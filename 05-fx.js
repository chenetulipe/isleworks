/* ================= SON ================= */
/* Moteur audio synthétisé : bus maître compressé, réverbération générée, bruit filtré, cloches et gamme pentatonique */
let lcoin=0,lbump=0,MRECT=null;addEventListener('resize',()=>MRECT=null);
let AC=null,MS=null,RV=null,NB=null,AMB=null,muted=localStorage.getItem('ficsit-mute')=='1',lsell=0,combo=0,lcombo=0,beltN=0,lbelt=0,lz=0;
function au(){if(!AC){try{const AX=window.AudioContext||window.webkitAudioContext;try{AC=new AX({latencyHint:'playback'})}catch(e){AC=new AX()}const cp=AC.createDynamicsCompressor();cp.threshold.value=-14;cp.knee.value=12;cp.ratio.value=6;cp.attack.value=.004;cp.release.value=.2;cp.connect(AC.destination);
MS=AC.createGain();MS.gain.value=muted?0:.9;MS.connect(cp);
const len=AC.sampleRate*1.1|0,ir=AC.createBuffer(2,len,AC.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}
RV=AC.createConvolver();RV.buffer=ir;const rg=AC.createGain();rg.gain.value=.22;RV.connect(rg);rg.connect(MS);
NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const nd=NB.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1}catch(e){AC=null}}
if(AC&&AC.state=='suspended')AC.resume();return AC}
const sOK=()=>AC&&MS&&!muted;
function env(g,t,a,d,v){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}
let sfxV=0;const sfxHold=d=>{sfxV++;setTimeout(()=>sfxV--,(d+.15)*1000)};
function O(f,d,o){o=o||{};if(!sOK()||sfxV>16)return;sfxHold(d+(o.w||0));const t=AC.currentTime+(o.w||0),os=AC.createOscillator(),g=AC.createGain();os.type=o.t||'sine';os.frequency.setValueAtTime(f,t);if(o.s)os.frequency.exponentialRampToValueAtTime(o.s,t+(o.sd||d));
let n=os;if(o.lp){const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(o.lp,t);fl.Q.value=o.q||.8;os.connect(fl);n=fl}
n.connect(g);env(g,t,o.a||.005,d,o.v||.06);g.connect(MS);if(o.r){const sg=AC.createGain();sg.gain.value=o.r;g.connect(sg);sg.connect(RV)}os.start(t);os.stop(t+(o.a||.005)+d+.05)}
function N(d,o){o=o||{};if(!sOK()||sfxV>16)return;sfxHold(d+(o.w||0));const t=AC.currentTime+(o.w||0),src=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();src.buffer=NB;src.loop=true;f.type=o.ft||'bandpass';f.frequency.setValueAtTime(o.f||1000,t);if(o.fs)f.frequency.exponentialRampToValueAtTime(o.fs,t+d);f.Q.value=o.q||1;
src.connect(f);f.connect(g);env(g,t,o.a||.003,d,o.v||.05);g.connect(MS);if(o.r){const sg=AC.createGain();sg.gain.value=o.r;g.connect(sg);sg.connect(RV)}src.start(t,Math.random()*.5);src.stop(t+(o.a||.003)+d+.05)}
function bell(f,d,v,w,r){O(f,d,{v,w,r:r==null?.4:r});O(f*2.76,d*.5,{v:v*.3,w,r:.3});O(f*5.4,d*.22,{v:v*.1,w})}
function tone(f,d,type,v,when,slide){O(f,d,{t:type,v:v||.05,w:when,s:slide})}
const PENTA=[0,2,4,7,9],nt=i=>261.63*Math.pow(2,(12*Math.floor(i/5)+PENTA[((i%5)+5)%5])/12);
const SFX={
ui:()=>{O(1500+Math.random()*250,.03,{t:'triangle',v:.022});N(.018,{f:3800,q:2,v:.018})},
key:()=>{O(150,.08,{v:.06,s:85});N(.035,{f:1700,q:1.4,v:.04})},
open:()=>{N(.22,{f:380,fs:2600,q:.8,v:.032,a:.05});O(520,.14,{t:'triangle',v:.018,w:.05,s:800})},
close:()=>N(.17,{f:2300,fs:330,q:.8,v:.028,a:.02}),
tab:()=>{O(1150,.025,{t:'square',v:.01,lp:3000});O(1700,.035,{t:'triangle',v:.018,w:.03})},
place:()=>{O(110,.18,{v:.12,s:52});N(.06,{f:900,q:.7,v:.06});O(420,.25,{t:'triangle',v:.028,w:.02,r:.35});O(1180,.18,{v:.01,w:.02,r:.3})},
belt:()=>{const n=performance.now();if(n-lbelt>700)beltN=0;lbelt=n;O(nt(10+Math.min(beltN++,14)),.05,{t:'triangle',v:.024});N(.014,{f:5000,q:3,v:.014})},
rot:()=>{for(let i=0;i<3;i++){N(.012,{f:4200,q:4,v:.03,w:i*.035});O(900+i*130,.015,{t:'square',v:.008,w:i*.035,lp:2500})}},
del:()=>{N(.35,{ft:'lowpass',f:2400,fs:200,q:.7,v:.09,a:.01});O(90,.25,{v:.09,s:45});for(let i=0;i<4;i++)O(600+Math.random()*900,.06,{t:'square',v:.01,w:.03+i*.045,lp:3000})},
/* en accéléré : moins souvent, plus doux, et la note ne monte plus sans fin */
sell:()=>{const n=performance.now(),k=typeof spd=='number'?spd:1;if(n-lsell<(k>1?150*k:110))return;if(n-lcombo>1600)combo=0;lsell=n;lcombo=n;const i=12+Math.min(combo++,k>1?3:12);bell(nt(i),.35,k>1?.018:.032,0,.35);if(k==1&&combo%8==0)bell(nt(i+5),.55,.028,.08)},
coin:()=>{const n=performance.now(),k=typeof spd=='number'?spd:1;if(n-lcoin<(k>1?120*k:45))return;lcoin=n;O(2600+Math.random()*500,.02,{t:'triangle',v:k>1?.005:.009})},
err:()=>{O(196,.12,{t:'triangle',v:.06,lp:900});O(147,.18,{t:'triangle',v:.06,w:.09,lp:700})},
quest:()=>{N(.08,{ft:'lowpass',f:600,v:.12});O(80,.12,{v:.12,s:48});[0,2,4,7].forEach((k,i)=>bell(nt(12+k),.6,.042,.12+i*.09,.5));O(nt(19)/2,.9,{t:'triangle',v:.026,w:.12,r:.4})},
res:()=>{[0,4,7,9,12].forEach((k,i)=>bell(nt(10+k),.9,.032,i*.06,.6));N(.9,{f:6000,fs:12000,q:.5,v:.014,a:.2,r:.5})},
charge:p=>O(220+p*700,.07,{t:'sawtooth',v:.012,lp:500+p*3200}),
buy:()=>{O(65,.8,{v:.1,a:.08,s:98});[0,4,7,12].forEach((k,i)=>O(nt(5+k),1.1,{t:'triangle',v:.028,a:.05,w:.1+i*.05,r:.6}));N(.6,{f:300,fs:3000,q:.6,v:.018,a:.2,r:.4})},
wreck:()=>{for(let i=0;i<6;i++)O(300+Math.random()*1400,.12,{t:'square',v:.016,w:i*.07,lp:2500,r:.3});N(.3,{ft:'lowpass',f:1200,v:.06})},
ruin:()=>{N(.7,{ft:'lowpass',f:500,fs:120,v:.1,a:.02});bell(nt(14),1.2,.038,.25,.7);bell(nt(18),1.2,.028,.4,.7)},
art:()=>{for(let i=0;i<10;i++)bell(nt(10+i),.5,.022,i*.045,.6);O(nt(5),1.6,{v:.035,a:.3,r:.8})},
ship:()=>{N(1.6,{f:200,fs:900,q:.6,v:.045,a:.5});O(180,1.4,{t:'sawtooth',v:.011,lp:500,s:120,a:.3});O(nt(17),.12,{t:'square',v:.018,w:1.3,lp:3000});O(nt(19),.12,{t:'square',v:.018,w:1.45,lp:3000})},
shipOk:()=>{[0,4,7,12].forEach((k,i)=>bell(nt(14+k),.5,.042,i*.08,.5));N(1.2,{f:900,fs:200,q:.6,v:.035,a:.1,w:.3})},
shipKo:()=>{O(nt(9),.35,{t:'triangle',v:.045});O(nt(6),.6,{t:'triangle',v:.045,w:.25});N(1,{f:600,fs:150,q:.6,v:.025,w:.2})},
up:()=>{bell(nt(12),.3,.04,0);bell(nt(19),.4,.04,.08);O(300,.35,{t:'sawtooth',v:.014,lp:2000,s:900})},
copy:()=>{O(nt(17),.05,{t:'square',v:.016,lp:3000});O(nt(19),.06,{t:'square',v:.016,lp:3000,w:.06})},
pause:()=>O(400,.35,{t:'sawtooth',v:.02,lp:1200,s:60}),play:()=>O(80,.3,{t:'sawtooth',v:.02,lp:1200,s:400}),
speed:n=>{for(let i=0;i<n;i++)O(nt(12+i*2),.05,{t:'square',v:.015,w:i*.06,lp:3500})},
radOpen:()=>{O(300,.12,{t:'triangle',v:.032,s:900});N(.08,{f:2000,q:1,v:.018})},
radHover:i=>O(nt(8+i),.03,{t:'triangle',v:.018}),
radPick:()=>{O(nt(15),.06,{t:'triangle',v:.035});O(nt(19),.1,{t:'triangle',v:.035,w:.05})},
newsUp:()=>{O(nt(14),.12,{t:'triangle',v:.026});O(nt(17),.2,{t:'triangle',v:.026,w:.1})},
newsDn:()=>{O(nt(14),.12,{t:'triangle',v:.026});O(nt(11),.25,{t:'triangle',v:.026,w:.1})},
start:()=>{N(1.2,{f:150,fs:4000,q:.7,v:.045,a:.6});[0,4,7,12,16].forEach((k,i)=>O(nt(5+k),1.6,{t:'triangle',v:.026,a:.1,w:.5+i*.07,r:.7}))},
zoom:()=>{const n=performance.now();if(n-lz<90)return;lz=n;N(.02,{f:6000,q:4,v:.01})}};
/* =====================================================================
   MUSIQUES GÉNÉRATIVES
   4 morceaux synthétisés en direct, qui ne se répètent jamais à l'identique :
   Lo-fi (chill), Brume (ambient), Néon (synthwave), Café (jazz).
   En mode « Auto », on change de morceau toutes les 24 mesures.
   ===================================================================== */
