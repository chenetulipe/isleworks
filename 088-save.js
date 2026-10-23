// Isleworks — 088-save.js : codec de sauvegarde ISLE3
// Chaîne : état -> allègement (objets sur tapis retirés) -> binaire compact
//          (table de chaînes, entiers variables, machines en colonnes avec
//          positions en delta) -> compression deflate -> taille + CRC32
//          -> caractères CJK (14 bits par caractère).
// Lit aussi les anciennes saves ISLE2 et ISLE1.

const IsleSave = (() => {
  const P3 = 'ISLE3:', P2 = 'ISLE2:', P1 = 'ISLE1:';
  const BASE = 0x4E00, BITS = 14, MASK = (1 << BITS) - 1;
  const BELT_ITEMS_INDEX = 12; // case "q" de L (objets en transit sur tapis, répartiteurs, tunnels)

  class SaveError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  }
  const broken = () => new SaveError('corrupted', 'Save abîmée : contenu illisible.');

  // ---------- CRC32 ----------
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(b) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  async function pipe(bytes, stream) {
    const out = new Blob([bytes]).stream().pipeThrough(stream);
    return new Uint8Array(await new Response(out).arrayBuffer());
  }

  // ---------- octets <-> caractères CJK ----------
  function bytesToChars(bytes) {
    const out = [];
    let acc = 0, n = 0;
    for (let i = 0; i < bytes.length; i++) {
      acc = (acc << 8) | bytes[i]; n += 8;
      while (n >= BITS) { n -= BITS; out.push(BASE + ((acc >>> n) & MASK)); }
      acc &= (1 << n) - 1;
    }
    if (n > 0) out.push(BASE + ((acc << (BITS - n)) & MASK));
    let s = '';
    for (let i = 0; i < out.length; i += 4096) s += String.fromCharCode(...out.slice(i, i + 4096));
    return s;
  }
  function charsToBytes(str) {
    const out = [];
    let acc = 0, n = 0;
    for (let i = 0; i < str.length; i++) {
      const v = str.charCodeAt(i) - BASE;
      if (v < 0 || v > MASK) throw new SaveError('invalid', 'Le code contient des caractères qui ne viennent pas d’une save Isleworks.');
      acc = (acc << BITS) | v; n += BITS;
      while (n >= 8) { n -= 8; out.push((acc >>> n) & 0xFF); }
      acc &= (1 << n) - 1;
    }
    return new Uint8Array(out);
  }

  // ---------- binaire compact ----------
  // Étiquettes : 0 null, 1 false, 2 true, 3 entier, 4 décimal,
  // 5 nouvelle chaîne, 6 chaîne déjà vue, 7 tableau, 8 objet,
  // 9 case absente, 10 tableau de lignes stocké en colonnes
  const T_NULL = 0, T_FALSE = 1, T_TRUE = 2, T_INT = 3, T_FLOAT = 4, T_STR = 5,
        T_REF = 6, T_ARR = 7, T_OBJ = 8, T_HOLE = 9, T_TABLE = 10;
  const isInt = v => typeof v === 'number' && Number.isSafeInteger(v);

  class Writer {
    constructor() { this.b = new Uint8Array(4096); this.n = 0; this.strings = new Map(); this.enc = new TextEncoder(); }
    grow(k) {
      if (this.n + k <= this.b.length) return;
      const nb = new Uint8Array(Math.max(this.b.length * 2, this.n + k));
      nb.set(this.b); this.b = nb;
    }
    byte(v) { this.grow(1); this.b[this.n++] = v; }
    uv(v) { while (v >= 128) { this.byte((v % 128) | 128); v = Math.floor(v / 128); } this.byte(v); }
    sv(v) { this.uv(v < 0 ? -2 * v - 1 : 2 * v); }
    f64(v) { this.grow(8); new DataView(this.b.buffer).setFloat64(this.n, v); this.n += 8; }
    str(s) {
      const idx = this.strings.get(s);
      if (idx !== undefined) { this.byte(T_REF); this.uv(idx); return; }
      this.strings.set(s, this.strings.size);
      const u = this.enc.encode(s);
      this.byte(T_STR); this.uv(u.length); this.grow(u.length); this.b.set(u, this.n); this.n += u.length;
    }
    value(v) {
      if (v === undefined) return this.byte(T_HOLE);
      if (v === null) return this.byte(T_NULL);
      if (v === false) return this.byte(T_FALSE);
      if (v === true) return this.byte(T_TRUE);
      if (typeof v === 'number') {
        if (isInt(v) && !Object.is(v, -0)) { this.byte(T_INT); this.sv(v); }
        else { this.byte(T_FLOAT); this.f64(v); }
        return;
      }
      if (typeof v === 'string') return this.str(v);
      if (Array.isArray(v)) {
        if (v.length >= 4 && v.every(Array.isArray)) return this.table(v);
        this.byte(T_ARR); this.uv(v.length);
        for (const x of v) this.value(x);
        return;
      }
      const keys = Object.keys(v);
      this.byte(T_OBJ); this.uv(keys.length);
      for (const k of keys) { this.str(k); this.value(v[k]); }
    }
    // Lignes de même forme (ex. machines) : écrites colonne par colonne,
    // les colonnes d'entiers (positions, directions…) en écarts successifs.
    table(rows) {
      this.byte(T_TABLE); this.uv(rows.length);
      let cols = 0;
      for (const r of rows) { this.uv(r.length); if (r.length > cols) cols = r.length; }
      for (let j = 0; j < cols; j++) {
        const intCol = rows.every(r => j < r.length && isInt(r[j]));
        this.byte(intCol ? 1 : 0);
        let prev = 0;
        for (const r of rows) {
          if (intCol) { this.sv(r[j] - prev); prev = r[j]; }
          else if (j < r.length) this.value(r[j]);
        }
      }
    }
    out() { return this.b.subarray(0, this.n); }
  }

  class Reader {
    constructor(b) { this.b = b; this.i = 0; this.strings = []; this.dec = new TextDecoder(); }
    byte() { if (this.i >= this.b.length) throw broken(); return this.b[this.i++]; }
    uv() { let v = 0, m = 1, c; do { c = this.byte(); v += (c & 127) * m; m *= 128; } while (c & 128); return v; }
    sv() { const u = this.uv(); return u % 2 ? -(u + 1) / 2 : u / 2; }
    f64() {
      if (this.i + 8 > this.b.length) throw broken();
      const v = new DataView(this.b.buffer, this.b.byteOffset + this.i, 8).getFloat64(0);
      this.i += 8; return v;
    }
    value() {
      const t = this.byte();
      switch (t) {
        case T_NULL: return null;
        case T_FALSE: return false;
        case T_TRUE: return true;
        case T_INT: return this.sv();
        case T_FLOAT: return this.f64();
        case T_HOLE: return undefined;
        case T_STR: {
          const len = this.uv();
          if (this.i + len > this.b.length) throw broken();
          const s = this.dec.decode(this.b.subarray(this.i, this.i + len));
          this.i += len; this.strings.push(s); return s;
        }
        case T_REF: {
          const s = this.strings[this.uv()];
          if (s === undefined) throw broken();
          return s;
        }
        case T_ARR: {
          const n = this.uv(), a = new Array(n);
          for (let k = 0; k < n; k++) a[k] = this.value();
          return a;
        }
        case T_OBJ: {
          const n = this.uv(), o = {};
          for (let k = 0; k < n; k++) {
            const key = this.value();
            if (typeof key !== 'string') throw broken();
            o[key] = this.value();
          }
          return o;
        }
        case T_TABLE: {
          const n = this.uv(), rows = new Array(n);
          let cols = 0;
          for (let k = 0; k < n; k++) { const len = this.uv(); rows[k] = new Array(len); if (len > cols) cols = len; }
          for (let j = 0; j < cols; j++) {
            const intCol = this.byte() === 1;
            let prev = 0;
            for (const r of rows) {
              if (intCol) { prev += this.sv(); r[j] = prev; }
              else if (j < r.length) r[j] = this.value();
            }
          }
          return rows;
        }
        default: throw broken();
      }
    }
  }

  // ---------- allègement ----------
  // Retire les objets en transit sur les tapis : le tapis repart vide au chargement.
  function slim(state) {
    const s = JSON.parse(JSON.stringify(state));
    if (Array.isArray(s.L)) {
      for (const e of s.L) {
        if (Array.isArray(e) && Array.isArray(e[BELT_ITEMS_INDEX])) e[BELT_ITEMS_INDEX] = 0;
      }
    }
    return s;
  }

  // ---------- en-tête taille + CRC ----------
  function wrap(comp) {
    const all = new Uint8Array(8 + comp.length);
    const view = new DataView(all.buffer);
    view.setUint32(0, comp.length);
    view.setUint32(4, crc32(comp));
    all.set(comp, 8);
    return bytesToChars(all);
  }
  function unwrap(chars) {
    const bytes = charsToBytes(chars);
    if (bytes.length < 8) throw new SaveError('truncated', 'Save tronquée : le code est incomplet.');
    const view = new DataView(bytes.buffer);
    const len = view.getUint32(0), crc = view.getUint32(4);
    if (bytes.length < 8 + len) {
      const pct = Math.max(0, Math.round(((bytes.length - 8) / len) * 100));
      throw new SaveError('truncated', `Save tronquée : il manque la fin du code (${pct} % reçu).`);
    }
    const comp = bytes.subarray(8, 8 + len);
    if (crc32(comp) !== crc) throw new SaveError('corrupted', 'Save abîmée : un ou plusieurs caractères ont été modifiés.');
    return comp;
  }

  // ---------- API ----------
  async function encode(state) {
    const w = new Writer();
    w.value(slim(state));
    const comp = await pipe(w.out(), new CompressionStream('deflate-raw'));
    return P3 + wrap(comp);
  }

  async function decode(text) {
    const clean = String(text || '').replace(/\s+/g, '');
    if (!clean) throw new SaveError('empty', 'Aucun code collé.');

    if (clean.startsWith(P3)) {
      const raw = await pipe(unwrap(clean.slice(P3.length)), new DecompressionStream('deflate-raw')).catch(() => { throw broken(); });
      const r = new Reader(raw);
      const state = r.value();
      if (!state || typeof state !== 'object') throw broken();
      return state;
    }
    if (clean.startsWith(P2)) {
      const raw = await pipe(unwrap(clean.slice(P2.length)), new DecompressionStream('deflate-raw')).catch(() => { throw broken(); });
      return JSON.parse(new TextDecoder().decode(raw));
    }
    if (clean.startsWith(P1)) {
      let bin;
      try { bin = atob(clean.slice(P1.length)); }
      catch { throw new SaveError('invalid', 'Ancienne save illisible : caractères invalides.'); }
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      try { return JSON.parse(new TextDecoder().decode(bytes)); }
      catch { throw new SaveError('truncated', 'Ancienne save tronquée ou abîmée : la fin du code manque probablement.'); }
    }
    throw new SaveError('unknown', 'Ce n’est pas un code de save Isleworks.');
  }

  // Enregistrer la save en fichier .txt (menu de partage sur téléphone)
  async function saveToFile(code, name = 'isleworks-save.txt') {
    const file = new File([code], name, { type: 'text/plain' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Save Isleworks' }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Ouvrir un fichier de save et renvoyer son texte
  function loadFromFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.txt,text/plain';
      input.onchange = () => {
        const f = input.files && input.files[0];
        if (!f) return reject(new SaveError('empty', 'Aucun fichier choisi.'));
        f.text().then(resolve, reject);
      };
      input.click();
    });
  }

  return { encode, decode, saveToFile, loadFromFile, SaveError };
})();

if (typeof module !== 'undefined') module.exports = IsleSave;
