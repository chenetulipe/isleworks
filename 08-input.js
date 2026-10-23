/* =====================================================================
   TACTILE
   Un doigt : déplacer la carte (ou tracer des tapis avec l'outil Tapis /
   en partant d'une machine). Deux doigts : déplacer et zoomer.
   Appui long sur une case vide : menu rapide. Double tap : copier.
   ===================================================================== */
let P=null,LP=null,GRB=null,grabFx=null,dbl=null,pd=0,pm=null;const ptrs=new Map();
const cell=e=>{const r=cv.getBoundingClientRect();return[Math.floor(((e.clientX-r.left-r.width/2)/cam.z+cam.x)/TS),Math.floor(((e.clientY-r.top-r.height/2)/cam.z+cam.y)/TS)]};
const dirTo=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1];return Math.abs(dx)>=Math.abs(dy)?(dx>0?1:3):(dy>0?2:0)};
let lastBelt='conveyor';
function sstep(f,t,d){
/* on vient de passer sur une ligne existante : si on continue tout droit, c'est qu'on la traverse → croisement ; sinon on s'y raccorde simplement */
if(P.cross){const cr=P.cross;P.cross=null;if(d==cr.d&&f[0]==cr.t[0]&&f[1]==cr.t[1]){if(!U.b.has('crossing')){toast('Recherche « Croisements » pour traverser une ligne de tapis','bad');P.stop=1;return}if(place(cr.t[0],cr.t[1],'crossing')){P.placed.add(at(cr.t));SFX.belt()}else{P.stop=1;return}}else{P.stop=1;return}}
const a=at(f),o=at(t);
{const up=isBelt(tool)?tool:!tool?lastBelt:null,rk={conveyor:1,belt2:2,belt3:3};if(o&&rk[o.t]&&up&&rk[up]>rk[o.t]&&o.t!='bridge'){const c=BD[up].cost-BD[o.t].cost;if(money>=c){money-=c;pushU({k:'u',x:t[0],y:t[1],c,from:o.t});o.t=up;o.d=d;SFX.belt();P.last=t;return}}}if(a&&(P.placed.has(a)||a==P.src)&&a.d!=d){a.d=d;bDirty=1}if(o&&o===P.src){P.last=t;return}
/* on traverse un répartiteur, un trieur ou un croisement existant et on continue de l'autre côté */
if(o&&(o.t=='split2'||o.t=='splitter'||o.t=='osplit'||o.t=='sorter'||o.t=='crossing')){P.last=t;return}
/* on coupe une autre ligne de tapis : un croisement est posé automatiquement (les deux lignes ne se mélangent pas) */
if(o&&(o.t=='conveyor'||o.t=='belt2'||o.t=='belt3')&&!P.placed.has(o)&&o.d%2!=d%2&&!P.cross){P.cross={t,d};P.last=t;return}
if(o){P.stop=1;P.last=t;return}dir=d;const wet=!Bi(t[0],t[1])&&!PLAT.has(tk(t[0],t[1]));if(!place(t[0],t[1],wet&&U.b.has('bridge')?'bridge':isBelt(tool)?tool:lastBelt))P.stop=1;else P.placed.add(at(t));P.last=t}
function walk(t){let g=0;while(!P.stop&&(P.last[0]!=t[0]||P.last[1]!=t[1])&&g++<60){const ddx=t[0]-P.last[0],ddy=t[1]-P.last[1],cd=P.cd;const d=cd!=null&&(cd==1&&ddx>0||cd==3&&ddx<0||cd==2&&ddy>0||cd==0&&ddy<0)?cd:dirTo(P.last,t);P.cd=d;sstep(P.last,[P.last[0]+DX[d],P.last[1]+DY[d]],d)}ui()}
function radOpen(x,y,c){const it=[...new Set([...recent.filter(k=>U.b.has(k)),...ORD.filter(k=>U.b.has(k))])].slice(0,8),rr=Math.max(96,it.length*84/6.283+4),
X=Math.max(Math.min(rr+44,innerWidth/2),Math.min(innerWidth-rr-44,x)),Y=Math.max(rr+60,Math.min(innerHeight-rr-90,y));let h=`<div class="rd" style="left:${X}px;top:${Y}px"></div>`;
it.forEach((k,i)=>{const a=-Math.PI/2+i*2*Math.PI/it.length;h+=`<div class="ri plate" style="--i:${i};left:${X+Math.cos(a)*rr}px;top:${Y+Math.sin(a)*rr}px"><img src="${bicu(k)}" alt="">${BD[k].n}<small>${BD[k].cost} $</small></div>`});
const R0=$('rad');R0.style.setProperty('--x',X+'px');R0.style.setProperty('--y',Y+'px');R0.innerHTML=h;R0.hidden=false;SFX.radOpen();P.rad={x:X,y:Y,it,c,i:-1};vib(15)}
function radMove(e){const r=P.rad,dx=e.clientX-r.x,dy=e.clientY-r.y,n=r.it.length;let i=-1;if(Math.hypot(dx,dy)>38){const a=(Math.atan2(dy,dx)+Math.PI/2+2*Math.PI)%(2*Math.PI);i=Math.round(a/(2*Math.PI/n))%n}
if(i!=r.i){r.i=i;[...$('rad').querySelectorAll('.ri')].forEach((el,k)=>el.classList.toggle('on',k==i));if(i>=0){vib(5);SFX.radHover(i)}}}
cv.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,[e.clientX,e.clientY]);try{cv.setPointerCapture(e.pointerId)}catch(_){}if(menu)return;
if(ptrs.size>=2){clearTimeout(LP);$('rad').hidden=true;P=null;hv=null;const[a,b]=[...ptrs.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1]);pm=[(a[0]+b[0])/2,(a[1]+b[1])/2];return}
ugid++;const c=cell(e),b0=at(c);P={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,mv:false,c,last:null,stop:0,src:null,rad:null,placed:new Set(),grab:false};
const endBelt=b0&&isBelt(b0.t)&&!at(fr(b0));
if(!dis&&(isBelt(tool)||!tool)&&b0&&(BD[b0.t].rt||BD[b0.t].m||STORE[b0.t]||b0.t=='split2'||b0.t=='splitter'||b0.t=='osplit'||b0.t=='sorter'||b0.t=='crossing'||b0.t=='tunnel'||endBelt)){P.src=b0;
/* avec l'outil Tapis, on part tout de suite ; sans outil, il faut maintenir 0,2 s pour « attraper » la machine */
/* sortie libre (rien de branché devant) : on trace tout de suite ; sinon il faut maintenir */
const freeOut=fronts(b0).every(f=>!at(f));if(isBelt(tool)||freeOut)P.grab=true;else GRB=setTimeout(()=>{if(P&&!P.mv&&P.src){P.grab=true;vib(14);SFX.tab();hv=[P.src.x,P.src.y];grabFx=P.src}},200)}if(isBelt(tool))lastBelt=tool;
if(tool)hv=c;
if(bpMode=='sel'){P.bp=c;P.src=null;P.grab=false;clearTimeout(GRB)}
if(dis)LP=setTimeout(()=>{if(P&&!P.mv&&ptrs.size<2){P.box=P.c;P.boxEnd=P.c;vib(18);SFX.tab()}},380);
if(!tool&&!dis&&!b0&&land(c)&&owned(c[0],c[1])&&!poiAt(c[0],c[1]))LP=setTimeout(()=>{if(P&&!P.mv&&ptrs.size<2)radOpen(P.sx,P.sy,c)},420)});
cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,[e.clientX,e.clientY]);if(menu)return;
if(ptrs.size>=2){const[a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,r=cv.getBoundingClientRect(),cx0=r.left+r.width/2,cy0=r.top+r.height/2;
/* Zoom ancré entre les deux doigts : le point sous les doigts reste sous les doigts */
const wx=cam.x+(pm[0]-cx0)/cam.z,wy=cam.y+(pm[1]-cy0)/cam.z;if(pd)cam.z=Math.max(.15,Math.min(3,cam.z*d/pd));cam.x=wx-(mx-cx0)/cam.z;cam.y=wy-(my-cy0)/cam.z;camGoal=null;pd=d;pm=[mx,my];return}
if(!P)return;if(P.rad){radMove(e);return}
const dx=e.clientX-P.x,dy=e.clientY-P.y;P.x=e.clientX;P.y=e.clientY;
if(!P.mv&&Math.hypot(e.clientX-P.sx,e.clientY-P.sy)>10){P.mv=true;clearTimeout(LP);clearTimeout(GRB);if(P.src&&!P.grab)P.src=null;if(dis&&!P.box)erase(P.c[0],P.c[1])}if(!P.mv)return;
const c=cell(e);
if(P.bp){P.bpEnd=c;return}
if(P.box){P.boxEnd=c;return}
if(dis){if(!P.last||c[0]!=P.last[0]||c[1]!=P.last[1]){erase(c[0],c[1]);P.last=c}return}
if(isBelt(tool)||P.src){if(!P.last){if(P.src)P.last=[P.src.x,P.src.y];else{if(!at(P.c)){dir=dirTo(P.c,c);place(P.c[0],P.c[1],tool)}P.last=P.c}}
if(c[0]!=P.last[0]||c[1]!=P.last[1])walk(c);hv=null;return}
cam.x-=dx/cam.z;cam.y-=dy/cam.z;camGoal=null;if(tool)hv=null});
function up(e){ptrs.delete(e.pointerId);clearTimeout(LP);clearTimeout(GRB);grabFx=null;if(menu)return;
if(ptrs.size>0){P=null;return}if(!P){hv=null;return}
if(P.bp){if(P.bpEnd)bpCapture(P.bp,P.bpEnd);P=null;hv=null;return}
if(P.box){const a0=P.box,a1=P.boxEnd,x0=Math.min(a0[0],a1[0]),x1=Math.max(a0[0],a1[0]),y0=Math.min(a0[1],a1[1]),y1=Math.max(a0[1],a1[1]),seen=new Set();let n=0;
for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const b=at([x,y]);if(b&&!seen.has(b)){seen.add(b);erase(b.x,b.y);n++}}if(n)toast(n+' bâtiment'+(n>1?'s':'')+' démoli'+(n>1?'s':''),'ok');P=null;hv=null;return}
if(P.rad){$('rad').hidden=true;const r=P.rad;if(r.i>=0){SFX.radPick();setTool(r.it[r.i]);P=null;place(r.c[0],r.c[1],tool)}P=null;hv=null;return}
if(!P.mv){const c=P.c,b=at(c);P=null;
if(dis)erase(c[0],c[1]);
else if(tool){if(isBelt(tool)&&b&&isBelt(b.t)){b.d=(b.d+1)%4;vib(6);SFX.rot()}else{const o=Math.floor((SZ(tool)-1)/2);place(c[0]-o,c[1]-o,tool)}}
else if(!owned(c[0],c[1])){const k=pk(c[0]>>3,c[1]>>3),s=pstate(c[0]>>3,c[1]>>3);if(s==1){selP=k;openSheet('parcel')}else if(chunk(c[0]>>3,c[1]>>3).land)toast('Zone inexplorée : achète d’abord une parcelle voisine','bad')}
else if(poiAt(c[0],c[1])){selPOI=poiAt(c[0],c[1]);openSheet('poi')}
else if(!b&&Rs(c[0],c[1])){selInfo={x:c[0],y:c[1]};openSheet('info')}
else if(!b&&isRiver(c[0],c[1])){selInfo={x:c[0],y:c[1],river:1};openSheet('info')}
else{const n=performance.now();if(b&&dbl&&n-dbl.t<330&&dbl.b==b){pipette(b);dbl=null}else{dbl={t:n,b};openInsp(b)}}}
P=null;hv=null}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect(),ox=e.clientX-r.left-r.width/2,oy=e.clientY-r.top-r.height/2,wx=cam.x+ox/cam.z,wy=cam.y+oy/cam.z;zoomBy(e.deltaY<0?1.1:.9);cam.x=wx-ox/cam.z;cam.y=wy-oy/cam.z},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
