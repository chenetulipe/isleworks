/* Isleworks : mise en cache pour un lancement instantané et le jeu hors ligne.
   À CHAQUE MISE À JOUR DU JEU : changer VERSION ci-dessous et le ?v= dans index.html
   (le script version.py le fait pour toi), sinon les joueurs gardent l'ancienne version. */
const VERSION='isleworks-4.1.0';
const FILES=["./", "index.html", "manifest.webmanifest", "style.css?v=4.1.0", "00-data.js?v=4.1.0", "01-world.js?v=4.1.0", "02-sim.js?v=4.1.0", "03-icons.js?v=4.1.0", "036-gl.js?v=4.1.0", "04-render.js?v=4.1.0", "05-fx.js?v=4.1.0", "06-ui.js?v=4.1.0", "07-quests.js?v=4.1.0", "076-mascot.js?v=4.1.0", "08-input.js?v=4.1.0", "085-i18n.js?v=4.1.0", "087-perf.js?v=4.1.0", "088-save.js?v=4.1.0", "09-main.js?v=4.1.0", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
const AUDIO='isleworks-audio-1';
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION&&k!==AUDIO).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
  /* la page : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne */
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(VERSION).then(k=>k.put(r,c));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));return}
  /* musiques : cache à part, gardé d'une version à l'autre */
  if(/\.mp3(\?|$)/.test(r.url)){e.respondWith(caches.open(AUDIO).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res.status===200)c.put(r,res.clone());return res}))));return}
  /* le reste (scripts, style, polices, icônes) : cache d'abord, réseau sinon */
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(VERSION).then(k=>k.put(r,c))}return res})))});
