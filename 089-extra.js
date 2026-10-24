/* =====================================================================
   MARCHAND AMBULANT · COLLECTION · PRESTIGE
   - Un vaisseau marchand passe régulièrement (toutes les 15 min de jeu,
     2 fois plus souvent avec le Phare) et reste 3 min. Il vend des
     machines uniques, dont 6 MÉGA-MACHINES introuvables ailleurs.
   - Collection : chaque trouvaille différente obtenue donne +3 % de ventes.
   - Prestige : une fois le vaisseau de fret livré, on peut repartir sur
     une nouvelle île avec +10 % de ventes et de vitesse par niveau.
   ===================================================================== */
const MER_STOCK={megadrill:250000,timewarp:400000,replicator:300000,blackhole:200000,starforge:600000,magnet:150000,xdrill:60000,clock:80000,golden:50000,antenna:70000,cryo:90000};
const MER_MEGA=['megadrill','timewarp','replicator','blackhole','starforge','magnet'];
const merPrice=k=>Math.round(MER_STOCK[k]*(DIF[diff]?DIF[diff].p:1)/1000)*1000;
const merEvery=()=>(MON.lighthouse?7.5:15)*60000;
function merTick(){if(menu||typeof st!='object')return;
  /* anciennes parties : la collection reprend les trouvailles déjà obtenues */
  if(!st.coll)st.coll=COLLT.filter(k=>(INV[k]||0)>0||L.some(b=>b.t==k));
  if(st.merT==null)st.merT=gt+6*60000;
  if(st.merU&&gt>st.merU){st.merU=0;st.merO=null;st.merT=gt+merEvery();merBtn();toast('Le marchand ambulant est reparti');return}
  if(!st.merU&&gt>=st.merT){
    /* 3 offres : au moins une méga-machine, jamais deux fois la même */
    const pool=Object.keys(MER_STOCK).sort(()=>Math.random()-.5),mega=MER_MEGA[Math.random()*MER_MEGA.length|0],o=[mega];
    for(const k of pool){if(o.length>=3)break;if(!o.includes(k))o.push(k)}
    st.merO=o;st.merB=[];st.merU=gt+3*60000;merBtn();toast('🛸 Un marchand ambulant est arrivé ! Il repart dans 3 minutes.','ok');
    (SFX.res||SFX.quest)();vib&&vib([20,40,20])}
  merBtn()}
