/* Isleworks : mise en cache pour un lancement instantané et le jeu hors ligne.
   À CHAQUE MISE À JOUR DU JEU : changer VERSION ci-dessous et le ?v= dans index.html
   (le script version.py le fait pour toi), sinon les joueurs gardent l'ancienne version. */
const VERSION='isleworks-3.0.1';
const FILES=["./", "index.html", "manifest.webmanifest", "style.css?v=3.0.1", "00-data.js?v=3.0.1", "01-world.js?v=3.0.1", "02-sim.js?v=3.0.1", "03-icons.js?v=3.0.1", "04-render.js?v=3.0.1", "05-fx.js?v=3.0.1", "06-ui.js?v=3.0.1", "07-quests.js?v=3.0.1", "076-mascot.js?v=3.0.1", "08-input.js?v=3.0.1", "085-i18n.js?v=3.0.1", "088-save.js?v=3.0.1", "09-main.js?v=3.0.1", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
  /* la page : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne */
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(VERSION).then(k=>k.put(r,c));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));return}
  /* le reste (scripts, style, polices, icônes) : cache d'abord, réseau sinon */
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const c=res.clone();caches.open(VERSION).then(k=>k.put(r,c))}return res})))});
