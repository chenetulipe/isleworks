/* =====================================================================
   SAUVEGARDE (localStorage). Le terrain se régénère depuis la graine :
   on ne stocke que les bâtiments, les parcelles et la progression.
   ===================================================================== */
const SK='ficsit-usine-v4',SV=4;let offGain=0,offMin=0;
function save(){if(menu)return false;try{const prev=localStorage.getItem(SK);if(prev)localStorage.setItem(SK+'-bak',prev);localStorage.setItem(SK,JSON.stringify({v:SV,seed:SEED,wv:WV,inv:INV,bp:BP,ct:CT.map(c=>({x:c.pad.x,y:c.pad.y,item:c.item,n:c.n,got:c.got,left:c.dur-(tk_-c.t0),dur:c.dur,reward:c.reward})),ev:EV,evn:evNext,diff,money,gt,tk:tk_,dir,own:[...OWN],found:[...FOUND],plat:[...PLAT],
L:L.map(b=>[b.t,b.x,b.y,b.d,b.rec,b.lv,b.tot,b.st2,b.out,b.buf,b.flt||0,b.fq||0,b.q&&b.q.length?b.q.map(e=>[e.it,Math.round(e.p*100)]):0,b.mode||b.ch||b.wat||b.dq||b.rq||b.flt2||b.off||b.lim?{m:b.mode,c:Math.round(b.ch||0),w:b.wat||0,dq:b.dq||0,rq:b.rq||0,f2:b.flt2||0,off:b.off?1:0,lim:b.lim||0}:0]),u:[...U.b],ur:[...U.r],ux:[...U.x],ut:[...U.t],m,sold,recent,st,qi,cfgMem,ach:[...ACHD],tips:[...seenTips],ts:Date.now(),rate:REV,cam:[cam.x,cam.y,cam.z]}));return true}catch(e){return false}}
function readSave(){for(const k of[SK,SK+'-bak']){try{const s=JSON.parse(localStorage.getItem(k)||'null');if(s&&s.v==SV&&Array.isArray(s.L))return s}catch(e){}}return null}
async function exportSave(){save();const j=localStorage.getItem(SK);if(!j)throw new Error('Aucune partie à exporter');return IsleSave.encode(JSON.parse(j))}
async function importSave(code){let s;try{s=await IsleSave.decode(code)}catch(e){return(e&&e.message)||'Code invalide'}
if(!s||s.v!=SV||!Array.isArray(s.L))return'Cette save vient d’une autre version du jeu.';
try{const j=JSON.stringify(s),old=localStorage.getItem(SK);if(old)localStorage.setItem(SK+'-bak',old);localStorage.setItem(SK,j);return load()?true:'Chargement impossible.'}catch(e){return'Chargement impossible.'}}
let lastCode='';
function doImport(t){importSave(t).then(r=>{if(r===true){closeSheet();toast('Partie importée','ok')}else toast(r||'Code invalide','bad')})}
function load(){const s=readSave();if(!s)return false;resetState();SEED=s.seed;WV=s.wv||1;CT.length=0;EV=s.ev&&EVD[s.ev.k]?s.ev:null;evNext=s.evn||300000;BP=s.bp&&s.bp.items?s.bp:null;bpMode=null;for(const k in ZK)delete ZK[k];INV=Object.assign(INV0(),s.inv||{});for(const k in INV)if(INV[k]>0)U.b.add(k);diff=DIF[s.diff]?s.diff:'std';CHK.clear();DEP.clear();RBC.clear();OWN.clear();FOUND.clear();
s.own.forEach(k=>OWN.add(k));(s.found||[]).forEach(k=>FOUND.add(k));PLAT.clear();(s.plat||[]).forEach(k=>PLAT.add(k));money=s.money;gt=s.gt||0;tk_=s.tk||0;dir=s.dir||1;
U.b=new Set(s.u);U.r=new Set(s.ur);U.x=new Set(s.ux);U.t=new Set(s.ut);/* bâtiments ajoutés après coup à une recherche déjà faite */for(const n of T)if(U.t.has(n.id))(n.b||[]).forEach(k=>U.b.add(k));for(const k in IT){if(s.m&&s.m[k]!=null)m[k]=s.m[k];if(s.sold&&s.sold[k]!=null)sold[k]=s.sold[k]}
recent=(s.recent||[]).filter(k=>BD[k]);Object.assign(st,s.st||{});qi=s.qi||0;Q.length=NQ0;if(st.chal)Q.push(mkChal(st.chal));for(const k in s.cfgMem||{})if(R[s.cfgMem[k]]||k=='sorterF')cfgMem[k]=s.cfgMem[k];ACHD.clear();(s.ach||[]).forEach(k=>ACHD.add(k));seenTips.clear();(s.tips||[]).forEach(k=>seenTips.add(k));
for(const a of s.L){if(!BD[a[0]])continue;const b=mk(a[0],a[1],a[2],a[3]);b.rec=R[a[4]]?a[4]:null;b.lv=a[5]||1;b.tot=a[6]||0;b.st2=a[7]||{};b.out=a[8]||[];b.buf=a[9]||{};b.flt=a[10]||null;if(a[11])b.fq=a[11];if(a[13]){const x=a[13];if(x.m)b.mode=x.m;if(x.c)b.ch=x.c;if(x.w)b.wat=x.w;if(x.dq)b.dq=x.dq;if(x.rq)b.rq=x.rq;if(x.f2)b.flt2=x.f2;if(x.off)b.off=1;if(x.lim)b.lim=x.lim}if(a[12])b.q=a[12].filter(e=>IT[e[0]]).map(e=>({it:e[0],p:e[1]/100,pp:e[1]/100,t:-9,from:null}));(tilesOf(b.t,b.x,b.y).some(c=>BL.has(tk(c[0],c[1])))&&(b.small=1),regB(b));L.push(b)}
cam.x=s.cam[0];cam.y=s.cam[1];cam.z=s.cam[2];ctUI();
/* Gains hors ligne : la moitié du revenu par minute, sur 2 heures au maximum */
const away=s.ts?Math.min(120,(Date.now()-s.ts)/60000):0;offGain=away>1&&s.rate>0?Math.round(s.rate*away*.3):0;if(offGain){money+=offGain;offMin=Math.round(away)}for(const c of s.ct||[]){const pd=at([c.x,c.y]);if(!pd||pd.t!='pad'||pd.ct||!IT[c.item])continue;const o={item:c.item,n:c.n,got:c.got,t0:tk_-(c.dur-c.left),dur:c.dur,reward:c.reward,pad:pd,born:time-9000};pd.ct=o;CT.push(o)}for(const c of CT)c.t0-=Math.round(away*120);ctUI();return true}
let hidAt=0;setInterval(save,15000);
addEventListener('visibilitychange',()=>{if(document.hidden){save();hidAt=Date.now();return}if(menu||!hidAt)return;const away=Math.min(120,(Date.now()-hidAt)/60000);hidAt=0;if(away<.1)return;
{const tk=Math.round(away*60*2);for(const c of CT.slice())c.t0-=tk;ctTick()}if(away>1&&REV>0){const g=Math.round(REV*away*.3);money+=g;st.earned+=g;setTimeout(()=>{toast('Pendant ton absence ('+Math.round(away)+' min) : +'+g.toLocaleString(LOC)+' $','ok');SFX.shipOk()},400)}lt=performance.now()});addEventListener('pagehide',save);
/* =====================================================================
   ACCUEIL
   ===================================================================== */
