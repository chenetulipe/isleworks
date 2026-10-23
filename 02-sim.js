/* =====================================================================
   ÉTAT DE LA PARTIE
   ===================================================================== */
const $=id=>document.getElementById(id),cv=$('c');/* let : le rendu peut dessiner temporairement dans un autre canvas (cache des bâtiments) */let cx=cv.getContext('2d',{alpha:false,desynchronized:true})||cv.getContext('2d',{alpha:false});
let D=Math.max(1,Math.min(2,devicePixelRatio||1));
const OPT=Object.assign({vib:true,night:true,deco:true,fx:true,music:true,tips:true},JSON.parse(localStorage.getItem('ficsit-opt')||'{}'));
const saveOpt=()=>{try{localStorage.setItem('ficsit-opt',JSON.stringify(OPT))}catch(e){}};
const vib=n=>{if(!OPT.vib)return;try{navigator.vibrate&&navigator.vibrate(n)}catch(e){}};
let money=300,tk_=0,gt=0,acc=0,paused=false,spd=1,tool=null,dis=false,dir=1,sel=null,time=0,cfg=null,sheet=null,cat='Extraction',menu=true,recent=[];
const L=[],BL=new Map(),sales=[],fl=[],CT=[],cam={x:16,y:16,z:1},m={},sold={},cfgMem=Object.create(null);
const U={b:new Set(),r:new Set(),x:new Set(),t:new Set()};
const st={made:{},earned:0,delivered:0,poi:0,art:0};let qi=0;
function resetState(){money=300;tk_=0;gt=0;acc=0;sel=null;tool=null;dis=false;cfg=null;recent=[];L.length=0;BL.clear();CT.length=0;sales.length=0;fl.length=0;
for(const k in IT){m[k]=1;sold[k]=0}for(const k in cfgMem)delete cfgMem[k];UND.length=0;if(typeof ACHD!='undefined')ACHD.clear();hist={};st.made={};st.earned=0;st.delivered=0;st.poi=0;st.art=0;st.extb=0;st.mwb=0;st.free=0;INV=INV0();qi=0;PT.length=0;SP.length=0;
U.b=new Set(['conveyor','ext1','smelter','seller','pad']);U.r=new Set(['ironi','copi','charc']);U.x=new Set();U.t=new Set()}
const at=c=>BL.get(tk(c[0],c[1]))||null;
const SZ=t=>BD[t]&&BD[t].sz||1;
/* Cases occupées par un bâtiment (2×2 pour les grosses machines, ancrées en haut à gauche) */
const bsz=b=>b.small?1:SZ(b.t);
function tilesOf(t,x,y,s0){const s=s0||SZ(t),r=[];for(let j=0;j<s;j++)for(let i=0;i<s;i++)r.push([x+i,y+j]);return r}
function regB(b){for(const c of tilesOf(b.t,b.x,b.y,bsz(b)))BL.set(tk(c[0],c[1]),b)}
function unregB(b){for(const c of tilesOf(b.t,b.x,b.y,bsz(b)))if(BL.get(tk(c[0],c[1]))===b)BL.delete(tk(c[0],c[1]))}
/* Cases juste devant le bâtiment (2 pour une machine 2×2) */
function fronts(b,d){if(d==null)d=b.d;const s=bsz(b);if(s<2)return[[b.x+DX[d],b.y+DY[d]]];const x=b.x,y=b.y,r=[];for(let i=0;i<s;i++)r.push(d==0?[x+i,y-1]:d==1?[x+s,y+i]:d==2?[x+i,y+s]:[x-1,y+i]);return r}
const fr=b=>fronts(b)[0];
const outsTo=(n,b)=>!!n&&n.d!=null&&!STORE[n.t]&&fronts(n).some(f=>f[0]==b.x&&f[1]==b.y);
const mk=(t,x,y,d)=>({t,x,y,d,out:[],cd:1,buf:{},busy:0,pr:0,rec:null,lv:1,st2:{},tot:0,item:null,st:-1,from:null,ps:-1,rr:0,ct:null,leave:0,born:0});
const INV0=()=>({rcore:0,xdrill:0,relic:0,orbital:0,cryo:0,golden:0,antenna:0,statue:0,clock:0,well:0,vault:0,beltmotor:0});let INV=INV0(),RELN=0;
/* portée d'action des machines spéciales (en cases autour) */
const RANGE=nz({xdrill:2,cryo:2,golden:2,antenna:2,beacon:1,beltmotor:3});
function nearT(b,t,r){if(!INVP[t])return false;const s=bsz(b);for(let j=-r;j<s+r;j++)for(let i=-r;i<s+r;i++){const n=at([b.x+i,b.y+j]);if(n&&n.t==t&&n!==b)return true}return false}
function invAdd(t){INV[t]=(INV[t]||0)+1;U.b.add(t);rivet('Tu as trouvé une machine unique ! Elle t’attend dans Construire › Trouvailles.','inv')}
function drillF(b){if(!INVP.xdrill)return 1;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const n=at([b.x+i,b.y+j]);if(n&&n.t=='xdrill')return 1.5}return 1}
let INVP={};
/* =====================================================================
   PLANS : copier une zone puis la reposer ailleurs
   ===================================================================== */
