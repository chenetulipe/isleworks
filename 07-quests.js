/* =====================================================================
   OBJECTIFS (tutoriel puis progression)
   ===================================================================== */
const fe=t=>L.find(b=>b.t==t);
const freeTile=c=>land(c)&&owned(c[0],c[1])&&!at(c)&&!Rs(c[0],c[1])&&!poiAt(c[0],c[1]);
function near(pred,from){const f=from||[Math.floor(cam.x/TS),Math.floor(cam.y/TS)];let best=null,bd=1e9;
for(let y=f[1]-14;y<f[1]+15;y++)for(let x=f[0]-14;x<f[0]+15;x++){const c=[x,y];if(!pred(c))continue;const d=Math.hypot(x-f[0],y-f[1]);if(d<bd){bd=d;best=c}}return best}
const nearestBuyable=()=>{const px0=Math.floor(cam.x/TS)>>3,py0=Math.floor(cam.y/TS)>>3;let b=null,bd=1e9;for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++)if(pstate(px0+i,py0+j)==1){const d=Math.hypot(i,j);if(d<bd){bd=d;b=[(px0+i)*CH+4,(py0+j)*CH+4]}}return b};
const extOn=r=>L.some(b=>BD[b.t].rt&&Rs(b.x,b.y)==r);
const Q=[
{t:'Pose un extracteur sur du minerai',h:'Construire › Extracteur Mk1, puis touche un rocher aux reflets bleus (fer) ou orange à taches vertes (cuivre).',c:()=>extOn('iron')||extOn('copper'),r:20,dock:'b',cat:'Extraction',card:'ext1',spot:()=>tool=='ext1'?near(c=>Rs(c[0],c[1])=='iron'&&!at(c)&&owned(c[0],c[1])):null},
{t:'Pose un terminal de vente',h:'Construire › Vente › Terminal de vente, à 3 ou 4 cases de l’extracteur.',c:()=>!!fe('seller'),r:20,dock:'b',cat:'Vente',card:'seller',spot:()=>{if(tool!='seller')return null;const e=L.find(b=>BD[b.t].rt);return e?near(freeTile,[e.x+4,e.y]):null}},
{t:'Glisse le doigt de l’extracteur au terminal',h:'Pose le doigt sur l’extracteur et glisse jusqu’au terminal : les tapis se posent tout seuls. (Sur une machine déjà branchée, maintiens d’abord le doigt.)',c:()=>Object.values(sold).some(v=>v>0),r:40,spot:()=>{if(tool)return null;const e=L.find(b=>BD[b.t].rt);return e?[e.x,e.y]:null}},
{t:'Ajoute une fonderie sur la ligne',h:'Les lingots valent presque deux fois plus que le minerai. Pose une fonderie, puis démolis un tapis et relie extracteur → fonderie → terminal. La fonderie choisit sa recette toute seule.',c:()=>(sold.iron_ingot||0)+(sold.copper_ingot||0)>=1,r:60,dock:'b',cat:'Transformation',card:'smelter',need:()=>!fe('smelter')},
{t:'Vends 10 lingots',h:'Laisse tourner ta ligne. ×2 ou ×4 en haut à droite pour accélérer.',p:()=>[(sold.iron_ingot||0)+(sold.copper_ingot||0),10],r:60},
{t:'Ouvre le Marché',h:'Touche Marché en bas : chaque objet a un prix qui baisse quand tu en vends beaucoup, puis remonte.',c:()=>SEEN.has('m'),r:20,dock:'m'},
{t:'Démolis un bâtiment',h:'Touche Démolir en bas, puis un bâtiment (un tapis en trop par exemple). C’est remboursé à 100 %. Touche ✕ pour quitter le mode.',c:()=>(st.demol||0)>=1,r:20,dock:'dis'},
{t:'Lance ta première recherche',h:'Ouvre Recherche, touche une puce disponible et maintiens le bouton.',c:()=>U.t.size>=1,r:50,dock:'t'},
{t:'Ouvre la Carte',h:'Touche Carte en bas : tu vois toute l’île et les gisements. Touche un endroit pour t’y rendre.',c:()=>SEEN.has('map'),r:20,dock:'map'},
{t:'Achète une nouvelle parcelle',h:'Touche une zone en pointillés orange au bord de ton terrain : tu verras son contenu et son prix.',p:()=>[OWN.size-4,1],r:60,spot:()=>tool?null:nearestBuyable()},
{t:'Pose un pad de livraison',h:'Construire › Vente › Pad de livraison. Un vaisseau viendra y passer commande.',c:()=>!!fe('pad'),r:30,dock:'b',cat:'Vente',card:'pad'},
{t:'Livre ta première commande',h:'La commande s’affiche en haut à gauche. Amène les objets demandés au pad avec des tapis.',p:()=>[st.delivered,1],r:150},
{t:'Fouille un point d’intérêt',h:'Les « ? » violets cachent épaves, ruines et artefacts. Achète la parcelle, puis touche le point d’intérêt.',p:()=>[st.poi,1],r:100},
{t:'Gagne 1 000 $ au total',h:'Ventes, commandes et trouvailles comptent.',p:()=>[Math.floor(st.earned),1000],r:100},
{t:'Fabrique 20 plaques de fer',h:'Recherche Façonnage, puis envoie des lingots de fer dans un Constructeur réglé sur Plaque de fer.',p:()=>[st.made.plate||0,20],r:350},
{t:'Débloque l’Assemblage',h:'Recherche Câblerie et Visserie, puis Assemblage.',c:()=>U.t.has('asm'),r:450,dock:'t'},
{t:'Allume une centrale électrique',h:'L’assembleuse a besoin de courant (6 MW). Recherche Électricité, puis pose des éoliennes (sur une colline ou la côte) ou une centrale alimentée par tapis. Pas besoin de câbles.',c:()=>L.some(b=>GEN[b.t]&&b.mw>0),r:300,dock:'t'},
{t:'Fabrique 10 plaques renforcées',h:'Une Assembleuse a besoin de plaques et de vis.',p:()=>[st.made.rplate||0,10],r:600},

{t:'Débloque le Haut-fourneau',h:'Il combine lingots de fer et charbon pour faire de l’acier. Il a besoin de courant.',c:()=>U.t.has('blast'),r:300,dock:'t'},
{t:'Produis 20 aciers',h:'Haut-fourneau : 2 lingots de fer + 1 charbon.',p:()=>[st.made.steel||0,20],r:500},
{t:'Agrandis ton île à 12 parcelles',h:'Plus tu t’éloignes, plus les gisements sont rares et précieux.',p:()=>[OWN.size,12],r:600},
{t:'Exploite un gisement de quartz ou de bauxite',h:'On les trouve loin du départ. Utilise la Carte pour les repérer.',c:()=>extOn('quartz')||extOn('bauxite'),r:800},
{t:'Débloque la Pétrochimie',h:'La pompe et la raffinerie ouvrent le plastique et le caoutchouc.',c:()=>U.t.has('oil'),r:800,dock:'t'},
{t:'Fabrique 10 ordinateurs',h:'Circuits + plastique dans une assembleuse.',p:()=>[st.made.computer||0,10],r:2000},
{t:'Livre 10 commandes',h:'Plus de pads, c’est plus de vaisseaux en même temps.',p:()=>[st.delivered,10],r:1500},
{t:'Fabrique un turbomoteur',h:'Manufacture : moteurs, ordinateur et câbles gainés.',p:()=>[st.made.turbo||0,1],r:5000},
{t:'Fabrique un satellite',h:'Superordinateur, cadres lourds et batteries.',p:()=>[st.made.satellite||0,1],r:15000},
{t:'Construis un vaisseau de fret',h:'Le chef-d’œuvre final de ton île.',p:()=>[st.made.cargo||0,1],r:50000}];
const qp=q=>q.p?q.p():[q.c()?1:0,1];
let qShow=null,lastQ='',qOpen=false;
function refreshQ(){let i=qi,done=false;if(qShow&&time<qShow.u){i=qShow.i;done=true}const q=Q[i];qSpot=!done&&q&&q.spot?q.spot():null;const e=$('qp');if(!q){e.hidden=true;return}e.hidden=false;
const[c,g]=done?[1,1]:qp(q),f=Math.min(1,c/g);
const h=`<div class="qpill${qOpen?' open':''}"><svg class="qr" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="none" stroke="#2b262022" stroke-width="4"/><circle cx="18" cy="18" r="14" fill="none" stroke="#f07a28" stroke-width="4" stroke-linecap="round" stroke-dasharray="88" stroke-dashoffset="${(88*(1-f)).toFixed(1)}" transform="rotate(-90 18 18)"/><text x="18" y="22.5" text-anchor="middle">${i+1}</text></svg><div class="qtx"><b>${q.t}</b>${q.p&&!done?`<span class="m">${Math.min(c,g).toLocaleString(LOC)}/${g.toLocaleString(LOC)}</span>`:''}${qOpen?`<small>${q.h}</small>`:''}</div><span class="qrw m">+${q.r.toLocaleString(LOC)}$</span>${done?'<div class="stamp">FAIT</div>':''}</div>`;
if(h!=lastQ){e.innerHTML=h;lastQ=h}}
function qTick(){if(!Q[qi]&&qi>=NQ0){if(st.chal&&Q.length==NQ0)Q.push(mkChal(st.chal));else nextChal()}const q=Q[qi];if(!q)return;const[c,g]=qp(q);if(c>=g){money+=q.r;st.earned+=q.r;toast('Objectif terminé : +'+q.r.toLocaleString(LOC)+' $','ok');SFX.quest();vib([20,40,30]);qShow={i:qi,u:time+1400};if(q.ch){st.chal=null;Q.length=NQ0;nextChal();qShow=null;qi=NQ0}else qi++;if(qi==NQ0&&!st.won){st.won=1;setTimeout(showWin,1800)}qOpen=false;confetti();save();if(Q[qi]&&qi<16)setTimeout(()=>rivet(Q[qi].h,'q'+qi),1600)}refreshQ();qHL()}
/* surbrillance du tutoriel : on ne touche aux classes que si la cible change (évite un recalcul de page à chaque tick) */
let QHL=[];function qHL(){const T=[];qHL0(T);if(T.length==QHL.length&&T.every((e,i)=>e===QHL[i]&&e.classList.contains('hl')))return;for(const e of QHL)if(!T.includes(e))e.classList.remove('hl');for(const e of T)e.classList.add('hl');QHL=T}
function qHL0(T){const q=Q[qi];if(!q||menu||(q.need&&!q.need()))return;
if(q.card&&tool==q.card)return;if(q.card&&L.some(b=>b.t==q.card)&&q.card!='seller'&&q.card!='smelter')return;if(q.card=='smelter'&&L.some(b=>b.t=='smelter'))return;
if(q.dock&&sheet!=q.dock&&!tool){const b=document.querySelector(`#dock [data-s="${q.dock}"]`);if(b)T.push(b)}
if(sheet=='b'&&q.card){if(cat!=q.cat){const t=document.querySelector(`#shb [data-c="${q.cat}"]`);if(t)T.push(t)}else{const c=document.querySelector(`#shb .pc[data-k="${q.card}"]`);if(c)T.push(c)}}
if(sheet=='t'&&q.dock=='t'){const b=document.querySelector('#shb .hold')||document.querySelector('#bi .hx.s-av .hxw');if(b)T.push(b)}}
$('qp').onclick=()=>{qOpen=!qOpen;lastQ='';refreshQ();SFX.tab();if(OPT.tips&&Q[qi])rivetAgain(Q[qi].h)};