const TRACKS=[
{id:'lofi',n:'Lo-fi',bpm:72,cb:1,ch:[[57,60,64,67],[53,57,60,64],[48,52,55,59],[55,59,62,65]],pad:['triangle',850,.03],bass:'root',mel:.3,sc:[0,3,5,7,10,12,15],root:69,dr:'lofi'},
{id:'brume',n:'Brume',bpm:56,cb:2,ch:[[50,54,57,61,64],[47,50,54,57,61],[43,47,50,54,57],[45,49,52,57,59]],pad:['sine',1300,.034],bass:'long',mel:.12,sc:[0,2,4,7,9,12,14],root:74,dr:'none',bell:1},
{id:'neon',n:'Néon',bpm:96,cb:1,ch:[[52,55,59],[48,52,55],[55,59,62],[50,54,57]],pad:['sawtooth',650,.016],bass:'pulse',mel:.1,sc:[0,3,5,7,10,12],root:64,dr:'synth',arp:1},
{id:'cafe',n:'Café',bpm:84,cb:1,ch:[[50,53,57,60,64],[43,53,57,59,64],[48,52,55,59,62],[45,49,55,58,61]],pad:['triangle',1100,.022],bass:'walk',mel:.22,sc:[0,2,3,5,7,9,10,12],root:62,dr:'jazz',swing:.17}];
let MUS=null,musStep=0,trk=0,trkBars=0;const mf=n=>440*Math.pow(2,(n-69)/12);
/* Les morceaux sont désormais PRÉ-ENREGISTRÉS (fichiers mus-lofi.mp3, mus-brume.mp3, mus-neon.mp3,
   mus-cafe.mp3 : 24 mesures qui bouclent sans coupure, rendus avec le séquenceur d’origine).
   Plus aucun synthétiseur ne tourne pendant le jeu : beaucoup moins de calcul et de saccades.
   Un seul morceau décodé en mémoire à la fois (plus le suivant pendant un fondu). */
