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
/* DIAGNOSTIC (bouton ▶ du compteur) : 4 phases de 2,5 s pour savoir qui limite les images/s.
   normal → sans dessin (si ça reste bas : limite du téléphone/navigateur)
   → résolution 1× (si ça monte : la carte graphique sature) → sans bâtiments. */
const PFX={skip:false,nob:false};const PFD=[['normal','normal'],['nodraw','sans dessin'],['lowres','résolution 1×'],['nob','sans bâtiments']];
function pfDiagStart(e){if(e)e.stopPropagation();if(PF.diag)return;PF.diag={i:0,t0:performance.now(),n:0,s:0,res:[],dm:DMAX};PF.diagRes=null;toast('Diagnostic : ne touche à rien pendant 10 s')}
function pfDiagStep(t,dt){const g=PF.diag;if(!g)return;const el=t-g.t0;if(el>500){g.n++;g.s+=dt}
if(el<2500)return;g.res.push([PFD[g.i][1],g.n*1000/Math.max(1,g.s),g.s/Math.max(1,g.n)]);g.i++;g.t0=t;g.n=0;g.s=0;
PFX.skip=false;PFX.nob=false;if(DMAX!==g.dm){DMAX=g.dm;resize()}
if(g.i>=PFD.length){PF.diagRes=g.res;PF.diag=null;PF.diagT=t;toast('Diagnostic terminé : touche le compteur pour copier le rapport','ok');return}
const k=PFD[g.i][0];if(k=='nodraw')PFX.skip=true;else if(k=='lowres'){DMAX=1;resize()}else if(k=='nob')PFX.nob=true}
function pfSim(ms,n){if(!OPT.perf)return;PF.simS+=ms;PF.ticks+=n;if(n&&ms/n>PF.simMax)PF.simMax=ms/n}
function pfDraw(ms){if(!OPT.perf)return;PF.drS+=ms;PF.draws++;if(ms>PF.drMax)PF.drMax=ms}
function pfEl(){if(PF.el)return PF.el;const e=document.createElement('div');e.id='perf';
e.style.cssText="position:fixed;right:8px;top:calc(env(safe-area-inset-top,0px) + 112px);z-index:30;font:11px/1.35 'Share Tech Mono',ui-monospace,monospace;color:#e8e3d8;background:rgba(10,11,12,.78);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:6px 8px;white-space:pre;pointer-events:auto;min-width:112px";
e.onclick=pfCopy;e.innerHTML='<span id="pft"></span><button id="pfd" style="display:block;margin-top:5px;width:100%;font:inherit;color:#ffd34d;background:#2a2620;border:1px solid #ffd34d55;border-radius:6px;padding:4px 0">▶ Diagnostic 10 s</button>';document.body.appendChild(e);e.querySelector('#pfd').onclick=pfDiagStart;return PF.el=e}
function pfFrame(t,dt){if(!OPT.perf){if(PF.el){PF.el.remove();PF.el=null}return}pfDiagStep(t,dt);
if(!PF.t0){PF.t0=t;return}PF.n++;PF.dtS+=dt;if(dt>PF.dtMax)PF.dtMax=dt;if(dt>50&&!document.hidden){PF.jank++;PF.tot.jank++}PF.tot.fr++;
if(t-PF.t0<500)return;const s=(t-PF.t0)/1000,r={fps:PF.n/s,dt:PF.dtS/Math.max(1,PF.n),dtMax:PF.dtMax,draw:PF.draws?PF.drS/PF.draws:0,drawMax:PF.drMax,sim:PF.ticks?PF.simS/PF.ticks:0,simMax:PF.simMax,tps:PF.ticks/s,jank:PF.jank,
nb:L.length,z:cam.z,spd,D,qs:OPT.qs||0,qm:OPT.qm||'auto',mem:((typeof RBC!='undefined'?RBC.px:0)+(typeof BLpx!='undefined'?BLpx:0))*4/1e6,jobs:(typeof RBJ!='undefined'?RBJ.size:0)+(typeof BLJ!='undefined'?BLJ.size:0),
heap:performance.memory?performance.memory.usedJSHeapSize/1e6:null,at:Math.round(gt/1000)};
PF.hist.push(r);if(PF.hist.length>40)PF.hist.shift();Object.assign(PF,{t0:t,n:0,draws:0,dtS:0,dtMax:0,drS:0,drMax:0,simS:0,simMax:0,ticks:0,jank:0});
const e=pfEl(),col=r.fps>=55?'#7dff6a':r.fps>=40?'#ffd34d':'#ff6259',f=x=>x.toFixed(1);
const dg=PF.diag?`\n<b style="color:#ffd34d">diagnostic ${PF.diag.i+1}/${PFD.length} : ${PFD[PF.diag.i][1]}</b>`:PF.diagRes&&t-PF.diagT<20000?'\n<b style="color:#ffd34d">'+PF.diagRes.map(r=>r[0]+' '+Math.round(r[1])).join('\n')+'</b>':'';
e.querySelector('#pft').innerHTML=`<b style="color:${col};font-size:13px">${Math.round(r.fps)} FPS</b>\nimage  ${f(r.dt)} / ${Math.round(r.dtMax)} ms\ndessin ${f(r.draw)} / ${f(r.drawMax)} ms\nsimu   ${f(r.sim)} / ${f(r.simMax)} ms\nà-coups ${r.jank}  · ×${r.spd}\nbât. ${r.nb}  · Q${r.qs} ${r.D}x\ncache ${Math.round(r.mem)} Mo${r.heap?' · JS '+Math.round(r.heap)+' Mo':''}${dg}`}
function pfReport(){const v=(document.querySelector('script[src*="09-main"]')||{}).src||'',ver=(v.match(/v=([\d.]+)/)||[])[1]||'?',H=PF.hist,
avg=k=>H.length?H.reduce((a,r)=>a+r[k],0)/H.length:0,mx=k=>H.reduce((a,r)=>Math.max(a,r[k]),0),f=x=>(+x).toFixed(1),min=(PF.tot.fr&&(performance.now()-PF.tot.t0)/60000)||0;
const lines=['RAPPORT PERF ISLEWORKS','version '+ver+' · '+new Date().toISOString(),
'appareil: '+navigator.userAgent,'écran '+screen.width+'×'+screen.height+' · fenêtre '+innerWidth+'×'+innerHeight+' · DPR '+(devicePixelRatio||1)+' · rendu '+D+'x · coeurs '+(navigator.hardwareConcurrency||'?')+(navigator.deviceMemory?' · RAM '+navigator.deviceMemory+' Go':''),
'options: qualité '+(OPT.qm||'auto')+' palier '+(OPT.qs||0)+' · effets '+(OPT.fx?'oui':'non')+' · décors '+(OPT.deco?'oui':'non')+' · nuit '+(OPT.night?'oui':'non')+' · vitesse ×'+spd,
'partie: '+L.length+' bâtiments · '+OWN.size+' parcelles · zoom '+f(cam.z),
'',`moyenne ~${H.length/2|0} s : ${f(avg('fps'))} FPS · image ${f(avg('dt'))} ms (pire ${f(mx('dtMax'))}) · dessin ${f(avg('draw'))} ms (pire ${f(mx('drawMax'))}) · simu ${f(avg('sim'))} ms/étape (pire ${f(mx('simMax'))})`,
`à-coups (>50 ms) : ${PF.tot.jank} sur ${PF.tot.fr} images en ${f(min)} min`,
(PF.diagRes?'diagnostic : '+PF.diagRes.map(r=>r[0]+' '+Math.round(r[1])+' FPS ('+f(r[2])+' ms)').join(' · '):'diagnostic : pas encore lancé'),'',
'détail (toutes les 0,5 s) : fps | image moy/pire | dessin moy/pire | simu moy/pire | bât | zoom | ×vit | cache Mo',
...H.slice(-24).map(r=>[Math.round(r.fps),f(r.dt)+'/'+Math.round(r.dtMax),f(r.draw)+'/'+f(r.drawMax),f(r.sim)+'/'+f(r.simMax),r.nb,f(r.z),'×'+r.spd,Math.round(r.mem)].join(' | '))];
return lines.join('\n')}
function pfCopy(){const t=pfReport(),ok=()=>{toast('Rapport copié : colle-le dans un message','ok');SFX.copy&&SFX.copy()};
try{navigator.clipboard.writeText(t).then(ok,()=>pfCopy2(t,ok))}catch(e){pfCopy2(t,ok)}}
function pfCopy2(t,ok){const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){toast('Copie impossible','bad')}a.remove()}