let BP=null,bpMode=null;
function bpCapture(a,b2){const x0=Math.min(a[0],b2[0]),x1=Math.max(a[0],b2[0]),y0=Math.min(a[1],b2[1]),y1=Math.max(a[1],b2[1]),seen=new Set(),items=[];let cost=0;
for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const b=at([x,y]);if(!b||seen.has(b)||BD[b.t].inv)continue;seen.add(b);const s=bsz(b);if(b.x<x0||b.y<y0||b.x+s-1>x1||b.y+s-1>y1)continue;
items.push({dx:b.x-x0,dy:b.y-y0,t:b.t,d:b.d,rec:b.rec||null,flt:b.flt||null});cost+=BD[b.t].cost}
if(!items.length){toast('Aucun bâtiment entier dans cette zone','bad');return false}BP={w:x1-x0+1,h:y1-y0+1,items,cost};bpMode='paste';SFX.place();vib(15);toast('Plan copié : '+items.length+' bâtiments','ok');ui();return true}
function bpRotate(){if(!BP)return;const h=BP.h;for(const it of BP.items){const s=SZ(it.t),nx=h-it.dy-s,ny=it.dx;it.dx=nx;it.dy=ny;it.d=(it.d+1)%4}BP={...BP,w:BP.h,h:BP.w};SFX.rot();ui()}
function bpAnchor(){return[Math.floor(cam.x/TS)-(BP.w>>1),Math.floor(cam.y/TS)-(BP.h>>1)]}
function bpPaste(){if(!BP)return;if(money<BP.cost){toast('Pas assez d’argent pour ce plan ('+BP.cost.toLocaleString(LOC)+' $)','bad');return}const[ax,ay]=bpAnchor();ugid++;let ok=0;const P0=P;P={bp:1};
const order=[...BP.items].sort((a,b)=>(isBelt(a.t)?1:0)-(isBelt(b.t)?1:0));
QUIET=1;for(const it of order){dir=it.d;cfg={t:it.t,rec:it.rec,flt:it.flt};const r=place(ax+it.dx,ay+it.dy,it.t);cfg=null;
if(r){ok++;const b=at([ax+it.dx,ay+it.dy]);if(b&&b.t==it.t){b.d=it.d;if(it.rec)b.rec=it.rec;if(it.flt)b.flt=it.flt}}}
QUIET=0;P=P0;bDirty=1;closeSheet();toast('Plan posé : '+ok+'/'+BP.items.length+' bâtiments',ok==BP.items.length?'ok':'bad');ui()}
const tcost=n=>Math.round(n.cost*(INVP.statue?.85:1));
const REVR=Object.create(null);for(const k in R){const r=R[k];if(Object.keys(r.in).length&&!REVR[r.out])REVR[r.out]=r}
const ACAP=6000;
const fp=n=>n.toLocaleString(LOC,{maximumFractionDigits:1});
const fmt=n=>LANG=='en'?'$'+Math.floor(n).toLocaleString(LOC):Math.floor(n).toLocaleString(LOC)+' $';
const avail=()=>{const s=new Set(['wood','stone','sand','clay','limestone','iron_ore','copper_ore','coal','quartz','bauxite','sulfur']);if(U.x.has('titan'))s.add('titanium_ore');if(U.x.has('uran'))s.add('uranium_ore');if(U.x.has('gold'))s.add('gold_ore');if(U.b.has('pump'))s.add('oil');for(const r of U.r)s.add(R[r].out);return s};
const pr=k=>{const v=IT[k][1]*m[k]*(U.x.has('mkt')?1.1:1)*(1+.05*(st.art+RELN))*evM('price');return v<10?Math.max(.1,Math.round(v*10)/10):Math.round(v)};
/* =====================================================================
   SIMULATION (un tick toutes les 0,5 s de jeu)
   ===================================================================== */
function accept(t,it,sx,sy){switch(t.t){
case'conveyor':case'belt2':case'belt3':case'bridge':return beltIn(t,it,sx,sy);
case'tunnel':{const f=fr(t);if(t.item||(f[0]==sx&&f[1]==sy))return false;t.item=it;t.st=tk_;t.from=[sx,sy];t.via=0;return true}
case'split2':case'splitter':case'osplit':case'sorter':if(t.item)return false;t.item=it;t.st=tk_;t.from=[sx,sy];return true;
case'crossing':{const dx=t.x-sx,dy=t.y-sy,d=Math.abs(dx)>=Math.abs(dy)?(dx>0?1:3):(dy>0?2:0),ax=d%2;if(!t.cr)t.cr=[null,null];if(t.cr[ax])return false;t.cr[ax]={it,d,st:tk_,from:[sx,sy]};return true}
case'sink':{const v=Math.max(1,Math.round(IT[it][1]*.5*(1+.05*(st.art+RELN))));money+=v;st.earned+=v;sales.push([gt,v]);sbA(it,'s',1);onSale(t);return true}
case'beacon':return false;
case'recycler':{if(!REVR[it]||(t.rq||(t.rq=[])).length>=2)return false;t.rq.push(it);return true}
case'dronest':{if(t.mode=='recv'||(t.dq||(t.dq=[])).length>=30)return false;t.dq.push(it);return true}
case'gen_steam':if(it=='water'){if((t.wat||0)>=20)return false;t.wat=(t.wat||0)+1;return true}
case'gen_bio':case'gen_coal':case'gen_fuel':case'reactor':{if(!GEN[t.t].f[it]||(t.fq||(t.fq=[])).length>=6)return false;t.fq.push(it);return true}
case'solarp':return false;
case'crate':case'silo':if(t.tot>=BD[t.t].cap)return false;t.st2[it]=(t.st2[it]||0)+1;t.tot++;return true;
case'seller':{const sd=(sx>t.x?1:sx<t.x?3:sy>t.y?2:0);if(!t.lsd)t.lsd=[-1,-1,-1,-1];if(t.lsd[sd]===tk_)return false;t.lsd[sd]=tk_;const v=pr(it)*(nearT(t,'golden',2)?1.2:1);money+=v;st.earned+=v;onSale(t);sales.push([gt,v]);sold[it]++;sbA(it,'s',1);m[it]=Math.max(.2,m[it]*.982);return true}
case'pad':{const c=t.ct;if(!c||c.item!=it||c.got>=c.n)return false;c.got++;sbA(it,'s',1);if(c.got>=c.n)ctDone(c,true);return true}}
if(!t.rec&&BD[t.t].m){/* machine neuve : on choisit la recette la plus simple qui utilise cet objet */const c=Object.keys(R).filter(k=>R[k].m==BD[t.t].m&&U.r.has(k)&&R[k].in[it]).sort((a,b)=>Object.keys(R[a].in).length-Object.keys(R[b].in).length);
if(c.length){t.rec=c[0];toast('Recette choisie : '+IT[R[c[0]].out][0]+' (touche la machine pour changer)','ok');rivet('Une machine choisit sa recette toute seule selon ce qui arrive. Touche-la pour en changer, et n’oublie pas de relier sa sortie (flèche orange).','autorec')}}
const r=R[t.rec],n=r&&r.in[it];if(!n||(t.buf[it]||0)>=n*2)return false;t.buf[it]=(t.buf[it]||0)+1;return true}
function pushD(b,it,d){const fs=fronts(b,d);if(fs.length==1){const t=at(fs[0]);return t?accept(t,it,fs[0][0]-DX[d],fs[0][1]-DY[d]):false}
const s=b.rr2=(b.rr2||0)+1;for(let k=0;k<fs.length;k++){const f=fs[(s+k)%fs.length],t=at(f);if(t&&t!==b&&accept(t,it,f[0]-DX[d],f[1]-DY[d]))return true}return false}
function pushS(b,it){if(b.t=='split2'){for(let k=0;k<2;k++){const d=(b.d+[1,3][(b.rr+k)%2])%4;if(pushD(b,it,d)){b.rr=(b.rr+k+1)%2;return true}}return false}
if(b.t=='osplit'){if(pushD(b,it,b.d))return true;for(let k=0;k<2;k++){const d=(b.d+[1,3][(b.rr+k)%2])%4;if(pushD(b,it,d)){b.rr=(b.rr+k+1)%2;return true}}return false}
if(b.t=='splitter'){for(let k=0;k<3;k++){const d=(b.d+[0,1,3][(b.rr+k)%3])%4;if(pushD(b,it,d)){b.rr=(b.rr+k+1)%3;return true}}return false}
if(b.t=='sorter')return pushD(b,it,b.flt&&it==b.flt?(b.d+3)%4:b.d);
/* Tunnel d'entrée : cherche un tunnel de sortie dans le même sens, 2 à 5 cases plus loin */
if(b.t=='tunnel'&&!b.via)for(let k=2;k<=5;k++){const t=at([b.x+DX[b.d]*k,b.y+DY[b.d]*k]);if(t&&t.t=='tunnel'&&t.d==b.d){if(t.item)return false;t.item=it;t.st=tk_;t.via=1;t.from=[b.x,b.y];return true}}
return pushD(b,it,b.d)}
function okRes(b){const r=Rs(b.x,b.y),d=BD[b.t];if(!r)return false;if(d.oil)return r=='oil';if(r=='oil')return false;if((r=='titanium'||r=='uranium')&&b.t!='ext3')return false;if(r=='titanium'&&!U.x.has('titan')||r=='uranium'&&!U.x.has('uran'))return false;return r!='gold'||U.x.has('gold')}
const BELTS=nz({conveyor:1,belt2:1,belt3:1,bridge:1}),isBelt=t=>!!BELTS[t],CARRY=nz({split2:1,splitter:1,osplit:1,sorter:1,tunnel:1}),
/* Vitesse en cases par tick et écart minimal entre deux objets : 3 objets par case au maximum.
   Débit : tapis 120/min, tapis rapide 240/min. */