const MBUF=Object.create(null),MLOAD=Object.create(null);let mNow=null,mWant='',mNext=null,mEnded=false;
function musVol(){if(MUS)MUS.gain.setTargetAtTime(OPT.music&&!muted?(menu?.45:.55):0,AC.currentTime,1.5)}
function pickTrack(){const want=OPT.track||'auto';if(want!='auto'){const i=TRACKS.findIndex(t=>t.id==want);if(i>=0)trk=i;return}trk=(trk+1+(Math.random()*(TRACKS.length-1)|0))%TRACKS.length}
const musAuto=()=>(OPT.track||'auto')=='auto'&&!menu,musId=()=>menu?'brume':TRACKS[trk].id;
function musBuf(id){if(MBUF[id])return Promise.resolve(MBUF[id]);if(MLOAD[id])return MLOAD[id];
return MLOAD[id]=fetch('mus-'+id+'.mp3').then(r=>{if(!r.ok)throw new Error('mus');return r.arrayBuffer()}).then(ab=>new Promise((res,rej)=>AC.decodeAudioData(ab,res,rej))).then(b=>{delete MLOAD[id];MBUF[id]=b;
for(const k in MBUF)if(k!=id&&k!=(mNow&&mNow.id))delete MBUF[k];return b}).catch(e=>{delete MLOAD[id];throw e})}
function musPlay(id,buf){const t=AC.currentTime+.05,g=AC.createGain(),s=AC.createBufferSource();s.buffer=buf;s.loop=!musAuto();s.connect(g);g.connect(MUS);
g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+(mNow?2:.5));
if(mNow){const o=mNow;o.s.onended=null;o.g.gain.cancelScheduledValues(t);o.g.gain.setValueAtTime(o.g.gain.value,t);o.g.gain.linearRampToValueAtTime(0,t+2);try{o.s.stop(t+2.1)}catch(e){}}
const cur={id,s,g,t0:t,dur:buf.duration};s.onended=()=>{if(mNow===cur){mNow=null;mEnded=true}};s.start(t);mNow=cur}
function musStop(){if(!mNow)return;try{mNow.s.onended=null;mNow.s.stop(AC.currentTime+1.8)}catch(e){}mNow=null}
function musWatch(){if(!MUS||!AC)return;if(!(OPT.music&&!muted)){musStop();mNext=null;return}
if(mEnded){mEnded=false;if(musAuto())pickTrack()}
if(mNow&&mNow.id==musId()){mNow.s.loop=!musAuto();
/* mode Auto : on prépare le morceau suivant et on enchaîne en fondu juste avant la fin */
if(musAuto()){const rem=mNow.t0+mNow.dur-AC.currentTime;if(rem<15&&!mNext){const k=trk;pickTrack();mNext=TRACKS[trk].id;trk=k;musBuf(mNext).catch(()=>{mNext=null})}
if(rem<2.5&&mNext&&MBUF[mNext]){trk=TRACKS.findIndex(t=>t.id==mNext);const id=mNext;mNext=null;musPlay(id,MBUF[id])}}return}
const want=musId();if(mWant==want)return;mWant=want;mNext=null;
musBuf(want).then(b=>{mWant='';if(musId()==want&&OPT.music&&!muted&&!(mNow&&mNow.id==want))musPlay(want,b)}).catch(()=>{mWant=''})}
function musicStart(){if(!AC||!MS||MUS)return;MUS=AC.createGain();MUS.gain.value=0;MUS.connect(MS);
trk=Math.random()*TRACKS.length|0;if(OPT.track&&OPT.track!='auto')pickTrack();setInterval(musWatch,400);musWatch();musVol()}
/* Ambiance : ressac de l’océan + bourdonnement proportionnel aux machines actives */
function ambStart(){if(!AC||!MS||AMB)return;const src=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(),lfo=AC.createOscillator(),lg=AC.createGain();src.buffer=NB;src.loop=true;f.type='lowpass';f.frequency.value=420;g.gain.value=.016;lfo.frequency.value=.11;lg.gain.value=.011;lfo.connect(lg);lg.connect(g.gain);src.connect(f);f.connect(g);g.connect(MS);src.start();lfo.start();
const hum=AC.createOscillator(),hf=AC.createBiquadFilter(),hg=AC.createGain();hum.type='sawtooth';hum.frequency.value=55;hf.type='lowpass';hf.frequency.value=170;hg.gain.value=0;hum.connect(hf);hf.connect(hg);hg.connect(MS);hum.start();AMB={g,hg}}
function ambTick(){if(!AMB)return;let n=0;for(const b of L)if(b.busy)n++;const t=AC.currentTime;AMB.hg.gain.setTargetAtTime(menu?0:Math.min(.018,n*.0014),t,.6);AMB.g.gain.setTargetAtTime(menu?0:.016,t,.6)}
$('snd').onclick=()=>{muted=!muted;localStorage.setItem('ficsit-mute',muted?'1':'0');au();if(MS)MS.gain.setTargetAtTime(muted?0:.9,AC.currentTime,.05);musVol();if(!muted)SFX.radPick();ui()};
document.addEventListener('pointerdown',e=>{if(e.target.closest('#dock button,[data-hold]'))return;if(e.target.closest('button,.pc,.rcp,.hx'))SFX.ui()},true);

