/* =====================================================================
   RIVET, LA MASCOTTE
   Un petit robot de chantier qui sert de tutoriel : il présente chaque
   objectif et donne un conseil la première fois qu'une situation arrive.
   ===================================================================== */
const RIVET=`<svg viewBox="0 0 80 84" class="rvs"><ellipse cx="40" cy="80" rx="20" ry="3.5" fill="#0006"/>
<line x1="40" y1="14" x2="40" y2="4" stroke="#8b93a1" stroke-width="3"/><circle class="rva" cx="40" cy="4" r="4" fill="#ff9442"/>
<rect x="14" y="14" width="52" height="40" rx="14" fill="#e8dcc2" stroke="#2b2620" stroke-width="2.5"/><rect x="20" y="20" width="40" height="27" rx="10" fill="#14171c"/>
<g class="rve"><circle cx="40" cy="33" r="9" fill="#79e3ff"/><circle cx="40" cy="33" r="4.5" fill="#0b2a36"/><circle cx="43" cy="30" r="2" fill="#fff"/></g>
<rect x="22" y="56" width="36" height="18" rx="6" fill="#ff9442" stroke="#2b2620" stroke-width="2.5"/><rect x="22" y="62" width="36" height="5" fill="#2b2620"/>
<path d="M26 62 l4 -6 M34 62 l4 -6 M42 62 l4 -6 M50 62 l4 -6" stroke="#ffd34d" stroke-width="2.5"/>
<path class="rvw" d="M58 60 q12 -4 14 -16" stroke="#2b2620" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M22 60 q-10 4 -10 12" stroke="#2b2620" stroke-width="5" fill="none" stroke-linecap="round"/>
<rect x="26" y="74" width="9" height="6" rx="2" fill="#2b2620"/><rect x="45" y="74" width="9" height="6" rx="2" fill="#2b2620"/></svg>`;
const seenTips=new Set();let mascQ=[],mascT=null,mascLeft=0;
/* le compte à rebours ne tourne que si Rivet est à l'écran (pas caché derrière un menu, pas en pause) */
setInterval(()=>{const m=$('masc');if(!m.classList.contains('on')||sheet||menu||document.hidden)return;mascLeft-=250;if(mascLeft<=0){if(mascQ.length)mascNext();else mascHide()}},250);
function rivet(text,key){if(!OPT.tips||menu||!text)return;if(key){if(seenTips.has(key))return;seenTips.add(key)}if(mascQ.includes(text)||MH[MH.length-1]==text)return;mascQ.push(text);if(!$('masc').classList.contains('on')){mi=MH.length-1;mascNext()}else{$('masc').querySelector('.mn').textContent=(mi+1)+' / '+(MH.length+mascQ.length)}}
/* Historique des messages : on peut revenir en arrière, rien ne se saute par accident */
const MH=[];let mi=-1;
function mascShow(i){const m=$('masc');mi=i;m.querySelector('.mt').textContent=MH[i];m.querySelector('.mn').textContent=(i+1)+' / '+(MH.length+mascQ.length);
m.querySelector('[data-r=prev]').disabled=i<=0;const last=i>=MH.length-1&&!mascQ.length;m.querySelector('[data-r=next]').innerHTML=last?svg('check'):svg('next');
m.classList.remove('on');void m.offsetWidth;m.classList.add('on');posToast();mascLeft=Math.min(22000,9000+MH[i].length*70)}
function mascNext(){if(mi<MH.length-1){mascShow(mi+1);return}const t=mascQ.shift();if(!t){$('masc').classList.remove('on');posToast();return}MH.push(t);if(MH.length>30){MH.shift()}SFX.tab();mascShow(MH.length-1)}
function mascHide(){$('masc').classList.remove('on');posToast()}
function rivetAgain(t){if(!t||menu)return;const i=MH.lastIndexOf(t);if(i>=0)mascShow(i);else{MH.push(t);mascShow(MH.length-1)}}
$('masc').querySelector('.mav').innerHTML=RIVET;
$('masc').querySelector('[data-r=prev]').innerHTML=svg('prev');$('masc').querySelector('[data-r=x]').innerHTML=svg('x');
$('masc').addEventListener('click',e=>{const r=e.target.closest('[data-r]');if(!r){mascLeft+=4000;return}e.stopPropagation();SFX.tab();
if(r.dataset.r=='prev'&&mi>0)mascShow(mi-1);else if(r.dataset.r=='next')mascNext();else if(r.dataset.r=='x'){mascQ.length=0;mascHide()}});
$('masc').querySelector('.mav').onclick=()=>{if(Q[qi])rivetAgain(Q[qi].h)};
/* Conseils déclenchés par des situations */
function tipsTick(){if(!OPT.tips||menu)return;
if(CT.length)rivet('Un vaisseau attend une commande ! Amène-lui ce qu’il demande sur le pad : c’est bien plus rentable que la vente.','ship');
if(GRID.on&&GRID.r<.99&&GRID.use>0)rivet('Il manque du courant ! Ajoute des éoliennes, un barrage ou une centrale.','power');
if(Object.keys(sold).some(k=>sold[k]>15&&m[k]<.55))rivet('Les prix chutent quand tu vends trop d’un même objet. Fabrique des pièces plus complexes ou livre les vaisseaux !','mkt');
if(nightK()>.2)rivet('La nuit tombe : les panneaux solaires s’arrêtent, mais tes usines s’illuminent.','night');
if(L.some(b=>BD[b.t].m&&!b.rec))rivet('Une machine sans recette ne fait rien : touche-la et choisis ce qu’elle fabrique.','norec');
if(OWN.size>=6)rivet('Plus tu t’éloignes, plus les gisements sont rares et précieux. La Carte t’aide à les repérer.','far')}