BSP=nz({conveyor:.34,belt2:.67,bridge:.34}),GAP=.33;
function beltIn(t,it,sx,sy){const f=fr(t);if(f[0]==sx&&f[1]==sy)return false;const q=t.q||(t.q=[]);
const back=t.x-DX[t.d]==sx&&t.y-DY[t.d]==sy,side=sx==t.x+DX[(t.d+1)%4]&&sy==t.y+DY[(t.d+1)%4]?1:-1,curve=!back&&t.cv==side,p0=back||curve?0:.5;
/* Fusion : si une ligne attend sur le côté, l'arrière lui cède la place une fois sur deux */
if(back&&t.want>=tk_-1&&t.lastIn=='b')return false;
let ok=q.length<3;if(ok)for(const e of q)if(Math.abs(e.p-p0)<GAP-.001){ok=false;break}
if(!ok){if(!back&&!curve)t.want=tk_;return false}t.lastIn=back||curve?'b':'s';
let i=0;while(i<q.length&&q[i].p>p0)i++;const o=HAND||[sx*TS+16,sy*TS+16];let pn=p0;if(HAND&&HAND.length>2){const adv=Math.max(0,Math.min(.75,HAND[3]-(1-HAND[2])));pn=Math.min(p0+adv,i>0?q[i-1].p-GAP:1)}if(pn<p0)pn=p0;q.splice(i,0,{it,p:pn,pp:p0,p0,t:tk_,from:[sx,sy],ox:o[0],oy:o[1]});return true}
/* Position à l'écran d'un objet sur un tapis, pour l'animation fluide */
const CA=[1,0,-1,0],SA=[0,1,0,-1];function beltPos(b,p,p0){if(b.cv&&p0!==.5){const ca=CA[b.d],sa=SA[b.d];const a=Math.PI/2+b.cv*p*Math.PI/2,lx=b.cv*16+Math.cos(a)*16,ly=-16+Math.sin(a)*16;return[b.x*TS+16+lx*ca-ly*sa,b.y*TS+16+lx*sa+ly*ca]}
return[b.x*TS+16+DX[b.d]*(p-.5)*TS,b.y*TS+16+DY[b.d]*(p-.5)*TS]}
let HAND=null;
/* Un sous-pas de tapis : passage de l'objet de tête à la case suivante, puis avance des autres */
function beltStep(b,v){const q=b.q;if(!q||!q.length)return;
if(q[0].p>=.999&&q[0].t!==tk_){HAND=q[0].ox!=null?[q[0].ox,q[0].oy,q[0].pp==null?1:q[0].pp,v]:null;const ok=pushD(b,q[0].it,b.d);HAND=null;if(ok)q.shift()}
for(let i=0;i<q.length;i++){const e=q[i],mx=i==0?1:q[i-1].p-GAP;if(e.p<mx)e.p=Math.min(mx,e.p+v)}}
/* Ordre de traitement : de l'aval vers l'amont, pour que chaque tapis libère sa place avant de recevoir */
let BORD_=[],bDirty=1;
const feeds=(n,b)=>outsTo(n,b);
function beltShape(b){const bk=at([b.x-DX[b.d],b.y-DY[b.d]]),r=at([b.x+DX[(b.d+1)%4],b.y+DY[(b.d+1)%4]]),l=at([b.x+DX[(b.d+3)%4],b.y+DY[(b.d+3)%4]]);
const fb=feeds(bk,b),fr2=feeds(r,b),fl=feeds(l,b);b.cv=!fb&&fr2!=fl?(fr2?1:-1):0}
let CARRL=[];function beltOrder(){CARRL=L.filter(b=>CARRY[b.t]||b.t=='crossing');const bs=L.filter(b=>BELTS[b.t]),dist=new Map();for(const b of bs)b.bm=0;for(const m0 of L)if(m0.t=='beltmotor')for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){const n=at([m0.x+i,m0.y+j]);if(n&&BELTS[n.t])n.bm=1}bs.forEach(beltShape);const dd=b=>{if(dist.has(b))return dist.get(b);dist.set(b,0);const n=at(fr(b));const v=n&&BELTS[n.t]?1+dd(n):0;dist.set(b,v);return v};bs.forEach(dd);BORD_=bs.sort((a,b)=>dist.get(a)-dist.get(b));bDirty=0}
function beltsTick(){if(bDirty||tk_%10==0)beltOrder();for(const b of BORD_)if(b.q)for(const e of b.q){if(e.t===tk_)continue;e.pp=e.p;const w=beltPos(b,e.p,e.p0);e.ox=w[0];e.oy=w[1]}
for(let s=0;s<3;s++)for(const b of BORD_){const bm=b.bm?1.5:1;if(s==0)beltStep(b,(b.t=='conveyor'||b.t=='bridge'?BSP[b.t]:.335)*bm);else if(s==1&&(b.t=='belt2'||b.t=='belt3')||s==2&&b.t=='belt3')beltStep(b,.335*bm)}}
const beltCount=b=>b.q?b.q.length:0,STORE=nz({silo:1,crate:1});
function beacons(b){let n=0;const s=bsz(b);for(let j=-1;j<=s;j++)for(let i=-1;i<=s;i++){if(i>=0&&j>=0&&i<s&&j<s)continue;const t=BL.get(tk(b.x+i,b.y+j));if(t&&t.t=='beacon')n++}return Math.min(2,n)}
function status(b){const d=BD[b.t];if(d.rt)return!okRes(b)?'r':b.out.length>=3?'y':PWR[b.t]&&GRID.r<.05?'y':'g';if(d.m)return!R[b.rec]?'r':PWR[b.t]&&GRID.r<.05?'y':b.busy?'g':'y';if(STORE[b.t])return b.tot>=d.cap?'y':'g';if(GEN[b.t])return b.mw>0?'g':'y';return'g'}
const SB=Array.from({length:120},()=>({}));let REV=0;
function sbA(k,t,n){const o=SB[tk_%120],e=o[k]||(o[k]={p:0,c:0,s:0});e[t]+=n}
let GRID={prod:0,use:0,r:1,on:false};
const daylight=()=>OPT.night?1-Math.max(0,-Math.sin(((gt/1000/360)%1)*6.283)):1;
function powerTick(){let prod=0,use=0,on=false;for(const b of L){const g=GEN[b.t];if(g){on=true;if(g.sun){b.mw=Math.round(g.mw*daylight()*evM('sun'));prod+=b.mw;continue}
if(g.dam){b.mw=isRiver(b.x,b.y)&&damOK(b)?Math.round(g.mw*evM('dam')):0;prod+=b.mw;continue}
if(g.wind){b.mw=windMW(b);prod+=b.mw;continue}
if(g.water){if((b.wat||0)<.5){b.mw=0;continue}if(b.burn>0||b.fq&&b.fq.length)b.wat-=.5}const gm=Math.round(g.mw*evM('therm'));if(b.burn>0){b.burn--;prod+=gm;b.mw=gm}else if(b.fq&&b.fq.length){const it=b.fq.shift();b.burn=g.f[it]-1;prod+=gm;b.mw=gm}else b.mw=0;continue}
const p=PWR[b.t];if(p){on=true;const d=BD[b.t];if(d.rt?okRes(b)&&b.out.length<3:R[b.rec]&&(b.busy||b.out.length<4))use+=p*(b.lv?LVS[b.lv-1]:1)}}
for(const b of L){if(b.t=='rcore'){b.mw=40;prod+=40;on=true}else if(b.t=='orbital'){b.mw=25;prod+=25;on=true}else if(GEN[b.t]&&b.mw&&nearT(b,'cryo',2)){const x=Math.round(b.mw*.3);prod+=x;b.mw+=x}}prod+=st.mwb||0;if(st.mwb)on=true;{let sur=prod-use;for(const b of L)if(b.t=='accu'){on=true;b.ch=b.ch||0;b.mw=0;if(sur>0){const c=Math.min(sur,30,ACAP-b.ch);b.ch+=c;sur-=c}else if(sur<0&&b.ch>0){const g=Math.min(-sur,40,b.ch);b.ch-=g;prod+=g;sur+=g;b.mw=g}}}GRID={prod,use,r:use?Math.min(1,prod/use):1,on}}
/* Un tronçon de barrage produit si la ligne de barrages va d'une rive à l'autre */
function damOK(b){for(const ax of[[1,0],[0,1]]){let ok=true;for(const s of[1,-1]){let k=1;for(;;){const x=b.x+ax[0]*s*k,y=b.y+ax[1]*s*k,t=at([x,y]);if(t&&t.t=='dam'){if(++k>14){ok=false;break}continue}if(!Bi(x,y)&&!PLAT.has(tk(x,y)))ok=false;break}if(!ok)break}if(ok)return true}return false}
/* Éolienne : meilleure en montagne et sur la côte, moins bonne en forêt ; deux éoliennes trop proches se gênent */
/* =====================================================================
   ÉVÉNEMENTS MÉTÉO : toutes les 5 à 9 minutes de jeu, un événement de 2 à 3 minutes
   qui change la production d'énergie (ou la vitesse des machines de pointe).
   ===================================================================== */
