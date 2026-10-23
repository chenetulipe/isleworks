/* =====================================================================
   MONDE INFINI
   Le terrain est une fonction pure de (x, y, graine). Il est généré par
   parcelles de 8×8 cases à la demande et gardé en cache.
   Biomes : 0 eau, 1 plaine, 2 forêt, 3 sable/plage, 4 montagne
   ===================================================================== */
const TS=32,CH=8,TM=500,DX=[0,1,0,-1],DY=[-1,0,1,0],DS=['N','E','S','O'];
let SEED=12345;
const DIF={easy:{m:1100,r:1.25,p:.85},std:{m:520,r:.8,p:1},hard:{m:420,r:.55,p:1.3}};let diff='std';
function hsh(x,y,s){let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296}
function vn(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=hsh(xi,yi,s),b=hsh(xi+1,yi,s),c=hsh(xi,yi+1,s),d=hsh(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,s,o){let t=0,a=.5,f=1,n=0;for(let i=0;i<o;i++){t+=vn(x*f,y*f,s+i*101)*a;n+=a;a*=.5;f*=2.03}return t/n}
const BR=[[52,112,170],[127,174,99],[85,144,79],[217,196,138],[146,136,118]],BCOL=BR.map(c=>`rgb(${c})`);
/* Gisements de départ, garantis autour de l'origine */
const START=[['iron',-5,-5],['copper',4,-5],['coal',-5,4],['wood',4,4],['stone',-4,-13],['sand',12,0],['clay',-13,2]];
function elev(x,y){const d=Math.hypot(x,y);let e=fbm(x/38,y/38,SEED,4)+Math.max(0,1-d/24)*.45;
if(Math.max(Math.abs(x+.5),Math.abs(y+.5))<10)e=Math.max(e,.75);for(const s of START)if(Math.hypot(x-s[1],y-s[2])<4.5)e=Math.max(e,.7);return e}
const LANDT=.56;
/* Un gisement par cellule de 14×14 cases, avec une probabilité qui dépend de la difficulté.
   Les ressources rares n'apparaissent que loin du départ. */
const OC=14;let WV=2;
function deposit(cx,cy){if(hsh(cx,cy,SEED+31)>(WV>1?.3:.42)*DIF[diff].r)return null;const x=cx*OC+2+hsh(cx,cy,SEED+32)*10,y=cy*OC+2+hsh(cx,cy,SEED+33)*10,d=Math.hypot(x,y);if(d<18)return null;
const mt=fbm(x/22,y/22,SEED+5,3)>.63,pool=mt?['iron','iron','copper','coal','stone','limestone']:['iron','copper','coal','clay','limestone','stone'];
if(d>32)pool.push('gold','quartz',mt?'gold':'quartz');if(d>50)pool.push('bauxite','sulfur','bauxite');if(d>68)pool.push('oil','oil','sulfur');if(d>85)pool.push('titanium',mt?'titanium':'bauxite');if(d>100)pool.push('uranium');
return{x,y,r:WV>1?1.2+hsh(cx,cy,SEED+34)*1.1:1.5+hsh(cx,cy,SEED+34)*1.6,t:pool[hsh(cx,cy,SEED+35)*pool.length|0]}}
const DEP=new Map();function depC(cx,cy){const k=cx*65536+cy;if(!DEP.has(k))DEP.set(k,deposit(cx,cy));return DEP.get(k)}
/* Rivières : des lignes sinueuses le long d'un bruit « crête », jamais dans la zone de départ */
function river(x,y,e){if(Math.max(Math.abs(x+.5),Math.abs(y+.5))<12||e>.98)return false;for(const s of START)if(Math.hypot(x-s[1],y-s[2])<6)return false;
return Math.abs(fbm(x/75,y/75,SEED+300,3)-.5)<.011+.009*vn(x/18,y/18,SEED+301)}
function tile(x,y){const e=elev(x,y);if(e<LANDT)return[0,null];if(river(x,y,e))return[0,null,1];
let b;const mt=fbm(x/22,y/22,SEED+5,3),mo=fbm(x/55,y/55,SEED+9,3);b=mt>.63?4:mo<.4?3:mo<.58?1:2;
if(b!=4&&(elev(x+1,y)<LANDT||elev(x-1,y)<LANDT||elev(x,y+1)<LANDT||elev(x,y-1)<LANDT))b=3;
for(const s of START){const d=Math.hypot(x-s[1],y-s[2]);if(d<4.6){const r=WV>1&&s[0]!='wood'?1.75+.5*vn(x/2.3,y/2.3,SEED+70):2.5*(.6+.8*vn(x/2.3,y/2.3,SEED+70));if(WV>1&&d<1.1||d<r&&hsh(x,y,SEED+3)<(d<r*.55?.97:WV>1?.5:.72))return[s[0]=='wood'?2:s[0]=='sand'?3:b,s[0]];return[b==0?1:b,null]}}
if(Math.max(Math.abs(x+.5),Math.abs(y+.5))<10)return[b,null];
const cx=Math.floor(x/OC),cy=Math.floor(y/OC),n=vn(x/3,y/3,SEED+60);
for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const D=depC(cx+i,cy+j);if(!D)continue;const d=Math.hypot(x-D.x,y-D.y);if(d<D.r*(.7+.6*n)&&hsh(x,y,SEED+77)<(d<D.r*.6?.95:.7))return[D.t=='sand'?3:b,D.t]}
const g=fbm(x/7,y/7,SEED+40,2),rd=hsh(x,y,SEED+41),RM=DIF[diff].r*(WV>1?.4:1);
if(b==2&&g>.6&&rd<.4*RM)return[b,'wood'];if(b==3&&g>.68&&rd<.3*RM)return[b,'sand'];if(b==4&&g>.72&&rd<.18*RM)return[b,'stone'];return[b,null]}
/* Cache des parcelles */
const CHK=new Map(),pk=(px,py)=>px*65536+py,tk=(x,y)=>x*65536+y;
/* Variantes d'épaves : nom, description, bouton */
const WRECK=[['Cargo éventré','Sa soute est éventrée, mais des caisses de pièces sont intactes. Une belle somme à la clé.','Récupérer la cargaison'],
['Vaisseau minier','Sa foreuse est intacte : une machine unique qui accélère de 50 % les extracteurs autour d’elle.','Récupérer la foreuse'],
['Réacteur échoué','Le cœur du réacteur bat encore : une machine unique de 40 MW, à poser où tu veux.','Récupérer le cœur'],
['Capsule de survie','Un kit de construction d’urgence : tes 6 prochaines machines seront gratuites.','Ouvrir la capsule'],
['Drone éclaireur','Ses cartes sont intactes : il t’offre une parcelle voisine gratuitement.','Télécharger les cartes']];
const POI={wreck:{n:'Épave de vaisseau',d:'Une carcasse encore chaude. Il reste sûrement des pièces de valeur à récupérer.',a:'Récupérer'},ruin:{n:'Ruines d’avant-poste',d:'Un ancien avant-poste abandonné. Des plans de recherche, ou même une machine des anciens, traînent peut-être encore.',a:'Fouiller'},art:{n:'Artefact inconnu',d:'Un cristal qui pulse doucement. Une relique unique : posée sur ton île, elle donne +5 % sur toutes tes ventes et commandes.',a:'Récolter'}};
function genChunk(px,py){const b=new Uint8Array(64),rv=new Uint8Array(64),r=new Array(64).fill(null),col=new Array(64);let land=0;
for(let j=0;j<CH;j++)for(let i=0;i<CH;i++){const x=px*CH+i,y=py*CH+j,t=tile(x,y),k=j*CH+i;b[k]=t[0];r[k]=t[1];rv[k]=t[2]?1:0;if(t[0])land++;const q=t[2]?[66,140,196]:BR[t[0]],jj=(hsh(x,y,7)-.5)*14;col[k]=`rgb(${q[0]+jj|0},${q[1]+jj|0},${q[2]+jj|0})`}
let poi=null;const start=px>=-1&&px<=0&&py>=-1&&py<=0;
if(land&&!start&&hsh(px,py,SEED+91)<.2){for(let k=0;k<24;k++){const i=hsh(px,py,SEED+92+k)*CH|0,j=hsh(px,py,SEED+120+k)*CH|0,q=j*CH+i;if(b[q]&&!r[q]){const h=hsh(px,py,SEED+93);poi={x:px*CH+i,y:py*CH+j,k:h<.5?'wreck':h<.78?'ruin':'art',v:hsh(px,py,SEED+94)*5|0};break}}}
return{b,r,rv,col,land,poi}}
function chunk(px,py){const k=pk(px,py);let c=CHK.get(k);if(!c){c=genChunk(px,py);CHK.set(k,c)}return c}
const Bi=(x,y)=>chunk(x>>3,y>>3).b[((y&7)<<3)|(x&7)];
const isRiver=(x,y)=>chunk(x>>3,y>>3).rv[((y&7)<<3)|(x&7)]==1;
const Rs=(x,y)=>chunk(x>>3,y>>3).r[((y&7)<<3)|(x&7)];
const land=c=>Bi(c[0],c[1])>0;
/* Parcelles possédées et points d'intérêt fouillés */
function fogDirty(k){if(typeof RBC=='undefined')return;const px=Math.round(k/65536),py=k-px*65536;for(const[l,rb]of[[1,16],[2,16],[4,8],[8,4]]){for(let by=Math.floor((py-1)*8/rb);by<=Math.floor(((py+1)*8+7)/rb);by++)for(let bx=Math.floor((px-1)*8/rb);bx<=Math.floor(((px+1)*8+7)/rb);bx++)RBC.delete(bx*1e6+by*10+l)}}
class OwnSet extends Set{add(v){const n=!this.has(v);super.add(v);if(n)fogDirty(v);return this}delete(v){const r=super.delete(v);if(r)fogDirty(v);return r}clear(){super.clear();if(typeof RBC!='undefined')RBC.clear()}}
const OWN=new OwnSet(),FOUND=new Set(),PLAT=new Set();
const owned=(x,y)=>OWN.has(pk(x>>3,y>>3));
function pstate(px,py){if(OWN.has(pk(px,py)))return 2;if(!chunk(px,py).land&&!(typeof U!='undefined'&&U.x.has('water')))return 0;return OWN.has(pk(px+1,py))||OWN.has(pk(px-1,py))||OWN.has(pk(px,py+1))||OWN.has(pk(px,py-1))?1:0}
function poiAt(x,y){const c=chunk(x>>3,y>>3);return c.poi&&c.poi.x==x&&c.poi.y==y&&!FOUND.has(tk(x,y))?c.poi:null}
const pPrice=(px,py)=>{const d=px==null?1:Math.max(Math.abs(px+.5),Math.abs(py+.5))-.5;return Math.round(90*Math.pow(1.22,Math.max(0,OWN.size-4))*(1+.18*d)*DIF[diff].p/10)*10};
function newWorld(){SEED=(Math.random()*1e9)|0;WV=2;if(typeof ZK!='undefined')for(const k in ZK)delete ZK[k];CHK.clear();DEP.clear();OWN.clear();FOUND.clear();PLAT.clear();for(const[a,b]of[[-1,-1],[0,-1],[-1,0],[0,0]])OWN.add(pk(a,b))}
