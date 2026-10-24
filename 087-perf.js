/* =====================================================================
   COMPTEUR DE PERFORMANCE (Options › Compteur de performance)
   Affiche chaque seconde : images/s, temps d'une image (moyen et pire),
   temps de dessin, temps de simulation, nombre de bâtiments, qualité.
   Toucher le compteur copie un rapport complet à envoyer au développeur.
   Coût quasi nul : quelques additions par image, l'affichage n'est mis
   à jour que 2 fois par seconde, et rien n'est mesuré quand il est masqué.
   ===================================================================== */
const PF={t0:0,n:0,draws:0,dtS:0,dtMax:0,drS:0,drMax:0,simS:0,simMax:0,ticks:0,jank:0,hist:[],tot:{fr:0,jank:0,t0:performance.now()},el:null};
const pfNow=()=>performance.now();
function pfSim(ms,n){if(!OPT.perf)return;PF.simS+=ms;PF.ticks+=n;if(n&&ms/n>PF.simMax)PF.simMax=ms/n}
function pfDraw(ms){if(!OPT.perf)return;PF.drS+=ms;PF.draws++;if(ms>PF.drMax)PF.drMax=ms}
function pfEl(){if(PF.el)return PF.el;const e=document.createElement('div');e.id='perf';
e.style.cssText="position:fixed;right:8px;top:calc(env(safe-area-inset-top,0px) + 112px);z-index:30;font:11px/1.35 'Share Tech Mono',ui-monospace,monospace;color:#e8e3d8;background:rgba(10,11,12,.78);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:6px 8px;white-space:pre;pointer-events:auto;min-width:112px";
e.onclick=pfCopy;document.body.appendChild(e);return PF.el=e}
function pfFrame(t,dt){if(!OPT.perf){if(PF.el){PF.el.remove();PF.el=null}return}
if(!PF.t0){PF.t0=t;return}PF.n++;PF.dtS+=dt;if(dt>PF.dtMax)PF.dtMax=dt;if(dt>50&&!document.hidden){PF.jank++;PF.tot.jank++}PF.tot.fr++;
if(t-PF.t0<500)return;const s=(t-PF.t0)/1000,r={fps:PF.n/s,dt:PF.dtS/Math.max(1,PF.n),dtMax:PF.dtMax,draw:PF.draws?PF.drS/PF.draws:0,drawMax:PF.drMax,sim:PF.ticks?PF.simS/PF.ticks:0,simMax:PF.simMax,tps:PF.ticks/s,jank:PF.jank,
nb:L.length,z:cam.z,spd,D,qs:OPT.qs||0,qm:OPT.qm||'auto',mem:((typeof RBC!='undefined'?RBC.px:0)+(typeof BLpx!='undefined'?BLpx:0))*4/1e6,jobs:(typeof RBJ!='undefined'?RBJ.size:0)+(typeof BLJ!='undefined'?BLJ.size:0),
heap:performance.memory?performance.memory.usedJSHeapSize/1e6:null,at:Math.round(gt/1000)};
PF.hist.push(r);if(PF.hist.length>40)PF.hist.shift();Object.assign(PF,{t0:t,n:0,draws:0,dtS:0,dtMax:0,drS:0,drMax:0,simS:0,simMax:0,ticks:0,jank:0});
const e=pfEl(),col=r.fps>=55?'#7dff6a':r.fps>=40?'#ffd34d':'#ff6259',f=x=>x.toFixed(1);
e.innerHTML=`<b style="color:${col};font-size:13px">${Math.round(r.fps)} FPS</b>\nimage  ${f(r.dt)} / ${Math.round(r.dtMax)} ms\ndessin ${f(r.draw)} / ${f(r.drawMax)} ms\nsimu   ${f(r.sim)} / ${f(r.simMax)} ms\nà-coups ${r.jank}  · ×${r.spd}\nbât. ${r.nb}  · Q${r.qs} ${r.D}x\ncache ${Math.round(r.mem)} Mo${r.heap?' · JS '+Math.round(r.heap)+' Mo':''}`}
function pfReport(){const v=(document.querySelector('script[src*="09-main"]')||{}).src||'',ver=(v.match(/v=([\d.]+)/)||[])[1]||'?',H=PF.hist,
avg=k=>H.length?H.reduce((a,r)=>a+r[k],0)/H.length:0,mx=k=>H.reduce((a,r)=>Math.max(a,r[k]),0),f=x=>(+x).toFixed(1),min=(PF.tot.fr&&(performance.now()-PF.tot.t0)/60000)||0;
const lines=['RAPPORT PERF ISLEWORKS','version '+ver+' · '+new Date().toISOString(),
'appareil: '+navigator.userAgent,'écran '+screen.width+'×'+screen.height+' · fenêtre '+innerWidth+'×'+innerHeight+' · DPR '+(devicePixelRatio||1)+' · rendu '+D+'x · coeurs '+(navigator.hardwareConcurrency||'?')+(navigator.deviceMemory?' · RAM '+navigator.deviceMemory+' Go':''),
'options: qualité '+(OPT.qm||'auto')+' palier '+(OPT.qs||0)+' · effets '+(OPT.fx?'oui':'non')+' · décors '+(OPT.deco?'oui':'non')+' · nuit '+(OPT.night?'oui':'non')+' · vitesse ×'+spd,
'partie: '+L.length+' bâtiments · '+OWN.size+' parcelles · zoom '+f(cam.z),
'',`moyenne ~${H.length/2|0} s : ${f(avg('fps'))} FPS · image ${f(avg('dt'))} ms (pire ${f(mx('dtMax'))}) · dessin ${f(avg('draw'))} ms (pire ${f(mx('drawMax'))}) · simu ${f(avg('sim'))} ms/étape (pire ${f(mx('simMax'))})`,
`à-coups (>50 ms) : ${PF.tot.jank} sur ${PF.tot.fr} images en ${f(min)} min`,'',
'détail (toutes les 0,5 s) : fps | image moy/pire | dessin moy/pire | simu moy/pire | bât | zoom | ×vit | cache Mo',
...H.slice(-24).map(r=>[Math.round(r.fps),f(r.dt)+'/'+Math.round(r.dtMax),f(r.draw)+'/'+f(r.drawMax),f(r.sim)+'/'+f(r.simMax),r.nb,f(r.z),'×'+r.spd,Math.round(r.mem)].join(' | '))];
return lines.join('\n')}
function pfCopy(){const t=pfReport(),ok=()=>{toast('Rapport copié : colle-le dans un message','ok');SFX.copy&&SFX.copy()};
try{navigator.clipboard.writeText(t).then(ok,()=>pfCopy2(t,ok))}catch(e){pfCopy2(t,ok)}}
function pfCopy2(t,ok){const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){toast('Copie impossible','bad')}a.remove()}