function warmIcons(){const q=[...Object.keys(BD).map(k=>()=>bicu(k)),...Object.keys(IT).map(k=>()=>icu(k))];const step=()=>{const t0=performance.now();while(q.length&&performance.now()-t0<6)q.shift()();if(q.length)setTimeout(step,40)};setTimeout(step,300)}
function startGame(){document.body.classList.remove('tool');au();warmIcons();menu=false;SFX.start();ambStart();musicStart();setTimeout(musVol,50);document.body.classList.remove('menu');const h=$('home');h.style.pointerEvents='none';h.classList.add('out');setTimeout(()=>h.hidden=true,700);lastDock='';ui()}
$('dif').onclick=e=>{const b=e.target.closest('button');if(!b)return;diff=b.dataset.d;$('dif').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x==b))};
/* Accueil : le premier toucher réveille le son, puis musique d'ambiance et clics */
$('home').addEventListener('pointerdown',()=>{au();ambStart();musicStart();musVol()},{once:true});
$('home').addEventListener('click',e=>{if(e.target.closest('button'))SFX.tab()});
$('lgb').onclick=()=>{try{localStorage.setItem('isle-lang',LANG=='fr'?'en':'fr')}catch(e){}location.reload()};
$('hw').onclick=()=>$('how').hidden=!$('how').hidden;
$('crb').onclick=()=>{const c=$('cred');c.innerHTML=CREDITS();c.hidden=!c.hidden};
let goArm=-1e9;$('go').onclick=()=>{goNew();};function goNew(){if(readSave()&&performance.now()-goArm>3000){goArm=performance.now();$('go').textContent='Toucher encore : écraser la partie ?';$('go').classList.add('pri');setTimeout(()=>{$('go').textContent='Nouvelle partie';$('go').classList.remove('pri')},3000);return}const d=diff;resetState();diff=d;newWorld();RBC.clear();money=DIF[diff].m;cam.x=cam.y=0;cam.z=.9;seenTips.clear();startGame();save();setTimeout(()=>{rivet('Salut, moi c’est Rivet ! Je vais t’aider à monter ton usine. Suis les ordres de travail en haut de l’écran.','hi');rivet(Q[0].h,'q0')},900)}
if(readSave()){$('cont').innerHTML='<button class="pri big pulse" id="cg" style="margin-bottom:6px">Continuer la partie</button>';$('go').className='big';
$('cg').onclick=()=>{if(load()){startGame();if(offGain)setTimeout(()=>{toast('Pendant ton absence ('+offMin+' min) : +'+offGain.toLocaleString(LOC)+' $','ok');SFX.shipOk();coin({x:Math.floor(cam.x/TS),y:Math.floor(cam.y/TS)},10)},900);else toast('Partie chargée','ok')}else toast('Sauvegarde illisible','bad')}}
else if(localStorage.getItem('ficsit-usine'))$('cont').innerHTML='<div class="hint" style="margin-bottom:10px">Le monde est devenu infini : les anciennes sauvegardes ne sont plus compatibles. Lance une nouvelle partie.</div>';
/* =====================================================================
   BOUCLE PRINCIPALE
   ===================================================================== */