let merEl=null;
function merBtn(){if(!st.merU||menu){if(merEl){merEl.remove();merEl=null}return}
  if(!merEl){merEl=document.createElement('button');merEl.id='merb';merEl.style.cssText="position:fixed;left:12px;top:calc(env(safe-area-inset-top,0px) + 112px);z-index:25;font:700 13px Rajdhani,sans-serif;color:#1a1d22;background:linear-gradient(#ffd34d,#f2a93b);border:0;border-radius:10px;padding:7px 11px;box-shadow:0 4px 14px rgba(0,0,0,.4)";merEl.onclick=merOpen;document.body.appendChild(merEl)}
  const s=Math.max(0,Math.ceil((st.merU-gt)/1000/Math.max(1,spd)));merEl.textContent='🛸 Marchand · '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
/* fenêtre générique (marchand, prestige) */
function xModal(html){let m=document.getElementById('xmod');if(m)m.remove();m=document.createElement('div');m.id='xmod';
  m.style.cssText='position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center';
  m.innerHTML=`<div style="width:100%;max-width:520px;max-height:82vh;overflow:auto;background:#1c1f24;border-top:2px solid #ffd34d55;border-radius:18px 18px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));color:#e8e3d8;font:14px/1.4 Rajdhani,system-ui,sans-serif">${html}</div>`;
  m.onclick=e=>{if(e.target===m||e.target.closest('[data-xclose]'))m.remove()};document.body.appendChild(m);return m}
function collLine(){const n=collN();return `<div style="margin:6px 0 12px;padding:8px 10px;border-radius:10px;background:#262a31">📚 Collection : <b>${n}/${COLLT.length}</b> trouvailles · <b style="color:#4ade80">+${3*n} % de ventes</b>${PRES?` · ★ Prestige ${PRES} : <b style="color:#ffd34d">+${10*PRES} %</b>`:''}</div>`}
function merOpen(){if(!st.merU)return;const cards=st.merO.map(k=>{const d=BD[k],p=merPrice(k),own=st.merB.includes(k),mega=MER_MEGA.includes(k);
  return `<div style="display:flex;gap:10px;align-items:center;padding:10px;margin-bottom:8px;border-radius:12px;background:${mega?'linear-gradient(135deg,#3a2a10,#262a31)':'#262a31'};border:1px solid ${mega?'#ffd34d66':'#ffffff14'}">
  <div style="flex:1"><div style="font-weight:700;font-size:16px">${mega?'⭐ ':''}${d.n}</div><div style="opacity:.8;font-size:13px">${d.d}</div></div>
  <button data-merbuy="${k}" ${own||money<p?'disabled':''} style="min-width:96px;padding:9px 8px;border-radius:10px;border:0;font:700 14px Rajdhani,sans-serif;background:${own?'#3a3f47':money<p?'#3a3f47':'#ffd34d'};color:${own||money<p?'#9aa0a8':'#1a1d22'}">${own?'Acheté':p.toLocaleString(LOC)+' $'}</button></div>`}).join('');
  const m=xModal(`<div style="display:flex;justify-content:space-between;align-items:center"><div style="font:700 20px Rajdhani,sans-serif">🛸 Marchand ambulant</div><button data-xclose style="background:none;border:0;color:#e8e3d8;font-size:22px">✕</button></div>
  <div style="opacity:.8;margin-top:2px">Des machines uniques, dont des méga-machines introuvables ailleurs. Elles arrivent dans Construire › Trouvailles.</div>${collLine()}${cards}`);
  m.querySelectorAll('[data-merbuy]').forEach(b=>b.onclick=()=>{const k=b.dataset.merbuy,p=merPrice(k);if(money<p||st.merB.includes(k))return;money-=p;st.merB.push(k);invAdd(k);SFX.up&&SFX.up();toast(BD[k].n+' achetée !','ok');save();merOpen()})}
/* ---------- prestige ---------- */
function prestOpen(){const ok=!!st.won,n=PRES;
  const m=xModal(`<div style="display:flex;justify-content:space-between;align-items:center"><div style="font:700 20px Rajdhani,sans-serif">★ Prestige</div><button data-xclose style="background:none;border:0;color:#e8e3d8;font-size:22px">✕</button></div>
  <p>Repars de zéro sur une <b>nouvelle île</b>, avec un bonus permanent qui s’ajoute à chaque prestige : <b style="color:#ffd34d">+10 % de ventes et +10 % de vitesse</b> pour toutes tes machines et extracteurs.</p>
  <p>Niveau actuel : <b>★ ${n}</b> (+${10*n} %). Après : <b>★ ${n+1}</b> (+${10*(n+1)} %).</p>
  ${ok?'<p style="color:#ff9442">Ta partie actuelle sera remplacée. Pense à l’exporter avant si tu veux la garder.</p><button id="prgo" style="width:100%;padding:12px;border-radius:12px;border:0;font:700 16px Rajdhani,sans-serif;background:#ffd34d;color:#1a1d22">Passer au prestige ★ '+(n+1)+'</button>':'<p style="opacity:.8">Débloqué quand tu as terminé la partie (le vaisseau de fret livré).</p>'}`);
  const g=m.querySelector('#prgo');if(g)g.onclick=()=>{localStorage.setItem('isle-prest',String(n+1));try{localStorage.removeItem(SK)}catch(e){}location.reload()}}
/* étoile de prestige à côté de la version, sur l'accueil */
setTimeout(()=>{const e=document.getElementById('verl');if(e&&PRES)e.textContent+=' · ★'+PRES},50);
setInterval(merTick,500);