const EVD={storm:{n:'Tempête',d:'Éoliennes ×2, mais il pleut à verse.',wind:2,du:[90,150]},
calm:{n:'Calme plat',d:'Plus un souffle : éoliennes ×0,3.',wind:.3,du:[120,240]},
trade:{n:'Alizés',d:'Un vent régulier : éoliennes ×1,5.',wind:1.5,du:[240,360]},
drought:{n:'Sécheresse',d:'Barrages à moitié, solaire +40 %.',dam:.5,sun:1.4,du:[180,300]},
flood:{n:'Crue',d:'Les rivières débordent : barrages ×1,6.',dam:1.6,du:[120,180]},
fog:{n:'Brume épaisse',d:'Le soleil peine à percer : solaire ×0,5.',sun:.5,du:[120,180]},
heat:{n:'Canicule',d:'Centrales à combustible ×0,75, solaire +20 %.',therm:.75,sun:1.2,du:[180,240]},
aurora:{n:'Aurore boréale',d:'Four à arc, centrifugeuse et salle blanche +40 % de vitesse.',hi:1.4,du:[90,180],night:1},
stars:{n:'Étoiles filantes',d:'Les marchés font la fête : +15 % sur tous les prix.',price:1.15,du:[90,150],night:1}};
let EV=null,evNext=540000+Math.random()*420000;
const evM=k=>EV&&EVD[EV.k][k]||1;
function evTick(dt){if(menu||paused)return;const g=dt*spd;if(EV){EV.left-=g;if(EV.left<=0){toast('Fin : '+EVD[EV.k].n);EV=null;evNext=540000+Math.random()*420000}return}
evNext-=g;if(evNext>0||L.length<6)return;const night=nightK()>.15,ks=Object.keys(EVD).filter(k=>!EVD[k].night||night),k=ks[Math.random()*ks.length|0],du=EVD[k].du;
EV={k,left:(du[0]+Math.random()*(du[1]-du[0]))*1000};if(k=='storm')rain=1;toast(EVD[k].n+' : '+EVD[k].d,'ok');SFX.ship();rivet('Un événement météo ! Il change la production d’énergie pendant quelques minutes : c’est le moment d’avoir plusieurs sources d’énergie.','ev')}
function windMW(b){const bi=Bi(b.x,b.y),bf=bi==4?1.4:bi==3?1.2:bi==2?.6:bi==0?1.3:1,gust=.8+.2*Math.sin(gt/20000+b.x*.7+b.y*.3);let n=0;
for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){if(!i&&!j)continue;const t=BL.get(tk(b.x+i,b.y+j));if(t&&t.t=='wind')n++}return Math.round(GEN.wind.mw*bf*gust*Math.pow(.75,n)*evM('wind'))}
const HIT=nz({arc:1,centrifuge:1,cleanroom:1});const pf=b=>(PWR[b.t]?GRID.r:1)*(HIT[b.t]?evM('hi'):1);
function tick(){tk_++;SB[tk_%120]={};powerTick();
for(const b of L){const d=BD[b.t];
if(d.rt){if((b.cd-=pf(b)*(1+.1*(st.extb||0))*drillF(b))<=0){if(b.out.length<3&&okRes(b)&&RN[Rs(b.x,b.y)]){const it=RN[Rs(b.x,b.y)];b.out.push(it);sbA(it,'p',1);b.cd+=d.rt}else b.cd=0}}
else if(d.m){const r=R[b.rec];if(!r)continue;if(b.busy){b.pr-=LVS[b.lv-1]*(1+.25*beacons(b))*pf(b)*(nearT(b,'antenna',2)?1.3:1)*(INVP.clock?1.08:1);if(b.pr<=0){for(let i=0;i<r.n;i++)b.out.push(r.out);b.busy=0;st.made[r.out]=(st.made[r.out]||0)+r.n;sbA(r.out,'p',r.n)}}
if(!b.busy&&b.out.length<=4-r.n){let ok=true;for(const k in r.in)if((b.buf[k]||0)<r.in[k]){ok=false;break}if(ok){for(const k in r.in){b.buf[k]-=r.in[k];sbA(k,'c',r.in[k])}b.busy=1;b.pr=r.t}}}}
/* répartiteurs, trieurs, tunnels et croisements passent leur objet avant que les tapis bougent : débit plein, sans temps mort */
for(const b of CARRL){if(CARRY[b.t]){if(b.item&&b.st!==tk_&&pushS(b,b.item))b.item=null}else if(b.cr)for(let a=0;a<2;a++){const q=b.cr[a];if(q&&q.st!==tk_&&pushD(b,q.it,q.d))b.cr[a]=null}}
beltsTick();
for(let p=0;p<4;p++){let ch=0;for(const b of L){
if(BELTS[b.t])continue;
if(CARRY[b.t]){if(b.item&&b.st!==tk_&&pushS(b,b.item)){b.item=null;ch=1}}
else if(b.t=='crossing'){if(b.cr)for(let a=0;a<2;a++){const q=b.cr[a];if(q&&q.st!==tk_&&pushD(b,q.it,q.d)){b.cr[a]=null;ch=1}}}
else{if(b.ps!==tk_){b.ps=tk_;b.pn=0}if(b.pn<2){if(STORE[b.t]){let k=null;for(const q in b.st2)if(b.st2[q]>0){k=q;break}if(k&&pushD(b,k,b.d)){b.st2[k]--;b.tot--;b.pn++;ch=1}}
else if(b.out.length&&pushD(b,b.out[0],b.d)){b.out.shift();b.pn++;ch=1}}}}if(!ch)break}
for(const k in IT){m[k]+=(1-m[k])*(U.x.has("mkt")?.02:.01)+(Math.random()-.5)*.01;m[k]=Math.max(.2,Math.min(1.8,m[k]));if(tk_%8==0){(hist[k]=hist[k]||[]).push(m[k]);if(hist[k].length>36)hist[k].shift()}}
if(tk_%120==0){const ks=[...avail()],k=ks[Math.random()*ks.length|0];if(Math.random()<.5){m[k]=Math.min(1.8,m[k]*1.6);toast('Forte demande : '+IT[k][0],'ok');SFX.newsUp()}else{m[k]*=.65;toast('Surproduction : '+IT[k][0]);SFX.newsDn()}}
while(sales.length&&sales[0][0]<gt-60000)sales.shift();
if(GRID.on){const e=$('pw'),t=svg('bolt')+' '+GRID.prod+'/'+Math.round(GRID.use)+' MW'+(EV?' · '+svg('ev_'+EV.k)+' '+Math.ceil(EV.left/60000)+' min':'');e.hidden=false;if(e.dataset.h!==t){e.innerHTML=t;e.dataset.h=t}e.classList.toggle('low',GRID.r<1)}else $('pw').hidden=true;
if(tk_%2==0){REV=Math.round(sales.reduce((a,s)=>a+s[1],0)*60000/Math.max(15000,Math.min(60000,gt)));const rt='+'+REV.toLocaleString(LOC)+' $/min';if($('rev').textContent!==rt)$('rev').textContent=rt}
ctTick();qTick();ambTick();for(const b of L){
if(b.t=='wpump'){if(--b.cd<=0&&b.out.length<3){b.out.push('water');b.cd=2;sbA('water','p',1)}}
else if(b.t=='recycler'){if(b.busy){if(--b.pr<=0){b.busy=0;const r=REVR[b.cur];if(r){let n=0;for(const k in r.in){const c=Math.floor(r.in[k]*.5);for(let i=0;i<c&&b.out.length<10;i++){b.out.push(k);n++}}if(!n&&b.out.length<10)b.out.push(Object.keys(r.in)[0])}b.cur=null}}else if(b.rq&&b.rq.length&&b.out.length<6){b.cur=b.rq.shift();b.busy=1;b.pr=4}}
else if(b.t=='dronest'&&b.mode!='recv'){if(b.fl){if(tk_-b.fl.t0>=b.fl.dur){const t=b.fl.to;if(L.includes(t)&&(t.out.length+b.fl.items.length)<=24){t.out.push(...b.fl.items);b.fl=null;SFX.tab&&0}else if(!L.includes(t)){b.dq.unshift(...b.fl.items);b.fl=null}}}
else if(b.dq&&b.dq.length&&tk_%4==0){let best=null,bd=1e9;for(const o of L)if(o.t=='dronest'&&o!==b&&o.mode=='recv'){const d=Math.hypot(o.x-b.x,o.y-b.y);if(d<bd){bd=d;best=o}}if(best)b.fl={to:best,items:b.dq.splice(0,6),t0:tk_,dur:Math.max(4,Math.round(bd/5))}}}
if(b.t=='well'){if(--b.cd<=0&&b.out.length<3){b.out.push('oil');b.cd=4;st.made.oil=(st.made.oil||0)+1}}else if(b.t=='vault'&&tk_%120==0){const g=Math.min(2000,Math.round(money*.004));if(g>0){money+=g;st.earned+=g;fl.push({x:b.x*TS+16,y:b.y*TS,t:time,s:'+'+g+' $'})}}}for(const b of L){const d=BD[b.t];if(!(d.m||d.rt))continue;const on=d.m?!!b.busy:status(b)=='g';b.ua=(b.ua==null?.5:b.ua)*.985+(on?.015:0);
if(!on){const r=R[b.rec];b.why=d.m&&r?(b.out.length>=4?'out':Object.keys(r.in).find(k=>(b.buf[k]||0)<r.in[k])||(PWR[b.t]&&GRID.r<1?'pow':b.why)):b.out&&b.out.length>=3?'out':PWR[b.t]&&GRID.r<1?'pow':b.why}}if(tk_%10==0){INVP={};RELN=0;for(const b of L)if(BD[b.t].inv){INVP[b.t]=1;if(b.t=='relic')RELN++}}if(tk_%6==0)tipsTick();if(tk_%10==0)achTick();
if(sheet=='i')updInsp();else if(sheet=='m'&&tk_%4==0){if(mtab=='p')renderSheet();else updMarket()}else if(sheet=='t'&&tk_%2==0)renderTD()}
/* Commandes de vaisseaux */
function ctDone(c,ok){const p=c.pad;if(ok){money+=c.reward;st.earned+=c.reward;st.delivered++;SFX.shipOk();coin(p,6);toast('Commande livrée : +'+c.reward.toLocaleString(LOC)+' $','ok');fl.push({x:p.x*TS+16,y:p.y*TS,t:time,s:'+'+c.reward+' $'});vib([20,40,20])}
else{toast('Le vaisseau est reparti sans sa commande');SFX.shipKo()}p.ct=null;p.leave=time;CT.splice(CT.indexOf(c),1);ctUI()}
function ctTick(){for(const c of CT.slice()){if(at([c.pad.x,c.pad.y])!==c.pad)CT.splice(CT.indexOf(c),1);else if(tk_-c.t0>c.dur)ctDone(c,false)}
if(tk_%60==0&&CT.length<3){const pads=L.filter(b=>b.t=='pad'&&!b.ct);if(pads.length){const q=new Set();for(const x of L){if(BD[x.t].rt&&okRes(x))q.add(RN[Rs(x.x,x.y)]);if(BD[x.t].m&&R[x.rec])q.add(R[x.rec].out)}
const pool=q.size?[...q]:['iron_ingot','copper_ingot'],it=pool[Math.random()*pool.length|0],base=IT[it][1],n=Math.max(3,Math.round((120+Math.random()*100)/Math.sqrt(base)/2.2)),pd=pads[Math.random()*pads.length|0],
c={item:it,n,got:0,t0:tk_,dur:200+n*6,reward:Math.round(base*n*1.5*(1+.05*(st.art+RELN))),pad:pd,born:time};pd.ct=c;CT.push(c);SFX.ship();toast('Un vaisseau demande '+n+' × '+IT[it][0])}}ctUI()}
/* =====================================================================
   ACTIONS DU JOUEUR
   ===================================================================== */