/* ================= PARTICULES ================= */
const PT=[],SP=[];let fxAcc=0;
function burst(x,y,col,n){if(!OPT.fx)return;for(let i=0;i<n;i++){const a=Math.random()*6.283,v=30+Math.random()*60;PT.push({x:x*TS+16,y:y*TS+16,vx:Math.cos(a)*v,vy:Math.sin(a)*v-20,g:80,l:0,m:.5+Math.random()*.3,c:col,r:2+Math.random()*2})}}
function scr(wx,wy){return[(wx-cam.x)*cam.z+innerWidth/2,(wy-cam.y)*cam.z+innerHeight/2]}
function coin(b,n){const r=MRECT||(MRECT=$('money').getBoundingClientRect()),[x,y]=scr(b.x*TS+16,b.y*TS+16);if(x<-40||y<-40||x>innerWidth+40||y>innerHeight+40)return;
for(let i=0;i<(n||1);i++)SP.push({k:'coin',x0:x+(Math.random()-.5)*20,y0:y,cx:x+(Math.random()-.5)*120,cy:Math.min(y,r.bottom)-80-Math.random()*60,x1:r.left+r.width*.3,y1:r.top+r.height/2,l:-i*.06,m:.75})}
function onSale(t){SFX.sell();if(!t.lc||time-t.lc>300){t.lc=time;coin(t)}}
function confetti(){const r=$('qp').getBoundingClientRect();for(let i=0;i<40;i++){const a=Math.random()*Math.PI,v=150+Math.random()*250;SP.push({k:'cf',x:r.left+Math.random()*r.width,y:r.bottom,vx:Math.cos(a)*v*(Math.random()<.5?-1:1),vy:-Math.sin(a)*v*.5,l:0,m:1.4,c:['#FA9549','#4ade80','#facc15','#6fe3ff','#e05fd0'][i%5],r:Math.random()*6.28})}}
function fxStep(dt){const s=dt/1000;
for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.l+=s;if(p.l>p.m){PT.splice(i,1);continue}p.x+=p.vx*s;p.y+=p.vy*s;p.vy+=(p.g||0)*s;if(p.grow)p.r+=p.grow*s}
for(let i=SP.length-1;i>=0;i--){const p=SP[i];p.l+=s;if(p.l>p.m){if(p.k=='coin'){SFX.coin();/* petit rebond du compteur, sans forcer le navigateur à recalculer la page */if(time-lbump>220){lbump=time;const e=$('money');if(e.animate)e.animate([{transform:'none'},{transform:'scale(1.08)',filter:'brightness(1.4)'},{transform:'none'}],{duration:250})}}SP.splice(i,1);continue}if(p.k=='cf'){p.x+=p.vx*s;p.y+=p.vy*s;p.vy+=500*s;p.r+=s*8}}
if(menu||paused||!OPT.fx)return;fxAcc+=dt;if(fxAcc<140)return;fxAcc=0;if(PT.length>260)return;
const vw=innerWidth/cam.z/2+40,vh=innerHeight/cam.z/2+40;
for(const b of L){if(!b.busy||Math.abs(b.x*TS-cam.x)>vw||Math.abs(b.y*TS-cam.y)>vh)continue;
if((b.t=='smelter'||b.t=='blast'||b.t=='refinery')&&Math.random()<.45)PT.push({x:b.x*TS+(b.t=='refinery'?10:23)+Math.random()*3,y:b.y*TS+4,vx:(Math.random()-.5)*6,vy:-14-Math.random()*8,l:0,m:1.6,c:'rgba(160,160,170,.35)',r:2.5,grow:4});
else if((b.t=='constructor'||b.t=='assembler'||b.t=='manufacturer'||b.t=='crusher')&&Math.random()<.35)for(let k=0;k<2;k++){const a=Math.random()*6.283;PT.push({x:b.x*TS+16,y:b.y*TS+16,vx:Math.cos(a)*50,vy:Math.sin(a)*50-30,g:120,l:0,m:.35,c:'#ffcf6b',r:1.4})}}}
function drawPT(){for(const p of PT){cx.globalAlpha=Math.max(0,1-p.l/p.m);cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill()}cx.globalAlpha=1}
function drawSP(){if(!SP.length)return;cx.setTransform(D,0,0,D,0,0);for(const p of SP){if(p.l<0)continue;const t=p.l/p.m;
if(p.k=='coin'){const e=t*t,u=1-e,x=u*u*p.x0+2*u*e*p.cx+e*e*p.x1,y=u*u*p.y0+2*u*e*p.cy+e*e*p.y1;cx.fillStyle='#ffd45c';cx.beginPath();cx.arc(x,y,7,0,7);cx.fill();cx.strokeStyle='#b8860b';cx.lineWidth=1.5;cx.stroke();cx.fillStyle='#8a5a00';cx.font='700 10px Rajdhani,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('$',x,y+1)}
else{cx.save();cx.globalAlpha=Math.max(0,1-t);cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-4,-2,8,4);cx.restore()}}}
function drawBA(b){if(b.born&&time-b.born<420){const k=(time-b.born)/420,s=1+.35*(1-k)*Math.cos(k*11),px=b.x*TS+16,py=b.y*TS+16;cx.save();cx.translate(px,py);cx.scale(s,s);cx.translate(-px,-py);drawB(b);cx.restore()}else drawB(b)}