/* Qualité : OPT.qm = 'auto' (adaptative), 'max' ou 'eco' ; OPT.qs = palier actuel (0 = maximum … 3 = minimum) */
const QD=[2,2,1.5,1];if(OPT.qm=='max')OPT.qs=0;else if(OPT.qm=='eco')OPT.qs=2;let qChk=null,qNoHelp=false,DMAX=QD[OPT.qs||0],qWin=[0,0],qGood=0,qPause=0,qLock=0,qUp=-1e9;
/* Mode Auto : la résolution s’adapte en continu (de 1× à 2×) pour tenir ~60 images/s ; effets et décors restent allumés.
   (Les mesures sur téléphone ont montré que c’est le nombre de pixels qui limite, pas le calcul.) */
if((OPT.qm||'auto')=='auto'){if(OPT.autoOff){OPT.autoOff=false;OPT.fx=true;OPT.deco=true}OPT.qs=0;DMAX=Math.min(2,Math.max(1,OPT.rs||2))}
let rsWin=[0,0],rsGood=0,rsCeil=9,rsCeilT=0,rsChk=null,rsNoHelp=false,rsLow=0;
function rsSet(v){v=Math.round(Math.min(2,Math.max(1,v))*8)/8;if(v===DMAX)return;DMAX=v;OPT.rs=v;saveOpt();resize()}
function rsStep(t,dt){if((OPT.qm||'auto')!='auto'||menu||document.hidden||t<qPause||dt>=250||PF.diag)return;rsWin[0]+=dt;rsWin[1]++;if(rsWin[0]<2000)return;
const fps=rsWin[1]*1000/rsWin[0];rsWin=[0,0];if(t>rsCeilT)rsCeil=9;
/* la baisse précédente n’a rien changé : c’est le téléphone qui plafonne, on remet la résolution et on n’y touche plus */
if(rsChk){const c=rsChk;rsChk=null;if(fps<c.fps*1.1){rsNoHelp=true;rsSet(c.v);return}}
if(fps<50&&DMAX>1&&!rsNoHelp){rsCeil=DMAX;rsCeilT=t+300000;rsGood=0;rsChk={fps,v:DMAX};rsSet(DMAX-(fps<38?.5:.25));return}
if(fps<33&&DMAX<=1&&(OPT.fx||OPT.deco)&&++rsLow>=2){OPT.autoOff=true;OPT.fx=false;OPT.deco=false;RBC.clear();saveOpt();toast('Effets et décors coupés pour garder le jeu fluide');return}
if(fps>=57&&DMAX<Math.min(2,devicePixelRatio||1)&&DMAX+.125<rsCeil){if(++rsGood>=5){rsGood=0;rsSet(DMAX+.125)}}else rsGood=0}
function setQ(n,why){n=Math.max(0,Math.min(3,n));const was=OPT.qs||0;if(n==was)return;OPT.qs=n;
if(n>=1&&was<1&&(OPT.fx||OPT.deco)){OPT.autoOff=true;OPT.fx=false;OPT.deco=false;RBC.clear()}
if(n==0&&OPT.autoOff){OPT.autoOff=false;OPT.fx=true;OPT.deco=true;RBC.clear()}
DMAX=QD[n];saveOpt();resize();if(why)toast(why)}
/* mesure sur des fenêtres de 6 s (images/s moyennes), en ignorant les à-coups isolés (> 250 ms) */
function qStep(t,dt){if((OPT.qm||'auto')=='auto'&&!menu&&!document.hidden&&t>qPause&&dt<250){qWin[0]+=dt;qWin[1]++;if(qWin[0]>6000){const fps=qWin[1]*1000/qWin[0];qWin=[0,0];
if(PF.diag){}
/* la baisse précédente n'a pas aidé (le téléphone plafonne lui-même les images/s) : on remet la qualité et on n'y touche plus */
else if(qChk){const c=qChk;qChk=null;if(fps<c.fps*1.15){qNoHelp=true;setQ(c.lv,'Qualité rétablie : la baisser ne rendait pas le jeu plus fluide')}}
else if(fps<27&&(OPT.qs||0)<3&&!qNoHelp){qGood=0;if(t-qUp<40000)qLock=1e15;qChk={fps,lv:OPT.qs||0};setQ((OPT.qs||0)+1,'Qualité réduite automatiquement pour garder le jeu fluide')}
else if(fps>50&&(OPT.qs||0)>0&&t>qLock){if(++qGood>=3){qGood=0;qUp=t;setQ((OPT.qs||0)-1,'Le jeu est fluide : qualité augmentée')}}else qGood=0}}}
/* au retour sur la page : on oublie les mesures (la première image arrive toujours en retard) */
document.addEventListener('visibilitychange',()=>{qWin=[0,0];qPause=performance.now()+2500});
/* Redimensionnement : le terrain en cache ne dépend pas de la taille de l’écran, on le garde ;
   on ne touche au canvas que si sa taille change vraiment (la barre d’adresse mobile envoie des « resize » en rafale) */
