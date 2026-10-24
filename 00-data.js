'use strict';
/* Tables indexées par nom de bâtiment : sans prototype, sinon « constructor » renvoie une fonction cachée */
let LANG=(()=>{try{const l=localStorage.getItem('isle-lang');if(l)return l}catch(e){}return(navigator.language||'fr').toLowerCase().startsWith('fr')?'fr':'en'})();const LOC=LANG=='fr'?'fr-FR':'en-US';
const nz=o=>Object.assign(Object.create(null),o);
/* =====================================================================
   DONNÉES DU JEU
   Objets : [nom, valeur de base, couleur, forme de l'icône]
   ===================================================================== */
const IT={
/* Matières premières */
fiber:['Fibre végétale',2,'#9bbf5a','powder'],paper:['Papier',4,'#f2ead9','plate'],water:['Eau',.5,'#4aa3df','bottle'],wood:['Bois',2,'#8b5a2b','log'],stone:['Pierre',2,'#9aa0a8','ore'],sand:['Sable',2,'#e2cf94','sand'],clay:['Argile',3,'#c9a891','ore'],limestone:['Calcaire',3,'#d8d2c0','ore'],
iron_ore:['Minerai de fer',3,'#7b8fa6','ore'],copper_ore:['Minerai de cuivre',3,'#d9824a','ore'],coal:['Charbon',4,'#2a2d33','ore'],quartz:['Quartz brut',8,'#e9e4ff','crystal'],
bauxite:['Bauxite',7,'#c8643c','ore'],sulfur:['Soufre',8,'#e8d23a','ore'],gold_ore:['Minerai d’or',12,'#f2c94c','ore'],oil:['Pétrole brut',10,'#2a2433','barrel'],titanium_ore:['Minerai de titane',14,'#8fa3b8','ore'],uranium_ore:['Minerai d’uranium',18,'#4fd65a','ore'],
/* Transformés */
iron_ingot:['Lingot de fer',8,'#b8c4d0','ingot'],copper_ingot:['Lingot de cuivre',8,'#f0a060','ingot'],gold_ingot:['Lingot d’or',40,'#ffd45c','ingot'],charcoal:['Charbon de bois',6,'#5d5d5d','ore'],
glass:['Verre',9,'#a8e6f0','glass'],brick:['Brique',8,'#b5523b','brick'],plank:['Planche',6,'#c08a52','plank'],lime:['Chaux',7,'#f1eee4','powder'],gravel:['Gravier',4,'#8d8f92','powder'],
silica:['Silice',14,'#f4f1ff','powder'],iron_dust:['Poudre de fer',5,'#8e9db0','powder'],copper_dust:['Poudre de cuivre',5,'#e09a6a','powder'],alumina:['Alumine',18,'#f3d9cf','powder'],concrete:['Béton',12,'#9b9b94','concrete'],
plate:['Plaque de fer',16,'#e3e9f0','plate'],rod:['Tige de fer',14,'#c9d3de','rod'],gear:['Engrenage',20,'#9fb0c4','gear'],screw:['Vis',12,'#c9d3de','screw'],wire:['Câble',13,'#ff9d4d','wire'],
copper_sheet:['Tôle de cuivre',18,'#e8955a','plate'],steel:['Acier',40,'#5d6b7c','ingot'],alu_ingot:['Lingot d’alu',45,'#d5dde6','ingot'],tglass:['Verre trempé',30,'#7fd3e6','glass'],
beam:['Poutre d’acier',60,'#5d6b7c','beam'],pipe:['Tuyau',30,'#7d8a9a','pipe'],quartz_crystal:['Cristal de quartz',30,'#d9ccff','crystal'],alu_sheet:['Tôle d’alu',60,'#e3e9f0','plate'],
plastic:['Plastique',35,'#4fb3e8','plate'],rubber:['Caoutchouc',32,'#34343a','plate'],fuel:['Carburant',40,'#e0802a','barrel'],acid:['Acide sulfurique',40,'#d7ef4a','bottle'],gunpowder:['Poudre noire',30,'#3a3530','powder'],bronze:['Lingot de bronze',30,'#c98b4a','ingot'],gold_wire:['Fil d’or',55,'#ffd45c','wire'],silicon:['Silicium pur',45,'#5b6fa8','silicon'],titanium:['Alliage de titane',110,'#c3cfdc','ingot'],uranium:['Uranium enrichi',160,'#7dff6a','uranium'],
/* Composants */
rplate:['Plaque renforcée',95,'#cfd8e3','rplate'],rotor:['Rotor',60,'#9fb0c4','rotor'],stator:['Stator',70,'#c9763a','stator'],motor:['Moteur',160,'#d65a5a','motor'],
circuit:['Circuit',90,'#3fbf6a','circuit'],cable_g:['Câble gainé',30,'#ff9d4d','coil'],frame:['Cadre modulaire',180,'#8a93a0','frame'],jewel:['Bijou',220,'#e05fd0','jewel'],
computer:['Ordinateur',280,'#6fe3ff','computer'],battery:['Batterie',75,'#2f9a63','battery'],explosive:['Explosif',120,'#c8321e','crate'],adv_circuit:['Circuit avancé',320,'#4f7cff','circuit'],heatsink:['Dissipateur',240,'#cfd8e3','heatsink'],fiber:['Fibre optique',150,'#79e3ff','coil'],e_motor:['Moteur électrique',380,'#4f9cff','motor'],solar:['Panneau solaire',420,'#2d5bd1','solar'],fuel_rod:['Barre de combustible',900,'#7dff6a','rod'],
/* Haute technologie */
heavy_frame:['Cadre lourd',650,'#5d6b7c','frame'],turbo:['Turbomoteur',700,'#d65a5a','turbo'],drone:['Drone',900,'#79e3ff','drone'],supercomp:['Superordinateur',1500,'#7b5cff','computer'],cpu:['Microprocesseur',1100,'#6b7a8f','cpu'],quantum:['Cristal quantique',8000,'#c58bff','quantum'],
engine:['Moteur à réaction',2500,'#ff7a3d','engine'],satellite:['Satellite',6000,'#e8edf3','satellite'],cargo:['Vaisseau de fret',15000,'#ffb470','cargo']};
/* Gisements : ressource posée sur la carte → objet extrait */
const RN={titanium:'titanium_ore',uranium:'uranium_ore',wood:'wood',stone:'stone',sand:'sand',clay:'clay',limestone:'limestone',iron:'iron_ore',copper:'copper_ore',coal:'coal',quartz:'quartz',bauxite:'bauxite',sulfur:'sulfur',gold:'gold_ore',oil:'oil'},RK=Object.keys(RN);
const RNAME={titanium:'Titane',uranium:'Uranium',wood:'Bois',stone:'Pierre',sand:'Sable',clay:'Argile',limestone:'Calcaire',iron:'Fer',copper:'Cuivre',coal:'Charbon',quartz:'Quartz',bauxite:'Bauxite',sulfur:'Soufre',gold:'Or',oil:'Pétrole'};
const RC={titanium:'#8fa3b8',uranium:'#3fbf4a',wood:'#2f6b34',stone:'#9aa0a8',sand:'#e2cf94',clay:'#c9a891',limestone:'#d8d2c0',iron:'#6f86a0',copper:'#d9763a',coal:'#23262b',quartz:'#cbbcff',bauxite:'#c8643c',sulfur:'#e8d23a',gold:'#f2c94c',oil:'#1d1a24'};
const SPK={titanium:'#e8f2ff',uranium:'#9dff7a',iron:'#a9c4e6',copper:'#f0925a',coal:'#7a808b',gold:'#ffe27a',stone:'#c4c9d0',clay:'#e8d3c3',limestone:'#fffaf0',quartz:'#ffffff',bauxite:'#ff9a6a',sulfur:'#fff27a'};
/* Recettes : machine, entrées, sortie, durée en ticks de 0,5 s */
const rc=(m,i,o,t,n)=>({m,in:i,out:o,t,n:n||1});
const R={
fiberg:rc('greenhouse',{},'fiber',6),woodg:rc('greenhouse',{},'wood',5),paper:rc('constructor',{fiber:2},'paper',3),rubberf:rc('chemlab',{fiber:2,sulfur:1},'rubber',6),
ironi:rc('smelter',{iron_ore:1},'iron_ingot',4),copi:rc('smelter',{copper_ore:1},'copper_ingot',4),charc:rc('smelter',{wood:1},'charcoal',4),brick:rc('smelter',{clay:1},'brick',4),
glass:rc('smelter',{sand:1},'glass',5),limei:rc('smelter',{limestone:1},'lime',4),goldi:rc('smelter',{gold_ore:1},'gold_ingot',6),
gravel:rc('crusher',{stone:1},'gravel',3),ironp:rc('crusher',{iron_ore:1},'iron_dust',4,2),copp:rc('crusher',{copper_ore:1},'copper_dust',4,2),idust:rc('smelter',{iron_dust:1},'iron_ingot',3),cdust:rc('smelter',{copper_dust:1},'copper_ingot',3),silica:rc('crusher',{quartz:1},'silica',4),alumina:rc('crusher',{bauxite:2},'alumina',5),
plate:rc('constructor',{iron_ingot:1},'plate',3),rod:rc('constructor',{iron_ingot:1},'rod',3),gear:rc('constructor',{iron_ingot:1},'gear',3),screw:rc('constructor',{rod:1},'screw',2),
wire:rc('constructor',{copper_ingot:1},'wire',3),csheet:rc('constructor',{copper_ingot:2},'copper_sheet',4),plank:rc('constructor',{wood:1},'plank',3),conc:rc('constructor',{gravel:3},'concrete',4),
beam:rc('constructor',{steel:1},'beam',4),pipe:rc('constructor',{steel:1},'pipe',4),qcrys:rc('constructor',{silica:2},'quartz_crystal',5),asheet:rc('constructor',{alu_ingot:1},'alu_sheet',4),
steel:rc('blast',{iron_ingot:2,coal:1},'steel',5),aluingot:rc('blast',{alumina:2,coal:1},'alu_ingot',6),tglass:rc('blast',{glass:2,lime:1},'tglass',5),bronze:rc('blast',{copper_ingot:2,iron_ingot:1},'bronze',5),goldw:rc('constructor',{gold_ingot:1},'gold_wire',4,2),
silicon:rc('arc',{quartz:2,coal:1},'silicon',5),titanium:rc('arc',{titanium_ore:2,steel:1},'titanium',7),uranium:rc('centrifuge',{uranium_ore:5},'uranium',10),
advc:rc('assembler',{circuit:2,plastic:2,gold_wire:1},'adv_circuit',10),heatsink:rc('assembler',{alu_ingot:3,copper_sheet:2},'heatsink',8),fiber:rc('assembler',{glass:2,plastic:1},'fiber',6),
emotor:rc('assembler',{rotor:1,circuit:1,steel:2},'e_motor',9),solar:rc('assembler',{silicon:2,glass:2,alu_sheet:1},'solar',9),fuelrod:rc('assembler',{uranium:1,pipe:2},'fuel_rod',10),
cpu:rc('cleanroom',{adv_circuit:2,silicon:2,gold_wire:1},'cpu',14),quantum:rc('cleanroom',{quartz_crystal:1,cpu:2,uranium:1},'quantum',20),
plastic:rc('refinery',{oil:2},'plastic',5),rubber:rc('refinery',{oil:2},'rubber',5),fuel:rc('refinery',{oil:1},'fuel',4),
acid:rc('chemlab',{sulfur:2,glass:1},'acid',6),gunpow:rc('chemlab',{sulfur:1,charcoal:2},'gunpowder',5),battery:rc('chemlab',{copper_ingot:2,acid:1},'battery',7),
rplate:rc('assembler',{plate:2,screw:4},'rplate',6),rotor:rc('assembler',{rod:2,screw:4},'rotor',6),stator:rc('assembler',{pipe:1,wire:4},'stator',7),motor:rc('assembler',{rotor:1,stator:1},'motor',8),
circuit:rc('assembler',{plate:1,wire:3},'circuit',6),frame:rc('assembler',{rplate:2,rod:4},'frame',9),jewel:rc('assembler',{gold_ingot:1,glass:1},'jewel',8),cableg:rc('assembler',{wire:2,rubber:1},'cable_g',4),
computer:rc('assembler',{circuit:2,plastic:2},'computer',9),explosive:rc('assembler',{gunpowder:2,plastic:1},'explosive',8),
hframe:rc('manufacturer',{frame:2,beam:4,concrete:5},'heavy_frame',12),turbo:rc('manufacturer',{motor:2,computer:1,cable_g:4},'turbo',12),drone:rc('manufacturer',{motor:2,computer:1,alu_sheet:2},'drone',14),
supercomp:rc('manufacturer',{computer:2,quartz_crystal:4,cable_g:6},'supercomp',16),engine:rc('manufacturer',{turbo:2,alu_sheet:6,fuel:4},'engine',18),
satellite:rc('manufacturer',{supercomp:1,heavy_frame:2,battery:4},'satellite',22),cargo:rc('manufacturer',{engine:2,satellite:1,heavy_frame:4},'cargo',30)};
/* Bâtiments. rt = cadence d'extraction (ticks par objet), m = type de machine de production */
const BD=nz({conveyor:{n:'Tapis',cost:5,d:'120 objets/min, 3 par case. Glisse le doigt pour tracer.'},split2:{n:'Répartiteur double',cost:20,d:'Partage la ligne en deux : à gauche et à droite.'},splitter:{n:'Répartiteur triple',cost:25,d:'Partage la ligne en trois : devant, à gauche et à droite.'},osplit:{n:'Répartiteur prioritaire',cost:40,d:'Tout droit en priorité ; le surplus part sur les côtés.'},bridge:{n:'Pont',cost:30,d:'Tapis qui traverse l’eau, sans plateforme.'},platform:{n:'Plateforme',cost:80,d:'Fondation posée sur l’eau : on peut construire dessus.',plat:1},
belt2:{n:'Tapis rapide',cost:20,d:'Deux fois plus rapide : 240 objets/min.'},belt3:{n:'Tapis express',cost:40,d:'Trois fois plus rapide : 360 objets/min.'},sorter:{n:'Trieur',cost:120,d:'L’objet choisi sort à gauche, le reste tout droit.'},tunnel:{n:'Tunnel',cost:60,d:'Passe sous 1 à 4 cases jusqu’au tunnel suivant dans le même sens.'},crossing:{n:'Croisement',cost:50,d:'Deux lignes se croisent sans se mélanger.'},
silo:{n:'Silo',cost:100,d:'Stocke 100 objets et les ressort.',cap:100},crate:{n:'Conteneur',cost:300,d:'Stocke 500 objets et les ressort.',cap:500},beacon:{n:'Balise de surcharge',cost:1500,d:'+25 % de vitesse aux machines autour (3×3).'},sink:{n:'Broyeur',cost:200,d:'Détruit tout : 50 % de la valeur, sans faire baisser les prix.'},
ext1:{n:'Extracteur Mk1',cost:40,d:'Lent : 30 objets/min.',rt:4,c:'#c89b3c'},ext2:{n:'Extracteur Mk2',cost:150,d:'60 objets/min.',rt:2,c:'#6fb7e8'},ext3:{n:'Extracteur Mk3',cost:500,d:'120 objets/min.',rt:1,c:'#c77dff'},
pump:{n:'Pompe à pétrole',cost:400,d:'Se pose sur une nappe de pétrole.',rt:3,c:'#e0802a',oil:1},
smelter:{n:'Fonderie',cost:80,m:'smelter',d:'Fond minerais, sable, argile et calcaire.'},crusher:{n:'Concasseur',cost:140,m:'crusher',d:'Broie pierre, quartz et bauxite.'},
blast:{n:'Haut-fourneau',cost:400,m:'blast',d:'Alliages à deux entrées : acier, alu.',sz:2},refinery:{n:'Raffinerie',cost:900,m:'refinery',d:'Pétrole → plastique, caoutchouc, carburant.',sz:2},
constructor:{n:'Constructeur',cost:120,m:'constructor',d:'1 entrée → 1 pièce.'},assembler:{n:'Assembleuse',cost:240,m:'assembler',d:'2 ou 3 entrées → 1 produit. Consomme 6 MW.',sz:2},
arc:{n:'Four à arc',cost:3000,m:'arc',d:'Silicium et titane.',sz:2},centrifuge:{n:'Centrifugeuse',cost:5000,m:'centrifuge',d:'Enrichit l’uranium.',sz:2},cleanroom:{n:'Salle blanche',cost:8000,m:'cleanroom',d:'Microprocesseurs et cristaux quantiques.',sz:2},
chemlab:{n:'Labo chimique',cost:1200,m:'chemlab',d:'Acide, poudre noire, batteries.',sz:2},manufacturer:{n:'Manufacture',cost:2500,m:'manufacturer',d:'Jusqu’à 3 entrées : la haute technologie.',sz:3},
seller:{n:'Terminal de vente',cost:30,d:'Vend au prix du marché. 2 maximum.'},wind:{n:'Éolienne',cost:120,d:'Gratuit, sans câble : 10 à 20 MW selon le relief et le vent. Espace-les.'},dam:{n:'Barrage',cost:240,d:'Sur une rivière. Barre-la d’une rive à l’autre : 40 MW par tronçon.'},
gen_bio:{n:'Chaudière à biomasse',cost:250,d:'Brûle bois, planches ou charbon de bois : 15 MW.'},gen_coal:{n:'Centrale à charbon',cost:600,d:'Brûle du charbon : 45 MW.',sz:2},solarp:{n:'Champ solaire',cost:900,d:'12 MW gratuits le jour, rien la nuit.'},gen_fuel:{n:'Centrale au carburant',cost:2500,d:'Brûle du carburant : 150 MW.',sz:2},reactor:{n:'Réacteur nucléaire',cost:12000,d:'Barres de combustible : 1 000 MW.',sz:3},
greenhouse:{n:'Serre',cost:500,m:'greenhouse',d:'Fait pousser du bois ou de la fibre, sans gisement. Consomme 4 MW.',sz:2},
recycler:{n:'Recycleur',cost:600,d:'Démonte un objet fabriqué et rend la moitié de ses ingrédients.'},
accu:{n:'Batterie de stockage',cost:450,d:'Garde le surplus d’énergie et le rend quand il en manque (40 MW au plus).'},
wpump:{n:'Pompe à eau',cost:150,d:'Au bord de l’eau ou sur une rivière : 60 eaux par minute.'},
gen_steam:{n:'Centrale à vapeur',cost:900,d:'Charbon + eau → 70 MW. Bien plus puissante qu’une centrale à charbon.',sz:2},
dronest:{n:'Station de drones',cost:1200,d:'En mode Envoi, ses drones portent les objets reçus à la station Réception la plus proche, sans tapis.'},
pad:{n:'Pad de livraison',cost:60,d:'Vend tout ce qu’on lui apporte. Des vaisseaux y passent aussi des commandes, payées bien plus cher, sans limite de temps.'},
rcore:{n:'Cœur de réacteur',cost:0,inv:1,sz:2,d:'Machine unique : 40 MW gratuits, sans carburant ni câble.'},
xdrill:{n:'Foreuse ancienne',cost:0,inv:1,d:'Machine unique : les extracteurs à 2 cases ou moins vont 50 % plus vite.'},
orbital:{n:'Panneau orbital',cost:0,inv:1,d:'Machine unique : 25 MW jour et nuit, sans rien consommer.'},
cryo:{n:'Radiateur cryogénique',cost:0,inv:1,d:'Machine unique : les centrales à 2 cases ou moins produisent 30 % de plus.'},
golden:{n:'Presse dorée',cost:0,inv:1,d:'Machine unique : les terminaux de vente à 2 cases ou moins vendent 20 % plus cher.'},
antenna:{n:'Antenne des anciens',cost:0,inv:1,d:'Machine unique : les machines de production à 2 cases ou moins vont 30 % plus vite.'},
statue:{n:'Statue du fondateur',cost:0,inv:1,d:'Machine unique : toutes les recherches coûtent 15 % de moins tant qu’elle est posée.'},
clock:{n:'Horloge des anciens',cost:0,inv:1,d:'Machine unique : toutes tes machines de production vont 8 % plus vite.'},
well:{n:'Puits fossile',cost:0,inv:1,d:'Machine unique : produit 30 pétroles bruts par minute, posé n’importe où.'},
vault:{n:'Coffre des anciens',cost:0,inv:1,d:'Machine unique : chaque minute, ton argent rapporte 0,4 % d’intérêts (2 000 $ au plus).'},
beltmotor:{n:'Moteur de tapis',cost:0,inv:1,d:'Machine unique : les tapis à 3 cases ou moins vont 50 % plus vite.'},
relic:{n:'Relique',cost:0,inv:1,d:'Machine unique : +5 % sur toutes tes ventes et commandes tant qu’elle est posée.'}});
const CATS=nz({Extraction:['ext1','ext2','ext3','pump','greenhouse','wpump'],Transformation:['smelter','crusher','blast','refinery','arc','centrifuge','recycler'],Fabrication:['constructor','assembler','chemlab','manufacturer','cleanroom','beacon'],Logistique:['conveyor','belt2','belt3','bridge','platform','split2','splitter','osplit','sorter','tunnel','crossing','silo','crate','dronest'],Vente:['seller','pad','sink'],Trouvailles:['rcore','xdrill','relic','orbital','cryo','golden','antenna','statue','clock','well','vault','beltmotor'],Énergie:['wind','dam','gen_bio','gen_coal','solarp','gen_fuel','reactor','gen_steam','accu']});
const ORD=['conveyor','ext1','smelter','constructor','seller','pad','splitter','crusher','ext2','assembler','blast','silo','ext3','pump','refinery','chemlab','manufacturer','belt2','belt3','sorter','tunnel','crossing','crate','sink','arc','centrifuge','cleanroom','beacon','bridge','platform','wind','dam','gen_bio','gen_coal','solarp','gen_fuel','reactor'],NX=nz({ext1:'ext2',ext2:'ext3'});
/* Économie : les matières premières ne valent presque rien ; la valeur d'un objet est calculée
   à partir de ses ingrédients (×1,35) plus un bonus de temps de fabrication.
   Vendre du brut ne rapporte rien : il faut monter des chaînes longues pour gagner gros. */
{const RAWV={water:.5,wood:1,stone:1,sand:1,clay:1.5,limestone:1.5,iron_ore:2,copper_ore:2,coal:2,quartz:4,bauxite:4,sulfur:4,gold_ore:8,oil:5,titanium_ore:8,uranium_ore:10},V={};for(const k in RAWV)V[k]=RAWV[k];
for(let pass=0;pass<12;pass++)for(const id in R){const r=R[id];let s=0,ok=true;for(const i in r.in){if(V[i]==null){ok=false;break}s+=V[i]*r.in[i]}if(!ok)continue;const v=(s*1.35+r.t*.3)/r.n;if(V[r.out]==null||v<V[r.out])V[r.out]=v}
for(const k in IT)if(V[k]!=null)IT[k][1]=V[k]<10?Math.round(V[k]*10)/10:Math.round(V[k])}
/* Économie : les machines coûtent bien plus cher, les tapis un peu plus */
for(const k in BD)BD[k].cost=Math.round(BD[k].cost*(['conveyor','belt2','belt3','bridge'].includes(k)?1.6:2.5)/5)*5;
const LVS=[1,1.5,2],MACH=Object.keys(BD).filter(k=>BD[k].m);
/* Recherches */
const tn=(id,n,cost,req,o)=>Object.assign({id,n,cost,req},o);
const T=[
tn('logi','Logistique',100,[],{b:['split2','splitter','silo'],d:'Répartiteur et silo.'}),
tn('forge','Façonnage',150,[],{b:['constructor'],r:['plate','rod','gear'],d:'Constructeur : plaques, tiges, engrenages.'}),
tn('mason','Maçonnerie',200,[],{r:['brick','plank'],d:'Briques d’argile et planches.'}),
tn('glassn','Verrerie',250,['mason'],{r:['glass'],d:'Fondre le sable en verre.'}),
tn('cable','Câblerie',150,['forge'],{r:['wire','csheet'],d:'Câbles et tôles de cuivre.'}),
tn('crush','Concassage',300,['forge'],{b:['crusher'],r:['gravel'],d:'Concasseur : la pierre devient gravier.'}),
tn('screws','Visserie',220,['forge'],{r:['screw'],d:'Des vis à partir des tiges.'}),
tn('mk2','Extracteur Mk2',300,['forge'],{b:['ext2'],d:'Récolte deux fois plus vite.'}),
tn('bridge','Ponts et plateformes',600,['logi'],{b:['bridge','platform'],x:'water',d:'Traverse l’eau et achète les parcelles marines.'}),
tn('tunnel','Tunnels',250,['logi'],{b:['tunnel'],d:'Fais passer une ligne sous les autres.'}),
tn('cross','Croisements',250,['logi'],{b:['crossing'],d:'Deux lignes se croisent sans se mélanger.'}),
tn('sink','Broyeur',400,['logi'],{b:['sink'],d:'Écoule les surplus sans casser les prix.'}),
tn('enrich','Enrichissement',700,['crush'],{r:['ironp','copp','idust','cdust'],d:'Concasse le minerai en 2 poudres : double rendement !'}),
tn('mkt','Contrats commerciaux',800,['logi'],{x:'mkt',d:'+10 % sur les prix, le marché récupère plus vite.'}),
tn('lime','Chaux et béton',450,['crush','mason'],{r:['limei','conc'],d:'Chaux de calcaire, béton de gravier.'}),
tn('asm','Assemblage',450,['cable','screws'],{b:['assembler'],r:['rplate','rotor'],d:'Assembleuse : plaques renforcées et rotors.'}),
tn('green','Agronomie',900,['elec'],{b:['greenhouse'],r:['fiberg','woodg','paper','rubberf'],d:'Serre : bois et fibre sans gisement, papier.'}),
tn('recyc','Recyclage',1400,['sink'],{b:['recycler'],d:'Recycleur : démonte les surplus en ingrédients.'}),
tn('accu','Stockage d’énergie',1600,['elec'],{b:['accu'],d:'Batteries : le surplus du jour sert la nuit.'}),
tn('steam','Vapeur',1300,['elec'],{b:['wpump','gen_steam'],d:'Pompe à eau et centrale à vapeur (70 MW).'}),
tn('dronelog','Logistique par drones',5000,['comp'],{b:['dronest'],d:'Stations de drones : transport sans tapis.'}),
tn('belt3','Tapis express',3200,['belt2','steelw'],{b:['belt3'],d:'Tapis trois fois plus rapides (360/min).'}),
tn('belt2','Tapis rapides',700,['asm'],{b:['belt2'],d:'Tapis deux fois plus rapides (240/min).'}),
tn('sorter','Tri intelligent',900,['asm','logi'],{b:['sorter','osplit'],d:'Trieur et répartiteur prioritaire.'}),
tn('crate','Conteneurs',800,['logi','blast'],{b:['crate'],d:'Stockage de 500 objets.'}),
tn('circ','Électronique',900,['asm'],{r:['circuit'],d:'Circuits imprimés.'}),
tn('elec','Électricité',500,['cable'],{b:['wind','gen_bio','gen_coal'],d:'Éoliennes et centrales : les machines avancées ont besoin de courant.'}),
tn('hydro','Hydroélectricité',900,['elec'],{b:['dam'],d:'Barrages : bloque une rivière pour produire 40 MW par tronçon.'}),
tn('blast','Haut-fourneau',800,['asm','elec'],{b:['blast'],r:['steel'],d:'Alliages à deux entrées : l’acier.'}),
tn('quartz','Quartz',1300,['crush','glassn'],{r:['silica','qcrys'],d:'Silice et cristaux de quartz.'}),
tn('gold','Orfèvrerie',1500,['mk2','glassn'],{r:['goldi','jewel','goldw'],x:'gold',d:'Or, bijoux et fil d’or.'}),
tn('steelw','Aciérie',1000,['blast'],{r:['beam','pipe'],d:'Poutres et tuyaux d’acier.'}),
tn('bronze','Bronze',1100,['blast','cable'],{r:['bronze'],d:'Alliage cuivre et fer.'}),
tn('tglass','Verre trempé',1200,['blast','lime'],{r:['tglass'],d:'Verre renforcé à la chaux.'}),
tn('over1','Surcadençage I',2000,['asm'],{x:'lv2',d:'Les machines de production passent au niveau 2 (×1,5).'}),
tn('mk3','Extracteur Mk3',1800,['mk2','blast'],{b:['ext3'],d:'Récolte quatre fois plus vite.'}),
tn('stator','Électromagnétisme',1400,['steelw','circ'],{r:['stator','motor'],d:'Stators et moteurs.'}),
tn('frame','Structures modulaires',2000,['steelw','asm'],{r:['frame'],d:'Cadres modulaires.'}),
tn('alu','Aluminium',2500,['blast','crush'],{r:['alumina','aluingot','asheet'],d:'De la bauxite aux tôles d’alu.'}),
tn('oil','Pétrochimie',2500,['steelw'],{b:['pump','refinery'],r:['plastic','rubber','fuel'],d:'Pompe et raffinerie.'}),
tn('chem','Chimie',3000,['oil','quartz'],{b:['chemlab'],r:['acid','gunpow'],d:'Labo chimique : acide et poudre noire.'}),
tn('comp','Informatique',3500,['circ','oil'],{r:['computer','cableg'],d:'Ordinateurs et câbles gainés.'}),
tn('batt','Batteries',3500,['chem'],{r:['battery'],d:'Batteries à l’acide.'}),
tn('explo','Explosifs',5000,['chem','oil'],{r:['explosive'],d:'Explosifs industriels.'}),
tn('beacon','Balises de surcharge',4000,['over1','circ'],{b:['beacon'],d:'+25 % de vitesse aux machines voisines.'}),
tn('heat','Dissipateurs',3000,['alu','cable'],{r:['heatsink'],d:'Refroidissement en aluminium.'}),
tn('arc','Four à arc',4500,['alu','quartz'],{b:['arc'],r:['silicon'],d:'Silicium pur.'}),
tn('titan','Titane',7000,['arc','mk3'],{r:['titanium'],x:'titan',d:'Extraction (Mk3) et alliage de titane.'}),
tn('advc','Circuits avancés',6000,['comp','gold'],{r:['advc','fiber'],d:'Circuits avancés et fibre optique.'}),
tn('emotor','Moteurs électriques',5000,['stator','circ'],{r:['emotor'],d:'Moteurs électriques.'}),
tn('solar','Photovoltaïque',7000,['arc','alu'],{r:['solar'],b:['solarp'],d:'Panneaux et champs solaires.'}),
tn('fuelgen','Turbines à carburant',4000,['oil','elec'],{b:['gen_fuel'],d:'Centrale au carburant : 150 MW.'}),
tn('clean','Salle blanche',12000,['advc','arc'],{b:['cleanroom'],r:['cpu'],d:'Microprocesseurs.'}),
tn('nuke','Nucléaire',15000,['chem','titan'],{b:['centrifuge','reactor'],r:['uranium','fuelrod'],x:'uran',d:'Uranium enrichi et barres de combustible.'}),
tn('quantum','Physique quantique',40000,['clean','nuke'],{r:['quantum'],d:'Cristaux quantiques.'}),
tn('over2','Surcadençage II',6000,['over1','comp'],{x:'lv3',d:'Les machines de production passent au niveau 3 (×2).'}),
tn('manuf','Manufacture',6000,['comp','frame'],{b:['manufacturer'],r:['hframe','turbo'],d:'Cadres lourds et turbomoteurs.'}),
tn('drone','Robotique',9000,['manuf','alu'],{r:['drone'],d:'Drones.'}),
tn('super','Supercalcul',12000,['manuf','quartz'],{r:['supercomp'],d:'Superordinateurs.'}),
tn('jet','Propulsion',18000,['drone'],{r:['engine'],d:'Moteurs à réaction.'}),
tn('sat','Orbite',30000,['super','jet','batt'],{r:['satellite'],d:'Satellites.'}),
tn('cargo','Vaisseau de fret',60000,['sat'],{r:['cargo'],d:'Le chef-d’œuvre de ton île.'})];
/* Énergie : consommation des machines avancées (MW) et production des centrales.
   Les machines de base restent mécaniques et ne consomment rien. */
const PWR=nz({greenhouse:4,assembler:6,ext3:12,pump:14,blast:20,refinery:30,arc:45,centrifuge:60,cleanroom:80,manufacturer:70,chemlab:24,beacon:10});
const GEN=nz({gen_steam:{mw:70,f:{coal:8,charcoal:6},water:1},wind:{mw:11,wind:1},dam:{mw:40,dam:1},gen_bio:{mw:15,f:{wood:4,plank:6,charcoal:8}},gen_coal:{mw:45,f:{coal:8,charcoal:6}},solarp:{mw:12,sun:1},gen_fuel:{mw:150,f:{fuel:12}},reactor:{mw:1000,f:{fuel_rod:240}}});
for(const t of T)t.cost=Math.round(t.cost*1.5/10)*10;
const LED={g:'#4ade80',y:'#facc15',r:'#ef4444'},LT={g:'Opérationnel',y:'En attente',r:'Bloqué'};