function place(x,y,t){const d=BD[t],ex=BL.get(tk(x,y));
if(ex&&isBelt(ex.t)&&ex.t!='bridge'&&(t=='split2'||t=='splitter'||t=='osplit'||t=='sorter'||t=='crossing')&&U.b.has(t)&&money>=d.cost-BD[ex.t].cost){pushU({k:'e',x:ex.x,y:ex.y,c:BD[ex.t].cost,b:{t:ex.t,d:ex.d}});money+=BD[ex.t].cost;dir=ex.d;unregB(ex);L.splice(L.indexOf(ex),1);bDirty=1}
if(BL.has(tk(x,y)))return false;
if(t=='wpump'&&!(isRiver(x,y)||[[1,0],[-1,0],[0,1],[0,-1]].some(([i,j])=>!Bi(x+i,y+j)))){toast('La pompe à eau se pose au bord de l’eau ou sur une rivière','bad');return false}
if(SZ(t)>1){const n=SZ(t)+'×'+SZ(t);for(const c of tilesOf(t,x,y)){if(BL.has(tk(c[0],c[1]))||poiAt(c[0],c[1]))return toast('Il faut '+n+' cases libres','bad'),false;if(!owned(c[0],c[1]))return toast('Cette parcelle ne t’appartient pas encore','bad'),false;if(!Bi(c[0],c[1])&&!PLAT.has(tk(c[0],c[1])))return toast('Il faut '+n+' cases sur la terre ferme','bad'),false}}
if(!owned(x,y)){toast('Cette parcelle ne t’appartient pas encore','bad');return false}
if(d.plat){if(Bi(x,y)){toast('La plateforme se pose sur l’eau','bad');return false}if(PLAT.has(tk(x,y)))return false;if(money<d.cost){toast('Pas assez d’argent','bad');return false}
money-=d.cost;PLAT.add(tk(x,y));pushU({k:'pp',x,y,c:d.cost});SFX.place();burst(x,y,'#c08a52',10);vib(10);if(recent[0]!=t)recent=[t,...recent.filter(q=>q!=t)].slice(0,6);return true}
if(t=='dam'&&!isRiver(x,y)){toast('Le barrage se pose sur une rivière','bad');return false}
if(!Bi(x,y)&&!PLAT.has(tk(x,y))&&t!='bridge'&&t!='dam'){toast(U.b.has('bridge')?'Sur l’eau : pose une plateforme, ou un pont pour les tapis':'Impossible de construire sur l’eau','bad');return false}
if(poiAt(x,y)){toast('Fouille d’abord ce point d’intérêt','bad');return false}
const rr=Rs(x,y);
if(d.oil&&rr!='oil'){toast('La pompe se pose sur une nappe de pétrole','bad');return false}
if(d.rt&&!d.oil&&(!rr||rr=='oil')){toast(rr=='oil'?'Il faut une pompe pour le pétrole':'Un extracteur se pose sur un gisement','bad');return false}
if(d.rt&&rr=='gold'&&!U.x.has('gold')){toast('Recherche « Orfèvrerie » requise pour l’or','bad');return false}
if(d.rt&&(rr=='titanium'||rr=='uranium')&&t!='ext3'){toast('Il faut un Extracteur Mk3 pour ce minerai','bad');return false}
if(t=='seller'&&L.filter(q=>q.t=='seller').length>=2){toast('2 terminaux de vente maximum : livre les vaisseaux ou utilise le broyeur','bad');return false}
if(d.inv&&!(INV[t]>0)){toast('Tu n’en as plus en stock : fouille des épaves et des artefacts','bad');return false}if(d.inv)INV[t]--;
const freeB=!d.inv&&(st.free||0)>0&&(d.m||d.rt||GEN[t]);if(!freeB&&money<d.cost){toast('Pas assez d’argent','bad');return false}
if(freeB){st.free--;if(!st.free)toast('Kit de construction épuisé')}else money-=d.cost;const b=mk(t,x,y,dir);
if(d.m){const mr=cfg&&cfg.t==t?cfg.rec:cfgMem[t];b.rec=R[mr]&&R[mr].m==d.m?mr:null}if(t=='sorter')b.flt=cfg&&cfg.t==t?cfg.flt:cfgMem.sorterF||null;
if(!['wind','dam','solarp','conveyor','belt2','belt3','bridge','split2','splitter','osplit','sorter','tunnel','crossing','seller','pad','sink','beacon'].includes(t)&&!at(fr(b))){const k=[0,1,2,3].find(q=>{const n=at([x+DX[q],y+DY[q]]);if(!n||n.t!='conveyor')return false;const f=fr(n);return!(f[0]==x&&f[1]==y)});if(k!==undefined)b.d=k}
regB(b);L.push(b);b.born=time;bDirty=1;if(t=='greenhouse'&&!b.rec)b.rec='fiberg';if(t=='dronest')b.mode=cfg&&cfg.mode||'send';if(d.m||d.rt)rivet('Chaque machine a une sortie : la petite flèche orange. Pour changer son sens, touche la machine puis « Tourner », ou tourne avant de poser avec le bouton ↻.','rot');pushU({k:'p',x,y,c:freeB?0:d.cost});if(recent[0]!=t)recent=[t,...recent.filter(q=>q!=t)].slice(0,6);vib(t=='conveyor'?4:10);
if(isBelt(t))SFX.belt();else{SFX.place();burst(x,y,'#c9ced6',8)}
if(d.m&&!b.rec&&!P){autoInsp=true;openInsp(b)}return true}
function erase(x,y){if(!undoing&&!redoing&&at([x,y]))st.demol=(st.demol||0)+1;const b=at([x,y]);if(b&&BD[b.t].inv){INV[b.t]++;pushU({k:'ei',x:b.x,y:b.y,t:b.t,d:b.d});unregB(b);L.splice(L.indexOf(b),1);bDirty=1;if(sel==b)openInsp(null);vib(12);SFX.del();toast(BD[b.t].n+' : remise dans ton inventaire');return}if(!b){if(PLAT.has(tk(x,y))){PLAT.delete(tk(x,y));const c=BD.platform.cost;pushU({k:'ep',x,y,c});money+=c;fl.push({x:x*TS+16,y:y*TS,t:time,s:'+'+c+' $'});SFX.del();burst(x,y,'#c08a52',10)}return}const c=BD[b.t].cost*(b.lv||1);money+=c;pushU({k:'e',x:b.x,y:b.y,c,b:{t:b.t,d:b.d,rec:b.rec,lv:b.lv,flt:b.flt}});fl.push({x:x*TS+16,y:y*TS,t:time,s:'+'+c+' $'});unregB(b);L.splice(L.indexOf(b),1);bDirty=1;if(sel==b)openInsp(null);vib(12);SFX.del();burst(x,y,'#FA9549',12)}
/* Pile d'annulation (15 gestes) */
const UND=[];let ugid=0;let RED=[],redoing=false;const SEEN=new Set();
function pushU(a){if(undoing)return;if(!redoing)RED.length=0;a.g=ugid;UND.push(a);if(UND.length>200)UND.shift()}let undoing=false;
function undo(){if(!UND.length)return;const g=UND[UND.length-1].g;undoing=true;let n=0;const rg=[];
while(UND.length&&UND[UND.length-1].g==g){const a=UND.pop();n++;
if(a.k=='p'){const b=at([a.x,a.y]);if(b)rg.push({k:'rp',t:b.t,x:b.x,y:b.y,d:b.d,rec:b.rec,flt:b.flt})}else if(a.k=='e'||a.k=='ei'||a.k=='ep')rg.push({k:'re',x:a.x,y:a.y});else if(a.k=='pp')rg.push({k:'rpp',x:a.x,y:a.y});
if(a.k=='p'){const b=at([a.x,a.y]);if(b){if(BD[b.t].inv)INV[b.t]++;unregB(b);L.splice(L.indexOf(b),1);money+=a.c;if(sel==b)sel=null}}
else if(a.k=='ei'){if(INV[a.t]>0&&tilesOf(a.t,a.x,a.y).every(c=>!at(c))){INV[a.t]--;const b=mk(a.t,a.x,a.y,a.d);regB(b);L.push(b)}}
else if(a.k=='pp'){if(!at([a.x,a.y])&&PLAT.delete(tk(a.x,a.y)))money+=a.c}
else if(a.k=='ep'){if(money>=a.c){PLAT.add(tk(a.x,a.y));money-=a.c}}
else if(a.k=='e'&&tilesOf(a.b.t,a.x,a.y).every(c=>!at(c))&&money>=a.c){const b=mk(a.b.t,a.x,a.y,a.b.d);Object.assign(b,{rec:a.b.rec,lv:a.b.lv||1,flt:a.b.flt||null});regB(b);L.push(b);money-=a.c}
else if(a.k=='u'){const b=at([a.x,a.y]);if(b&&isBelt(b.t)){b.t=a.from||'conveyor';money+=a.c}}}
bDirty=1;undoing=false;if(rg.length){RED.push(rg.reverse());if(RED.length>50)RED.shift()}SFX.copy();toast('Annulé ('+n+' action'+(n>1?'s':'')+')');ui()}
function redo(){const g=RED.pop();if(!g)return;ugid++;redoing=true;QUIET=1;let n=0;const P0=P;P={bp:1};
for(const a of g){if(a.k=='rp'){dir=a.d;cfg={t:a.t,rec:a.rec,flt:a.flt};if(place(a.x,a.y,a.t)){n++;const b=at([a.x,a.y]);if(b){b.d=a.d;if(a.rec)b.rec=a.rec}}cfg=null}
else if(a.k=='re'){const b=at([a.x,a.y]);if(b||PLAT.has(tk(a.x,a.y))){erase(a.x,a.y);n++}}else if(a.k=='rpp'){if(place(a.x,a.y,'platform'))n++}}
P=P0;QUIET=0;redoing=false;bDirty=1;closeSheet();SFX.copy();toast('Rétabli ('+n+' action'+(n>1?'s':'')+')');ui()}
function setTool(t){tool=t;dis=false;cfg=null;sel=null;bpMode=null;if(sheet)closeSheet();ui()}
function pipette(b){SFX.copy();setTool(b.t);dir=b.d;cfg={t:b.t,rec:b.rec,flt:b.flt};toast('Copié : '+BD[b.t].n);ui()}
const ACH=[
['first','Premier lingot','Fabrique ton premier lingot',()=>(st.made.iron_ingot||0)+(st.made.copper_ingot||0)>0,50],
['sell100','Commerçant','Vends 100 objets',()=>Object.values(sold).reduce((a,b)=>a+b,0)>=100,150],
['rev1k','Usine rentable','Atteins 1 000 $/min',()=>REV>=1000,500],
['rev10k','Empire','Atteins 10 000 $/min',()=>REV>=10000,5000],
['p10','Propriétaire','Possède 10 parcelles',()=>OWN.size>=10,300],
['p30','Baron foncier','Possède 30 parcelles',()=>OWN.size>=30,3000],
['poi3','Archéologue','Fouille 3 points d’intérêt',()=>st.poi>=3,400],
['art3','Collectionneur','Récolte 3 artefacts',()=>st.art>=3,1500],
['belt100','Logisticien','Pose 100 tapis',()=>L.filter(b=>BELTS[b.t]).length>=100,500],
['mach30','Ingénieur','Fais tourner 30 machines',()=>L.filter(b=>BD[b.t].m).length>=30,1000],
['power','Électricien','Allume ta première centrale',()=>L.some(b=>GEN[b.t]&&b.mw>0),300],
['hydro','Maître des eaux','Fais tourner un barrage',()=>L.some(b=>b.t=='dam'&&b.mw>0),1500],
['wind10','Champ d’éoliennes','Fais tourner 10 éoliennes',()=>L.filter(b=>b.t=='wind'&&b.mw>0).length>=10,2000],
['mw500','Centrale géante','Produis 500 MW',()=>GRID.prod>=500,4000],
['oil','Pétrolier','Pompe ton premier baril',()=>(st.made.plastic||0)+(st.made.fuel||0)+(st.made.rubber||0)>0,800],
['deliv25','Livreur express','Livre 25 commandes',()=>st.delivered>=25,2500],
['atom','Atomiste','Enrichis de l’uranium',()=>(st.made.uranium||0)>0,6000],
['allres','Savant fou','Termine toutes les recherches',()=>U.t.size>=T.length,20000],
['million','Millionnaire','Gagne 1 000 000 $ au total',()=>st.earned>=1e6,50000],
['cargo','Armateur','Construis un vaisseau de fret',()=>(st.made.cargo||0)>0,100000]];
const ACHD=new Set();
function achTick(){for(const a of ACH)if(!ACHD.has(a[0])&&a[3]()){ACHD.add(a[0]);money+=a[4];st.earned+=a[4];toast('Succès : '+a[1]+' (+'+a[4].toLocaleString(LOC)+' $)','ok');SFX.res();vib([10,30,10,30,10])}}
function unlockT(n){U.t.add(n.id);(n.b||[]).forEach(k=>U.b.add(k));(n.r||[]).forEach(k=>U.r.add(k));if(n.x)U.x.add(n.x)}
function research(id){const n=T.find(x=>x.id==id);if(U.t.has(id))return;if(!n.req.every(r=>U.t.has(r)))return toast('Prérequis manquants','bad');if(money<tcost(n))return toast('Pas assez d’argent','bad');
money-=tcost(n);unlockT(n);toast('Recherche terminée : '+n.n,'ok');SFX.res();vib([15,30,15]);renderSheet();save()}
function upgrade(b){const n=NX[b.t];if(!n||!U.b.has(n))return;const c=BD[n].cost-Math.floor(BD[b.t].cost/2);if(money<c)return toast('Pas assez d’argent','bad');money-=c;b.t=n;SFX.up();toast(BD[n].n+' installé','ok');renderSheet()}
const lvOK=lv=>lv==2?U.x.has('lv2'):lv==3?U.x.has('lv3'):true,lvCost=b=>BD[b.t].cost*b.lv;
function levelUp(b){const n=b.lv+1;if(n>3||!lvOK(n))return;const c=lvCost(b);if(money<c)return toast('Pas assez d’argent','bad');money-=c;b.lv=n;SFX.up();toast(BD[b.t].n+' niveau '+n,'ok');renderSheet()}
function zoomBy(f){SFX.zoom();cam.z=Math.max(.15,Math.min(3,cam.z*f))}
function jump(r){const px0=Math.floor(cam.x/TS)>>3,py0=Math.floor(cam.y/TS)>>3;let best=null,bd=1e9;
for(let j=-12;j<=12;j++)for(let i=-12;i<=12;i++){const px=px0+i,py=py0+j;if(!pstate(px,py))continue;const c=chunk(px,py);for(let k=0;k<64;k++)if(c.r[k]==r){const x=px*CH+(k&7),y=py*CH+(k>>3),d=Math.hypot(x*TS-cam.x,y*TS-cam.y);if(d<bd&&d>260){bd=d;best=[x,y]}}}
if(best){cam.x=best[0]*TS+16;cam.y=best[1]*TS+16;closeSheet()}else toast('Aucun autre gisement visible à proximité','bad')}
/* Exploration */
let selP=null,selPOI=null,autoInsp=false,selInfo=null,mtab='c';
function bestExt(r){if(r=='oil')return U.b.has('pump')?'pump':null;if(r=='titanium'||r=='uranium')return U.b.has('ext3')?'ext3':null;return['ext3','ext2','ext1'].find(k=>U.b.has(k))}
function buyP(k){const px=Math.floor(k/65536+.5),py=k-px*65536;if(pstate(px,py)!=1)return;const p=pPrice(px,py);if(money<p)return toast('Pas assez d’argent','bad');money-=p;OWN.add(k);closeSheet();
for(let i=0;i<6;i++)burst(px*CH+Math.random()*CH|0,py*CH+Math.random()*CH|0,'#FA9549',6);SFX.buy();vib([15,30,15]);toast('Nouvelle parcelle !','ok');save()}
function digPOI(q){if(!q||FOUND.has(tk(q.x,q.y)))return;const x=q.x,y=q.y;FOUND.add(tk(x,y));st.poi++;closeSheet();burst(x,y,'#c77dff',16);(SFX[q.k]||SFX.quest)();vib([20,40,20]);
if(q.k=='wreck'){const v=q.v||0;
if(v==0){const g=Math.round(150+Math.random()*200+Math.hypot(x,y)*9);money+=g;st.earned+=g;fl.push({x:x*TS+16,y:y*TS,t:time,s:'+'+g+' $'});toast('Cargaison récupérée : +'+g+' $','ok')}
else if(v==1){invAdd('xdrill');toast('Foreuse ancienne ajoutée à ton inventaire','ok')}
else if(v==2){invAdd('rcore');toast('Cœur de réacteur ajouté à ton inventaire','ok')}
else if(v==3){st.free=(st.free||0)+6;toast('Kit de construction : '+st.free+' machines gratuites','ok')}
else{let best=null,bd=1e9;const px0=x>>3,py0=y>>3;for(let j=-4;j<=4;j++)for(let i=-4;i<=4;i++)if(pstate(px0+i,py0+j)==1){const d=Math.hypot(i,j);if(d<bd){bd=d;best=pk(px0+i,py0+j)}}
if(best!=null){OWN.add(best);toast('Le drone t’offre une nouvelle parcelle !','ok')}else{money+=400;toast('Cartes revendues : +400 $','ok')}}}
else if(q.k=='ruin'&&Math.random()<.45){const f=['statue','antenna','well','beltmotor'][Math.random()*4|0];invAdd(f);toast(BD[f].n+' ajoutée à ton inventaire','ok')}
else if(q.k=='ruin'){const av=T.filter(n=>!U.t.has(n.id)&&n.req.every(r=>U.t.has(r)));if(av.length){const n=av[Math.random()*av.length|0];unlockT(n);toast('Plans retrouvés : '+n.n+' débloqué !','ok')}else{money+=150;toast('Ruines fouillées : +150 $','ok')}}
else{const f=['relic','golden','cryo','orbital','clock','vault'][Math.random()*6|0];invAdd(f);toast(BD[f].n+' ajoutée à ton inventaire','ok')}save()}