function resize(){D=Math.max(1,Math.min(DMAX,devicePixelRatio||1));const w=Math.round(innerWidth*D),h=Math.round(innerHeight*D);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;if(GLR)GLR.resize(w,h);
/* changer la taille efface l’image : on redessine tout de suite, sinon une image vide s’affiche (clignotement) */
if(resize.ok){try{if(cx.beginFrame)cx.beginFrame();draw(Math.min(1,acc/TM));drawRain();drawEvent();drawPings();drawSP();if(cx.endFrame)cx.endFrame()}catch(e){}}}}
(()=>{const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d'),im=g.createImageData(96,96);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=Math.random()*16}g.putImageData(im,0,0);document.documentElement.style.setProperty('--noise',`url(${c.toDataURL()})`)})();
applyLang();$('hrv').innerHTML=RIVET;addEventListener('resize',resize);resize();resetState();newWorld();ui();
let lt=performance.now(),fc=0,goHome=false,camGoal=null;
/* Météo : averses de temps en temps (visuel + bruit de pluie) */
let rain=0,rainT=60000+Math.random()*120000,rainG=null;
function weather(dt){if(menu||paused)return;evTick(dt);if(EV&&EV.k=='storm'){rain=1;rainT=Math.max(rainT,2000)}if(EV&&EV.k=='drought'&&rain){rain=0}rainT-=dt*spd;if(rainT<=0){if(rain>0){rain=0;rainT=120000+Math.random()*180000}else{rain=1;rainT=40000+Math.random()*40000;toast('Une averse arrive sur l’île')}}
if(AC&&MS){if(!rainG&&rain){const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NB;s.loop=true;f.type='highpass';f.frequency.value=2500;g.gain.value=0;s.connect(f);f.connect(g);g.connect(MS);s.start();rainG=g}
if(rainG)rainG.gain.setTargetAtTime(rain&&!muted?.008:0,AC.currentTime,1.5)}}
function drawRain(){if(!rain||!OPT.fx)return;const w=innerWidth,h=innerHeight;cx.setTransform(D,0,0,D,0,0);cx.fillStyle='rgba(20,30,50,.12)';cx.fillRect(0,0,w,h);cx.strokeStyle='rgba(180,200,230,.35)';cx.lineWidth=1;cx.beginPath();
const t=time/1000;for(let i=0;i<70;i++){const x=(hsh(i,1,9)*w+t*60)%w,y=(hsh(i,2,9)*h+t*(500+hsh(i,3,9)*300))%h;cx.moveTo(x,y);cx.lineTo(x-3,y+12)}cx.stroke()}
$('optb').onclick=()=>{tool=null;dis=false;openSheet('opt')};
$('hb').onclick=()=>{goHome=true;SFX.tab();vib(8)};
let lastDraw=0;function frame(t){resize.ok=true;const dt=Math.min(100,t-lt);lt=t;time=t;if(!menu&&!paused&&!document.hidden)st.play=(st.play||0)+dt/1000;
/* Qualité adaptative par paliers : d'abord les effets, puis la résolution (jamais d'un coup) */
if((OPT.qm||'auto')=='auto')rsStep(t,dt);else qStep(t,dt);
if(menu){cam.x=Math.cos(t/9000)*260;cam.y=Math.sin(t/7000)*200;cam.z=.8}
else if(!paused){acc+=dt*spd;gt+=dt*spd;let n=0;const ts=performance.now();while(acc>=TM&&n++<8){acc-=TM;tick()}if(n)pfSim(performance.now()-ts,Math.min(n,8));if(acc>TM)acc=TM}
setMoney(money);fxStep(dt);weather(dt);fc++;const every=!sheet||sheet=='i'||sheet=='info'?1:sheet=='t'?1e9:3;
/* plafond : 60 i/s (les écrans 90/120 Hz dessinaient 2× trop) ; 30 i/s en Économie, ou au palier bas quand rien ne bouge */
if(FLING&&!P){cam.x+=FLING.vx*dt/cam.z;cam.y+=FLING.vy*dt/cam.z;const fk=Math.exp(-dt/320);FLING.vx*=fk;FLING.vy*=fk;if(Math.hypot(FLING.vx,FLING.vy)<.03)FLING=null}
const moving=!!P||!!FLING||camGoal||time-zMoveT<400,cap=OPT.qm=='eco'&&!moving?32:15.5;const due=t-lastDraw>=cap;
if(due&&!PFX.skip&&(fc%every==0||P&&sheet!='t')){lastDraw=t;const td=performance.now();if(cx.beginFrame)cx.beginFrame();draw(Math.min(1,acc/TM));drawRain();drawEvent();drawPings();drawSP();if(cx.endFrame)cx.endFrame();pfDraw(performance.now()-td)}if(sheet=='map'){mmStep();if(fc%2==0)drawMap()}
if(camGoal&&!menu){cam.x+=(camGoal.x-cam.x)*.18;cam.y+=(camGoal.y-cam.y)*.18;if(Math.hypot(camGoal.x-cam.x,camGoal.y-cam.y)<1)camGoal=null}
if(goHome&&!menu){cam.x+=(0-cam.x)*.14;cam.y+=(0-cam.y)*.14;if(Math.hypot(cam.x,cam.y)<4)goHome=false}
pfFrame(t,dt);if(fc%15==0){const far=!menu&&!sheet&&!tool&&!dis&&Math.hypot(cam.x,cam.y)>TS*14;$('hb').hidden=!far}requestAnimationFrame(frame)}
requestAnimationFrame(frame);
