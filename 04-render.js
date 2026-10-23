/* =====================================================================
   RENDU DE LA CARTE
   Optimisation : le terrain (sol, arbres, rochers) est dessiné une seule
   fois par bloc de 16×16 cases dans un canvas hors écran, à 3 niveaux de
   détail selon le zoom. Ensuite chaque image ne fait que les recopier.
   ===================================================================== */
/* Cache des blocs : budget en pixels (et non en nombre) pour ne jamais vider ce qui est à l’écran ;
   un bloc invalidé (parcelle achetée…) reste affiché jusqu’à ce que son remplaçant soit prêt. */
const RBJ=new Map(),RBOLD=new Map();let rbFrame=0;
class RBMap extends Map{constructor(){super();this.px=0}
set(k,c){const o=super.get(k);if(o)this.px-=o.width*o.height;this.px+=c.width*c.height;return super.set(k,c)}
touch(k){const c=super.get(k);if(c){super.delete(k);super.set(k,c)}return c}
evict(k){const c=super.get(k);if(!c)return;this.px-=c.width*c.height;super.delete(k);c.width=c.height=0}
delete(k){const c=super.get(k);if(c){this.px-=c.width*c.height;super.delete(k);RBOLD.set(k,c)}RBJ.delete(k);return!!c}
clear(){this.px=0;RBJ.clear();RBOLD.clear();return super.clear()}}
const RB=16,RBC=new RBMap();
function rbTrim(){const cap=Math.max(8e6,(typeof cv!='undefined'?cv.width*cv.height:2e6)*6);while(RBC.px>cap&&RBC.size>4)RBC.evict(RBC.keys().next().value)}
/* ---------- Végétation : 8 essences, choisies selon le biome ---------- */
const TG=[['#2a6433','#3a8742','#62b863'],['#2f5c2a','#487a33','#79b35a'],['#24604a','#357f5e','#58b58c'],['#4a5e22','#6b8a2c','#a3c45a']];
function shadow(g,x,y,w){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(x+2,y,w,w*.42,0,0,7);g.fill()}
function tree(g,x,y,s,kind,G,h){
switch(kind){
case'oak':shadow(g,x,y+8*s,9*s);g.fillStyle='#4a3322';g.fillRect(x-1.5*s,y+1*s,3*s,8*s);g.fillStyle=G[0];g.beginPath();g.arc(x,y-1*s,9*s,0,7);g.fill();g.fillStyle=G[1];g.beginPath();g.arc(x-2*s,y-3*s,6.5*s,0,7);g.arc(x+3*s,y-1*s,4.5*s,0,7);g.fill();g.fillStyle=G[2];g.beginPath();g.arc(x-3.5*s,y-5*s,2.6*s,0,7);g.fill();break;
case'pine':shadow(g,x,y+9*s,7*s);g.fillStyle='#3a2a1a';g.fillRect(x-1.2*s,y+4*s,2.4*s,5*s);for(let i=0;i<3;i++){g.fillStyle=i==2?G[2]:i?G[1]:G[0];g.beginPath();g.moveTo(x,y-12*s+i*4*s);g.lineTo(x+(8-i*1.6)*s,y+(4-i*3)*s);g.lineTo(x-(8-i*1.6)*s,y+(4-i*3)*s);g.closePath();g.fill()}break;
case'cypress':shadow(g,x,y+9*s,5*s);g.fillStyle=G[0];g.beginPath();g.ellipse(x,y-2*s,4.5*s,11*s,0,0,7);g.fill();g.fillStyle=G[1];g.beginPath();g.ellipse(x-1.2*s,y-4*s,2.8*s,8*s,0,0,7);g.fill();break;
case'birch':shadow(g,x,y+8*s,7*s);g.fillStyle='#e8e4da';g.fillRect(x-1.3*s,y-2*s,2.6*s,10*s);g.fillStyle='#2b2620';g.fillRect(x-1.3*s,y+1*s,1.4*s,1*s);g.fillRect(x,y+4*s,1.3*s,1*s);g.fillStyle=TG[3][1];g.beginPath();g.ellipse(x,y-5*s,6.5*s,7.5*s,0,0,7);g.fill();g.fillStyle=TG[3][2];g.beginPath();g.arc(x-2*s,y-8*s,2.5*s,0,7);g.fill();break;
case'fruit':shadow(g,x,y+8*s,8*s);g.fillStyle='#4a3322';g.fillRect(x-1.5*s,y+1*s,3*s,7*s);g.fillStyle=G[1];g.beginPath();g.arc(x,y-2*s,8*s,0,7);g.fill();g.fillStyle=h<.5?'#e0473a':'#ffb347';for(let i=0;i<5;i++){g.beginPath();g.arc(x+(hsh(i,7,h*99|0)-.5)*11*s,y-2*s+(hsh(7,i,h*99|0)-.5)*10*s,1.3*s,0,7);g.fill()}break;
case'bush':shadow(g,x,y+5*s,9*s);g.fillStyle=G[0];for(const[a,b,q]of[[-5,1,5],[5,1,5],[0,-3,6]]){g.beginPath();g.arc(x+a*s,y+b*s,q*s,0,7);g.fill()}g.fillStyle=G[2];g.beginPath();g.arc(x-1*s,y-5*s,2.2*s,0,7);g.fill();break;
case'palm':shadow(g,x+3*s,y+9*s,6*s);g.strokeStyle='#8a6a3a';g.lineWidth=2.4*s;g.beginPath();g.moveTo(x-2*s,y+9*s);g.quadraticCurveTo(x+3*s,y,x+1*s,y-7*s);g.stroke();g.strokeStyle='#3f8a3a';g.lineWidth=2.2*s;g.lineCap='round';for(let i=0;i<6;i++){const a=i/6*6.283+h*2;g.beginPath();g.moveTo(x+1*s,y-7*s);g.quadraticCurveTo(x+1*s+Math.cos(a)*6*s,y-10*s+Math.sin(a)*3*s,x+1*s+Math.cos(a)*9*s,y-6*s+Math.sin(a)*6*s);g.stroke()}g.lineCap='butt';g.fillStyle='#6b4a2a';g.beginPath();g.arc(x+1*s,y-6*s,1.6*s,0,7);g.fill();break;
case'snow':shadow(g,x,y+9*s,7*s);g.fillStyle='#3a2a1a';g.fillRect(x-1.2*s,y+4*s,2.4*s,5*s);for(let i=0;i<3;i++){g.fillStyle='#2c5a3a';g.beginPath();g.moveTo(x,y-12*s+i*4*s);g.lineTo(x+(8-i*1.6)*s,y+(4-i*3)*s);g.lineTo(x-(8-i*1.6)*s,y+(4-i*3)*s);g.closePath();g.fill();g.fillStyle='#eef3f6';g.beginPath();g.moveTo(x,y-12*s+i*4*s);g.lineTo(x+3*s,y-8*s+i*4*s);g.lineTo(x-3*s,y-8*s+i*4*s);g.closePath();g.fill()}break;
case'dead':shadow(g,x,y+8*s,6*s);g.strokeStyle='#6b5a46';g.lineWidth=2*s;g.lineCap='round';g.beginPath();g.moveTo(x,y+8*s);g.lineTo(x,y-6*s);g.moveTo(x,y-1*s);g.lineTo(x-5*s,y-6*s);g.moveTo(x,y-3*s);g.lineTo(x+4*s,y-8*s);g.moveTo(x-3*s,y-4*s);g.lineTo(x-4*s,y-9*s);g.stroke();g.lineCap='butt';break}}
/* ---------- Roches : polygones à facettes éclairées en haut à gauche ---------- */
function poly(g,x,y,r,sd,n){g.beginPath();for(let i=0;i<n;i++){const a=i/n*6.283+hsh(sd,i,1)*.5,q=r*(.72+hsh(sd,i,2)*.38),px=x+Math.cos(a)*q,py=y+Math.sin(a)*q*.82;i?g.lineTo(px,py):g.moveTo(px,py)}g.closePath()}
function rock(g,x,y,r,C,sd,spk){g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x+2,y+r*.6,r*1.05,r*.42,0,0,7);g.fill();g.fillStyle=C[0];poly(g,x,y,r,sd,6+(sd%3));g.fill();g.fillStyle=C[1];poly(g,x-r*.16,y-r*.2,r*.66,sd+7,5);g.fill();g.fillStyle=C[2];poly(g,x-r*.32,y-r*.36,r*.26,sd+13,4);g.fill();
if(spk){g.fillStyle=spk;for(let k=0;k<3+(sd%3);k++)g.fillRect(x+(hsh(sd,k,8)-.5)*r*1.2,y+(hsh(k,sd,9)-.5)*r,2.2,2.2)}}
function crystal(g,x,y,s,col,lite,sd,glow){if(glow){g.fillStyle=glow;g.beginPath();g.arc(x,y-4*s,12*s,0,7);g.fill()}g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x,y+2*s,10*s,3.5*s,0,0,7);g.fill();
const n=3+(sd%3);for(let i=0;i<n;i++){const a=(i-(n-1)/2)*.42+(hsh(sd,i,3)-.5)*.3,h=(10+hsh(sd,i,4)*9)*s,w=(2.4+hsh(i,sd,5)*1.6)*s;g.save();g.translate(x+(i-(n-1)/2)*3.5*s,y+2*s);g.rotate(a);g.fillStyle=col;g.beginPath();g.moveTo(-w,0);g.lineTo(-w,-h+w);g.lineTo(0,-h);g.lineTo(w,-h+w);g.lineTo(w,0);g.closePath();g.fill();g.fillStyle=lite;g.beginPath();g.moveTo(0,0);g.lineTo(0,-h);g.lineTo(w,-h+w);g.lineTo(w,0);g.closePath();g.fill();g.restore()}}
const ROCKC={iron:['#4d5560','#7d8794','#b8c6d6'],copper:['#5a4a40','#86705f','#b89a85'],coal:['#17191d','#2c3037','#4a505a'],stone:['#6b6f76','#9a9fa7','#c4c9d0'],limestone:['#a9a493','#d6d0bd','#f6f1e2'],gold:['#5d5340','#8a7a55','#b8a678'],bauxite:['#7a3a22','#b85a35','#e08a62'],titanium:['#5f6c7a','#93a3b5','#d6e2ef']};
function drawRes(g,r,x,y,ox,oy){const X=(x-ox)*TS,Y=(y-oy)*TS,h=hsh(x,y,21),v=h*4|0;
if(r=='wood'){const b=Bi(x,y),G=TG[hsh(x,y,11)*3|0],kinds=b==3?['palm','palm','bush']:b==4?['snow','snow','dead','pine']:b==1?['oak','fruit','birch','bush','oak']:['oak','pine','pine','cypress','birch','bush','oak'];
const n=1+(hsh(x,y,14)*2.6|0),pts=[];for(let i=0;i<n;i++)pts.push([X+7+hsh(x,y,30+i)*18,Y+8+hsh(x,y,40+i)*16,(n==1?1:.72)+hsh(x,y,50+i)*.3,kinds[hsh(x,y,60+i)*kinds.length|0]]);
pts.sort((a,b)=>a[1]-b[1]);for(const p of pts)tree(g,p[0],p[1],p[2],p[3],G,hsh(x,y,70));return}
const px=X+16+(hsh(x,y,3)-.5)*4,py=Y+16+(hsh(x,y,4)-.5)*4;
if(r=='sand'){if(v==0){g.fillStyle='#c9b46f';g.beginPath();g.ellipse(px,py+3,12,5.5,0,0,7);g.fill();g.fillStyle='#f3e4aa';g.beginPath();g.ellipse(px-2,py+1,9,3.8,0,0,7);g.fill()}
else if(v==1){g.strokeStyle='#b39a5a';g.lineWidth=1.4;for(let i=0;i<4;i++){g.beginPath();g.moveTo(px-12,py-6+i*5);g.quadraticCurveTo(px,py-9+i*5,px+12,py-6+i*5);g.stroke()}}
else if(v==2){g.fillStyle='#c9b46f';g.beginPath();g.moveTo(px-13,py+7);g.quadraticCurveTo(px-4,py-9,px+3,py+7);g.closePath();g.fill();g.fillStyle='#e9d79a';g.beginPath();g.moveTo(px-1,py+8);g.quadraticCurveTo(px+6,py-3,px+13,py+8);g.closePath();g.fill()}
else{g.fillStyle='#f3e4aa';g.beginPath();g.ellipse(px,py+2,12,6,0,0,7);g.fill();g.fillStyle='#fff8e6';for(let i=0;i<3;i++){g.beginPath();g.arc(px-6+i*6,py+(i%2)*3,1.8,0,Math.PI);g.fill()}g.fillStyle='#e0a07a';g.beginPath();g.arc(px+7,py-2,1.6,0,7);g.fill()}return}
if(r=='oil'&&v==3){for(const[a,b,s2]of[[-6,-3,7],[6,4,5.5]]){g.fillStyle='#14121a';g.beginPath();g.ellipse(px+a,py+b,s2*1.3,s2*.8,0,0,7);g.fill();g.fillStyle='#3a2f55aa';g.beginPath();g.ellipse(px+a-2,py+b-1,s2*.5,s2*.25,-.4,0,7);g.fill()}g.fillStyle='#2a2430';g.beginPath();g.arc(px+8,py-7,3,0,7);g.fill();return}
if(r=='oil'){g.fillStyle='#14121a';g.beginPath();g.ellipse(px,py+2,13,8.5,h,0,7);g.fill();g.fillStyle='#3a2f55';g.beginPath();g.ellipse(px-3,py,5,2.5,-.4,0,7);g.fill();g.strokeStyle='#5a7aa855';g.lineWidth=1.2;g.beginPath();g.ellipse(px+2,py+3,6,3,0,0,7);g.stroke();g.fillStyle='#2a2440';for(let i=0;i<v+1;i++){g.beginPath();g.arc(px+(hsh(x,y,80+i)-.5)*14,py+(hsh(x,y,90+i)-.5)*8,1.6,0,7);g.fill()}return}
if(r=='quartz'){if(v==1){rock(g,px,py+2,10,['#6b6f76','#9a9fa7','#c4c9d0'],x*7+y*3&255,null);g.fillStyle='#2b2238';g.beginPath();g.ellipse(px-1,py-1,6,4,0,0,7);g.fill();crystal(g,px-1,py+1,.45,'#b9a9f0','#e9e2ff',x*7+y*13&255)}
else if(v==2){for(let i=0;i<5;i++){const a=hsh(x,y,150+i)*6.28;g.save();g.translate(px+Math.cos(a)*8,py+Math.sin(a)*6);g.rotate(a);g.fillStyle=i%2?'#b9a9f0':'#e9e2ff';g.beginPath();g.moveTo(0,-5);g.lineTo(2,0);g.lineTo(0,4);g.lineTo(-2,0);g.closePath();g.fill();g.restore()}}
else crystal(g,px,py+4,1,'#b9a9f0','#e9e2ff',x*7+y*13&255);return}
if(r=='sulfur'){if(v%2){g.fillStyle='#6b5a2a';g.beginPath();g.ellipse(px,py+4,12,7,0,0,7);g.fill();g.fillStyle='#d8c43a';g.beginPath();g.ellipse(px,py+2,8,4.5,0,0,7);g.fill();g.fillStyle='#2b2620';g.beginPath();g.ellipse(px,py+1,3,1.8,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.22)';for(let i=0;i<3;i++){g.beginPath();g.arc(px+(i-1)*2,py-5-i*4,2.5+i,0,7);g.fill()}}
else{crystal(g,px-4,py+5,.75,'#d8c43a','#fff27a',x*5+y*11&255);g.fillStyle='#e8d23a99';g.beginPath();g.ellipse(px+5,py+8,6,2.5,0,0,7);g.fill()}return}
if(r=='uranium'){g.fillStyle='rgba(125,255,106,.16)';g.beginPath();g.arc(px,py,14,0,7);g.fill();if(v%2){rock(g,px-4,py+1,7,['#2e3a2e','#4a5e48','#6a8a66'],x*3+y*5&255,'#9dff7a');rock(g,px+6,py+4,5,['#2e3a2e','#4a5e48','#6a8a66'],x*5+y*3&255,'#9dff7a')}else crystal(g,px,py+4,.9,'#3fbf4a','#9dff7a',x*3+y*17&255);return}
if(r=='clay'&&v>=2){g.fillStyle='#9a8272';g.beginPath();g.ellipse(px,py+2,13,8,0,0,7);g.fill();g.strokeStyle='#6e5a4c';g.lineWidth=1.2;for(let i=0;i<5;i++){const a=i*1.26+h;g.beginPath();g.moveTo(px,py+2);g.lineTo(px+Math.cos(a)*11,py+2+Math.sin(a)*7);g.stroke()}if(v==3){g.fillStyle='#c98a5a';for(let i=0;i<3;i++){g.beginPath();g.roundRect(px-8+i*6,py-6+(i%2)*3,5,4,1);g.fill()}}return}
if(r=='clay'){g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(px+2,py+8,13,5,0,0,7);g.fill();g.fillStyle='#9a8272';g.beginPath();g.ellipse(px,py+3,12,8,0,0,7);g.fill();g.fillStyle='#c9ad98';g.beginPath();g.ellipse(px-2,py+1,9,5.5,0,0,7);g.fill();g.strokeStyle='#6a3a22';g.lineWidth=1;g.beginPath();g.moveTo(px-6,py);g.lineTo(px-1,py+3);g.lineTo(px+4,py-1);g.moveTo(px-1,py+3);g.lineTo(px,py+7);g.stroke();return}
const C=ROCKC[r]||ROCKC.stone,sp=SPK[r]&&r!='stone'&&r!='limestone'?SPK[r]:null,sd=(x*31+y*17)&1023,v6=h*6|0,h2=hsh(x,y,23);
if(sp&&h2<.2){/* veine : le minerai affleure dans une fissure du sol */g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(px+1,py+3,14,8,.3,0,7);g.fill();g.fillStyle=C[0];g.beginPath();g.ellipse(px,py+1,13,7,.3,0,7);g.fill();g.strokeStyle=sp;g.lineWidth=2.6;g.lineCap='round';g.beginPath();g.moveTo(px-10,py+4);g.lineTo(px-3,py-1);g.lineTo(px+2,py+2);g.lineTo(px+10,py-3);g.stroke();g.lineWidth=1.4;g.beginPath();g.moveTo(px-3,py-1);g.lineTo(px-5,py-5);g.moveTo(px+2,py+2);g.lineTo(px+4,py+6);g.stroke();g.lineCap='butt';g.fillStyle='#ffffffaa';g.fillRect(px-4,py-2,1.5,1.5);return}
if(sp&&h2<.36){/* amas de pépites brillantes */g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(px+2,py+7,13,5,0,0,7);g.fill();for(let i=0;i<7;i++){const nx=px+(hsh(x,y,170+i)-.5)*20,ny=py+(hsh(x,y,180+i)-.5)*12,s=2.2+hsh(x,y,190+i)*2.4;g.fillStyle=i%3?C[1]:sp;g.beginPath();g.moveTo(nx,ny-s);g.lineTo(nx+s,ny);g.lineTo(nx,ny+s*.8);g.lineTo(nx-s,ny);g.closePath();g.fill()}g.fillStyle='#ffffffcc';g.fillRect(px-3,py-3,1.6,1.6);g.fillRect(px+5,py+1,1.3,1.3);return}
if(v6==4||r=='limestone'&&v6==5){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(px+2,py+8,14,5,0,0,7);g.fill();for(let i=0;i<4;i++){g.fillStyle=i%2?C[1]:C[0];g.beginPath();g.roundRect(px-12+i*1.5,py-8+i*4,24-i*3,4.5,2);g.fill()}if(sp){g.fillStyle=sp;g.fillRect(px-8,py-2,6,1.6);g.fillRect(px+2,py+4,5,1.6)}return}
if(v6==5){rock(g,px,py+1,11,C,sd,null);g.fillStyle=C[0];g.beginPath();g.moveTo(px-3,py-9);g.lineTo(px+2,py+1);g.lineTo(px-1,py+9);g.lineTo(px+3,py+9);g.lineTo(px+6,py+1);g.lineTo(px+1,py-9);g.closePath();g.fill();if(sp){g.fillStyle=sp;for(let i=0;i<5;i++)g.fillRect(px-1+(hsh(x,y,160+i)-.5)*5,py-6+i*3,2.5,2.5)}return}
if(v==0){rock(g,px-5,py-1,7.5,C,sd,sp);rock(g,px+6,py+4,5.5,C,sd+3,sp);rock(g,px-1,py+9,3.5,C,sd+5,null)}
else if(v==1){rock(g,px,py+1,10,C,sd,sp);for(let i=0;i<4;i++){g.fillStyle=C[1];g.beginPath();g.arc(px+(hsh(x,y,100+i)-.5)*26,py+9+(hsh(x,y,110+i)-.5)*6,1.6+hsh(x,y,120+i),0,7);g.fill()}}
else if(v==2){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(px+2,py+7,14,5,0,0,7);g.fill();g.fillStyle=C[0];g.beginPath();g.roundRect(px-12,py-6,24,13,5);g.fill();g.fillStyle=C[1];g.beginPath();g.roundRect(px-11,py-6,21,7,4);g.fill();if(sp){g.strokeStyle=sp;g.lineWidth=2;g.beginPath();g.moveTo(px-10,py+2);g.lineTo(px-4,py-2);g.lineTo(px+2,py+1);g.lineTo(px+9,py-3);g.stroke()}}
else{for(let i=0;i<4;i++)rock(g,px+[-7,5,-2,8][i],py+[-3,-5,6,5][i],3.5+hsh(x,y,130+i)*2.5,C,sd+i*4,i%2?sp:null)}}
/* Sous-zones : 4 bruits très lents, chacun entre 0 et 1, qui transforment un biome par endroits
   (prairie sèche, forêt d'automne, badlands rouges, neige ou roche volcanique). */
const zoneN=(x,y,k)=>{const v=vn(x*.055+k*17.3,y*.055-k*9.1,SEED+700+k);return Math.max(0,Math.min(1,(v-.52)*3.2))};
const ZK=Object.create(null);function zone(x,y){const k=x*65536+y;let z=ZK[k];if(z)return z;z=ZK[k]=[zoneN(x,y,1),zoneN(x,y,2),zoneN(x,y,3),zoneN(x,y,4)];return z}
const ZT={1:[[205,180,95],0,.55],2:[[200,110,45],1,.5],3:[[178,82,50],2,.55],4:[[238,242,246],3,.75]};
function zoneCol(c,b,x,y){const t=ZT[b];if(!t)return c;const Z=zone(x,y),a=Z[t[1]]*t[2],v=b==4?Z[0]*.55:0;if(a<=0&&v<=0)return c;const m=c.match(/\d+/g).map(Number);
let r=m[0]+(t[0][0]-m[0])*a,g2=m[1]+(t[0][1]-m[1])*a,bl=m[2]+(t[0][2]-m[2])*a;if(v>0){r+=(52-r)*v;g2+=(44-g2)*v;bl+=(46-bl)*v}return`rgb(${r|0},${g2|0},${bl|0})`}
/* Sol : on peint d'abord l'eau, puis chaque biome par ordre (sable, plaine, forêt, montagne)
   avec des pastilles arrondies qui débordent : les frontières deviennent organiques au lieu de carrées. */
const BORD=[3,1,2,4];
function* groundPaintG(g,ox,oy,w,h,ex0,ey0,cheap){g.fillStyle=BCOL[0];g.fillRect(0,0,w*TS,h*TS);
for(let j=ex0;j<h-ex0;j++){for(let i=ex0;i<w-ex0;i++){const x=ox+i,y=oy+j;if(!Bi(x,y)){const o=Math.sin(x*.9+y*1.3)*.5+.5;g.fillStyle=`rgba(255,255,255,${(.03+o*.04).toFixed(3)})`;g.fillRect(i*TS+4,j*TS+14,TS-8,3)}yield}}
for(const bb of BORD){for(let j=ex0;j<h-ex0;j++){for(let i=ex0;i<w-ex0;i++){const x=ox+i,y=oy+j;if(Bi(x,y)!=bb)continue;const ch=chunk(x>>3,y>>3);g.fillStyle=zoneCol(ch.col[((y&7)<<3)|(x&7)],bb,x,y);
const e=5+hsh(x,y,17)*4;g.beginPath();g.roundRect(i*TS-e,j*TS-e,TS+2*e,TS+2*e,12+hsh(x,y,18)*6);g.fill()}yield}}
for(let j=0;j<h;j++){for(let i=0;i<w;i++){const x=ox+i,y=oy+j,b=Bi(x,y);if(!b||cheap)continue;for(let k=0;k<3;k++){const v=hsh(x,y,30+k);g.fillStyle=v<.5?'rgba(0,0,0,.06)':'rgba(255,255,255,.06)';g.beginPath();g.arc(i*TS+hsh(x,y,40+k)*TS,j*TS+hsh(x,y,50+k)*TS,1.5+v*2.5,0,7);g.fill()}
const Z=zone(x,y),X=i*TS,Y=j*TS,e=6;
/* teinte de la sous-zone, en pastille arrondie pour des transitions douces */
const tint=b==1?[Z[0],'200,175,80',.2]:b==2?[Z[1],'205,105,40',.2]:b==3?[Z[2],'185,80,45',.26]:[Z[3],'255,255,255',.42],t2=b==4?Z[0]:0;
if(b==1){/* brins d'herbe : verts en prairie, paille en zone sèche */const n=3+(hsh(x,y,61)*4|0);g.lineWidth=1.1;for(let k=0;k<n;k++){const gx=X+hsh(x,y,62+k)*TS,gy=Y+hsh(x,y,72+k)*TS,dry=Z[0]>hsh(x,y,82+k);g.strokeStyle=dry?'rgba(215,190,110,.55)':'rgba(70,130,55,.45)';g.beginPath();g.moveTo(gx,gy+2);g.lineTo(gx+(hsh(x,y,92+k)-.5)*3,gy-3);g.stroke()}}
else if(b==2){/* tapis de feuilles : mousse verte ou feuilles d'automne */const n=4+(hsh(x,y,61)*4|0);for(let k=0;k<n;k++){const au=Z[1]>hsh(x,y,82+k);g.fillStyle=au?['#d9822b','#c4442a','#e8b33a'][k%3]+'99':'rgba(40,95,45,.45)';g.beginPath();g.ellipse(X+hsh(x,y,62+k)*TS,Y+hsh(x,y,72+k)*TS,2.2,1.3,hsh(x,y,92+k)*3,0,7);g.fill()}}
else if(b==3){if(Z[2]>.3){/* badlands : terre craquelée */g.strokeStyle=`rgba(90,40,25,${(.15+Z[2]*.25).toFixed(2)})`;g.lineWidth=1;g.beginPath();let cx0=X+hsh(x,y,61)*TS,cy0=Y+hsh(x,y,62)*TS;g.moveTo(cx0,cy0);for(let k=0;k<4;k++){cx0+=(hsh(x,y,63+k)-.5)*16;cy0+=(hsh(x,y,73+k)-.5)*16;g.lineTo(cx0,cy0)}g.stroke()}
else{/* dunes : ondulations parallèles */g.strokeStyle='rgba(160,130,70,.22)';g.lineWidth=1.2;for(let k=0;k<2;k++){const yy=Y+8+k*14+hsh(x,y,61+k)*4;g.beginPath();g.moveTo(X-2,yy);g.quadraticCurveTo(X+16,yy-4,X+TS+2,yy);g.stroke()}}}
else if(b==4){/* montagne : fissures, plaques de neige, braises en zone volcanique */g.strokeStyle='rgba(0,0,0,.14)';g.lineWidth=1;g.beginPath();const sx=X+hsh(x,y,61)*TS,sy=Y+hsh(x,y,62)*TS;g.moveTo(sx,sy);g.lineTo(sx+(hsh(x,y,63)-.5)*14,sy+(hsh(x,y,64)-.5)*14);g.lineTo(sx+(hsh(x,y,65)-.5)*20,sy+(hsh(x,y,66)-.5)*20);g.stroke();
if(Z[3]>.45&&hsh(x,y,71)<.5){g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.ellipse(X+hsh(x,y,67)*TS,Y+hsh(x,y,68)*TS,2+Z[3]*4,1.5+Z[3]*2,hsh(x,y,69),0,7);g.fill()}
if(t2>.5&&hsh(x,y,70)<.25){g.strokeStyle='rgba(255,110,40,.6)';g.lineWidth=1.4;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+(hsh(x,y,63)-.5)*14,sy+(hsh(x,y,64)-.5)*14);g.stroke()}}}yield}}
function groundPaint(...a){for(const _ of groundPaintG(...a));}
function deco(g,x,y,X,Y){if(Rs(x,y))return;const b=Bi(x,y),d=hsh(x,y,200),px=X+6+hsh(x,y,201)*20,py=Y+6+hsh(x,y,202)*20;if(deco2(g,x,y,b,d,px,py))return;
if(b==1){if(d<.1){const c=['#f5f1e6','#ffd34d','#e06aa8','#7aa8ff'][hsh(x,y,203)*4|0];for(let i=0;i<3;i++){g.strokeStyle='#3f7a35';g.lineWidth=1;g.beginPath();g.moveTo(px+i*3,py+4);g.lineTo(px+i*3,py);g.stroke();g.fillStyle=c;g.beginPath();g.arc(px+i*3,py-1,1.6,0,7);g.fill()}}else if(d<.24){g.strokeStyle='#5f9a48';g.lineWidth=1.2;g.beginPath();for(let i=-2;i<=2;i++){g.moveTo(px,py+3);g.lineTo(px+i*2,py-3+Math.abs(i))}g.stroke()}}
else if(b==2){if(d<.08){g.fillStyle='#e8e2d4';g.fillRect(px-.8,py,1.6,3);g.fillStyle=hsh(x,y,204)<.5?'#c8321e':'#a07a4a';g.beginPath();g.arc(px,py,2.6,Math.PI,0);g.fill()}else if(d<.2){g.strokeStyle='#2f6b34';g.lineWidth=1.4;g.beginPath();for(let i=-2;i<=2;i++){g.moveTo(px,py+3);g.quadraticCurveTo(px+i*2,py-1,px+i*3.5,py-4)}g.stroke()}}
else if(b==3){if(d<.07){g.fillStyle='#fff3e0';g.beginPath();g.arc(px,py,2.2,Math.PI,0);g.fill();g.strokeStyle='#e0b080';g.lineWidth=.6;g.beginPath();g.moveTo(px,py);g.lineTo(px,py-2);g.stroke()}else if(d<.1&&hsh(x,y,205)<.5){g.fillStyle='#4f8a3a';g.beginPath();g.roundRect(px-1.5,py-7,3,9,1.5);g.fill();g.beginPath();g.roundRect(px-5,py-4,2.5,4,1.2);g.fill();g.beginPath();g.roundRect(px+2.5,py-5,2.5,4,1.2);g.fill()}}
else if(b==4){if(d<.16){g.fillStyle='#7d7666';for(let i=0;i<3;i++){g.beginPath();g.arc(px+i*3,py+(i%2)*2,1.2+i*.4,0,7);g.fill()}}}
else if(d<.2&&(Bi(x+1,y)||Bi(x-1,y)||Bi(x,y+1)||Bi(x,y-1))){if(d<.1){g.fillStyle='#3f8a4a';g.beginPath();g.arc(px,py,4,.4,6);g.lineTo(px,py);g.fill();g.fillStyle='#f0a0c0';g.beginPath();g.arc(px+1,py-1,1.3,0,7);g.fill()}else{g.strokeStyle='#6a8a3a';g.lineWidth=1.2;g.beginPath();for(let i=0;i<4;i++){g.moveTo(px+i*2,py+4);g.lineTo(px+i*2+(i-1.5),py-5)}g.stroke()}}}
/* Décors supplémentaires, selon la sous-zone. Renvoie true si quelque chose a été dessiné. */
function deco2(g,x,y,b,d,px,py){const Z=zone(x,y),r=hsh(x,y,210),shore=b&&(Bi(x+1,y)==0||Bi(x-1,y)==0||Bi(x,y+1)==0||Bi(x,y-1)==0);
if(shore&&r<.12){/* coquillage ou étoile de mer */if(hsh(x,y,211)<.5){g.fillStyle='#ff8a5a';g.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,rr=k%2?2:5;g.lineTo(px+Math.cos(a)*rr,py+Math.sin(a)*rr)}g.closePath();g.fill()}else{g.fillStyle='#f4e6d4';g.beginPath();g.moveTo(px,py+3);g.arc(px,py+3,4,Math.PI*1.1,Math.PI*1.9);g.closePath();g.fill();g.strokeStyle='#c9a98a';g.lineWidth=.7;for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(px,py+3);g.lineTo(px+k*3,py-.5);g.stroke()}}return true}
if(shore&&r<.17){/* bois flotté */g.strokeStyle='#b8a48a';g.lineWidth=2.4;g.lineCap='round';g.beginPath();g.moveTo(px-7,py+2);g.quadraticCurveTo(px,py-2,px+7,py+1);g.stroke();g.lineCap='butt';return true}
if(b==1){if(Z[0]<.3&&r<.16){/* prairie fleurie : petit bouquet de fleurs de 6 couleurs */const C=['#f5f1e6','#ffd34d','#e06aa8','#7aa8ff','#ff7a4a','#c58aff'];for(let k=0;k<5;k++){const fx=px+(hsh(x,y,220+k)-.5)*14,fy=py+(hsh(x,y,230+k)-.5)*10;g.strokeStyle='#3f7a35';g.lineWidth=.9;g.beginPath();g.moveTo(fx,fy+4);g.lineTo(fx,fy);g.stroke();g.fillStyle=C[hsh(x,y,240+k)*6|0];g.beginPath();g.arc(fx,fy-.5,1.7,0,7);g.fill()}return true}
if(Z[0]>.5&&r<.1){/* herbe sèche en touffe */g.strokeStyle='#cdb36a';g.lineWidth=1.3;g.beginPath();for(let k=-3;k<=3;k++){g.moveTo(px,py+4);g.quadraticCurveTo(px+k,py-2,px+k*2.2,py-6)}g.stroke();return true}
if(r>.985){/* rond de sorcière : cercle de champignons */for(let k=0;k<7;k++){const a=k*.9,mx=px+Math.cos(a)*8,my=py+Math.sin(a)*5;g.fillStyle='#efe6d4';g.fillRect(mx-.6,my,1.2,2.2);g.fillStyle='#d9563a';g.beginPath();g.arc(mx,my,1.9,Math.PI,0);g.fill()}return true}
if(r>.965){/* petit rocher moussu */g.fillStyle='#8a8f86';g.beginPath();g.ellipse(px,py,5.5,4,0,0,7);g.fill();g.fillStyle='#5f9a48';g.beginPath();g.ellipse(px-1,py-2,4,1.8,0,0,7);g.fill();return true}}
if(b==2){if(r<.07){/* fougère */g.strokeStyle=Z[1]>.5?'#c47a2a':'#2f7a3a';g.lineWidth=1;for(let k=0;k<3;k++){const a=-1.9+k*.6;g.beginPath();g.moveTo(px,py+4);g.quadraticCurveTo(px+Math.cos(a)*5,py+Math.sin(a)*5,px+Math.cos(a)*9,py+Math.sin(a)*8);g.stroke();for(let s=1;s<4;s++){const qx=px+Math.cos(a)*s*2.5,qy=py+4+Math.sin(a)*s*2.6;g.beginPath();g.moveTo(qx,qy);g.lineTo(qx+2,qy-1.5);g.stroke()}}return true}
if(r>.975){/* tronc couché */g.fillStyle='#6b4a2a';g.beginPath();g.roundRect(px-9,py-2.5,18,5,2.5);g.fill();g.fillStyle='#c49a6a';g.beginPath();g.ellipse(px+9,py,2,2.5,0,0,7);g.fill();g.fillStyle='#5f9a48';g.beginPath();g.ellipse(px-3,py-2.5,4,1.4,0,0,7);g.fill();return true}
if(r>.955){/* souche */g.fillStyle='#5e4026';g.beginPath();g.roundRect(px-4,py-2,8,6,2);g.fill();g.fillStyle='#c49a6a';g.beginPath();g.ellipse(px,py-2,4,1.8,0,0,7);g.fill();g.strokeStyle='#8a6a42';g.lineWidth=.6;g.beginPath();g.ellipse(px,py-2,2,.9,0,0,7);g.stroke();return true}
if(Z[1]>.4&&r<.13){/* champignons d'automne */for(let k=0;k<3;k++){const mx=px+k*4-4,my=py+(k%2)*2;g.fillStyle='#efe6d4';g.fillRect(mx-.7,my,1.4,3);g.fillStyle=k==1?'#e0a040':'#a0542a';g.beginPath();g.arc(mx,my,2.4,Math.PI,0);g.fill()}return true}}
if(b==3){if(r>.985){/* crâne et os */g.fillStyle='#efe6d4';g.beginPath();g.arc(px,py,3,0,7);g.fill();g.fillRect(px-1.8,py+1.5,3.6,2.2);g.fillStyle='#3a2f28';g.beginPath();g.arc(px-1.1,py-.2,.8,0,7);g.arc(px+1.1,py-.2,.8,0,7);g.fill();g.strokeStyle='#efe6d4';g.lineWidth=1.4;g.beginPath();g.moveTo(px+5,py+2);g.lineTo(px+11,py+4);g.stroke();return true}
if(r<.06){/* buisson sec */g.strokeStyle='#8a6a42';g.lineWidth=.9;g.beginPath();for(let k=0;k<7;k++){const a=k*.9;g.moveTo(px,py+2);g.lineTo(px+Math.cos(a)*5,py+2+Math.sin(a)*4)}g.stroke();return true}
if(Z[2]>.4&&r<.12){/* pierres rouges des badlands */g.fillStyle='#a8553a';g.beginPath();g.ellipse(px,py,4.5,3.4,.4,0,7);g.fill();g.fillStyle='#c97a55';g.beginPath();g.ellipse(px-1,py-1,2.6,1.6,.4,0,7);g.fill();return true}
if(r>.96){/* cactus tonneau */g.fillStyle='#4f8a3a';g.beginPath();g.ellipse(px,py,4,4.5,0,0,7);g.fill();g.strokeStyle='#3a6a2a';g.lineWidth=.6;for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(px+k*2,py-4);g.lineTo(px+k*2,py+4);g.stroke()}g.fillStyle='#ff6a8a';g.beginPath();g.arc(px,py-4.5,1.4,0,7);g.fill();return true}}
if(b==4){if(Z[3]>.5&&r<.08){/* cristal de glace */g.fillStyle='#d8f1ff';g.beginPath();g.moveTo(px,py-6);g.lineTo(px+2.5,py);g.lineTo(px,py+3);g.lineTo(px-2.5,py);g.closePath();g.fill();g.fillStyle='#ffffff';g.fillRect(px-.5,py-4,1,4);return true}
if(Z[0]>.5&&r<.05){/* évent de vapeur volcanique */g.fillStyle='#2a2020';g.beginPath();g.ellipse(px,py+2,4,2,0,0,7);g.fill();g.fillStyle='#ff7a3a';g.beginPath();g.ellipse(px,py+2,2,1,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.18)';g.beginPath();g.arc(px+1,py-3,2.5,0,7);g.arc(px+2,py-7,3.2,0,7);g.fill();return true}
if(r<.07){/* lichen */g.fillStyle='#b8c070aa';g.beginPath();g.ellipse(px,py,3.5,2.2,r*40,0,7);g.fill();g.fillStyle='#e0a040aa';g.beginPath();g.arc(px+3,py+1,1.4,0,7);g.fill();return true}}
return false}
const rbOf=l=>l>=8?4:l>=4?8:16;
function rbNew(lod){const S=rbOf(lod)*TS*lod/2,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d',{alpha:false});g.scale(lod/2,lod/2);return[c,g]}
function* blockGen(g,bx,by,lod){const rb=rbOf(lod);const ox=bx*rb,oy=by*rb;
yield*groundPaintG(g,ox,oy,rb,rb,-1,-1,lod==1);
if(lod>1)for(let j=0;j<rb;j++){for(let i=0;i<rb;i++){const x=ox+i,y=oy+j;if(Bi(x,y)&&(Bi(x+1,y)==0||Bi(x-1,y)==0||Bi(x,y+1)==0||Bi(x,y-1)==0)){g.fillStyle='rgba(255,255,255,.08)';g.fillRect(i*TS+2,j*TS+2,TS-4,TS-4)}}yield}
if(lod>1&&OPT.deco)for(let j=0;j<rb;j++){for(let i=0;i<rb;i++)deco(g,ox+i,oy+j,i*TS,j*TS);yield}
for(let j=0;j<rb;j++){for(let i=0;i<rb;i++){const r=Rs(ox+i,oy+j);if(!r)continue;if(lod==1){const C=ROCKC[r]||ROCKC.stone;g.fillStyle=C[0];g.beginPath();g.ellipse(i*TS+16,j*TS+18,12,9,0,0,7);g.fill();g.fillStyle=C[1];g.beginPath();g.ellipse(i*TS+14,j*TS+15,7,5,0,0,7);g.fill()}else drawRes(g,r,ox+i,oy+j,ox,oy)}yield}
for(let py=Math.floor(oy/CH);py<=Math.floor((oy+rb-1)/CH);py++)for(let px=Math.floor(ox/CH);px<=Math.floor((ox+rb-1)/CH);px++){const s=pstate(px,py);if(s==2)continue;const X=(px*CH-ox)*TS,Y=(py*CH-oy)*TS,S2=CH*TS;
if(s==1){g.fillStyle='rgba(10,12,16,.45)';g.fillRect(X,Y,S2,S2)}else{const l=chunk(px,py).land;g.fillStyle=l?'rgba(8,10,14,.9)':'rgba(8,10,14,.5)';g.fillRect(X,Y,S2,S2);if(l){g.fillStyle='rgba(255,255,255,.035)';for(let k=0;k<4;k++){g.beginPath();g.arc(X+hsh(px,py,k)*S2,Y+hsh(py,px,k+3)*S2,40+hsh(px+k,py,9)*50,0,7);g.fill()}}}}
}
function blockCanvas(bx,by,lod){const key=bx*1e6+by*10+lod;let c=RBC.touch(key);if(c)return c;const r=rbNew(lod);c=r[0];for(const _ of blockGen(r[1],bx,by,lod));RBJ.delete(key);RBOLD.delete(key);RBC.set(key,c);rbTrim();return c}
/* Fabrication des blocs en tâche de fond, quelques millisecondes par image, les plus proches du centre d’abord */
function rbWant(bx,by,lod,pri){const key=bx*1e6+by*10+lod;let j=RBJ.get(key);if(!j){j={key,bx,by,lod,it:null,c:null,pri};RBJ.set(key,j)}else if(j.f!==rbFrame||pri<j.pri)j.pri=pri;j.f=rbFrame}
function rbRun(ms){if(!RBJ.size)return;const t0=performance.now(),list=[];for(const j of RBJ.values()){if(rbFrame-j.f>30){RBJ.delete(j.key);continue}list.push(j)}list.sort((a,b)=>a.pri-b.pri);
for(const j of list){if(!j.it){const r=rbNew(j.lod);j.c=r[0];j.it=blockGen(r[1],j.bx,j.by,j.lod)}let done=false;while(performance.now()-t0<ms){if(j.it.next().done){done=true;break}}
if(done){RBJ.delete(j.key);RBOLD.delete(j.key);RBC.set(j.key,j.c);rbTrim()}if(performance.now()-t0>=ms)return}}
/* Niveau de détail avec hystérésis : pas d’aller-retour quand on pince autour d’un seuil */
let LODc=2;function lodPick(zd){const up=zd>2.4*1.08?8:zd>1.25*1.08?4:zd>.55*1.08?2:1,dn=zd>2.4/1.08?8:zd>1.25/1.08?4:zd>.55/1.08?2:1;if(LODc<up||LODc>dn)LODc=zd>2.4?8:zd>1.25?4:zd>.55?2:1;return LODc}
function chev(y,col){const o=(time/500%1)*4;cx.strokeStyle=col;cx.lineWidth=3;cx.beginPath();cx.moveTo(-8,y+4-o);cx.lineTo(0,y-4-o);cx.lineTo(8,y+4-o);cx.stroke()}
function ports(t,x,y,d){if(BD[t].inv)return;cx.save();cx.translate(x*TS+16,y*TS+16);cx.rotate(d*Math.PI/2);if(t!='seller'&&t!='pad'&&t!='sink'&&t!='beacon')chev(-TS/2+3,'#4ade80');if(t=='sorter'){cx.save();cx.rotate(-Math.PI/2);chev(-TS/2+3,'#ffd34d');cx.restore()}if(!BD[t].rt&&t!='beacon')chev(TS/2-1,'#FA9549');cx.restore()}
function ship(x,y,s){cx.save();cx.translate(x,y);cx.scale(s,s);cx.fillStyle='#c9d3de';cx.beginPath();cx.moveTo(0,-13);cx.lineTo(8,8);cx.lineTo(0,4);cx.lineTo(-8,8);cx.closePath();cx.fill();cx.fillStyle='#FA9549';cx.beginPath();cx.moveTo(-3,6);cx.lineTo(0,12+Math.random()*4);cx.lineTo(3,6);cx.fill();cx.restore()}
const ROT=nz({crossing:1,split2:1,splitter:1,osplit:1,sorter:1,tunnel:1}),NOLED=nz({accu:1,dronest:1,wpump:1,seller:1,pad:1,split2:1,splitter:1,osplit:1,sorter:1,tunnel:1,crossing:1,sink:1,beacon:1,rcore:1,xdrill:1,relic:1,orbital:1,cryo:1,golden:1,antenna:1,statue:1,clock:1,well:1,vault:1,beltmotor:1});
const BSP_=Object.create(null);
const BSPN=Object.create(null);
let ANF=null,SPB=6,LIVEB=40;function bSprite(t,d,cv,tier,fr){tier=tier||2;const n=BSPN[t]||(BSPN[t]=[]),i=((d*3+(cv||0)+1)*8+tier)*4+(fr||0);let c=n[i];if(c)return c;const k=t+d+'_'+(cv||0)+'_'+tier+'_'+(fr||0);c=BSP_[k];if(c)return n[i]=c;
if(SPB<=0){for(const t2 of[4,6,2]){const c2=BSP_[t+d+'_'+(cv||0)+'_'+t2+'_'+(fr||0)]||BSP_[t+d+'_'+(cv||0)+'_'+t2+'_0'];if(c2)return c2}}SPB--;const bl=isBelt(t)?1:0;c=document.createElement('canvas');c.width=c.height=(32+bl*2)*tier;const g=c.getContext('2d');g.scale(tier,tier);g.translate(bl,bl);ANF=fr==null?null:fr;
const m0=mk(t,0,0,d);m0.cv=cv||0;drawBbody(m0,g,true);ANF=null;return n[i]=BSP_[k]=c}
function big(b,fn){const s=bsz(b);if(s<2)return fn();const ox=b.x*TS,oy=b.y*TS;cx.save();cx.translate(ox,oy);cx.scale(s,s);cx.translate(-ox,-oy);fn();cx.restore()}
function drawB(b){if(bsz(b)>1&&!b._bg){b._bg=1;big(b,()=>drawB(b));b._bg=0;return}
const zs=ZSG*bsz(b),tier=zs<=1.9?2:zs<=3.8?4:6,X=b.x*TS,Y=b.y*TS;
if(isBelt(b.t)){const fr=BCR?0:Math.floor(time/(b.t=='belt3'?30:b.t=='belt2'?45:90))%4;cx.drawImage(bSprite(b.t,b.d,b.cv,tier,fr),X-1,Y-1,TS+2,TS+2);return}
if(b.ct||b.leave&&time-b.leave<1500||b.t=='beacon'){drawBbody(b,cx,false);return}
const act=b.busy||GEN[b.t]&&b.mw>0&&!GEN[b.t].wind||BD[b.t].rt&&b.out&&b.out.length<3&&status(b)=='g';if(act&&!BCR&&ZSG*bsz(b)>=1.5&&LIVEB>0){LIVEB--;drawBbody(b,cx,false);if(b.lv>1)lvBadge(b,X,Y);return}
const sp=bSprite(b.t,b.d,0,tier);if(b.busy&&BD[b.t].m&&!BCR){const s=1+.03*Math.sin(time/110+b.x*1.7);cx.drawImage(sp,X+16-16*s,Y+16-16*s*1.02,TS*s,TS*s*1.02)}else cx.drawImage(sp,X,Y,TS,TS);
if(b.t=='wind')windRotor(cx,X+16,Y+5,b.mw?time/(130-b.mw*4):0,1);
if(b.t=='sorter'&&b.flt)dot(b.flt,X+24,Y+24);
if(STORE[b.t]&&b.tot){const f=Math.min(1,b.tot/BD[b.t].cap);cx.fillStyle='#14171c';cx.fillRect(X+5,Y+TS-8,TS-10,4);cx.fillStyle=f>.9?'#ff6259':'#ffd34d';cx.fillRect(X+5,Y+TS-8,(TS-10)*f,4)}
if(!NOLED[b.t]&&ZSG>=.6&&!BCR){const s=status(b);cx.fillStyle=LED[s];cx.fillRect(X+TS-10,Y+6,5,5)}
if((BD[b.t].m||BD[b.t].rt||STORE[b.t]||b.t=='well')&&ZSG>=1.1&&!b._bg2){cx.save();cx.translate(X+16,Y+16);cx.rotate(b.d*Math.PI/2);cx.fillStyle='#FA9549';cx.beginPath();cx.moveTo(0,-17);cx.lineTo(4.5,-12.5);cx.lineTo(-4.5,-12.5);cx.closePath();cx.fill();cx.restore()}
if(b.lv>1)lvBadge(b,X,Y)}
/* Badge de niveau : chevrons bleus (niveau 2) ou dorés (niveau 3) et liseré de la même couleur */
function lvBadge(b,X,Y){const c=b.lv>2?'#ffd34d':'#2ee6ff';cx.strokeStyle=c;cx.lineWidth=1.6;cx.beginPath();cx.roundRect(X+2,Y+2,TS-4,TS-4,5);cx.stroke();cx.fillStyle='rgba(12,14,18,.9)';cx.beginPath();cx.roundRect(X+2,Y+2,12,b.lv>2?12:9,3);cx.fill();cx.strokeStyle=c;cx.lineWidth=1.5;
for(let k=0;k<b.lv-1;k++){const y=Y+8+k*3.5-(b.lv>2?1.5:0);cx.beginPath();cx.moveTo(X+5,y+1.5);cx.lineTo(X+8,y-1);cx.lineTo(X+11,y+1.5);cx.stroke()}}
/* Tapis en virage : bande en quart de cercle autour du coin intérieur */
function curveBelt(g,side,f,anim){const c0=side*16,a0=side==1?Math.PI/2:0,a1=side==1?Math.PI:Math.PI/2;g.save();g.beginPath();g.rect(-17,-17,34,34);g.clip();
g.strokeStyle='#262b33';g.lineWidth=26;g.beginPath();g.arc(c0,-16,16,a0-.05,a1+.05);g.stroke();g.strokeStyle=f==3?'#2f5560':f?'#5a3a3a':'#454d5a';g.lineWidth=20;g.beginPath();g.arc(c0,-16,16,a0-.05,a1+.05);g.stroke();
g.strokeStyle=f==3?'#1f6f7f':f?'#7a3030':'#3a414d';g.lineWidth=2;const o=ANF!=null?ANF/4:(time/(f?(f==3?120:180):360))%1,as=Math.PI/2,ae=side==1?Math.PI:0;for(let k=0;k<4;k++){const a=as+((k+o)%4)/4*(ae-as);g.beginPath();g.moveTo(c0+Math.cos(a)*6,-16+Math.sin(a)*6);g.lineTo(c0+Math.cos(a)*26,-16+Math.sin(a)*26);g.stroke()}
g.strokeStyle=f==3?'#3ac0d0':f?'#c45a3a':'#6b7484';g.lineWidth=2;g.beginPath();g.arc(c0,-16,28,a0-.05,a1+.05);g.stroke();g.beginPath();g.arc(c0,-16,4,a0-.2,a1+.2);g.stroke();
const am=(a0+a1)/2,ax=c0+Math.cos(am)*16,ay=-16+Math.sin(am)*16,ta=am+side*Math.PI/2;g.strokeStyle='rgba(250,149,73,.6)';g.lineWidth=1.5;g.beginPath();g.moveTo(ax+Math.cos(ta+2.5)*5,ay+Math.sin(ta+2.5)*5);g.lineTo(ax+Math.cos(ta)*3,ay+Math.sin(ta)*3);g.lineTo(ax+Math.cos(ta-2.5)*5,ay+Math.sin(ta-2.5)*5);g.stroke();g.restore()}
function crossBelt(g){g.fillStyle='#262b33';g.fillRect(-17,-13,34,26);g.fillStyle='#454d5a';g.fillRect(-17,-10,34,20);g.fillStyle='#6b7484';g.fillRect(-17,-13,34,2);g.fillRect(-17,11,34,2);
g.strokeStyle='rgba(250,149,73,.6)';g.lineWidth=1.5;for(const x of[-14,14]){g.beginPath();g.moveTo(x-2,-3);g.lineTo(x+2,0);g.lineTo(x-2,3);g.stroke()}
g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-15,-17,31,34);g.fillStyle='#2f353f';g.fillRect(-13,-17,26,34);g.fillStyle='#5d6676';g.fillRect(-10,-17,20,34);
g.fillStyle='#8a93a3';g.fillRect(-13,-17,2,34);g.fillRect(11,-17,2,34);g.fillStyle='#ffd34d';g.fillRect(-13,-6,2,12);g.fillRect(11,-6,2,12);
g.strokeStyle='#f2ead9';g.lineWidth=2;for(const y of[-9,5]){g.beginPath();g.moveTo(-4,y+3);g.lineTo(0,y-1);g.lineTo(4,y+3);g.stroke()}}
function splitBelt(g,t,f){if(t=='split2'){g.fillStyle='#262b33';g.fillRect(-13,-2,26,19);g.fillRect(-17,-13,34,26);g.fillStyle='#454d5a';g.fillRect(-10,0,20,17);g.fillRect(-17,-10,34,20);g.fillStyle='#6b7484';g.fillRect(-13,13,2,4);g.fillRect(11,13,2,4);g.fillRect(-17,-13,34,2);
g.fillStyle='#1c2027';g.beginPath();g.arc(0,0,7,0,7);g.fill();g.strokeStyle='#FA9549';g.lineWidth=2;g.beginPath();g.arc(0,0,7,0,7);g.stroke();
for(const s of[-1,1]){g.save();g.translate(s*12,0);g.rotate(s*Math.PI/2);g.strokeStyle='#f2ead9';g.lineWidth=2.2;g.beginPath();g.moveTo(-4,2);g.lineTo(0,-2);g.lineTo(4,2);g.stroke();g.restore()}g.fillStyle='#f2ead9';g.font='bold 8px sans-serif';g.textAlign='center';g.fillText('2',0,3);return}
if(t=='splitter'){g.save();}const band=f?'#5a3a3a':'#454d5a',fr='#262b33';g.fillStyle=fr;g.fillRect(-13,-17,26,34);g.fillRect(-17,-13,t=='sorter'?30:34,26);
g.fillStyle=band;g.fillRect(-10,-17,20,34);g.fillRect(-17,-10,t=='sorter'?27:34,20);g.fillStyle='#6b7484';g.fillRect(-13,-17,2,4);g.fillRect(11,-17,2,4);g.fillRect(-13,13,2,4);g.fillRect(11,13,2,4);g.fillRect(-17,-13,4,2);g.fillRect(-17,11,4,2);if(t!='sorter'){g.fillRect(13,-13,4,2);g.fillRect(13,11,4,2)}
g.fillStyle='#1c2027';g.beginPath();g.arc(0,0,7,0,7);g.fill();g.strokeStyle=t=='sorter'?'#ffd34d':'#FA9549';g.lineWidth=2;g.beginPath();g.arc(0,0,7,0,7);g.stroke();
const ch=(x,y,a,c)=>{g.save();g.translate(x,y);g.rotate(a);g.strokeStyle=c;g.lineWidth=2.2;g.beginPath();g.moveTo(-4,2);g.lineTo(0,-2);g.lineTo(4,2);g.stroke();g.restore()};
if(t=='osplit'){g.fillStyle='#f2ead9';g.beginPath();g.moveTo(0,-16);g.lineTo(6,-8);g.lineTo(-6,-8);g.closePath();g.fill();ch(-12,0,-Math.PI/2,'#FA954999');ch(12,0,Math.PI/2,'#FA954999');g.fillStyle='#f2ead9';g.font='bold 8px sans-serif';g.textAlign='center';g.fillText('1',0,3);return}
ch(0,-12,0,'#f2ead9');ch(-12,0,-Math.PI/2,t=='sorter'?'#ffd34d':'#f2ead9');if(t!='sorter')ch(12,0,Math.PI/2,'#f2ead9');if(t=='splitter'){g.fillStyle='#f2ead9';g.font='bold 8px sans-serif';g.textAlign='center';g.fillText('3',0,3);g.restore()}}
function drawBbody(b,cx,stat0){const x=b.x*TS,y=b.y*TS,px=x+16,py=y+16,t=b.t,s=stat0?'y':status(b);
if(t=='crossing'){cx.save();cx.translate(px,py);cx.rotate(b.d*Math.PI/2);crossBelt(cx);cx.restore();return}
if(t=='split2'||t=='splitter'||t=='osplit'||t=='sorter'){cx.save();cx.translate(px,py);cx.rotate(b.d*Math.PI/2);splitBelt(cx,t,false);cx.restore();return}
if(isBelt(t)){const f=t=='belt2',f3=t=='belt3';cx.save();cx.translate(px,py);cx.rotate(b.d*Math.PI/2);if(b.cv&&t!='bridge'){curveBelt(cx,b.cv,f3?3:f,true);cx.restore();return}if(t=='bridge'){cx.fillStyle='rgba(0,0,0,.3)';cx.fillRect(-14,-14,30,32);cx.fillStyle='#5a3a1f';cx.fillRect(-16,-16.5,5,33);cx.fillRect(11,-16.5,5,33);cx.fillStyle='#a8763f';for(let k=0;k<4;k++){cx.fillRect(-16,-14+k*8,5,2);cx.fillRect(11,-14+k*8,5,2)}}
else{cx.fillStyle='#262b33';cx.fillRect(-13,-17,26,34)}
cx.fillStyle=f3?'#2f5560':f?'#5a3a3a':'#454d5a';cx.fillRect(-10,-17,20,34);
const o=ANF!=null?ANF*2:(time/(f?22:45))%8;cx.fillStyle=f3?'#1f6f7f':f?'#7a3030':'#3a414d';for(let k=0;k<4;k++)cx.fillRect(-10,15-((k*8+o)%32),20,2);cx.fillStyle=f3?'#3ac0d0':f?'#c45a3a':'#6b7484';cx.fillRect(-13,-17,2,34);cx.fillRect(11,-17,2,34);cx.fillStyle=f3?'#7ae0ea':f?'#d97a5a':'#8a93a3';cx.fillRect(-13,-17,1,34);
cx.strokeStyle='rgba(250,149,73,.55)';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(-4,3);cx.lineTo(0,-3);cx.lineTo(4,3);cx.stroke();cx.restore();return}
if(BD[t].inv){const gr=cx.createRadialGradient(px,py,2,px,py,17);gr.addColorStop(0,'rgba(197,139,255,.35)');gr.addColorStop(1,'rgba(197,139,255,0)');cx.fillStyle=gr;cx.fillRect(x,y,TS,TS);
cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(px+1,py+11,13,4.5,0,0,7);cx.fill();const hx=(r,yy,fill,stroke)=>{cx.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;cx.lineTo(px+Math.cos(a)*r,yy+Math.sin(a)*r*.45)}cx.closePath();cx.fillStyle=fill;cx.fill();if(stroke){cx.strokeStyle=stroke;cx.lineWidth=1.2;cx.stroke()}};
hx(14,py+9,'#1c1824');hx(14,py+7,'#2e2838','#c58bff99');hx(9,py+7,'#3a3348');cx.fillStyle='#c58bffcc';for(let k=0;k<6;k++){const a=k*Math.PI/3;cx.fillRect(px+Math.cos(a)*11.5-.8,py+7+Math.sin(a)*5-.8,1.6,1.6)}}
else{cx.fillStyle='rgba(0,0,0,.3)';cx.fillRect(x+4,y+5,TS-4,TS-4);cx.fillStyle='#2b3039';cx.beginPath();cx.roundRect(x+2,y+2,TS-4,TS-4,5);cx.fill();cx.strokeStyle='#ffffff26';cx.lineWidth=1;cx.stroke()}
cx.save();cx.translate(px,py);if(BD[t].inv){cx.translate(0,-3-(stat0?0:Math.sin(time/500+b.x)*1.2));cx.scale(.82,.82)}if(ROT[t])cx.rotate(b.d*Math.PI/2);bodyB(cx,t,stat0?null:b,!stat0&&s=='g');cx.restore();
if(BD[t].inv){cx.fillStyle='#f3e6ff';for(const[a,r0]of[[.6,13],[2.4,12],[4.2,14]]){const tw=stat0?.8:.5+.5*Math.sin(time/300+a*3);cx.globalAlpha=tw;cx.fillRect(px+Math.cos(a)*r0-1,py-4+Math.sin(a)*r0*.6-1,2,2)}cx.globalAlpha=1}
if(!NOLED[t]&&!stat0){cx.save();cx.translate(px,py);cx.rotate(b.d*Math.PI/2);cx.fillStyle='#4ade80';cx.beginPath();cx.moveTo(-4,-TS/2+8);cx.lineTo(4,-TS/2+8);cx.lineTo(0,-TS/2+2);cx.fill();cx.restore();
cx.fillStyle=LED[s]+'55';cx.beginPath();cx.arc(x+TS-8,y+8,5,0,7);cx.fill();cx.fillStyle=LED[s];cx.beginPath();cx.arc(x+TS-8,y+8,2.6,0,7);cx.fill();
if(b.lv>1){cx.fillStyle='#ffd34d';for(let i=0;i<b.lv-1;i++)cx.fillRect(x+5+i*4,y+5,2.5,6)}}
if(t=='beacon'&&!stat0){const k=(time%1600)/1600;cx.strokeStyle=`rgba(121,227,255,${(1-k)*.5})`;cx.lineWidth=2;cx.strokeRect(x-TS*k,y-TS*k,TS*(1+2*k),TS*(1+2*k))}
if(t=='sorter'&&b.flt&&!stat0)dot(b.flt,px+8,py+8);
if(t=='pad'&&!stat0){const c=b.ct;if(c){const k=Math.min(1,(time-c.born)/2000);ship(px,py-(1-k)*70-10+Math.sin(time/400)*1.5,k);
cx.strokeStyle='#4ade80';cx.lineWidth=3;cx.beginPath();cx.arc(px,py,14,-Math.PI/2,-Math.PI/2+6.283*c.got/c.n);cx.stroke();
cx.strokeStyle='#ef4444';cx.lineWidth=1.5;cx.beginPath();cx.arc(px,py,17,-Math.PI/2,-Math.PI/2+6.283*Math.max(0,1-(tk_-c.t0)/c.dur));cx.stroke()}
else if(b.leave&&time-b.leave<1500){const a=(time-b.leave)/1500;cx.globalAlpha=1-a;ship(px,py-10-a*90,1);cx.globalAlpha=1}}}
const ISP=Object.create(null);
const ISPN=Object.create(null);function itemSprite(it,tr){tr=tr||2;const n=ISPN[it]||(ISPN[it]=[]);let c=n[tr];if(c)return c;const k=it+tr;c=ISP[k];if(c)return n[tr]=c;if(SPB<=0){const c2=ISP[it+2]||ISP[it+5];if(c2)return c2}SPB--;c=itemArt(it,24*tr,.6*tr,true);return n[tr]=ISP[k]=c}
let DOTB=null;function dot(it,px,py){if(!IT[it])return;const zs=ZSG;if(zs<.75){if(DOTB){const c=IT[it][2];(DOTB[c]||(DOTB[c]=[])).push(px-4,py-4);return}cx.fillStyle=IT[it][2];cx.fillRect(px-4,py-4,8,8);return}cx.drawImage(itemSprite(it,zs<3.2?2:5),px-12,py-12,24,24);return;cx.save();cx.translate(px,py);cx.fillStyle='rgba(0,0,0,.3)';cx.beginPath();cx.ellipse(1,5,6,3,0,0,7);cx.fill();cx.scale(.62,.62);shp(cx,it);cx.restore()}
/* Voyants dessinés sur les machines */
function stat(b){if(ZSG*bsz(b)<.75)return;if(bsz(b)>1&&!b._bs){b._bs=1;big(b,()=>stat(b));b._bs=0;return}const d=BD[b.t];if(!d.rt&&!d.m)return;const x=b.x*TS,y=b.y*TS,r=R[b.rec];let p=0,miss=null,full=false;
if(d.rt){p=(d.rt-Math.max(0,b.cd))/d.rt;full=b.out.length>=3;if(!okRes(b))miss='x'}
else if(r){p=b.busy?(r.t-b.pr)/r.t:0;full=b.out.length>=4;if(!b.busy)for(const k in r.in)if((b.buf[k]||0)<r.in[k]){miss=k;break}}else miss='?';
{const pp=Math.max(0,Math.min(1,p)),bw=TS-10,bx0=x+5,by0=y+TS-7;cx.fillStyle='rgba(10,12,16,.85)';cx.beginPath();cx.roundRect(bx0-1,by0-1,bw+2,6,3);cx.fill();
if(pp>.02){cx.fillStyle=full?'#ffd34d':miss?'#8b93a1':'#ff9442';cx.beginPath();cx.roundRect(bx0,by0,Math.max(4,bw*pp),4,2);cx.fill();cx.fillStyle='rgba(255,255,255,.35)';cx.fillRect(bx0+1,by0+.6,Math.max(2,bw*pp-2),1.2)}}
const ix=x+16,iy=y-4;
if((miss||full)&&Math.sin(time/200)>-.2){cx.fillStyle='#000c';cx.beginPath();cx.arc(ix,iy,9,0,7);cx.fill();
if(miss&&miss!='x'&&miss!='?')dot(miss,ix,iy);else{cx.fillStyle='#fff';cx.font='700 12px Rajdhani,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(miss=='?'?'?':miss=='x'?'✕':'■',ix,iy+1)}
cx.strokeStyle='#ef4444';cx.lineWidth=2;cx.beginPath();cx.arc(ix,iy,9,0,7);cx.moveTo(ix-6,iy+6);cx.lineTo(ix+6,iy-6);cx.stroke()}
else if(b.busy&&r)dot(r.out,ix,iy+Math.sin(time/300)*2)}
function drawPOI(q,ownd){const px=q.x*TS+16,py=q.y*TS+16,k=q.k;
if(!ownd){cx.fillStyle='#c77dff';cx.font='700 20px Rajdhani,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.globalAlpha=.6+.4*Math.sin(time/400);cx.fillText('?',px,py);cx.globalAlpha=1;return}
cx.fillStyle='rgba(0,0,0,.28)';cx.beginPath();cx.ellipse(px+2,py+9,13,5,0,0,7);cx.fill();
if(k=='wreck'&&(q.v||0)==2){const gl=.5+.5*Math.sin(time/350);cx.fillStyle=`rgba(125,255,106,${(.12+.12*gl).toFixed(3)})`;cx.beginPath();cx.ellipse(px+2,py+6,16,6,0,0,7);cx.fill();
cx.save();cx.translate(px,py);cx.rotate(-.35);cx.fillStyle='#4a5260';cx.beginPath();cx.roundRect(-13,-6,23,12,6);cx.fill();cx.fillStyle='#5d6676';cx.fillRect(-11,-6,19,2.5);
cx.fillStyle='#ffd34d';cx.fillRect(-5,-6,5,12);cx.fillStyle='#1a1d22';for(let k=0;k<3;k++)cx.fillRect(-5,-6+k*4.4,5,1.6);
cx.fillStyle='#14171c';cx.beginPath();cx.arc(5,0,4.2,0,7);cx.fill();cx.fillStyle=`rgba(125,255,106,${(.7+.3*gl).toFixed(3)})`;cx.beginPath();cx.arc(5,0,3.2,0,7);cx.fill();
cx.strokeStyle='#14171c';cx.lineWidth=.9;cx.beginPath();cx.moveTo(3,-2.5);cx.lineTo(5,0);cx.lineTo(4,2.8);cx.moveTo(5,0);cx.lineTo(7.5,-1);cx.stroke();
cx.fillStyle='#2b3038';cx.beginPath();cx.ellipse(10,0,2.6,6,0,0,7);cx.fill();cx.restore();
cx.fillStyle='#5d6676';cx.fillRect(px-14,py+7,4,2);cx.fillRect(px+10,py+9,3,2);cx.fillStyle='#7dff6a';cx.fillRect(px+8,py+6,1.5,1.5)}
else if(k=='wreck'){cx.save();cx.translate(px,py);cx.rotate(-.5);const vv=q.v||0;cx.fillStyle=['#6b7280','#5d564c','#3a4a3a','#c9d3de','#4a5563'][vv];cx.beginPath();cx.moveTo(-13,4);cx.lineTo(9,-6);cx.lineTo(13,0);cx.lineTo(-9,9);cx.closePath();cx.fill();cx.fillStyle=['#ff9442','#ffd34d','#7dff6a','#e8edf3','#79e3ff'][vv];cx.fillRect(-4,-1,8,3);cx.fillStyle='#374151';cx.beginPath();cx.moveTo(0,-2);cx.lineTo(-6,-11);cx.lineTo(4,-4);cx.fill();cx.restore()}
else if(k=='ruin'){cx.fillStyle='#74776e';cx.beginPath();cx.moveTo(px-14,py+7);cx.lineTo(px+12,py+4);cx.lineTo(px+15,py+10);cx.lineTo(px-12,py+12);cx.closePath();cx.fill();
cx.strokeStyle='rgba(0,0,0,.3)';cx.lineWidth=.8;cx.beginPath();cx.moveTo(px-4,py+6);cx.lineTo(px-1,py+9);cx.lineTo(px+3,py+8);cx.stroke();
cx.fillStyle='#a3a59a';cx.beginPath();cx.moveTo(px-12,py+8);cx.lineTo(px-12,py-6);cx.lineTo(px-9,py-10);cx.lineTo(px-7,py-5);cx.lineTo(px-4,py-8);cx.lineTo(px-2,py-3);cx.lineTo(px-1,py+7);cx.closePath();cx.fill();
cx.fillStyle='#82857a';cx.beginPath();cx.moveTo(px-2,py-3);cx.lineTo(px-1,py+7);cx.lineTo(px-4,py+7);cx.lineTo(px-4,py-4);cx.closePath();cx.fill();cx.fillStyle='#2b2d28';cx.fillRect(px-10,py-2,3,3.5);
cx.save();cx.translate(px+5,py+5);cx.rotate(-.35);cx.fillStyle='#b5651d';cx.fillRect(-6,-2.5,12,5);cx.fillStyle='#8a4a14';cx.fillRect(-6,-2.5,12,1.2);cx.fillStyle='#d98a3a';cx.fillRect(-3,0,2,1.4);cx.restore();
cx.strokeStyle='#8b93a1';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(px+2,py+4);cx.lineTo(px+11,py-8);cx.moveTo(px+4,py+1);cx.lineTo(px+8,py+1);cx.stroke();cx.fillStyle='#c9d3de';cx.beginPath();cx.ellipse(px+11,py-9,4.2,2.2,-.9,0,7);cx.fill();
cx.fillStyle='#4f8a3a';for(const[a,b2]of[[-12,-3],[-11,1],[-9,4],[-3,-6],[-2,0]]){cx.beginPath();cx.arc(px+a,py+b2,1.4,0,7);cx.fill()}}
else{const g=.6+.4*Math.sin(time/300);cx.fillStyle=`rgba(197,139,255,${.25*g})`;cx.beginPath();cx.arc(px,py-2,15,0,7);cx.fill();cx.fillStyle='#b26bff';cx.beginPath();cx.moveTo(px,py-13);cx.lineTo(px+7,py);cx.lineTo(px,py+9);cx.lineTo(px-7,py);cx.closePath();cx.fill();cx.fillStyle='rgba(255,255,255,.5)';cx.beginPath();cx.moveTo(px,py-13);cx.lineTo(px+7,py);cx.lineTo(px,py);cx.fill()}
const by=py-22-Math.abs(Math.sin(time/300))*4;cx.fillStyle='#FA9549';cx.beginPath();cx.arc(px+10,by,7,0,7);cx.fill();cx.fillStyle='#181A1E';cx.font='700 12px Rajdhani,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('!',px+10,by+1)}
function bigPorts(b){if(BD[b.t].inv)return;for(const f of fronts(b)){cx.save();cx.translate((f[0]+.5)*TS-DX[b.d]*TS*.5,(f[1]+.5)*TS-DY[b.d]*TS*.5);cx.rotate(b.d*Math.PI/2);cx.fillStyle='#FA9549';cx.beginPath();cx.moveTo(0,-7);cx.lineTo(6,1);cx.lineTo(-6,1);cx.closePath();cx.fill();cx.restore()}}
let flash=0;function drawEvent(){if(!EV||!OPT.fx&&EV.k!='storm')return;const w=innerWidth,h=innerHeight;cx.setTransform(D,0,0,D,0,0);
if(EV.k=='storm'){cx.fillStyle='rgba(10,14,24,.22)';cx.fillRect(0,0,w,h);if(Math.random()<.004){flash=1;setTimeout(()=>{if(sOK())N(1.4,{f:120,q:.5,v:.25})},400+Math.random()*900)}if(flash>0){cx.fillStyle=`rgba(230,240,255,${(flash*.5).toFixed(3)})`;cx.fillRect(0,0,w,h);flash-=.06}}
else if(EV.k=='fog'){cx.fillStyle='rgba(200,210,220,.2)';cx.fillRect(0,0,w,h)}
else if(EV.k=='heat'){const g=cx.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,120,40,.12)');g.addColorStop(1,'rgba(255,90,40,.04)');cx.fillStyle=g;cx.fillRect(0,0,w,h)}
else if(EV.k=='stars'){const t=time/1000;cx.strokeStyle='rgba(255,255,230,.7)';cx.lineWidth=1.5;for(let k=0;k<3;k++){const p=((t*.35+k*.37)%1),x=w*(.2+.3*k)+p*160,y=60+k*40+p*90;cx.globalAlpha=Math.sin(p*Math.PI);cx.beginPath();cx.moveTo(x,y);cx.lineTo(x-40,y-22);cx.stroke()}cx.globalAlpha=1}
else if(EV.k=='drought'){const g=cx.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,170,60,.14)');g.addColorStop(1,'rgba(255,200,80,.04)');cx.fillStyle=g;cx.fillRect(0,0,w,h)}
else if(EV.k=='aurora'){const t=time/1000;cx.globalCompositeOperation='lighter';for(let k=0;k<3;k++){cx.beginPath();cx.moveTo(0,90+k*26);for(let x=0;x<=w;x+=20)cx.lineTo(x,90+k*26+Math.sin(x/70+t*.6+k)*18);cx.lineTo(w,0);cx.lineTo(0,0);cx.closePath();cx.fillStyle=['rgba(80,255,170,.07)','rgba(120,200,255,.06)','rgba(200,120,255,.05)'][k];cx.fill()}cx.globalCompositeOperation='source-over'}}
function drawPings(){if(!CT.length||menu)return;const w=innerWidth,h=innerHeight,top=118,bot=h-90;cx.setTransform(D,0,0,D,0,0);
for(const c of CT){if(!c.pad)continue;const sx=(c.pad.x*TS+16-cam.x)*cam.z+w/2,sy=(c.pad.y*TS+16-cam.y)*cam.z+h/2;if(sx>-10&&sx<w+10&&sy>top-10&&sy<bot+10)continue;
const cxm=w/2,cym=(top+bot)/2,dx=sx-cxm,dy=sy-cym,k=Math.min((w/2-26)/Math.abs(dx||1e-6),((bot-top)/2-26)/Math.abs(dy||1e-6)),px=cxm+dx*k,py=cym+dy*k,a=Math.atan2(dy,dx),pu=1+Math.sin(time/220)*.08;
cx.save();cx.translate(px,py);cx.scale(pu,pu);cx.fillStyle='rgba(18,20,25,.88)';cx.beginPath();cx.arc(0,0,17,0,7);cx.fill();cx.strokeStyle='#ffd34d';cx.lineWidth=2;cx.stroke();
cx.rotate(a);cx.fillStyle='#ffd34d';cx.beginPath();cx.moveTo(25,0);cx.lineTo(17,-6);cx.lineTo(17,6);cx.closePath();cx.fill();cx.restore();dot(c.item,px,py)}}
function drawFog(px0,px1,py0,py1,z){const S=CH*TS;
for(let py=py0;py<=py1;py++)for(let px=px0;px<=px1;px++){const s=pstate(px,py);if(s==2)continue;const p=s==1?pPrice(px,py):0;const X=px*S,Y=py*S;
if(s==1){cx.setLineDash([10,8]);cx.strokeStyle='rgba(250,149,73,.75)';cx.lineWidth=2/z;cx.strokeRect(X+3,Y+3,S-6,S-6);cx.setLineDash([]);
cx.save();cx.translate(X+S/2,Y+S/2);cx.scale(Math.min(1,1/z),Math.min(1,1/z));cx.globalAlpha=.85;cx.fillStyle='rgba(18,20,25,.8)';cx.beginPath();cx.arc(0,0,11,0,7);cx.fill();cx.strokeStyle=money>=p?'#FA9549':'#6f685c';cx.lineWidth=2;cx.stroke();cx.beginPath();cx.moveTo(-5,0);cx.lineTo(5,0);cx.moveTo(0,-5);cx.lineTo(0,5);cx.stroke();cx.globalAlpha=1;cx.restore()}
}}
let hv=null,qSpot=null,zPrev=0,zMoveT=0,ZSG=2;
/* Nuit : voile bleuté puis halos lumineux additifs sur les machines actives et les voyants */
const GLOW={};function glowS(col){if(GLOW[col])return GLOW[col];const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return GLOW[col]=c}
const nightK=()=>OPT.night&&!menu?Math.max(0,-Math.sin(((gt/1000/360)%1)*6.283))*.55:0;
const HOT=nz({gen_bio:'rgba(255,150,60,.8)',gen_coal:'rgba(255,210,120,.6)',gen_fuel:'rgba(255,170,80,.8)',reactor:'rgba(125,255,106,.9)',smelter:'rgba(255,150,60,.9)',blast:'rgba(255,120,40,.95)',arc:'rgba(150,220,255,.9)',refinery:'rgba(255,170,80,.8)',centrifuge:'rgba(125,255,106,.8)',seller:'rgba(74,222,128,.7)',pad:'rgba(250,204,21,.7)',beacon:'rgba(121,227,255,.8)',sink:'rgba(197,139,255,.7)'});
function nightPass(vis,x0,x1,y0,y1){const n=nightK();if(n<.02)return;cx.fillStyle=`rgba(6,12,38,${n.toFixed(3)})`;cx.fillRect(x0*TS,y0*TS,(x1-x0+1)*TS,(y1-y0+1)*TS);
cx.globalCompositeOperation='lighter';cx.globalAlpha=Math.min(1,n*1.6);
for(const b of vis){const px=b.x*TS+16,py=b.y*TS+16,h=HOT[b.t];if(h&&(b.busy||!BD[b.t].m&&(!GEN[b.t]||b.mw>0))){const r=b.t=='blast'||b.t=='arc'?70:52;cx.drawImage(glowS(h),px-r/2,py-r/2,r,r)}else if(BD[b.t].m||BD[b.t].rt){cx.drawImage(glowS(LED[status(b)]),b.x*TS+TS-16,b.y*TS,16,16)}}
for(const k of PLAT){const x=Math.floor(k/65536+.5),y=k-x*65536;if(x>=x0&&x<=x1&&y>=y0&&y<=y1&&(x+y)%3==0)cx.drawImage(glowS('rgba(255,210,140,.5)'),x*TS,y*TS,TS,TS)}
cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}
/* =====================================================================
   BÂTIMENTS EN CACHE (vue dézoomée)
   Quand on est dézoomé, chaque bloc de 16×16 cases garde une image figée
   de ses bâtiments : une seule copie par bloc au lieu de centaines de
   dessins. Une empreinte (type, position, sens, niveau) détecte tout
   changement et le bloc est refait en tâche de fond ; en attendant, ses
   bâtiments sont dessinés normalement. Voyants, jauges, pads, éoliennes…
   restent dessinés en direct.
   ===================================================================== */
const BB=16,BLC=new Map(),BLJ=new Map();let BLpx=0,BCR=0,blFrame=0;
const THS=Object.create(null),thash=t=>THS[t]||(THS[t]=[...t].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,7)||1);
const bLive=b=>STORE[b.t]||b.ct||(b.leave&&time-b.leave<1500)||b.t=='beacon'||b.t=='wind'||b.t=='sorter'||(b.born&&time-b.born<420);
const bsOf=z=>z<=.25?.25:z<=.375?.375:z<=.5?.5:z<=.75?.75:1;
const planCol=b=>{const d=BD[b.t];return isBelt(b.t)?(b.t=='belt3'?'#2f7f8f':b.t=='belt2'?'#7a3a3a':'#4a525e'):d.m?'#c9733a':d.rt?'#3f7fb3':GEN[b.t]?'#d9b44a':d.inv?'#a77be0':b.t=='seller'||b.t=='pad'?'#3fbf6a':'#6b7280'};
function planBatch(g,list){const B=Object.create(null);for(const b of list){const c=planCol(b);(B[c]||(B[c]=[])).push(b)}
for(const c in B){g.fillStyle=c;g.beginPath();for(const b of B[c]){if(isBelt(b.t))g.rect(b.x*TS+6,b.y*TS+6,TS-12,TS-12);else{const s=bsz(b);g.rect(b.x*TS+2,b.y*TS+2,s*TS-4,s*TS-4)}}g.fill()}}
function blEvict(){const cap=Math.max(6e6,cv.width*cv.height*3);while(BLpx>cap&&BLC.size>2){const k=BLC.keys().next().value,e=BLC.get(k);BLpx-=e.c.width*e.c.height;e.c.width=e.c.height=0;BLC.delete(k)}}
/* un bloc couvre ses 16×16 cases + 1 case à gauche/en haut et 3 à droite/en bas (débordements, grands bâtiments) */
function blRender(j){const s=j.s,S=Math.ceil((BB+4)*TS*s),c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
g.setTransform(s,0,0,s,-(j.bx*BB-1)*TS*s,-(j.by*BB-1)*TS*s);
if(j.plan)planBatch(g,j.list);else{const o=cx,ol=LIVEB;cx=g;BCR=1;LIVEB=0;try{for(const b of j.list)drawB(b)}finally{cx=o;BCR=0;LIVEB=ol}}
const old=BLC.get(j.key);if(old){BLpx-=old.c.width*old.c.height;old.c.width=old.c.height=0;BLC.delete(j.key)}
BLC.set(j.key,{c,sig:j.sig});BLpx+=S*S;blEvict()}
function blRun(ms){if(!BLJ.size)return;const t0=performance.now(),list=[...BLJ.values()].filter(j=>{if(blFrame-j.f>20){BLJ.delete(j.key);return false}return true}).sort((a,b)=>a.pri-b.pri);
for(const j of list){if(performance.now()-t0>=ms)return;BLJ.delete(j.key);blRender(j)}}
function drawBuildings(vis,x0,x1,y0,y1){const plan=ZSG<.42;
/* zoomé (ou petite usine) : dessin direct comme avant */
if(ZSG>=1||L.length<120){if(plan)planBatch(cx,vis);else{for(const b of vis)drawBA(b);for(const b of vis)if(BD[b.t].rt||BD[b.t].m)stat(b)}return}
blFrame++;const s=bsOf(ZSG),mode=(plan?'p':'s')+s,BX0=Math.floor((x0-3)/BB),BX1=Math.floor((x1+1)/BB),BY0=Math.floor((y0-3)/BB),BY1=Math.floor((y1+1)/BB),W=BX1-BX0+1,H=BY1-BY0+1;
const sig=new Int32Array(W*H),lists=new Array(W*H),live=[];
for(const b of L){const bx=Math.floor(b.x/BB)-BX0,by=Math.floor(b.y/BB)-BY0;if(bx<0||by<0||bx>=W||by>=H)continue;if(bLive(b)){live.push(b);continue}const i=by*W+bx;
sig[i]=(Math.imul(sig[i],31)+thash(b.t)+Math.imul(b.x,73856093)+Math.imul(b.y,19349663)+b.d*7+(b.lv||1)*131+(b.cv||0)*1009)|0;(lists[i]||(lists[i]=[])).push(b)}
const cxw=(cam.x/TS-BB/2)/BB,cyw=(cam.y/TS-BB/2)/BB,ready=new Uint8Array(W*H),liveB=[];
for(let by=0;by<H;by++)for(let bx=0;bx<W;bx++){const i=by*W+bx,lst=lists[i];if(!lst){ready[i]=1;continue}const key=(BX0+bx)*1e6+(BY0+by)*100+mode.length*10+(s*8|0)+(plan?50:0),e=BLC.get(key);
if(e&&e.sig===sig[i]){BLC.delete(key);BLC.set(key,e);ready[i]=1;cx.drawImage(e.c,((BX0+bx)*BB-1)*TS,((BY0+by)*BB-1)*TS,(BB+4)*TS,(BB+4)*TS);continue}
let j=BLJ.get(key);if(!j){j={key};BLJ.set(key,j)}Object.assign(j,{bx:BX0+bx,by:BY0+by,s,plan,sig:sig[i],list:lst,f:blFrame,pri:(BX0+bx-cxw)**2+(BY0+by-cyw)**2});
for(const b of lst)liveB.push(b)}
/* blocs pas encore prêts : dessin direct de leurs bâtiments visibles */
const vx0=x0-3,vx1=x1+1,vy0=y0-3,vy1=y1+2,inV=b=>b.x>=vx0&&b.x<=vx1&&b.y>=vy0&&b.y<=vy1;
if(plan){planBatch(cx,liveB.filter(inV));planBatch(cx,live.filter(inV))}
else{for(const b of liveB)if(inV(b))drawBA(b);for(const b of live)if(inV(b))drawBA(b);
/* voyants des blocs en cache, regroupés par couleur */
if(ZSG>=.6){const V=Object.create(null);for(const b of vis){if(NOLED[b.t]||isBelt(b.t)||bLive(b))continue;const i=(Math.floor(b.y/BB)-BY0)*W+(Math.floor(b.x/BB)-BX0);if(!ready[i]||!lists[i])continue;const c=LED[status(b)];(V[c]||(V[c]=[])).push(b)}
for(const c in V){cx.fillStyle=c;cx.beginPath();for(const b of V[c]){const k=bsz(b);cx.rect(b.x*TS+(TS-10)*k,b.y*TS+6*k,5*k,5*k)}cx.fill()}}
for(const b of vis)if(BD[b.t].rt||BD[b.t].m)stat(b)}}
let FT0=0;function draw(al){FT0=performance.now();SPB=6;LIVEB=(P&&P.mv)||time-zMoveT<350?0:24;if(bDirty&&typeof beltOrder=='function'){beltOrder();bDirty=0}const z=cam.z,w=cv.width,h=cv.height;cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#2b62a0';cx.fillRect(0,0,w,h);
cx.setTransform(z*D,0,0,z*D,w/2-cam.x*z*D,h/2-cam.y*z*D);
const vw=w/D/z/2,vh=h/D/z/2,x0=Math.floor((cam.x-vw)/TS),x1=Math.floor((cam.x+vw)/TS),y0=Math.floor((cam.y-vh)/TS),y1=Math.floor((cam.y+vh)/TS);
{if(z!==zPrev){zPrev=z;zMoveT=time}const zooming=time-zMoveT<350;if(!zooming)ZSG=z*D;rbFrame++;
const lz=lodPick(z*D),rbz=rbOf(lz),ccx=cam.x/TS/rbz-.5,ccy=cam.y/TS/rbz-.5,BX0=Math.floor(x0/rbz),BX1=Math.floor(x1/rbz),BY0=Math.floor(y0/rbz),BY1=Math.floor(y1/rbz);let miss=0;
for(let by=BY0;by<=BY1;by++)for(let bx=BX0;bx<=BX1;bx++){const key=bx*1e6+by*10+lz;let c=RBC.touch(key)||RBOLD.get(key);
if(!c||RBOLD.has(key)){miss++;rbWant(bx,by,lz,(bx-ccx)**2+(by-ccy)**2)}
if(!c){/* repli : un niveau déjà prêt, en découpant le bon morceau */let ok=0;for(const l2 of[4,2,1,8]){if(l2==lz)continue;const r2=rbOf(l2);if(r2<rbz)continue;const pbx=Math.floor(bx*rbz/r2),pby=Math.floor(by*rbz/r2),pk2=pbx*1e6+pby*10+l2,c2=RBC.get(pk2)||RBOLD.get(pk2);if(!c2)continue;const sc=TS*l2/2,sx=(bx*rbz-pbx*r2)*sc,sy=(by*rbz-pby*r2)*sc;cx.drawImage(c2,sx,sy,rbz*sc,rbz*sc,bx*rbz*TS,by*rbz*TS,rbz*TS+.5,rbz*TS+.5);ok=1;break}
if(ok)continue;/* rien de prêt : on demande d’abord le bloc grossier (rapide), et couleurs du sol en attendant */if(lz!=1)rbWant(Math.floor(bx*rbz/16),Math.floor(by*rbz/16),1,-1);
const n=Math.max(1,rbz/8|0),w=rbz/n;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=bx*rbz+i*w+(w>>1),y=by*rbz+j*w+(w>>1),ch=chunk(x>>3,y>>3);cx.fillStyle=ch.col[((y&7)<<3)|(x&7)];cx.fillRect((bx*rbz+i*w)*TS,(by*rbz+j*w)*TS,w*TS+.5,w*TS+.5)}continue}
cx.drawImage(c,bx*rbz*TS,by*rbz*TS,rbz*TS+.5,rbz*TS+.5)}
/* préparation à l’avance : l’anneau de blocs autour de l’écran, une fois l’écran complet */
if(!miss&&!zooming)for(let by=BY0-1;by<=BY1+1;by++)for(let bx=BX0-1;bx<=BX1+1;bx++){if(by>=BY0&&by<=BY1&&bx>=BX0&&bx<=BX1)continue;const key=bx*1e6+by*10+lz;if(RBC.has(key))RBC.touch(key);else rbWant(bx,by,lz,1e6+(bx-ccx)**2+(by-ccy)**2)}}
if(z>.9){cx.strokeStyle='rgba(255,255,255,.12)';cx.lineWidth=1.5;cx.beginPath();for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(!Bi(x,y)&&(x+y)%2==0){const o=isRiver(x,y)?((time/90+x*7+y*5)%28)-14:Math.sin(time/700+x*.9+y*.4)*5;cx.moveTo(x*TS+6+o,y*TS+12+o*.5);cx.lineTo(x*TS+20+o,y*TS+12+o*.5)}cx.stroke()}
const px0=x0>>3,px1=x1>>3,py0=y0>>3,py1=y1>>3;
for(let py=py0;py<=py1;py++)for(let px=px0;px<=px1;px++){const c=chunk(px,py);if(c.poi&&!FOUND.has(tk(c.poi.x,c.poi.y))){const s=menu?2:pstate(px,py);if(s)drawPOI(c.poi,s==2)}}
for(const k of PLAT){const x=Math.floor(k/65536+.5),y=k-x*65536;if(x<x0-1||x>x1+1||y<y0-1||y>y1+1)continue;const X=x*TS,Y=y*TS;cx.fillStyle='rgba(0,0,0,.3)';cx.fillRect(X+2,Y+4,TS,TS);cx.fillStyle='#8a5f33';cx.fillRect(X,Y,TS,TS);cx.fillStyle='#a8763f';for(let i=0;i<4;i++)cx.fillRect(X+1,Y+1+i*8,TS-2,6);cx.fillStyle='#5a3a1f';cx.fillRect(X,Y,3,3);cx.fillRect(X+TS-3,Y,3,3);cx.fillRect(X,Y+TS-3,3,3);cx.fillRect(X+TS-3,Y+TS-3,3,3)}
const vis=[];for(const b of L)if(b.x>=x0-1&&b.x<=x1+1&&b.y>=y0-1&&b.y<=y1+2)vis.push(b);
drawBuildings(vis,x0,x1,y0,y1);
/* Objets en transit : glissement interpolé (sur 2 ticks pour le tapis lent) */
const slide=(it,b,st,from)=>{let px=b.x*TS+16,py=b.y*TS+16;const dur=b.t=='conveyor'?2:1,f=Math.min(1,(tk_-st+al)/dur);if(from&&f<1&&Math.abs(from[0]-b.x)+Math.abs(from[1]-b.y)<=1){px+=(from[0]-b.x)*(1-f)*TS*.5;py+=(from[1]-b.y)*(1-f)*TS*.5}dot(it,px,py)};
for(const b of L)if(b.t=='dronest'&&b.fl){const f=Math.min(1,(tk_-b.fl.t0+al)/b.fl.dur),t=b.fl.to,x=(b.x+(t.x-b.x)*f)*TS+16,y=(b.y+(t.y-b.y)*f)*TS+16-Math.sin(f*Math.PI)*28;
cx.fillStyle='rgba(0,0,0,.25)';cx.beginPath();cx.ellipse((b.x+(t.x-b.x)*f)*TS+16,(b.y+(t.y-b.y)*f)*TS+22,7,2.5,0,0,7);cx.fill();cx.fillStyle='#8b93a1';cx.fillRect(x-6,y-1.5,12,3);cx.fillRect(x-1.5,y-6,3,12);cx.fillStyle='#2b3039';cx.beginPath();cx.arc(x,y,3.2,0,7);cx.fill();
cx.strokeStyle='rgba(220,230,240,.7)';cx.lineWidth=1.2;for(const[dx,dy]of[[-6,0],[6,0],[0,-6],[0,6]]){cx.beginPath();cx.ellipse(x+dx,y+dy,3.5,1,time/40,0,7);cx.stroke()}if(b.fl.items.length)dot(b.fl.items[0],x,y+7)}
DOTB=ZSG<.75?Object.create(null):null;if(ZSG>=.42)for(const b of vis){if(b.q&&b.q.length){for(const e of b.q){const w=beltPos(b,e.p,e.p0);let px=w[0],py=w[1];if(e.ox!=null){px=e.ox+(w[0]-e.ox)*al;py=e.oy+(w[1]-e.oy)*al}dot(e.it,px,py)}}
else if(CARRY[b.t]&&b.item)slide(b.item,b,b.st,b.from);else if(b.t=='crossing'&&b.cr)for(const q of b.cr)if(q)slide(q.it,b,q.st,q.from)}
if(DOTB){for(const c in DOTB){const a=DOTB[c];cx.fillStyle=c;cx.beginPath();for(let i=0;i<a.length;i+=2)cx.rect(a[i],a[i+1],8,8);cx.fill()}DOTB=null}
if(P&&P.bp&&P.bpEnd){const a0=P.bp,a1=P.bpEnd,x0=Math.min(a0[0],a1[0]),y0=Math.min(a0[1],a1[1]),ww=(Math.abs(a1[0]-a0[0])+1)*TS,hh=(Math.abs(a1[1]-a0[1])+1)*TS;cx.fillStyle='rgba(46,230,255,.16)';cx.strokeStyle='#2ee6ff';cx.lineWidth=3/z;cx.setLineDash([8/z,6/z]);cx.fillRect(x0*TS,y0*TS,ww,hh);cx.strokeRect(x0*TS,y0*TS,ww,hh);cx.setLineDash([])}
if(bpMode=='paste'&&BP){const[ax,ay]=bpAnchor();cx.globalAlpha=.55;for(const it of BP.items)drawB(mk(it.t,ax+it.dx,ay+it.dy,it.d));cx.globalAlpha=1;
for(const it of BP.items)for(const c of tilesOf(it.t,ax+it.dx,ay+it.dy)){const bad=at(c)||!owned(c[0],c[1])||!Bi(c[0],c[1])&&!PLAT.has(tk(c[0],c[1]))&&it.t!='bridge'||BD[it.t].rt&&!Rs(c[0],c[1]);if(bad){cx.fillStyle='rgba(239,68,68,.45)';cx.fillRect(c[0]*TS,c[1]*TS,TS,TS)}}
cx.strokeStyle='#2ee6ff';cx.lineWidth=3/z;cx.setLineDash([8/z,6/z]);cx.strokeRect(ax*TS,ay*TS,BP.w*TS,BP.h*TS);cx.setLineDash([])}
if(P&&P.box&&P.boxEnd){const a0=P.box,a1=P.boxEnd,x0=Math.min(a0[0],a1[0]),y0=Math.min(a0[1],a1[1]);cx.fillStyle='rgba(239,68,68,.22)';cx.strokeStyle='#ef4444';cx.lineWidth=3/z;cx.setLineDash([8/z,6/z]);cx.fillRect(x0*TS,y0*TS,(Math.abs(a1[0]-a0[0])+1)*TS,(Math.abs(a1[1]-a0[1])+1)*TS);cx.strokeRect(x0*TS,y0*TS,(Math.abs(a1[0]-a0[0])+1)*TS,(Math.abs(a1[1]-a0[1])+1)*TS);cx.setLineDash([])}
const rgB=sel&&RANGE[sel.t]?sel:tool&&RANGE[tool]&&hv?{t:tool,x:hv[0],y:hv[1]}:null;
if(rgB){const r=RANGE[rgB.t],s=bsz(rgB),x0=(rgB.x-r)*TS,y0=(rgB.y-r)*TS,w=(s+2*r)*TS,pu=.14+.05*Math.sin(time/300);cx.fillStyle=`rgba(46,230,255,${pu.toFixed(3)})`;cx.fillRect(x0,y0,w,w);cx.strokeStyle='#2ee6ff';cx.lineWidth=2.5/z;cx.setLineDash([10/z,7/z]);cx.strokeRect(x0,y0,w,w);cx.setLineDash([]);
const tg={beltmotor:b=>BELTS[b.t],xdrill:b=>BD[b.t].rt,cryo:b=>GEN[b.t],golden:b=>b.t=='seller',antenna:b=>BD[b.t].m,beacon:b=>BD[b.t].m}[rgB.t];if(tg)for(const b of L){if(b===rgB||!tg(b))continue;const bs=bsz(b);if(b.x+bs-1>=rgB.x-r&&b.x<=rgB.x+s-1+r&&b.y+bs-1>=rgB.y-r&&b.y<=rgB.y+s-1+r){cx.strokeStyle='#7dff6a';cx.lineWidth=2/z;cx.strokeRect(b.x*TS+3,b.y*TS+3,bs*TS-6,bs*TS-6)}}}
if(grabFx){const gs=bsz(grabFx),pu=2+Math.sin(time/80)*1.5;cx.strokeStyle='#4ade80';cx.lineWidth=3/z;cx.strokeRect(grabFx.x*TS-pu,grabFx.y*TS-pu,TS*gs+pu*2,TS*gs+pu*2)}
if(sel){const ss=bsz(sel);cx.strokeStyle='#FA9549';cx.lineWidth=3/z;cx.strokeRect(sel.x*TS+1,sel.y*TS+1,TS*ss-2,TS*ss-2);if(!isBelt(sel.t)){if(bsz(sel)>1)bigPorts(sel);else ports(sel.t,sel.x,sel.y,sel.d)}}
if(hv&&tool){const so=SZ(tool),oo=Math.floor((so-1)/2),hx=hv[0]-oo,hy=hv[1]-oo,rr=Rs(hx,hy),d=BD[tool],wet=!Bi(hx,hy)&&!PLAT.has(tk(hx,hy)),ok=(so<2?!BL.has(tk(hx,hy))&&owned(hx,hy):tilesOf(tool,hx,hy).every(c=>!BL.has(tk(c[0],c[1]))&&owned(c[0],c[1])&&(Bi(c[0],c[1])||PLAT.has(tk(c[0],c[1])))))&&(tool=='dam'?isRiver(hx,hy):d.plat?wet:wet?tool=='bridge':(d.oil?rr=='oil':!d.rt||(rr&&rr!='oil'&&(rr!='gold'||U.x.has('gold')))));
cx.globalAlpha=.6;if(!d.plat)drawB(mk(tool,hx,hy,dir));cx.globalAlpha=1;cx.fillStyle=ok?'rgba(46,230,255,.3)':'rgba(239,68,68,.45)';cx.fillRect(hx*TS,hy*TS,TS*so,TS*so);if(so<2)ports(tool,hx,hy,dir);else bigPorts(mk(tool,hx,hy,dir))}
nightPass(vis,x0,x1,y0,y1);
drawPT();if(!menu){drawFog(px0,px1,py0,py1,z);drawSpot(z);drawHand(z)}
for(let i=fl.length-1;i>=0;i--){const f=fl[i],a=(time-f.t)/1000;if(a>1.2){fl.splice(i,1);continue}cx.globalAlpha=Math.max(0,1-a/1.2);cx.fillStyle='#FA9549';cx.font='16px Share Tech Mono,monospace';cx.textAlign='center';cx.fillText(f.s,f.x,f.y-a*30);cx.globalAlpha=1}
{const zm=time-zMoveT<350;rbRun(zm?2:Math.max(2,9-(performance.now()-FT0)));if(!zm)blRun(Math.max(1.5,11-(performance.now()-FT0)))}}
/* Main du tutoriel : montre le geste à faire (glisser, ou toucher) */
function hand(x,y,s,press){cx.save();cx.translate(x,y);cx.scale(s,s);if(press)cx.scale(.88,.88);cx.lineJoin='round';
const sh=(f)=>{cx.beginPath();cx.roundRect(-3,0,6,15,3);f();cx.beginPath();cx.roundRect(-7,11,15,13,5);f();cx.beginPath();cx.ellipse(-8,16,3,5.5,.45,0,7);f()};
cx.fillStyle='rgba(0,0,0,.25)';cx.save();cx.translate(2,3);sh(()=>cx.fill());cx.restore();cx.strokeStyle='#1a1612';cx.lineWidth=3;sh(()=>cx.stroke());cx.fillStyle='#fff4e6';sh(()=>cx.fill());
cx.strokeStyle='rgba(0,0,0,.18)';cx.lineWidth=1;cx.beginPath();cx.moveTo(-2,14);cx.lineTo(-2,17);cx.moveTo(2,14);cx.lineTo(2,17);cx.stroke();cx.restore()}
function drawHand(z){if(!OPT.tips||menu||sheet||P)return;const q=Q[qi];if(!q)return;const s=1.1/Math.max(.6,Math.min(1.6,z));
if(q.t==Q[2].t&&qi==2&&!L.some(b=>isBelt(b.t))){const e=L.find(b=>BD[b.t].rt),sl=L.find(b=>b.t=='seller');if(!e||!sl)return;const k=(time%2400)/2400,p=Math.min(1,Math.max(0,(k-.18)/.6)),ax=e.x*TS+16,ay=e.y*TS+16,bx=sl.x*TS+16,by=sl.y*TS+16,hx=ax+(bx-ax)*p,hy=ay+(by-ay)*p;
cx.fillStyle='rgba(255,212,77,.85)';const n=Math.floor(p*10);for(let i=0;i<=n;i++){const f=i/10;cx.beginPath();cx.arc(ax+(bx-ax)*f,ay+(by-ay)*f,3/Math.max(.6,z)*.9,0,7);cx.fill()}
if(k<.18||k>.78){cx.strokeStyle=`rgba(255,212,77,${(1-((k<.18?k:k-.78)/.2))*.8})`;cx.lineWidth=2.5;cx.beginPath();cx.arc(k<.18?ax:bx,k<.18?ay:by,10+((k<.18?k:k-.78)*90),0,7);cx.stroke()}
cx.globalAlpha=k>.9?(1-k)*10:1;hand(hx,hy,s,k<.18||k>.78);cx.globalAlpha=1;return}
const qs=qSpot;if(qs&&tool){const px=qs[0]*TS+16,py=qs[1]*TS+16,k=(time%1300)/1300;if(k<.35){cx.strokeStyle=`rgba(46,230,255,${(1-k/.35)*.9})`;cx.lineWidth=2.5;cx.beginPath();cx.arc(px,py,8+k*60,0,7);cx.stroke()}hand(px+2,py+2+(k<.2?0:Math.min(1,(k-.2)*4)*6),s,k<.2)}}
function drawSpot(z){const qs=qSpot;if(!qs)return;const px=qs[0]*TS+16,py=qs[1]*TS+16,k=(time%1200)/1200;cx.strokeStyle=`rgba(250,149,73,${1-k})`;cx.lineWidth=3/z;cx.beginPath();cx.arc(px,py,13+k*18,0,7);cx.stroke();
const by=py-30-Math.abs(Math.sin(time/250))*8;cx.fillStyle='#FA9549';cx.strokeStyle='#181A1E';cx.lineWidth=2;cx.beginPath();cx.moveTo(px,by+12);cx.lineTo(px-8,by);cx.lineTo(px-3,by);cx.lineTo(px-3,by-8);cx.lineTo(px+3,by-8);cx.lineTo(px+3,by);cx.lineTo(px+8,by);cx.closePath();cx.stroke();cx.fill()}
/* Carte : fenêtre de 128×128 cases autour de la caméra */
const MW=128,mm=document.createElement('canvas');mm.width=mm.height=MW;let mmO=[0,0];
let mmJob=null;const RCX={};for(const k in RC)RCX[k]=[parseInt(RC[k].slice(1,3),16),parseInt(RC[k].slice(3,5),16),parseInt(RC[k].slice(5,7),16)];
const RIVC=[66,140,196];
function buildMM(){const g=mm.getContext('2d');g.fillStyle='#0b0c0a';g.fillRect(0,0,MW,MW);mmO=[Math.floor(cam.x/TS)-MW/2,Math.floor(cam.y/TS)-MW/2];mmJob={j:0,img:g.createImageData(MW,8)}}
/* 8 lignes de carte par image : l'ouverture est instantanée et la carte se dessine en balayage */
function mmStep(){if(!mmJob)return;const g=mm.getContext('2d'),img=mmJob.img,[ox,oy]=mmO;for(let jj=0;jj<8&&mmJob.j<MW;jj++,mmJob.j++){const j=mmJob.j;
for(let i=0;i<MW;i++){const x=ox+i,y=oy+j,r=Rs(x,y),c=r?RCX[r]:isRiver(x,y)?RIVC:BR[Bi(x,y)],s=pstate(x>>3,y>>3),f=s==2?1:s==1?.6:.22,o=(jj*MW+i)*4;img.data[o]=c[0]*f;img.data[o+1]=c[1]*f;img.data[o+2]=c[2]*f;img.data[o+3]=255}}
g.putImageData(img,0,mmJob.j-8);if(mmJob.j>=MW)mmJob=null}
function radar(g,w){const c=w/2,a=time/1400;g.save();g.translate(c,c);g.strokeStyle='rgba(255,148,66,.16)';g.lineWidth=D;for(const r of[.25,.5,.75]){g.beginPath();g.arc(0,0,c*r,0,7);g.stroke()}g.beginPath();g.moveTo(-c,0);g.lineTo(c,0);g.moveTo(0,-c);g.lineTo(0,c);g.stroke();
for(let i=0;i<26;i++){g.fillStyle=`rgba(255,148,66,${(.2*(1-i/26)).toFixed(3)})`;g.beginPath();g.moveTo(0,0);g.arc(0,0,c*1.42,a-i*.04,a-(i+1)*.04,true);g.closePath();g.fill()}g.restore()}
function drawMap(){const c=$('mapc');if(!c)return;const g=c.getContext('2d'),S=c.width/MW;g.imageSmoothingEnabled=false;g.drawImage(mm,0,0,c.width,c.height);g.fillStyle='#FA9549';
for(const b of L){const i=b.x-mmO[0],j=b.y-mmO[1];if(i>=0&&j>=0&&i<MW&&j<MW)g.fillRect(i*S,j*S,Math.max(2,S),Math.max(2,S))}
const mw=cv.width/D/cam.z/TS*S,mh=cv.height/D/cam.z/TS*S;g.strokeStyle='#fff';g.lineWidth=2;g.strokeRect((cam.x/TS-mmO[0])*S-mw/2,(cam.y/TS-mmO[1])*S-mh/2,mw,mh);radar(g,c.width)}
