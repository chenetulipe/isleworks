/* =====================================================================
   MOTEUR D'AFFICHAGE WEBGL
   Le jeu dessine toujours avec les mêmes instructions que Canvas 2D
   (drawImage, fillRect, translate, rotate…), mais celles qui coûtent
   cher (images et rectangles : terrain, bâtiments, objets, nuit) partent
   directement à la carte graphique via WebGL, regroupées en gros lots.
   Les formes vectorielles plus rares (traits, cercles, textes, barres)
   sont dessinées sur un calque Canvas 2D transparent posé au-dessus.

   Calques :  #gl (WebGL, dessous)  +  #c (Canvas 2D, dessus, reçoit le toucher)
   Repli automatique sur l'ancien affichage si WebGL est indisponible,
   ou via Options › « Ancien affichage ».
   ===================================================================== */
const GLR=(()=>{
  if(OPT.oldr)return null;
  const glc=document.createElement('canvas');glc.id='gl';
  glc.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none';
  let gl=null;
  try{gl=glc.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'high-performance'})||glc.getContext('experimental-webgl',{alpha:false,antialias:false})}catch(e){gl=null}
  if(!gl)return null;
  cv.parentNode.insertBefore(glc,cv);
  cv.style.background='transparent';

  /* ---------- shaders : une seule paire, pour images et couleurs unies ---------- */
  const VS='attribute vec2 p;attribute vec2 u;attribute vec4 c;uniform vec2 r;varying vec2 vu;varying vec4 vc;void main(){gl_Position=vec4(p.x/r.x*2.0-1.0,1.0-p.y/r.y*2.0,0.0,1.0);vu=u;vc=c;}';
  const FS='precision mediump float;uniform sampler2D t;varying vec2 vu;varying vec4 vc;void main(){gl_FragColor=texture2D(t,vu)*vc;}';
  const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return null;
  gl.useProgram(pr);
  const aP=gl.getAttribLocation(pr,'p'),aU=gl.getAttribLocation(pr,'u'),aC=gl.getAttribLocation(pr,'c'),uR=gl.getUniformLocation(pr,'r');

  /* ---------- tampon de sommets : jusqu'à 4096 rectangles par lot ---------- */
  const MAXQ=4096,FL=8,vb=new Float32Array(MAXQ*4*FL);let nq=0;
  const vbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,vb.byteLength,gl.DYNAMIC_DRAW);
  const ib=new Uint16Array(MAXQ*6);for(let i=0,v=0;i<ib.length;i+=6,v+=4){ib[i]=v;ib[i+1]=v+1;ib[i+2]=v+2;ib[i+3]=v;ib[i+4]=v+2;ib[i+5]=v+3}
  const ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ib,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aP);gl.enableVertexAttribArray(aU);gl.enableVertexAttribArray(aC);
  gl.vertexAttribPointer(aP,2,gl.FLOAT,false,FL*4,0);gl.vertexAttribPointer(aU,2,gl.FLOAT,false,FL*4,8);gl.vertexAttribPointer(aC,4,gl.FLOAT,false,FL*4,16);
  gl.enable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);

  /* ---------- textures ----------
     Petites images (bâtiments, objets, halos…) : rangées ensemble dans de grandes « planches » 2048×2048,
     pour que des centaines de dessins partent en un seul lot à la carte graphique.
     Grandes images (blocs de terrain, zones de bâtiments) : une texture chacune, libérée quand elle ne sert plus. */
  const TX=new Map(),AM=new Map(),AT=[],AW=2048,AMAX=200;let frameN=0,curTex=null,curAdd=false;
  const newTex=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t};
  const WU=2/AW;/* centre de la petite zone blanche en haut à gauche de chaque planche */
  function newPage(){flush();const t=newTex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,AW,AW,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,4,4,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(64).fill(255));curTex=null;const pg={t,x:6,y:0,rh:6};AT.push(pg);return pg}
  function atlasReset(){flush();for(const pg of AT)gl.deleteTexture(pg.t);AT.length=0;AM.clear();curTex=null;newPage()}
  newPage();
  const white={t:AT[0].t};
  function atlasOf(src){const v=src._glv||0;let e=AM.get(src);if(e&&e.v===v&&e.w===src.width&&e.h===src.height)return e;
    const w=src.width,h=src.height;let pg=AT[AT.length-1];
    if(pg.x+w+2>AW){pg.x=0;pg.y+=pg.rh;pg.rh=0}
    if(pg.y+h+2>AW){if(AT.length>=6){atlasReset()}pg=newPage();pg.y=6;pg.x=0;pg.rh=0}
    flush();gl.bindTexture(gl.TEXTURE_2D,pg.t);curTex=null;try{gl.texSubImage2D(gl.TEXTURE_2D,0,pg.x+1,pg.y+1,gl.RGBA,gl.UNSIGNED_BYTE,src)}catch(err){}
    e={t:pg.t,v,w,h,u0:(pg.x+1)/AW,v0:(pg.y+1)/AW,u1:(pg.x+1+w)/AW,v1:(pg.y+1+h)/AW};AM.set(src,e);pg.x+=w+2;pg.rh=Math.max(pg.rh,h+2);return e}
  function texOf(src){let e=TX.get(src);const v=src._glv||0,w=src.width,h=src.height;
    if(e&&e.v===v&&e.w===w&&e.h===h){e.f=frameN;return e.t}
    flush();if(!e){e={t:newTex(),v,w,h,f:frameN};TX.set(src,e)}else{e.v=v;e.w=w;e.h=h;e.f=frameN}
    gl.bindTexture(gl.TEXTURE_2D,e.t);try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src)}catch(err){}curTex=null;return e.t}
  /* textures de grandes images inutilisées depuis 3 s : libérées */
  function gcTex(){for(const[k,e]of TX)if(frameN-e.f>180){gl.deleteTexture(e.t);TX.delete(k)}}
  const isAtlas=t=>{for(const pg of AT)if(pg.t===t)return true;return false};

  function flush(){if(!nq)return;gl.bufferSubData(gl.ARRAY_BUFFER,0,vb.subarray(0,nq*4*FL));gl.drawElements(gl.TRIANGLES,nq*6,gl.UNSIGNED_SHORT,0);nq=0}
  function use(t,add){if(t!==curTex||add!==curAdd||nq>=MAXQ){flush();if(t!==curTex){gl.bindTexture(gl.TEXTURE_2D,t);curTex=t}if(add!==curAdd){curAdd=add;add?gl.blendFunc(gl.ONE,gl.ONE):gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)}}}
  function quad(m,x,y,w,h,u0,v0,u1,v1,r,g,b,a){let o=nq*4*FL;nq++;const A=m[0],B=m[1],C=m[2],D_=m[3],E=m[4],F=m[5],x1=x+w,y1=y+h;
    vb[o]=A*x+C*y+E;vb[o+1]=B*x+D_*y+F;vb[o+2]=u0;vb[o+3]=v0;vb[o+4]=r;vb[o+5]=g;vb[o+6]=b;vb[o+7]=a;o+=8;
    vb[o]=A*x1+C*y+E;vb[o+1]=B*x1+D_*y+F;vb[o+2]=u1;vb[o+3]=v0;vb[o+4]=r;vb[o+5]=g;vb[o+6]=b;vb[o+7]=a;o+=8;
    vb[o]=A*x1+C*y1+E;vb[o+1]=B*x1+D_*y1+F;vb[o+2]=u1;vb[o+3]=v1;vb[o+4]=r;vb[o+5]=g;vb[o+6]=b;vb[o+7]=a;o+=8;
    vb[o]=A*x+C*y1+E;vb[o+1]=B*x+D_*y1+F;vb[o+2]=u0;vb[o+3]=v1;vb[o+4]=r;vb[o+5]=g;vb[o+6]=b;vb[o+7]=a}

  /* ---------- couleurs CSS → RVBA (mises en cache) ---------- */
  const CC=new Map(),NAMED={white:[1,1,1,1],black:[0,0,0,1],transparent:[0,0,0,0],red:[1,0,0,1]};
  function col(s){if(typeof s!=='string')return null;let c=CC.get(s);if(c!==undefined)return c;c=null;const t=s.trim().toLowerCase();
    if(t[0]=='#'){let h=t.slice(1);if(h.length==3||h.length==4)h=[...h].map(x=>x+x).join('');if(h.length==6||h.length==8){const n=parseInt(h,16);c=h.length==6?[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255,1]:[(n>>>24&255)/255,(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]}}
    else if(t.startsWith('rgb')){const m=t.match(/[\d.]+%?/g);if(m&&m.length>=3)c=[+m[0]/255,+m[1]/255,+m[2]/255,m[3]!=null?(m[3].endsWith('%')?parseFloat(m[3])/100:+m[3]):1]}
    else if(NAMED[t])c=NAMED[t];
    CC.set(s,c);return c}

  /* ---------- le contexte « compatible » qui remplace cx ---------- */
  const OX=cx;let M=[1,0,0,1,0,0];const ST=[];
  let alpha=1,comp='source-over',fs='#000',rects=null,used=true;
  const G={canvas:cv,isGL:true};
  const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
  G.setTransform=function(a,b,c,d,e,f){if(a&&typeof a=='object'){M=[a.a,a.b,a.c,a.d,a.e,a.f]}else if(a===undefined)M=[1,0,0,1,0,0];else M=[a,b,c,d,e,f];OX.setTransform(...M)};
  G.resetTransform=function(){M=[1,0,0,1,0,0];OX.setTransform(1,0,0,1,0,0)};
  G.transform=function(a,b,c,d,e,f){M=mul(M,[a,b,c,d,e,f]);OX.transform(a,b,c,d,e,f)};
  G.translate=function(x,y){M=[M[0],M[1],M[2],M[3],M[0]*x+M[2]*y+M[4],M[1]*x+M[3]*y+M[5]];OX.translate(x,y)};
  G.scale=function(x,y){M=[M[0]*x,M[1]*x,M[2]*y,M[3]*y,M[4],M[5]];OX.scale(x,y)};
  G.rotate=function(r){const c=Math.cos(r),s=Math.sin(r);M=[M[0]*c+M[2]*s,M[1]*c+M[3]*s,M[2]*c-M[0]*s,M[3]*c-M[1]*s,M[4],M[5]];OX.rotate(r)};
  G.save=function(){ST.push([M,alpha,comp,fs]);OX.save()};
  G.restore=function(){const s=ST.pop();if(s){[M,alpha,comp,fs]=s}OX.restore()};
  Object.defineProperty(G,'globalAlpha',{get:()=>alpha,set:v=>{if(isFinite(v)&&v>=0&&v<=1){alpha=+v;OX.globalAlpha=v}}});
  Object.defineProperty(G,'globalCompositeOperation',{get:()=>comp,set:v=>{comp=v;OX.globalCompositeOperation=v}});
  Object.defineProperty(G,'fillStyle',{get:()=>fs,set:v=>{fs=v;OX.fillStyle=v}});

  G.drawImage=function(img,a,b,c,d,e,f,g,h){const w=img.width,hh=img.height;if(!w||!hh||alpha<=0)return;let sx=0,sy=0,sw=w,sh=hh,dx,dy,dw,dh;
    if(e===undefined){dx=a;dy=b;dw=c===undefined?w:c;dh=d===undefined?hh:d}else{sx=a;sy=b;sw=c;sh=d;dx=e;dy=f;dw=g;dh=h}
    const k=alpha;if(w<=AMAX&&hh<=AMAX&&!img._noat){const e=atlasOf(img);use(e.t,comp=='lighter');const du=e.u1-e.u0,dv=e.v1-e.v0;quad(M,dx,dy,dw,dh,e.u0+sx/w*du,e.v0+sy/hh*dv,e.u0+(sx+sw)/w*du,e.v0+(sy+sh)/hh*dv,k,k,k,k);return}
    const t=texOf(img);use(t,comp=='lighter');quad(M,dx,dy,dw,dh,sx/w,sy/hh,(sx+sw)/w,(sy+sh)/hh,k,k,k,k)};
  /* couleur unie : on reste sur la planche déjà active si possible (même lot que les images) */
  const solidTex=add=>{const t=curTex&&isAtlas(curTex)?curTex:AT[0].t;use(t,add);return t};
  G.fillRect=function(x,y,w,h){const c=col(fs);if(!c){used=true;OX.fillRect(x,y,w,h);return}const a=c[3]*alpha;if(a<=0)return;solidTex(comp=='lighter');quad(M,x,y,w,h,WU,WU,WU,WU,c[0]*a,c[1]*a,c[2]*a,a)};
  G.clearRect=function(x,y,w,h){used=true;OX.clearRect(x,y,w,h)};
  /* chemins faits uniquement de rectangles (lots d'objets, vue plan, voyants) : dessinés en WebGL */
  G.beginPath=function(){rects=[];OX.beginPath()};
  G.rect=function(x,y,w,h){if(rects)rects.push([M,x,y,w,h]);OX.rect(x,y,w,h)};
  for(const k of['moveTo','lineTo','arc','arcTo','ellipse','quadraticCurveTo','bezierCurveTo','closePath','roundRect'])G[k]=function(...a){rects=null;return OX[k](...a)};
  G.fill=function(...a){const c=col(fs);if(rects&&rects.length&&c&&!a.length){const al=c[3]*alpha;if(al>0){solidTex(comp=='lighter');for(const r of rects)quad(r[0],r[1],r[2],r[3],r[4],WU,WU,WU,WU,c[0]*al,c[1]*al,c[2]*al,al)}return}used=true;OX.fill(...a)};
  /* tout le reste (traits, textes, dégradés…) : calque Canvas 2D du dessus, avec le même état */
  const proto=CanvasRenderingContext2D.prototype;
  for(const k of Object.getOwnPropertyNames(proto)){if(k in G||k=='constructor')continue;const d=Object.getOwnPropertyDescriptor(proto,k);
    if(typeof d.value=='function')G[k]=function(...a){used=true;return OX[k](...a)};
    else if(d.get)Object.defineProperty(G,k,{get:()=>OX[k],set:v=>{OX[k]=v}})}

  G.beginFrame=function(){frameN++;if(used){OX.setTransform(1,0,0,1,0,0);OX.clearRect(0,0,cv.width,cv.height);used=false}
    gl.viewport(0,0,glc.width,glc.height);gl.uniform2f(uR,glc.width,glc.height);gl.clearColor(.17,.38,.63,1);gl.clear(gl.COLOR_BUFFER_BIT);curTex=null;curAdd=null;use(AT[0].t,false)};
  G.endFrame=function(){flush();if(frameN%60==0)gcTex()};
  G.resize=function(w,h){if(glc.width!==w||glc.height!==h){glc.width=w;glc.height=h}};
  glc.addEventListener('webglcontextlost',e=>{e.preventDefault();cx=OX;toast('Affichage WebGL perdu : retour à l’ancien affichage','bad')});
  cx=G;return G})();