/* =====================================================================
   DÉFIS INFINIS : quand tous les objectifs sont finis, le directeur en propose
   de nouveaux, de plus en plus ambitieux (revenu, production, commandes, parcelles).
   ===================================================================== */
const NQ0=Q.length;
function mkChal(c){const it=c.it,nm=IT[it]?IT[it][0]:it;
if(c.k=='rev')return{t:'Défi '+c.n+' : atteins '+c.g.toLocaleString(LOC)+' $/min',h:'Agrandis tes lignes les plus rentables et vise les objets complexes.',p:()=>[Math.min(REV,c.g),c.g],r:c.r,ch:1};
if(c.k=='make')return{t:'Défi '+c.n+' : fabrique '+c.g+' × '+nm,h:'Construis une ligne dédiée. Les plans (Construire › Copier une zone) font gagner du temps.',p:()=>[Math.max(0,(st.made[it]||0)-c.b),c.g],r:c.r,ch:1};
if(c.k=='deliv')return{t:'Défi '+c.n+' : livre '+c.g+' commandes',h:'Plus de pads de livraison = plus de vaisseaux en même temps.',p:()=>[Math.max(0,(st.delivered||0)-c.b),c.g],r:c.r,ch:1};
return{t:'Défi '+c.n+' : possède '+c.g+' parcelles',h:'Les parcelles lointaines cachent les gisements rares et les trouvailles.',p:()=>[OWN.size,c.g],r:c.r,ch:1}}
function nextChal(){const n=(st.chN||0)+1;st.chN=n;const ks=['rev','make','deliv','plots'],k=ks[(n-1)%4];const items=Object.keys(IT).filter(i=>IT[i][1]>=40&&Object.keys(R).some(r=>R[r].out==i&&U.r.has(r)));
const it=items.length?items[(n*7)%items.length]:'motor';let c;
if(k=='rev')c={k,n,g:Math.max(1000,Math.round(REV*1.5/500)*500)};else if(k=='make')c={k,n,it,b:st.made[it]||0,g:Math.max(10,Math.round(4000/Math.sqrt(IT[it][1])))};
else if(k=='deliv')c={k,n,b:st.delivered||0,g:5+n};else c={k,n,g:OWN.size+3+Math.floor(n/4)};c.r=Math.round(5000*Math.pow(1.35,n));st.chal=c;Q.length=NQ0;Q.push(mkChal(c))}
