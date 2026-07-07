/* ============ GALAXY VIEW v3 — système solaire haute densité ============ */
let GX=null;
function noiseTex(w,h,fn){ const cv=document.createElement("canvas");cv.width=w;cv.height=h;const cx=cv.getContext("2d");fn(cx,w,h);return new THREE.CanvasTexture(cv); }
function shade(hex,f){ const c=new THREE.Color(hex); c.offsetHSL(0,(f>0?-.05:.05)*Math.abs(f),f*.13); return "#"+c.getHexString(); }
function hash2(i,j,seed){ const n=Math.sin(i*127.1+j*311.7+seed*74.7)*43758.5453; return n-Math.floor(n); }
function vnoise(x,y,per,seed){
  let xi=Math.floor(x), yi=Math.floor(y); const xf=x-xi, yf=y-yi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const X0=((xi%per)+per)%per, X1=((xi+1)%per+per)%per; // seamless en longitude
  return hash2(X0,yi,seed)*(1-u)*(1-v)+hash2(X1,yi,seed)*u*(1-v)
        +hash2(X0,yi+1,seed)*(1-u)*v+hash2(X1,yi+1,seed)*u*v;
}
function fbm(x,y,seed,oct){ let a=.5,f=1,s2=0,n=0;
  for(let o=0;o<oct;o++){ s2+=a*vnoise(x*f,y*f,Math.max(1,Math.round(16*f)),seed+o*13); n+=a; a*=.5; f*=2; }
  return s2/n; }
function seedOf(str){ let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))%9973; return h/9973*100; }
/* Génère {albédo, lumières nocturnes} d'un monde selon l'état du bilan */
/* 3.74 : identites planetaires - un archetype dedie par entite */
/* 3.74+A1 : l'archétype visuel vient du champ arch de chaque entité (données). */
function archWorldTexture(e,W,H,arch){
  const seed=seedOf(e.id);
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;const cx=cv.getContext("2d");
  const lv=document.createElement("canvas");lv.width=W;lv.height=H;const lx=lv.getContext("2d");
  const img=cx.createImageData(W,H), li=lx.createImageData(W,H);
  const BANDS=[[214,178,120],[186,142,92],[238,210,160],[168,124,80]];
  for(let y=0;y<H;y++){
    const v=y/H, lat=(v-.5)*Math.PI, slat=Math.abs(Math.sin(lat));
    for(let x=0;x<W;x++){
      const u=x/W, i4=(y*W+x)*4;
      const n1=fbm(u*8,v*4,seed,6), n2=fbm(u*16,v*8,seed+31,5);
      let r=0,g=0,b=0;
      if(arch==="banded"){
        const tw=v*9+(n1-.5)*.85+Math.sin(u*12.566+seed)*.05;
        const band=Math.sin(tw*6.283)*.5+.5;
        const base=BANDS[((Math.floor(tw*4)%4)+4)%4];
        const k=.7+band*.3+(n2-.5)*.16;
        r=base[0]*k; g=base[1]*k; b=base[2]*k;
        const dx=(u-.68)*2.2, dy=(v-.62)*3.6, d2=dx*dx+dy*dy;
        if(d2<.02){ const q=(1-d2/.02); r=r*(1-q)+240*q; g=g*(1-q)+216*q; b=b*(1-q)+170*q; }
      } else if(arch==="ice"){
        const tw=v*6+(n1-.5)*.5, band=Math.sin(tw*6.283)*.5+.5;
        r=28+26*band+(n2-.5)*14; g=76+52*band+(n2-.5)*16; b=148+72*band+(n2-.5)*18;
        const dx=(u-.34)*2.6, dy=(v-.44)*4.2, d2=dx*dx+dy*dy;
        if(d2<.012){ const q=1-d2/.012; r=r*(1-q)+225*q; g=g*(1-q)+240*q; b=b*(1-q)+252*q; }
        if(slat>.88){ const q=(slat-.88)/.12; r=r*(1-q)+205*q; g=g*(1-q)+228*q; b=b*(1-q)+246*q; }
      } else if(arch==="ocean"){
        const depth=fbm(u*6,v*3,seed+7,5);
        r=10+34*depth; g=52+70*depth; b=86+92*depth;
        const sw=fbm(u*22,v*11,seed+77,3); if(sw>.6){ const q=(sw-.6)*1.6; r+=26*q; g+=32*q; b+=28*q; }
        const at=fbm(u*10,v*5,seed+123,4);
        if(at>.74){ const q=(at-.74)/.26; r=r*(1-q)+214*q; g=g*(1-q)+196*q; b=b*(1-q)+150*q; }
        if(slat>.9){ const q=Math.pow((slat-.9)/.1,1.5)*(0.7+0.3*fbm(x/W*14,y/H*7,seed+9,3)); r=r*(1-q)+226*q; g=g*(1-q)+236*q; b=b*(1-q)+244*q; }
      } else if(arch==="city"){
        const cont=n1;
        if(cont>.5){ const k=.35+n2*.3; r=52*k+26; g=54*k+27; b=62*k+30; }
        else { r=15+14*cont; g=17+16*cont; b=25+20*cont; }
        if(slat>.93){ const q=(slat-.93)/.07; r=r*(1-q)+178*q; g=g*(1-q)+190*q; b=b*(1-q)+204*q; }
      } else if(arch==="cratered"){
        const k=.5+n1*.4+(n2-.5)*.2;
        r=130*k+34; g=136*k+36; b=148*k+42;
      } else if(arch==="aurora"){
        const cont=n1;
        if(cont>.55){ const k=.4+n2*.4; r=26*k+10; g=96*k+26; b=76*k+22; }
        else { const d=(.55-cont)*1.8; r=8+16*(1-d); g=34+44*(1-d); b=42+40*(1-d); }
        if(slat>.86){ const q=(slat-.86)/.14; r=r*(1-q)+212*q; g=g*(1-q)+236*q; b=b*(1-q)+230*q; }
      }
      img.data[i4]=Math.max(0,Math.min(255,r)); img.data[i4+1]=Math.max(0,Math.min(255,g));
      img.data[i4+2]=Math.max(0,Math.min(255,b)); img.data[i4+3]=255; li.data[i4+3]=255;
    }
  }
  // lumieres en donnees pixel (avant putImageData)
  if(arch==="city"){
    for(let y=1;y<H-1;y++) for(let x=0;x<W;x++){
      const u=x/W,v2=y/H; if(fbm(u*8,v2*4,seed,5)<=.5) continue;
      const grid=(Math.sin(u*251.3)>.86||Math.sin(v2*138.2)>.9);
      const cl=fbm(u*20,v2*10,seed+77,3);
      const prob=(grid?.55:.12)*(cl>.5?1.6:.5);
      if(Math.random()<prob*.5){ const i4=(y*W+x)*4,k=.55+Math.random()*.45;
        li.data[i4]=255*k; li.data[i4+1]=214*k; li.data[i4+2]=150*k; }
    }
  } else if(arch==="banded"){
    for(let i=0;i<70;i++){ const x=(Math.random()*W)|0, y=(H*(.2+Math.random()*.6))|0;
      const i4=(y*W+x)*4; li.data[i4]=255; li.data[i4+1]=236; li.data[i4+2]=205; }
  } else if(arch==="cratered"){
    for(let i=0;i<4;i++){ const x=(Math.random()*W)|0, y=(H*(.3+Math.random()*.4))|0;
      const i4=(y*W+x)*4; li.data[i4]=255; li.data[i4+1]=225; li.data[i4+2]=170; }
  }
  cx.putImageData(img,0,0); lx.putImageData(li,0,0);
  // reliefs et effets vectoriels (apres putImageData)
  if(arch==="cratered"){
    const n=Math.round(46*W/512)+18;
    for(let i=0;i<n;i++){
      const x=Math.random()*W, y=H*.08+Math.random()*H*.84, R2=(1.5+Math.random()*Math.random()*10)*W/512+1;
      const g1=cx.createRadialGradient(x,y,0,x,y,R2);
      g1.addColorStop(0,"rgba(30,30,38,.55)"); g1.addColorStop(.72,"rgba(42,42,52,.25)");
      g1.addColorStop(.92,"rgba(212,216,226,.5)"); g1.addColorStop(1,"rgba(0,0,0,0)");
      cx.fillStyle=g1; cx.beginPath(); cx.arc(x,y,R2,0,7); cx.fill();
    }
    cx.strokeStyle="rgba(226,230,240,.26)"; cx.lineWidth=Math.max(.6,W/640);
    for(let i=0;i<3;i++){ const x=Math.random()*W,y=H*.25+Math.random()*H*.5;
      for(let a=0;a<9;a++){ const th=Math.random()*7, L=(6+Math.random()*22)*W/512;
        cx.beginPath(); cx.moveTo(x,y); cx.lineTo(x+Math.cos(th)*L, y+Math.sin(th)*L*.5); cx.stroke(); } }
  }
  if(arch==="aurora"){
    lx.globalCompositeOperation="lighter";
    [.10,.90].forEach(vy=>{
      const yb=H*vy;
      for(let x=0;x<W;x+=2){ const off=Math.sin(x*.05+seed)*H*.02+fbm(x/W*6,vy,seed+9,3)*H*.03;
        const g2=lx.createLinearGradient(0,yb-H*.06+off,0,yb+H*.06+off);
        g2.addColorStop(0,"rgba(70,255,175,0)"); g2.addColorStop(.5,"rgba(105,255,195,.5)"); g2.addColorStop(1,"rgba(70,255,175,0)");
        lx.fillStyle=g2; lx.fillRect(x,yb-H*.06+off,2,H*.12); }
    });
    lx.globalCompositeOperation="source-over";
  }
  if(arch==="ocean"){
    lx.globalCompositeOperation="lighter"; lx.fillStyle="rgba(255,214,150,.9)";
    for(let i=0;i<220;i++){ const x=Math.random()*W,y=H*.12+Math.random()*H*.76;
      if(fbm(x/W*10,y/H*5,seed+123,4)<=.75) continue;
      lx.fillRect(x,y,Math.max(1,W/448),Math.max(1,W/448)); }
    lx.globalCompositeOperation="source-over";
  }
  return {map:new THREE.CanvasTexture(cv), lights:new THREE.CanvasTexture(lv)};
}
function moonTexture(seed,tint){
  const W=128,H=64,cv=document.createElement("canvas");cv.width=W;cv.height=H;const cx=cv.getContext("2d");
  const tc=new THREE.Color(tint||0xB9C4D9);
  const im=cx.createImageData(W,H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i4=(y*W+x)*4;
    const n=fbm(x/W*9,y/H*4.5,seed,5), m=fbm(x/W*20,y/H*10,seed+40,4);
    // gris lunaire de base, module par le bruit
    let g=118+n*70+(m-.5)*26;
    // maria sombres
    if(n<.42){ g*=.62; }
    // legere teinte du vehicule (10%) pour l'identite sans blanchir
    let r=g*(.9+tc.r*.2), gg=g*(.9+tc.g*.2), b=g*(.9+tc.b*.2);
    im.data[i4]=Math.min(255,r); im.data[i4+1]=Math.min(255,gg); im.data[i4+2]=Math.min(255,b); im.data[i4+3]=255; }
  cx.putImageData(im,0,0);
  // crateres a rebord
  for(let i=0;i<26;i++){ const x=Math.random()*W,y=Math.random()*H,rr=1+Math.random()*Math.random()*7;
    const g1=cx.createRadialGradient(x,y,0,x,y,rr);
    g1.addColorStop(0,"rgba(30,32,38,.5)"); g1.addColorStop(.7,"rgba(60,62,70,.2)");
    g1.addColorStop(.9,"rgba(210,214,224,.4)"); g1.addColorStop(1,"rgba(0,0,0,0)");
    cx.fillStyle=g1; cx.beginPath(); cx.arc(x,y,rr,0,7); cx.fill(); }
  const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t;
}
function worldTexture(e,W,H){
  W=W||512; H=H||256; const _arch=e.arch; if(_arch) return archWorldTexture(e,W,H,_arch);
  const seed=seedOf(e.id);
  const theme=e.risk; // ok=luxuriant, warn=aride, risk=volcanique
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;const cx=cv.getContext("2d");
  const lv=document.createElement("canvas");lv.width=W;lv.height=H;const lx=lv.getContext("2d");
  const img=cx.createImageData(W,H), li=lx.createImageData(W,H);
  const tint=new THREE.Color(e.color);
  const sea = theme==="warn"? .60 : theme==="risk"? .50 : .53;
  const capLat = e.capLat!=null ? e.capLat : theme==="warn"? .88 : .74; // |sin(lat)| au-delà = glace
  const health = theme==="ok"?1:theme==="warn"?.5:.22;
  const land=[];
  for(let y=0;y<H;y++){
    const lat=(y/H-.5)*Math.PI, slat=Math.abs(Math.sin(lat));
    for(let x=0;x<W;x++){
      const nx=x/W*8, ny=y/H*4;
      let el=fbm(nx,ny,seed,5)*.72+fbm(nx*.5,ny*.5,seed+50,3)*.28; // continents + détail
      el -= slat*slat*.06;
      const i4=(y*W+x)*4;
      let r,g,b;
      const _capE=capLat+.07;
      const _capF=slat>capLat?Math.min(1,(slat-capLat)/(_capE-capLat)):0;
      const _capIrr=_capF*(0.6+0.4*fbm(nx*3,ny*3,seed+7,3));
      if(_capIrr>.5){ // calottes polaires a bord irregulier fondu
        const k=.85+fbm(nx*2,ny*2,seed+7,3)*.15;
        r=232*k; g=240*k; b=246*k; land.push(0);
      } else if(el<sea){ // océans avec profondeur
        const d=(sea-el)/sea;
        if(theme==="risk"){ // mers de lave refroidie
          r=26+22*(1-d); g=16+10*(1-d); b=18+12*(1-d);
          if(d<.10){ r=255;g=120+60*(1-d*10);b=40; } // rivages incandescents
        } else {
          r=14+30*(1-d); g=38+62*(1-d); b=78+96*(1-d);
        }
        land.push(0);
      } else { // terres émergées
        const a2=(el-sea)/(1-sea); // altitude relative
        const rough=fbm(nx*3,ny*3,seed+21,4);
        if(theme==="risk"){
          const k=.45+rough*.4; r=58*k+30; g=44*k+22; b=42*k+20; // basalte
          const lava=fbm(nx*6,ny*6,seed+33,4);
          if(lava>.62&&a2<.55){ const q=(lava-.62)/.38; r=200+55*q; g=70+90*q; b=20; }
        } else if(theme==="warn"){
          const k=.6+rough*.4; r=178*k; g=142*k; b=92*k; // déserts
          if(a2>.55){ const m=(a2-.55)/.45; r=r*(1-m)+150*m; g=g*(1-m)+140*m; b=b*(1-m)+135*m; }
        } else {
          if(a2<.08){ r=196;g=178;b=132; } // littoraux
          else if(a2<.5){ const k=.55+rough*.45; r=52*k+18; g=108*k+26; b=54*k+16; } // plaines
          else if(a2<.8){ const k=.5+rough*.5; r=98*k+40; g=86*k+38; b=70*k+34; } // montagnes
          else { const k=.85+rough*.15; r=232*k; g=238*k; b=246*k; } // neiges éternelles
        }
        land.push(a2>=.05&&a2<.6&&slat<capLat*.92?1:0);
        // identité : teinte vers la couleur du véhicule
      }
      r=r*.78+tint.r*255*.22; g=g*.78+tint.g*255*.22; b=b*.78+tint.b*255*.22;
      img.data[i4]=r; img.data[i4+1]=g; img.data[i4+2]=b; img.data[i4+3]=255;
      li.data[i4+3]=255; // alpha noir par défaut
    }
  }
  // LUMIÈRES NOCTURNES v2 : semis urbain de fond + grappes structurées
  for(let y=2;y<H-2;y++) for(let x=0;x<W;x++){
    const i=y*W+x; if(!land[i]) continue;
    const coast = !land[i-1]||!land[i+1]||!land[i-W]||!land[i+W];
    const cl=fbm(x/W*16,y/H*8,seed+77,3);
    const p=(coast?.4:.05)*health*(cl>.55?2.4:cl>.45?1:0.2);
    if(Math.random()<p*.45){
      const i4=i*4, k=.6+Math.random()*.4, warm=Math.random()<.82;
      li.data[i4]=255*k; li.data[i4+1]=(warm?200:225)*k; li.data[i4+2]=(warm?125:255)*k;
    }
  }
  lx.putImageData(li,0,0);
  lx.globalCompositeOperation="lighter";
  // grandes métropoles : cœur très dense + halo + tentacules de banlieue
  const nMet=Math.round(4+12*health);
  for(let m2=0;m2<nMet;m2++){
    let tries=0,x=0,y=0;
    do{ x=Math.floor(Math.random()*W); y=Math.floor(H*.12+Math.random()*H*.76); tries++; }while(!land[y*W+x]&&tries<80);
    if(!land[y*W+x]) continue;
    const R=(7+Math.random()*9)*W/512;
    // halo urbain
    const g2=lx.createRadialGradient(x,y,0,x,y,R*2.2);
    g2.addColorStop(0,"rgba(255,225,165,.9)"); g2.addColorStop(.4,"rgba(255,205,135,.4)"); g2.addColorStop(1,"rgba(255,190,110,0)");
    lx.fillStyle=g2; lx.beginPath(); lx.arc(x,y,R*2.2,0,7); lx.fill();
    // cœur ultra-lumineux (grain de pixels serrés)
    for(let k=0;k<160*health;k++){ const a=Math.random()*7, rr=Math.random()*R;
      const px=Math.round(x+Math.cos(a)*rr), py=Math.round(y+Math.sin(a)*rr);
      if(px<0||px>=W||py<0||py>=H||!land[py*W+px]) continue;
      const i4=(py*W+px)*4; li.data[i4]=255; li.data[i4+1]=222; li.data[i4+2]=170; }
    // tentacules routières lumineuses vers l'extérieur
    const arms=2+Math.floor(Math.random()*3);
    for(let aIdx=0;aIdx<arms;aIdx++){ let ax=x,ay=y; const dir=Math.random()*7;
      for(let st=0;st<40;st++){ ax+=Math.cos(dir+Math.sin(st*.3)*.4)*2.4; ay+=Math.sin(dir+Math.sin(st*.3)*.4)*2.4;
        const px=Math.round(ax),py=Math.round(ay); if(px<1||px>=W-1||py<1||py>=H-1||!land[py*W+px]) break;
        if(Math.random()<.7){ const i4=(py*W+px)*4; li.data[i4]=255; li.data[i4+1]=205; li.data[i4+2]=130; } }
    }
  }
  lx.putImageData(li,0,0);
  lx.globalCompositeOperation="source-over";
  // veines de lave lumineuses pour les mondes en alerte
  if(theme==="risk"){
    lx.strokeStyle="rgba(255,110,40,.85)"; lx.lineWidth=1.2;
    for(let v2=0;v2<26;v2++){
      let x=Math.random()*W, y=H*.2+Math.random()*H*.6;
      lx.beginPath(); lx.moveTo(x,y);
      for(let st=0;st<14;st++){ x+=(Math.random()-.5)*14; y+=(Math.random()-.5)*9; lx.lineTo(x,y); }
      lx.stroke();
    }
  }
  cx.putImageData(img,0,0);
  return {map:new THREE.CanvasTexture(cv), lights:new THREE.CanvasTexture(lv)};
}
function cloudTexture(seed,W,H){
  W=W||512; H=H||256; const cv=document.createElement("canvas");cv.width=W;cv.height=H;
  const cx=cv.getContext("2d"), img=cx.createImageData(W,H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const swirl=Math.sin(y/H*Math.PI*3+fbm(x/W*4,y/H*2,seed+5,3)*4)*6;
    const n=fbm((x+swirl)/W*7,y/H*3.5,seed,5);
    const a=Math.max(0,(n-.52)/.48);
    const i4=(y*W+x)*4;
    img.data[i4]=255; img.data[i4+1]=255; img.data[i4+2]=255;
    img.data[i4+3]=Math.min(230,a*a*330);
  }
  cx.putImageData(img,0,0);
  return new THREE.CanvasTexture(cv);
}
function sunTexture(){
  return noiseTex(512,256,(cx,w,h)=>{
    const g=cx.createLinearGradient(0,0,0,h); g.addColorStop(0,"#FFB23B"); g.addColorStop(.5,"#FFCE6B"); g.addColorStop(1,"#FF9A2E");
    cx.fillStyle=g; cx.fillRect(0,0,w,h);
    for(let i=0;i<900;i++){
      const r=Math.random()*7+1;
      cx.fillStyle=Math.random()<.5?"rgba(255,236,180,.5)":"rgba(255,140,40,.4)";
      cx.beginPath(); cx.arc(Math.random()*w,Math.random()*h,r,0,7); cx.fill();
    }
  });
}
function spiralTexture(){
  return noiseTex(256,256,(cx,w,h)=>{
    cx.translate(128,128);
    for(let a=0;a<6.4;a+=.02){
      for(let arm=0;arm<2;arm++){
        const r=4+a*16, th=a+arm*Math.PI;
        const x=Math.cos(th)*r, y=Math.sin(th)*r*.55;
        cx.fillStyle=`rgba(${190+Math.random()*60},${200+Math.random()*40},255,${Math.max(0,.5-a*.07)})`;
        cx.beginPath(); cx.arc(x,y,1.6+Math.random(),0,7); cx.fill();
      }
    }
    const g=cx.createRadialGradient(0,0,0,0,0,24);
    g.addColorStop(0,"rgba(255,250,230,.95)");g.addColorStop(1,"rgba(255,250,230,0)");
    cx.fillStyle=g; cx.beginPath(); cx.arc(0,0,24,0,7); cx.fill();
  });
}
function crossStarTexture(){
  return noiseTex(128,128,(cx)=>{
    const g=cx.createRadialGradient(64,64,0,64,64,40);
    g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.35,"rgba(220,235,255,.5)");g.addColorStop(1,"rgba(255,255,255,0)");
    cx.fillStyle=g; cx.fillRect(0,0,128,128);
    // point rond doux, sans aigrettes en croix
  });
}
function glowSprite(color,inner){
  const cv=document.createElement("canvas");cv.width=cv.height=256;const cx=cv.getContext("2d");
  const g=cx.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,inner); g.addColorStop(.35,color+"66"); g.addColorStop(1,"rgba(0,0,0,0)");
  cx.fillStyle=g; cx.fillRect(0,0,256,256);
  return new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
}
function initGalaxy(){
  if(GX) return;
  const wrap=$("#galaxy-canvas");
  const GLARE_EL=document.getElementById("sun-glare");
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x03060E,.00045);
  const cam=new THREE.PerspectiveCamera(55, wrap.clientWidth/wrap.clientHeight, .1, 9000);
  /* ===== LENSFLARE réaliste (screen-space, coût ~nul) ===== */
  const _flDisk=(function(){ const cv=document.createElement("canvas");cv.width=cv.height=64;const c=cv.getContext("2d");
    const g=c.createRadialGradient(32,32,1,32,32,31); g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.4,"rgba(255,255,255,.5)"); g.addColorStop(1,"rgba(255,255,255,0)");
    c.fillStyle=g; c.fillRect(0,0,64,64); return new THREE.CanvasTexture(cv); })();
  const _flRing=(function(){ const cv=document.createElement("canvas");cv.width=cv.height=64;const c=cv.getContext("2d");
    c.strokeStyle="rgba(255,255,255,.9)"; c.lineWidth=3.5; c.beginPath(); c.arc(32,32,24,0,6.29); c.stroke();
    c.strokeStyle="rgba(255,255,255,.28)"; c.lineWidth=8; c.beginPath(); c.arc(32,32,24,0,6.29); c.stroke();
    return new THREE.CanvasTexture(cv); })();
  const _flStreak=(function(){ const cv=document.createElement("canvas");cv.width=256;cv.height=32;const c=cv.getContext("2d");
    const g=c.createLinearGradient(0,0,256,0); g.addColorStop(0,"rgba(255,255,255,0)"); g.addColorStop(.5,"rgba(255,255,255,1)"); g.addColorStop(1,"rgba(255,255,255,0)");
    c.fillStyle=g; c.fillRect(0,12,256,8); return new THREE.CanvasTexture(cv); })();
  scene.add(cam);
  const FLARE=new THREE.Group(); FLARE.visible=false; cam.add(FLARE);
  const _flare=[
   {t:_flStreak,s:[13,0.7],f:1.0,o:0,c:0xFFE0B0},
   {t:_flDisk,  s:[1.8,1.8],f:1.0,o:.22,c:0xFFF2D8},
   {t:_flDisk,  s:[2.0,2.0],f:.55,o:0,c:0xFFD9A0},
   {t:_flRing,  s:[2.0,2.0],f:.34,o:.08,c:0x9FD8FF},
   {t:_flDisk,  s:[.8,.8],f:.06,o:.10,c:0xFFFFFF},
   {t:_flRing,  s:[4.8,4.8],f:-.28,o:0,c:0xFFB47A},
   {t:_flDisk,  s:[2.5,2.5],f:-.62,o:0,c:0x8FE0C8},
   {t:_flRing,  s:[7.5,7.5],f:-1.0,o:0,c:0xA8C4FF}
  ].map(function(d){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:d.t,color:d.c,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));
    sp.scale.set(d.s[0],d.s[1],1); sp.userData=d; sp.renderOrder=99; FLARE.add(sp); return sp; });
  const ren=new THREE.WebGLRenderer({antialias:true,alpha:true});
  ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=1.32;
  // — environnement réfléchissant : reflets sur le vaisseau + éclats du soleil sur les facettes de glace —
  try{
    const _pmrem=new THREE.PMREMGenerator(ren);
    const _envS=new THREE.Scene();
    _envS.add(new THREE.Mesh(new THREE.SphereGeometry(60,18,14), new THREE.MeshBasicMaterial({color:0x05070D,side:THREE.BackSide})));
    const _eSun=new THREE.Mesh(new THREE.SphereGeometry(2.4,20,20), new THREE.MeshBasicMaterial({color:0xFFE9C4})); _eSun.position.set(-8,12,-26); _envS.add(_eSun);
    const _eFill=new THREE.Mesh(new THREE.SphereGeometry(7,14,14), new THREE.MeshBasicMaterial({color:0x0E1C34})); _eFill.position.set(22,-8,18); _envS.add(_eFill);
    const _envRT=_pmrem.fromScene(_envS,0.02);
    scene.environment=_envRT.texture; _pmrem.dispose();
  }catch(_e){}
  ren.setPixelRatio(Math.min(devicePixelRatio,2));
  ren.setSize(wrap.clientWidth, wrap.clientHeight);
  wrap.appendChild(ren.domElement);
  scene.add(new THREE.AmbientLight(0x141E33,.20));
  const rimLight=new THREE.DirectionalLight(0x51719F,.55); rimLight.position.set(-720,460,-820); scene.add(rimLight);
  function dotTexture(){
    const cv=document.createElement("canvas");cv.width=cv.height=64;const cx=cv.getContext("2d");
    const g=cx.createRadialGradient(32,32,0,32,32,30);
    g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.5,"rgba(255,255,255,.9)");g.addColorStop(1,"rgba(255,255,255,0)");
    cx.fillStyle=g;cx.beginPath();cx.arc(32,32,30,0,7);cx.fill();
    return new THREE.CanvasTexture(cv);
  }
  const DOT=dotTexture();
  function starTexture(){ const cv=document.createElement("canvas");cv.width=cv.height=64;const x=cv.getContext("2d");
    const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.5,"rgba(255,255,255,.25)");g.addColorStop(1,"rgba(255,255,255,0)");
    x.fillStyle=g;x.beginPath();x.arc(32,32,32,0,7);x.fill();
    /* 3.67 : croix supprimee, point rond doux uniquement */
    return new THREE.CanvasTexture(cv); }
  const STAR=starTexture();
  const sunLight=new THREE.PointLight(0xFFE2B0,5.1,5200,1.6); scene.add(sunLight);

  /* ====== UNIVERS LOINTAIN ====== */
  function starLayer(n,spread,size,tint){
    const g=new THREE.BufferGeometry(), v=[], col=[];
    const palette=[[1,1,1],[ .72,.84,1],[1,.86,.66],[ .8,1,.95]];
    for(let i=0;i<n;i++){
      v.push((Math.random()-.5)*spread,(Math.random()-.5)*spread,(Math.random()-.5)*spread);
      const c=palette[Math.floor(Math.random()*palette.length)];
      const k=.55+Math.random()*.45;
      col.push(c[0]*k*tint, c[1]*k*tint, c[2]*k*tint);
    }
    g.setAttribute("position",new THREE.Float32BufferAttribute(v,3));
    g.setAttribute("color",new THREE.Float32BufferAttribute(col,3));
    const p=new THREE.Points(g,new THREE.PointsMaterial({size:size*.85,map:DOT,alphaTest:.02,vertexColors:true,sizeAttenuation:true,transparent:true,opacity:.9,depthWrite:false}));
    scene.add(p); return p;
  }
  const starsA=starLayer(6400,6800,1.3,1), starsB=starLayer(3200,4200,1.9,.9), starsC=starLayer(1400,2600,2.3,.75);
  // 3.71 : coquille UHD - etoiles a taille pixel constante, nettes a tout zoom et toute resolution
  (function(){ const N=5200, g=new THREE.BufferGeometry(), pos=new Float32Array(N*3), col=new Float32Array(N*3);
    for(let i=0;i<N;i++){ const u=Math.random()*2-1, th=Math.random()*6.2832, r2=3880+Math.random()*160, s3=Math.sqrt(1-u*u);
      pos[i*3]=r2*s3*Math.cos(th); pos[i*3+1]=r2*u; pos[i*3+2]=r2*s3*Math.sin(th);
      const w=Math.random(); const c=w<.68?[1,1,1]:(w<.85?[.72,.83,1]:(w<.95?[1,.9,.74]:[1,.78,.66])); const b=.5+Math.pow(Math.random(),1.6)*.5;
      col[i*3]=c[0]*b; col[i*3+1]=c[1]*b; col[i*3+2]=c[2]*b; }
    g.setAttribute("position",new THREE.BufferAttribute(pos,3)); g.setAttribute("color",new THREE.BufferAttribute(col,3));
    scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.7,sizeAttenuation:false,map:DOT,alphaTest:.02,vertexColors:true,transparent:true,opacity:.95,depthWrite:false})));
    // 3.86 : etoiles heros - un second jeu plus gros et brillant (profondeur du champ)
    const N2=120, g2=new THREE.BufferGeometry(), p2=new Float32Array(N2*3), c2=new Float32Array(N2*3);
    for(let i=0;i<N2;i++){ const u=Math.random()*2-1, th=Math.random()*6.2832, r2=3860+Math.random()*180, s3=Math.sqrt(1-u*u);
      p2[i*3]=r2*s3*Math.cos(th); p2[i*3+1]=r2*u; p2[i*3+2]=r2*s3*Math.sin(th);
      const w=Math.random(); const c=w<.6?[1,1,1]:(w<.82?[.7,.82,1]:[1,.85,.7]);
      c2[i*3]=c[0]; c2[i*3+1]=c[1]; c2[i*3+2]=c[2]; }
    g2.setAttribute("position",new THREE.BufferAttribute(p2,3)); g2.setAttribute("color",new THREE.BufferAttribute(c2,3));
    scene.add(new THREE.Points(g2,new THREE.PointsMaterial({size:2.9,sizeAttenuation:false,map:DOT,alphaTest:.02,vertexColors:true,transparent:true,opacity:1,depthWrite:false})));
  })();
  // étoiles brillantes à croisillon
  const crossTex=crossStarTexture(), brights=[];
  for(let i=0;i<7;i++){
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:crossTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.9}));
    const s=3.5+Math.random()*3; sp.scale.set(s,s,1); sp.material.opacity=.24;
    const a=Math.random()*Math.PI*2, b=Math.acos(2*Math.random()-1), R=3400+Math.random()*500;
    sp.position.set(R*Math.sin(b)*Math.cos(a), R*Math.cos(b)*.7, R*Math.sin(b)*Math.sin(a));
    sp.userData={ph:Math.random()*7}; scene.add(sp); brights.push(sp);
  }
  // Voie lactée : bande inclinée de 5200 points + lueurs
  const mwGroup=new THREE.Group();
  const mwG=new THREE.BufferGeometry(), mwV=[], mwC=[];
  for(let i=0;i<5200;i++){
    const a=Math.random()*Math.PI*2, R=2400+(Math.random()-.5)*620, th=(Math.random()-.5)*230;
    mwV.push(Math.cos(a)*R,(Math.random()-.5)*150+Math.sin(a*3)*40,Math.sin(a)*R*.42+th);
    const warm=Math.random()<.25;
    mwC.push(warm?1:.78, warm?.85:.86, warm?.65:1);
  }
  mwG.setAttribute("position",new THREE.Float32BufferAttribute(mwV,3));
  mwG.setAttribute("color",new THREE.Float32BufferAttribute(mwC,3));
  mwGroup.add(new THREE.Points(mwG,new THREE.PointsMaterial({size:1.8,map:DOT,alphaTest:.02,vertexColors:true,transparent:true,opacity:.38,depthWrite:false})));
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2, gl=glowSprite("#9FB6E8","rgba(190,205,240,.5)");
    gl.scale.set(620,300,1); gl.material.opacity=.10;
    gl.position.set(Math.cos(a)*2400,0,Math.sin(a)*2400*.42); mwGroup.add(gl);
  }
  mwGroup.rotation.set(.82,0,.34); scene.add(mwGroup);
  // nébuleuses
  const nebulae=[];
  [["#34467A",4400,[0,240,-2600]],["#42386A",4800,[0,-200,2600]]].forEach(([c,sc,p])=>{
    const n=glowSprite(c,c+"2E"); n.scale.set(sc,sc*.92,1); n.material.opacity=.028; n.position.set(...p); scene.add(n); nebulae.push(n);
  });
  // galaxies lointaines
  const spTex=spiralTexture();
  for(let i=0;i<4;i++){
    const g=new THREE.Sprite(new THREE.SpriteMaterial({map:spTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.55}));
    const s=110+Math.random()*150; g.scale.set(s,s*.7,1);
    g.position.set((Math.random()-.5)*5600,(Math.random()-.3)*3200,(Math.random()-.5)*5600); scene.add(g);
  }

  /* ====== SOLEIL CENTRAL — vivant, indexé sur la NAV ====== */
  const sunGroup=new THREE.Group(); scene.add(sunGroup);
  /* ====== VOIE LACTÉE + ÉTOILES FILANTES + COMÈTE (grand décor, coût ~nul) ====== */
  const _mwTex=(function(){ const cv=document.createElement("canvas"); cv.width=2048; cv.height=1024; const cx=cv.getContext("2d"); cx.scale(2,2);
    const g=cx.createLinearGradient(0,140,0,372); g.addColorStop(0,"rgba(90,110,170,0)"); g.addColorStop(.35,"rgba(150,170,220,.28)"); g.addColorStop(.5,"rgba(226,232,255,.44)"); g.addColorStop(.65,"rgba(150,170,220,.28)"); g.addColorStop(1,"rgba(90,110,170,0)");
    cx.fillStyle=g; cx.fillRect(0,140,1024,232);
    const rg=cx.createRadialGradient(512,256,10,512,256,190); rg.addColorStop(0,"rgba(255,238,210,.85)"); rg.addColorStop(.3,"rgba(255,220,180,.4)"); rg.addColorStop(1,"rgba(255,220,180,0)"); cx.fillStyle=rg; cx.beginPath(); cx.ellipse(512,256,190,84,0,0,6.29); cx.fill();
    cx.globalCompositeOperation="destination-out";
    for(let i=0;i<26;i++){ const x=80+Math.random()*880, y=210+Math.random()*96, r=18+Math.random()*44; const dg=cx.createRadialGradient(x,y,0,x,y,r); dg.addColorStop(0,"rgba(0,0,0,"+(0.35+Math.random()*0.4)+")"); dg.addColorStop(1,"rgba(0,0,0,0)"); cx.fillStyle=dg; cx.beginPath(); cx.ellipse(x,y,r,r*0.42,Math.random()*3,0,6.29); cx.fill(); }
    cx.globalCompositeOperation="lighter";
    for(let i=0;i<1500;i++){ const x=Math.random()*1024; const yb=256+(Math.random()+Math.random()+Math.random()-1.5)*86; const y=Math.random()<.86? yb : Math.random()*512;
      const a=.25+Math.random()*.75, sr=Math.random()<.94? .7 : 1.4; cx.fillStyle="rgba(255,"+(235+((Math.random()*20)|0))+","+(210+((Math.random()*45)|0))+","+a.toFixed(2)+")"; cx.beginPath(); cx.arc(x,y,sr*.7,0,6.29); cx.fill(); }
    cx.setTransform(1,0,0,1,0,0);
    (function(){ const FW=160, RW=cv.width, RH=cv.height, tmp=document.createElement("canvas"); tmp.width=FW; tmp.height=RH;
      const tx2=tmp.getContext("2d"); tx2.drawImage(cv,0,0,FW,RH,0,0,FW,RH);
      const gm=tx2.createLinearGradient(0,0,FW,0); gm.addColorStop(0,"rgba(0,0,0,0)"); gm.addColorStop(1,"rgba(0,0,0,1)");
      tx2.globalCompositeOperation="destination-in"; tx2.fillStyle=gm; tx2.fillRect(0,0,FW,RH);
      cx.drawImage(tmp,RW-FW,0); })();
    const tx=new THREE.CanvasTexture(cv); return tx; })();
  const milkyWay=new THREE.Mesh(new THREE.SphereGeometry(1450,48,32), new THREE.MeshBasicMaterial({map:_mwTex,side:THREE.BackSide,transparent:true,opacity:0,depthWrite:false}));
  // 3.78 : galaxie spirale hero de la reference
  const _galTex=(function(){ const cv=document.createElement("canvas"); cv.width=512; cv.height=320; const cx=cv.getContext("2d");
    const GX=256, GY=160;
    const cg=cx.createRadialGradient(GX,GY,0,GX,GY,54);
    cg.addColorStop(0,"rgba(255,240,214,.95)"); cg.addColorStop(.4,"rgba(255,224,178,.5)"); cg.addColorStop(1,"rgba(255,220,170,0)");
    cx.fillStyle=cg; cx.beginPath(); cx.ellipse(GX,GY,54,34,0,0,7); cx.fill();
    for(let arm=0;arm<2;arm++){ const ph0=arm*Math.PI;
      for(let i=0;i<900;i++){ const th=i*.012+ph0, r2=8*Math.exp(th*.185);
        if(r2>238) break;
        const jx=(Math.random()-.5)*16*(r2/60), jy=(Math.random()-.5)*10*(r2/60);
        const x=GX+Math.cos(th)*r2+jx, y=GY+Math.sin(th)*r2*.58+jy;
        const w=Math.random(); const col=w<.7?"200,216,255":(w<.9?"255,236,205":"255,255,255");
        cx.fillStyle="rgba("+col+","+(.12+Math.random()*.5).toFixed(2)+")";
        const sr=Math.random()<.9?.8:1.6; cx.beginPath(); cx.arc(x,y,sr,0,7); cx.fill(); } }
    return new THREE.CanvasTexture(cv); })();
  // 3.84 : galaxie spirale hero supprimee (source de tache)
  milkyWay.rotation.z=0.52; milkyWay.rotation.x=0.24; milkyWay.renderOrder=-9; scene.add(milkyWay);
  const _shootTex=(function(){ const cv=document.createElement("canvas");cv.width=128;cv.height=16;const cx=cv.getContext("2d"); const g2=cx.createLinearGradient(0,0,128,0); g2.addColorStop(0,"rgba(255,255,255,0)"); g2.addColorStop(.75,"rgba(230,240,255,.85)"); g2.addColorStop(1,"rgba(255,255,255,1)"); cx.fillStyle=g2; cx.fillRect(0,5,128,6); return new THREE.CanvasTexture(cv); })();
  const SHOOTS=[]; for(let i=0;i<3;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:_shootTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); sp.scale.set(64,4,1); sp.visible=false; scene.add(sp); SHOOTS.push({sp,life:0,max:0,v:new THREE.Vector3(),wait:2+Math.random()*8}); }
  const _cometTex=(function(){ const cv=document.createElement("canvas");cv.width=cv.height=64;const cx=cv.getContext("2d"); const g3=cx.createRadialGradient(32,32,1,32,32,30); g3.addColorStop(0,"rgba(255,255,255,1)"); g3.addColorStop(.35,"rgba(190,225,255,.7)"); g3.addColorStop(1,"rgba(140,190,255,0)"); cx.fillStyle=g3; cx.fillRect(0,0,64,64); return new THREE.CanvasTexture(cv); })();
  const COMET={head:new THREE.Sprite(new THREE.SpriteMaterial({map:_cometTex,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false})), tail:[], a:560, b:330, w:0.0145, ph:Math.random()*6.28};
  COMET.head.scale.set(10,10,1); scene.add(COMET.head);
  for(let i=0;i<9;i++){ const t2=new THREE.Sprite(new THREE.SpriteMaterial({map:_cometTex,color:0xA8CFFF,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false})); t2.scale.set(7,7,1); scene.add(t2); COMET.tail.push(t2); }
  // NAVETTES CARGO : petites lueurs qui commercent entre les orbites (les flux du patrimoine)
  const SHUTTLES=[]; for(let i=0;i<3;i++){ const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.3,0.9,3.4),new THREE.MeshBasicMaterial({color:0xC8D6E8})));
    const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:_cometTex,color:0x9FE8FF,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false})); gl.scale.set(4.5,4.5,1); gl.position.z=-2.2; g.add(gl);
    scene.add(g); SHUTTLES.push({g:g, r1:120+i*90, r2:260+i*120, w:.05+.02*i, ph:i*2.1}); }
  const sunTex=sunTexture(); sunTex.wrapS=THREE.RepeatWrapping;
  const sun=new THREE.Mesh(new THREE.SphereGeometry(26,64,64), new THREE.MeshBasicMaterial({map:sunTex,toneMapped:false}));
  sun.userData={id:"oriondemo"}; sunGroup.add(sun);
  // 3.77 : coeur incandescent - le centre sature en blanc chaud, hors tone mapping
  const coreGlow=glowSprite("#FFFFFF","rgba(255,250,240,1)");
  coreGlow.scale.set(46,46,1); coreGlow.material.opacity=.9; coreGlow.material.toneMapped=false; sunGroup.add(coreGlow);
  const coreHalo=glowSprite("#FFEFD2","rgba(255,240,210,.9)");
  coreHalo.scale.set(68,68,1); coreHalo.material.opacity=.5; sunGroup.add(coreHalo);
  // 3.80 : streak anamorphique premium (reference 3.53, en mieux) - double couche, hors ACES
  const diffH=glowSprite("#FFE0AE","rgba(255,230,185,.95)"); diffH.scale.set(560,11,1); diffH.material.opacity=.18; diffH.material.toneMapped=false; sunGroup.add(diffH);
  const diffH2=glowSprite("#FFF4DE","rgba(255,246,226,1)"); diffH2.scale.set(210,6.5,1); diffH2.material.opacity=.27; diffH2.material.toneMapped=false; sunGroup.add(diffH2);
  const diffV=glowSprite("#FFE6C0","rgba(255,234,190,.9)"); diffV.scale.set(16,140,1); diffV.material.opacity=.06; sunGroup.add(diffV);
  // — vent solaire : particules émises radialement par le soleil —
  const SWN=340, swPos=new Float32Array(SWN*3), swV=[], swG=new THREE.BufferGeometry();
  for(let i=0;i<SWN;i++){ const dir=new THREE.Vector3(Math.random()-.5,(Math.random()-.5)*.34,Math.random()-.5).normalize();
    const rad=28+Math.random()*640, sp=.5+Math.random()*1.4; swV.push({dir,sp,rad});
    swPos[i*3]=dir.x*rad; swPos[i*3+1]=dir.y*rad; swPos[i*3+2]=dir.z*rad; }
  swG.setAttribute("position",new THREE.BufferAttribute(swPos,3));
  const solarWind=new THREE.Points(swG,new THREE.PointsMaterial({size:2.6,map:DOT,color:0x9FD0FF,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true}));
  solarWind.frustumCulled=false; scene.add(solarWind);
  const sunTex2=sunTexture(); sunTex2.wrapS=THREE.RepeatWrapping;
  const sunSkin=new THREE.Mesh(new THREE.SphereGeometry(26.2,64,64),
    new THREE.MeshBasicMaterial({map:sunTex2,transparent:true,opacity:.2,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true}));
  sunGroup.add(sunSkin);
  const corona=glowSprite("#FFC861","rgba(255,232,178,.95)"); corona.scale.set(90,90,1); sunGroup.add(corona);
  const corona2=glowSprite("#FF8A2E","rgba(255,170,80,.36)"); corona2.scale.set(146,146,1); sunGroup.add(corona2);
  const corona3=glowSprite("#FFE6B0","rgba(255,240,200,.28)"); corona3.scale.set(210,210,1); corona3.material.opacity=.10; sunGroup.add(corona3);
  // 3.88 : halo chromatique externe (couronne solaire premium, hors tone mapping)
  const corona4=glowSprite("#FFDCA0","rgba(255,226,168,.5)"); corona4.scale.set(310,310,1); corona4.material.opacity=.055; corona4.material.toneMapped=false; sunGroup.add(corona4);
  const coronaCool=glowSprite("#BFD8FF","rgba(190,214,255,.5)"); coronaCool.scale.set(400,400,1); coronaCool.material.opacity=.03; coronaCool.material.toneMapped=false; sunGroup.add(coronaCool);
  // anneau de chromosphère fin et lumineux au limbe
  const chromo=new THREE.Mesh(new THREE.RingGeometry(26.2,29.5,96),
    new THREE.MeshBasicMaterial({color:0xFFE0A8,transparent:true,opacity:.32,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  chromo.userData.billboard=true; sunGroup.add(chromo);
  // pass visuel 3.65 : stries de lentille supprimees (plus de barres traversant l'ecran)
  // bande équatoriale incandescente
  const eqBand=new THREE.Mesh(new THREE.TorusGeometry(27.5,.9,12,96),
    new THREE.MeshBasicMaterial({color:0xFFE08A,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));
  eqBand.rotation.x=Math.PI/2; sunGroup.add(eqBand);
  // essaim de particules
  const swg=new THREE.BufferGeometry(), swv=[], swSeed=[];
  for(let i=0;i<420;i++){ const a=Math.random()*Math.PI*2, b=Math.acos(2*Math.random()-1), r=34+Math.random()*28;
    swv.push(r*Math.sin(b)*Math.cos(a), r*Math.cos(b), r*Math.sin(b)*Math.sin(a)); swSeed.push(Math.random()*Math.PI*2); }
  swg.setAttribute("position",new THREE.Float32BufferAttribute(swv,3));
  const swarm=new THREE.Points(swg,new THREE.PointsMaterial({color:0xFFD98A,size:1.6,map:DOT,alphaTest:.02,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));
  sunGroup.add(swarm);
  // protubérances magnétiques
  const flares=[], flareGroup=new THREE.Group(); sunGroup.add(flareGroup);
  for(let i=0;i<10;i++){
    const a=Math.random()*Math.PI*2, el=(Math.random()-.5)*1.5;
    const p0=new THREE.Vector3(Math.cos(a)*26*Math.cos(el),Math.sin(el)*26,Math.sin(a)*26*Math.cos(el));
    const a2=a+.4+Math.random()*.6;
    const p2=new THREE.Vector3(Math.cos(a2)*26*Math.cos(el),Math.sin(el)*26,Math.sin(a2)*26*Math.cos(el));
    const mid=p0.clone().add(p2).multiplyScalar(.5).normalize().multiplyScalar(40+Math.random()*30);
    const pts=new THREE.QuadraticBezierCurve3(p0,mid,p2).getPoints(26);
    const lg=new THREE.BufferGeometry().setFromPoints(pts);
    const ln=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0xFFBC64,transparent:true,opacity:.85,blending:THREE.AdditiveBlending}));
    ln.userData={ph:Math.random()*7}; flareGroup.add(ln); flares.push(ln);
  }
  // éjections de masse coronale (anneaux d'onde)
  const cmes=[];
  for(let i=0;i<2;i++){ const c=glowSprite("#FFCF7A","rgba(255,220,150,.0)"); c.material.opacity=0; c.userData={life:-i*4.5}; sunGroup.add(c); cmes.push(c); }
  // vent solaire : particules radiales en dérive perpétuelle
  const swind={n:340}; const wg=new THREE.BufferGeometry(), wv=[], wDir=[], wR=[];
  for(let i=0;i<swind.n;i++){
    const a=Math.random()*Math.PI*2, b=Math.acos(2*Math.random()-1);
    wDir.push(Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a));
    wR.push(40+Math.random()*420); wv.push(0,0,0);
  }
  wg.setAttribute("position",new THREE.Float32BufferAttribute(wv,3));
  const wind=new THREE.Points(wg,new THREE.PointsMaterial({color:0xFFD9A0,size:1.25,map:DOT,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false}));
  sunGroup.add(wind);
  // piliers de lumière (god rays) en rotation lente
  const pillars=[];
  for(let i=0;i<4;i++){
    const p=glowSprite("#FFE3A6","rgba(255,235,190,.55)");
    p.scale.set(26,560,1); p.material.opacity=.05; p.material.rotation=i*Math.PI/4;
    p.userData={ph:i}; sunGroup.add(p); pillars.push(p);
  }
  // flare anamorphique : trait horizontal qui s'allume quand on regarde le soleil
  const streak=glowSprite("#FFE9C2","rgba(255,240,210,.95)");
  streak.scale.set(540,9,1); streak.material.opacity=0; scene.add(streak);
  // lumière zodiacale : deux fuseaux le long de l'écliptique
  [1,-1].forEach(s2=>{ const z=glowSprite("#C9D8F2","rgba(210,225,250,.4)");
    z.scale.set(900,120,1); z.material.opacity=.05; z.position.set(s2*430,0,0);
    z.material.rotation=s2>0?0:Math.PI; scene.add(z); });

  // échelle du soleil ∝ NAV (base 1,5 M€)
  let sunScaleTarget=Math.max(.8,Math.min(1.9,Math.pow(Engine.consolidate().nav/1500000,.45)));
  window.updateGalaxyNav=function(){ sunScaleTarget=Math.max(.8,Math.min(1.9,Math.pow(Engine.consolidate().nav/1500000,.45))); };

/* ====== PLANÈTES + LUNES + ANNEAUX ====== */
  const planets=[], flows=[], halos=[], clouds=[], moons=[], alerts=[];
  const HD_QUEUE=[];

  const maxNav=Math.max(...DATA.entities.map(e=>Math.max(1,Engine.navShare(e))));
  const ORB=[]; let _orbAcc=120;
  DATA.entities.forEach((e,i)=>{
    const navQ=Math.max(20000,Engine.navShare(e));
    const r=5.5+13.5*Math.sqrt(navQ/maxNav);
    // orbite cumulative : intervalle franc proportionnel aux tailles voisines
    const dist=_orbAcc+r; _orbAcc=dist+r+62; ORB.push(dist);
    const incl=(i%2?1:-1)*(0.05+0.03*Math.sin(i*2.7));
    const world=worldTexture(e,128,64); // aperçu instantané, HD en arrière-plan
    const pmat=new THREE.MeshStandardMaterial({map:world.map,bumpMap:world.map,bumpScale:.30,roughness:.72,metalness:.05,
      emissive:new THREE.Color(0xFFCE85),emissiveIntensity:1.15,emissiveMap:world.lights,envMapIntensity:0});
    // nuit/jour : les lumières de civilisation ne brillent que sur la face sombre
    pmat.onBeforeCompile=sh=>{
      sh.uniforms.uSunDir={value:new THREE.Vector3(1,0,0)};
      pmat.userData.uSunDir=sh.uniforms.uSunDir;
      sh.fragmentShader=sh.fragmentShader
        .replace("void main() {","uniform vec3 uSunDir;\nvoid main() {")
        .replace("#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
           float nightK = smoothstep(0.20, -0.14, dot(normalize(vNormal), uSunDir));
           totalEmissiveRadiance *= nightK;`);
    };
    const _a2=e.arch||null;
    if(_a2==="aurora"){ pmat.emissive=new THREE.Color(0xA8FFD8); pmat.emissiveIntensity=1.5; }
    else if(_a2==="city"){ pmat.emissiveIntensity=1.6; }
    else if(_a2==="banded"){ pmat.emissiveIntensity=.8; pmat.roughness=.6; }
    else if(_a2==="ice"){ pmat.emissiveIntensity=.5; pmat.roughness=.5; }
    else if(_a2==="cratered"){ pmat.emissiveIntensity=.4; pmat.roughness=.9; }
    else if(_a2==="ocean"){ pmat.emissiveIntensity=.9; pmat.roughness=.42; }
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,64,48), pmat);
    mesh.userData_eI=1.55;
    mesh.rotation.z=(Math.random()-.5)*.5; // inclinaison de l'axe
    mesh.userData={id:e.id, dist, speed:.11/Math.sqrt(dist/105), angle:(i*2.39996+0.7)%(Math.PI*2), r, incl, spin:.0018+Math.random()*.0035};
    scene.add(mesh); planets.push(mesh);
    // — atmosphère / ozone : fin liseré Fresnel discret —
    (function(){
      const _atmVS="varying float vI;uniform float c;uniform float p;void main(){vec3 n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 vd=normalize(-mv.xyz);vI=pow(clamp(c-dot(n,vd),0.0,1.0),p);gl_Position=projectionMatrix*mv;}";
      const _atmFS="varying float vI;uniform vec3 gc;uniform float str;void main(){gl_FragColor=vec4(gc*vI*str,vI*str);}";
      const atmMat=new THREE.ShaderMaterial({
        uniforms:{c:{value:0.50},p:{value:5.2},str:{value:0.66},gc:{value:new THREE.Color(0x6AA0DE)}},
        vertexShader:_atmVS, fragmentShader:_atmFS,
        blending:THREE.AdditiveBlending,side:THREE.BackSide,transparent:true,depthWrite:false});
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(r*1.10,40,40),atmMat));
      const ozMat=new THREE.ShaderMaterial({
        uniforms:{c:{value:0.60},p:{value:8.5},str:{value:0.40},gc:{value:new THREE.Color(0x9CC6EE)}},
        vertexShader:_atmVS, fragmentShader:_atmFS,
        blending:THREE.AdditiveBlending,side:THREE.BackSide,transparent:true,depthWrite:false});
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(r*1.04,40,40),ozMat));
      // — champ magnétique : cage de lignes dipolaires sur la plus grosse planète —
      const _bigId=DATA.entities.reduce((a,b)=>Engine.navShare(b)>Engine.navShare(a)?b:a).id;
      if(e.id===_bigId){
        const mfMat=new THREE.LineBasicMaterial({color:0x8FD3FF,transparent:true,opacity:.30,blending:THREE.AdditiveBlending,depthWrite:false});
        const mfg=new THREE.Group(); const R=r*1.85;
        for(let k=0;k<6;k++){ const pts=[];
          for(let an=0;an<=72;an++){ const th=an/72*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(th)*R,Math.sin(th)*R,0)); }
          const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),mfMat);
          line.rotation.y=k/6*Math.PI; mfg.add(line); }
        mfg.rotation.x=0.32; mesh.add(mfg); mesh.userData_mag=mfg;
      }
    })();
    const hg=glowSprite(e.color,e.color+"AA"); hg.scale.set(r*2.9,r*2.9,1); hg.material.opacity=.32; hg.material.depthTest=true; hg.renderOrder=-2; scene.add(hg); halos.push(hg);
    // atmosphère : lisière lumineuse en face arrière (vrai volume)
    const atm=new THREE.Mesh(new THREE.SphereGeometry(r*1.045,48,48),
      new THREE.MeshBasicMaterial({color:new THREE.Color(e.color),transparent:true,opacity:.22,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));
    mesh.add(atm);
    // couche nuageuse pour les grandes planètes
    if(r>7){
      const cl=new THREE.Mesh(new THREE.SphereGeometry(r*1.035,32,32),
        new THREE.MeshStandardMaterial({map:cloudTexture(seedOf(e.id)+9,128,64),transparent:true,opacity:e.risk==="risk"?.18:.34,depthWrite:false,roughness:1,envMapIntensity:0}));
      mesh.add(cl); clouds.push(cl); mesh.userData_cloudMat=cl.material;
    }
    // anneaux de type Saturne — mondes fx "saturnRings" — vraie matière 3D
    if(e.fx&&e.fx.indexOf("saturnRings")>-1){
      const rg=new THREE.Group();
      const inner=r*1.45, outer=r*2.75;
      // texture radiale : bandes + division de Cassini
      const rtex=noiseTex(1024,8,(cx,w,h)=>{
        for(let x=0;x<w;x++){
          const u=x/w;
          let a=.5+.34*Math.sin(u*64)+.2*Math.sin(u*201+2)+.12*Math.sin(u*517+5);
          if(u>.56&&u<.645){ a*=.08; if(u<.575||u>.63) a=.35; } // Cassini aux bords éclairés
          if(u>.30&&u<.318) a*=.25; // division d'Encke fine
          if(u<.03||u>.97) a*=u<.03?u/.03:(1-u)/.03;
          // palette : or → rose poudré → ivoire selon le rayon
          const r2=255, g2=Math.round(170+55*Math.sin(u*9+1)), b2=Math.round(105+90*Math.pow(u,1.4));
          cx.fillStyle=`rgba(${r2},${g2},${b2},${Math.max(0,Math.min(.9,a))})`;
          cx.fillRect(x,0,1,h);
        }
      });
      const rgeo=new THREE.RingGeometry(inner,outer,160,1);
      // UV radiales pour que les bandes suivent le rayon
      const pos=rgeo.attributes.position, uv=rgeo.attributes.uv;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i), y=pos.getY(i), rr=Math.sqrt(x*x+y*y);
        uv.setXY(i,(rr-inner)/(outer-inner),.5);
      }
      const band=new THREE.Mesh(rgeo,new THREE.MeshBasicMaterial({map:rtex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
      band.rotation.x=Math.PI/2; rg.add(band);
      // voile lumineux interne (sheen)
      const sheen=new THREE.Mesh(rgeo.clone(),new THREE.MeshBasicMaterial({color:0xFFE6C0,transparent:true,opacity:.12,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
      sheen.rotation.x=Math.PI/2; sheen.position.y=.15; rg.add(sheen);
      // ceinture de particules (parallaxe réelle au mouvement de caméra)
      const pn=1900, pg=new THREE.BufferGeometry(), pv=[], pc=[];
      for(let i=0;i<pn;i++){
        const a=Math.random()*Math.PI*2;
        let rr=inner+Math.random()*(outer-inner);
        const u=(rr-inner)/(outer-inner);
        if(u>.56&&u<.65&&Math.random()<.85){ rr=inner+(Math.random()<.5?.4:.75)*(outer-inner); }
        pv.push(Math.cos(a)*rr,(Math.random()-.5)*r*.035,Math.sin(a)*rr);
        const k=.75+Math.random()*.25; pc.push(k,k*.85,k*.55);
      }
      pg.setAttribute("position",new THREE.Float32BufferAttribute(pv,3));
      pg.setAttribute("color",new THREE.Float32BufferAttribute(pc,3));
      const pring=new THREE.Points(pg,new THREE.PointsMaterial({size:.42,map:DOT,vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
      rg.add(pring);
      // blocs de glace 3D : profondeur réelle + glint sous les rayons du soleil
      const iceGeo=new THREE.IcosahedronGeometry(1,0);
      const iceMat=new THREE.MeshStandardMaterial({color:0xE8F0FA,roughness:.16,metalness:.5,emissive:0x29384a,emissiveIntensity:.2,flatShading:true});
      const NIce=180, ice=new THREE.InstancedMesh(iceGeo,iceMat,NIce); const dchunk=new THREE.Object3D();
      for(let i=0;i<NIce;i++){ const a=Math.random()*Math.PI*2; let R=inner+Math.random()*(outer-inner);
        const u=(R-inner)/(outer-inner); if(u>.56&&u<.65&&Math.random()<.7) R=inner+(Math.random()<.5?.4:.78)*(outer-inner);
        dchunk.position.set(Math.cos(a)*R,(Math.random()-.5)*r*.05,Math.sin(a)*R);
        dchunk.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
        dchunk.scale.setScalar(r*(0.012+Math.random()*0.055)); dchunk.updateMatrix(); ice.setMatrixAt(i,dchunk.matrix); }
      ice.instanceMatrix.needsUpdate=true; rg.add(ice);
      // éclats scintillants (façon mille feux)
      const spg=new THREE.BufferGeometry(), spv=[];
      for(let i=0;i<80;i++){ const a=Math.random()*Math.PI*2, R=inner+Math.random()*(outer-inner);
        spv.push(Math.cos(a)*R,(Math.random()-.5)*r*.05,Math.sin(a)*R); }
      spg.setAttribute("position",new THREE.Float32BufferAttribute(spv,3));
      const spk=new THREE.Points(spg,new THREE.PointsMaterial({size:r*.07,map:STAR,color:0xFFFFFF,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true}));
      spk.frustumCulled=false; rg.add(spk); mesh.userData_sparkle=spk;
      rg.rotation.set(.07,0,.035); mesh.add(rg);
      mesh.userData_ring=rg;
    }
    // anneau fin améthyste — mondes fx "thinRing"
    if(e.fx&&e.fx.indexOf("thinRing")>-1){
      const rg2=new THREE.Group();
      [[1.55,1.72,.4],[1.8,1.88,.26]].forEach(([a2,b2,op])=>{
        const ring=new THREE.Mesh(new THREE.RingGeometry(r*a2,r*b2,96),
          new THREE.MeshBasicMaterial({color:0xC9A8FF,transparent:true,opacity:op,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
        ring.rotation.x=Math.PI/2; rg2.add(ring); });
      rg2.rotation.set(.09,0,-.05); mesh.add(rg2);
    }
    // calottes polaires glacées — mondes fx "polarCaps"
    if(e.fx&&e.fx.indexOf("polarCaps")>-1){
      [1,-1].forEach(s2=>{
        const cap=new THREE.Mesh(new THREE.SphereGeometry(r*.42,24,16),
          new THREE.MeshStandardMaterial({color:0xEAF6FF,roughness:.35,metalness:.05,emissive:0xBFE8FF,emissiveIntensity:.12}));
        cap.scale.y=.32; cap.position.y=s2*r*.92; mesh.add(cap);
      });
    }
    mesh.userData.precess=Math.random()*7;
    HD_QUEUE.push({e, pmat, mesh});
    // anneau d'alerte pulsant pour les risques
    if(e.risk==="risk"){
      const al=new THREE.Mesh(new THREE.TorusGeometry(r*1.8,.4,10,72),
        new THREE.MeshBasicMaterial({color:0xFF6B5A,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));
      al.rotation.x=Math.PI/2; mesh.add(al); alerts.push(al);
    }
    // lunes = emprunts du véhicule
    e.loans.forEach((l,k)=>{
      const mr=Math.min(r*.30, 1.6+Math.sqrt(l.crd/1e6));
      const moon=new THREE.Mesh(new THREE.SphereGeometry(mr,32,24),
        new THREE.MeshStandardMaterial({map:moonTexture(seedOf(e.id)+k*17, e.color),bumpMap:moonTexture(seedOf(e.id)+k*17,e.color),bumpScale:.12,roughness:.95,metalness:.03}));
      moon.userData={host:mesh, md:r*(2.3+k*.95), ma:Math.random()*7, ms:(.7+Math.random()*.6)/(1+k*.4), tilt:(Math.random()-.5)*.7, entityId:e.id, loanIdx:k, r:mr, id:'moon'};
      scene.add(moon); moons.push(moon);
    });
    // orbite : trait fin + lueur large
    const oc=e.risk==="risk"?0xFF6B5A:0x6FE3FF;
    const orb=new THREE.Mesh(new THREE.RingGeometry(dist-.35,dist+.35,180),
      new THREE.MeshBasicMaterial({color:oc,transparent:true,opacity:e.risk==="risk"?.24:.10,side:THREE.DoubleSide,depthWrite:false,depthTest:true}));
    orb.rotation.x=Math.PI/2-incl; scene.add(orb);
    const orbGlow=new THREE.Mesh(new THREE.RingGeometry(dist-2.2,dist+2.2,180),
      new THREE.MeshBasicMaterial({color:oc,transparent:true,opacity:.025,side:THREE.DoubleSide,depthWrite:false}));
    orbGlow.rotation.x=Math.PI/2-incl; scene.add(orbGlow);
    // flux financiers vers le soleil
    const fg=new THREE.BufferGeometry();
    fg.setAttribute("position", new THREE.Float32BufferAttribute(new Array(22*3).fill(0),3));
    const fp=new THREE.Points(fg, new THREE.PointsMaterial({color:new THREE.Color(e.color),size:1.3,map:DOT,alphaTest:.02,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); fp.visible=false;
    scene.add(fp); flows.push({pts:fp, planet:mesh, phase:Math.random(), speed:.1+.06*Math.random()});
  });
  // traînées orbitales lumineuses
  // 3.73 : micro-vie orbitale - satellites artificiels a balise, stations pour les poids lourds
  const SATS=[];
  planets.forEach((m,pi)=>{ const r0=(m.geometry.parameters&&m.geometry.parameters.radius)||6;
    const n=(pi<3?2:1);
    for(let k=0;k<n;k++){
      const sg=new THREE.Group();
      sg.add(new THREE.Mesh(new THREE.BoxGeometry(r0*.11,r0*.05,r0*.05), new THREE.MeshStandardMaterial({color:0xC8D2E4,roughness:.35,metalness:.8})));
      sg.add(new THREE.Mesh(new THREE.BoxGeometry(r0*.012,r0*.05,r0*.30), new THREE.MeshStandardMaterial({color:0x27408A,roughness:.25,metalness:.6,emissive:0x122650,emissiveIntensity:.5})));
      const bec=glowSprite("#FF6A55","rgba(255,130,105,1)"); bec.scale.set(r0*.16,r0*.16,1); bec.material.opacity=0; sg.add(bec);
      scene.add(sg);
      SATS.push({g:sg,p:m,r:r0*(1.8+k*.85),sp:(.5+((pi*7+k*13)%10)/14)*(k%2?-1:1),ph:(pi*2.1+k*2.7)%6.28,ci:Math.cos(.3+(pi%5)*.22),si:Math.sin(.3+(pi%5)*.22),bec:bec,st:false});
    }
    if(pi<3){
      const st=new THREE.Group();
      st.add(new THREE.Mesh(new THREE.OctahedronGeometry(r0*.09), new THREE.MeshStandardMaterial({color:0xAAB6CC,roughness:.4,metalness:.75,emissive:0x0E1A30,emissiveIntensity:.5})));
      st.add(new THREE.Mesh(new THREE.TorusGeometry(r0*.16,r0*.02,8,26), new THREE.MeshStandardMaterial({color:0x8FA2C4,roughness:.35,metalness:.8})));
      const win=glowSprite("#9FD8FF","rgba(180,220,255,1)"); win.scale.set(r0*.2,r0*.2,1); win.material.opacity=.28; st.add(win);
      scene.add(st);
      SATS.push({g:st,p:m,r:r0*2.6,sp:.22*(pi%2?-1:1),ph:pi*1.7,ci:Math.cos(.9),si:Math.sin(.9),bec:null,st:true});
    }
  });
  const trails=planets.map((m,ti)=>{
    const n=16, tg2=new THREE.BufferGeometry();
    tg2.setAttribute("position",new THREE.Float32BufferAttribute(new Array(n*3).fill(0),3));
    const pts=new THREE.Points(tg2,new THREE.PointsMaterial({color:new THREE.Color(DATA.entities[ti].color),size:1.2,map:DOT,alphaTest:.02,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); pts.visible=false;
    scene.add(pts); return {pts, hist:[], host:m};
  });
  // montée en gamme progressive des mondes (512×256), une planète à la fois
  HD_QUEUE.forEach((q,i)=>setTimeout(()=>{ try{
    const hd=worldTexture(q.e,1024,512);
    q.pmat.map=hd.map; q.pmat.bumpMap=hd.map; q.pmat.emissiveMap=hd.lights; q.pmat.needsUpdate=true;
    if(q.mesh.userData_cloudMat){ q.mesh.userData_cloudMat.map=cloudTexture(seedOf(q.e.id)+9,384,192); q.mesh.userData_cloudMat.needsUpdate=true; }
  }catch(err){} }, 900+i*650));
  const lastDist=ORB[ORB.length-1]||420;

  /* ====== CEINTURE D'ASTÉROÏDES (instanciée) ====== */
  const beltR=((ORB[3]||280)+(ORB[4]||330))/2; // entre 4e et 5e orbite
  /* 3.75 : sculpteur d'asteroides - forme irreguliere par bruit + crateres d'impact a rebord */
  // 3.81 : texture miniere - roche sombre veinee de minerai chaud (fer/cuivre)
  const _oreTex=(function(){ const W=256,H=128,cv=document.createElement("canvas");cv.width=W;cv.height=H;const cx=cv.getContext("2d");
    const im=cx.createImageData(W,H);
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i4=(y*W+x)*4;
      const n=fbm(x/W*7,y/H*4,91,5), g=fbm(x/W*22,y/H*11,53,4);
      let r=64+n*40, gg=62+n*36, b=60+n*34;
      if(g>.66){ const q=(g-.66)/.34; r=r*(1-q)+188*q; gg=gg*(1-q)+96*q; b=b*(1-q)+44*q; }
      if(g>.8){ const q=(g-.8)/.2; r=r*(1-q)+236*q; gg=gg*(1-q)+150*q; b=b*(1-q)+70*q; }
      im.data[i4]=r; im.data[i4+1]=gg; im.data[i4+2]=b; im.data[i4+3]=255; }
    cx.putImageData(im,0,0);
    const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t; })();
  const _oreEmis=(function(){ const W=256,H=128,cv=document.createElement("canvas");cv.width=W;cv.height=H;const cx=cv.getContext("2d");
    const im=cx.createImageData(W,H);
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i4=(y*W+x)*4;
      const g=fbm(x/W*22,y/H*11,53,4); let e=0;
      if(g>.8){ e=(g-.8)/.2; }
      im.data[i4]=255*e; im.data[i4+1]=120*e; im.data[i4+2]=40*e; im.data[i4+3]=255; }
    cx.putImageData(im,0,0);
    const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; })();
  function rockGeo(seed,detail,nCraters,amp){
    const g=new THREE.IcosahedronGeometry(1,detail);
    const pos=g.attributes.position, v=new THREE.Vector3();
    let st=(seed*2654435761)%2147483647; if(st<=0)st+=2147483646;
    const rnd=()=>{ st=st*16807%2147483647; return (st-1)/2147483646; };
    const craters=[];
    for(let i=0;i<nCraters;i++){ const u2=rnd()*2-1, th=rnd()*6.283, q=Math.sqrt(Math.max(0,1-u2*u2));
      craters.push({x:q*Math.cos(th),y:u2,z:q*Math.sin(th),r:.28+rnd()*.42,k:.10+rnd()*.15}); }
    const o1=rnd()*10,o2=rnd()*10,o3=rnd()*10;
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i).normalize();
      const n1=Math.sin(v.x*6.3+o1)*Math.sin(v.y*5.1+o2)*Math.sin(v.z*7.7+o3);
      const n2=Math.sin(v.x*13.1+o2)*Math.sin(v.y*11.3+o3)*Math.sin(v.z*12.7+o1);
      let rr=1+n1*amp+n2*amp*.35;
      for(const c of craters){ const dx=v.x-c.x,dy=v.y-c.y,dz=v.z-c.z, dd=Math.sqrt(dx*dx+dy*dy+dz*dz);
        if(dd<c.r){ const t=dd/c.r; rr+=c.k*((t*t-1)+Math.max(0,1-Math.abs(t-.9)*6)*.55); } }
      pos.setXYZ(i,v.x*rr,v.y*rr,v.z*rr);
    }
    g.computeVertexNormals(); return g;
  }
  const AST=840;
  const belt=new THREE.InstancedMesh(rockGeo(7,3,7,.24),
    new THREE.MeshStandardMaterial({map:_oreTex,emissiveMap:_oreEmis,emissive:0xFF6420,emissiveIntensity:.5,roughness:.9,metalness:.22,envMapIntensity:.1}),AST);
  const aAng=[],aRad=[],aY=[],aSpd=[],aScl=[],aRx=[],aRy=[],aSx=[],aSz=[];
  const dummy=new THREE.Object3D();
  for(let i=0;i<AST;i++){
    aAng.push(Math.random()*7); aRad.push(beltR+(Math.random()-.5)*36);
    aY.push((Math.random()-.5)*12); aSpd.push(.00022+Math.random()*.0003);
    aScl.push(.7+Math.pow(Math.random(),1.6)*4.2); aRx.push(Math.random()*7); aRy.push(Math.random()*7); aSx.push(.7+Math.random()*.6); aSz.push(.7+Math.random()*.6);
  }
  scene.add(belt);
  // — cristaux de glace à facettes : scintillent sur la face éclairée quand ils tournent —
  const crystGeo=(function(){ const g=rockGeo(13,1,0,.42); g.scale(1,1.55,.85); return g; })();
  const crystMat=new THREE.MeshStandardMaterial({color:0xCFE6FF,metalness:.9,roughness:.12,emissive:0x16304E,emissiveIntensity:.08,flatShading:true,envMapIntensity:.3});
  const NCR=150, cryst=new THREE.InstancedMesh(crystGeo,crystMat,NCR);
  const crystD=[], _crQ=new THREE.Quaternion(), _crE=new THREE.Euler(), _crS=new THREE.Vector3(), _crP=new THREE.Vector3(), _crM=new THREE.Matrix4();
  for(let i=0;i<NCR;i++){ crystD.push({ ang:Math.random()*Math.PI*2, rad:beltR+(Math.random()-.5)*44, y:(Math.random()-.5)*15,
    spd:.0002+Math.random()*.00035, sc:.8+Math.random()*2.3, rx:Math.random()*6,ry:Math.random()*6,rz:Math.random()*6,
    vrx:(Math.random()-.5)*.06,vry:(Math.random()-.5)*.06,vrz:(Math.random()-.5)*.06 }); }
  cryst.frustumCulled=false; scene.add(cryst);
  // — éclats scintillants dans la ceinture (vivant + brillance au zoom, 1 draw call) —
  const _twN=380, _twPos=[], _twPh=[], _twSp=[];
  for(let i=0;i<_twN;i++){ const a=Math.random()*Math.PI*2, R=beltR+(Math.random()-.5)*64; _twPos.push(Math.cos(a)*R,(Math.random()-.5)*19,Math.sin(a)*R); _twPh.push(Math.random()*6.283); _twSp.push(1.3+Math.random()*2.8); }
  const _twG=new THREE.BufferGeometry();
  _twG.setAttribute("position",new THREE.Float32BufferAttribute(_twPos,3));
  _twG.setAttribute("ph",new THREE.Float32BufferAttribute(_twPh,1));
  _twG.setAttribute("sp",new THREE.Float32BufferAttribute(_twSp,1));
  const _twMat=new THREE.ShaderMaterial({ uniforms:{uT:{value:0},uBright:{value:1},uTex:{value:STAR},uColor:{value:new THREE.Color(0xE6F4FF)}},
    vertexShader:"attribute float ph;attribute float sp;uniform float uT;varying float vT;void main(){float s=sin(uT*sp+ph);float tw=pow(max(s,0.0),2.6);vec3 wp=(modelMatrix*vec4(position,1.0)).xyz;vec3 L=normalize(-wp);vec3 V=normalize(cameraPosition-wp);float d=dot(V,L);float sunK=0.07+0.93*pow(clamp(d,0.0,1.0),2.0)+1.4*pow(clamp(-d,0.0,1.0),6.0);vT=(0.13+tw)*sunK;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=(2.0+6.5*tw)*(340.0/max(40.0,-mv.z));gl_Position=projectionMatrix*mv;}",
    fragmentShader:"uniform sampler2D uTex;uniform vec3 uColor;uniform float uBright;varying float vT;void main(){vec4 c=texture2D(uTex,gl_PointCoord);gl_FragColor=vec4(uColor,1.0)*c*vT*uBright;}",
    transparent:true,blending:THREE.AdditiveBlending,depthWrite:false });
  const _twinkle=new THREE.Points(_twG,_twMat); _twinkle.frustumCulled=false; scene.add(_twinkle);
  /* ====== CEINTURE DE KUIPER ====== */
  const kg=new THREE.BufferGeometry(), kv=[];
  for(let i=0;i<650;i++){ const a=Math.random()*7, R=lastDist+70+Math.random()*90;
    kv.push(Math.cos(a)*R,(Math.random()-.5)*16,Math.sin(a)*R); }
  kg.setAttribute("position",new THREE.Float32BufferAttribute(kv,3));
  const kuiper=new THREE.Points(kg,new THREE.PointsMaterial({color:0x7E92B8,size:1.5,transparent:true,opacity:.5,depthWrite:false}));
  scene.add(kuiper);
  /* ====== POUSSIÈRE ZODIACALE ====== */
  const dg=new THREE.BufferGeometry(), dv=[];
  for(let i=0;i<1400;i++){ const a=Math.random()*7, R=70+Math.random()*(lastDist+140);
    dv.push(Math.cos(a)*R,(Math.random()-.5)*4,Math.sin(a)*R); }
  dg.setAttribute("position",new THREE.Float32BufferAttribute(dv,3));
  scene.add(new THREE.Points(dg,new THREE.PointsMaterial({color:0xAFC2E2,size:1,map:DOT,alphaTest:.02,transparent:true,opacity:.13,depthWrite:false})));

  /* ====== COMÈTE ====== */
  const comet=new THREE.Mesh(new THREE.SphereGeometry(2.4,18,18),
    new THREE.MeshStandardMaterial({color:0xCFEAFF,emissive:0x9FD4FF,emissiveIntensity:.8,roughness:.3}));
  scene.add(comet);
  const cometGlow=glowSprite("#BFE2FF","rgba(220,240,255,.95)"); cometGlow.scale.set(22,22,1); scene.add(cometGlow);
  const tg=new THREE.BufferGeometry();
  tg.setAttribute("position",new THREE.Float32BufferAttribute(new Array(80*3).fill(0),3));
  const tail=new THREE.Points(tg,new THREE.PointsMaterial({color:0xBFE2FF,size:2.4,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));
  scene.add(tail);
  let cTh=Math.random()*7;
  // étincelles de ceinture (détail d'approche)
  let beltSpark=null;
  { const bg2=new THREE.BufferGeometry(), bv2=[];
    for(let i=0;i<130;i++){ const a=Math.random()*7, R=205+Math.random()*46;
      bv2.push(Math.cos(a)*R,(Math.random()-.5)*7,Math.sin(a)*R); }
    bg2.setAttribute("position",new THREE.Float32BufferAttribute(bv2,3));
    beltSpark=new THREE.Points(bg2,new THREE.PointsMaterial({color:0xFFE9C2,size:1.3,map:DOT,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
    beltSpark.visible=false; scene.add(beltSpark); }
  /* ====== FOND HUBBLE : champ profond ====== */
  (function(){
    const W=2048,H=1024,cv=document.createElement("canvas");cv.width=W;cv.height=H;
    const cx=cv.getContext("2d");
    // 3.86 : FOND EPURE - noir absolu, aucune structure nuageuse. Rien que des etoiles nettes.
    cx.fillStyle="#010208"; cx.fillRect(0,0,W,H);
    const TINTS=[[255,255,255],[255,255,255],[255,255,255],[255,255,255],[200,216,255],[172,198,255],[150,182,255],[255,238,210],[255,216,172],[255,196,150]];
    // champ d'etoiles peint : dense, colore, distribution realiste (beaucoup de faibles, rares brillantes)
    for(let i=0;i<3000;i++){
      const x=Math.random()*W, y=Math.random()*H, q=Math.random();
      const tc=TINTS[(Math.random()*TINTS.length)|0];
      const br=0.16+Math.pow(Math.random(),2.4)*0.84;
      const rad=q<0.90?0.55:(q<0.985?0.9:1.35);
      cx.fillStyle="rgba("+tc[0]+","+tc[1]+","+tc[2]+","+br.toFixed(2)+")";
      cx.beginPath(); cx.arc(x,y,rad,0,7); cx.fill();
      // fin halo lumineux pour les plus brillantes (eclat, jamais tache)
      if(br>0.82){ const g=cx.createRadialGradient(x,y,0,x,y,rad*3.4);
        g.addColorStop(0,"rgba("+tc[0]+","+tc[1]+","+tc[2]+",0.45)"); g.addColorStop(1,"rgba(0,0,0,0)");
        cx.fillStyle=g; cx.beginPath(); cx.arc(x,y,rad*3.4,0,7); cx.fill(); }
    }
    const tex=new THREE.CanvasTexture(cv);
    const bg=new THREE.Mesh(new THREE.SphereGeometry(4200,32,20),
      new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false}));
    scene.add(bg);
  })();
  /* ====== STARFIGHTER (mode cinéma) — design original haute définition ====== */
  // texture de coque procédurale : plaques, lignes de panneau, salissures, rivets
  function shipHullTex(base,stripe){
    const cv=document.createElement("canvas"); cv.width=256; cv.height=256; const x=cv.getContext("2d");
    x.fillStyle=base; x.fillRect(0,0,256,256);
    for(let i=0;i<10;i++){ x.fillStyle="rgba(255,255,255,"+(0.02+Math.random()*0.04)+")"; x.fillRect(Math.random()*256,Math.random()*256,16+Math.random()*64,16+Math.random()*64); }
    if(stripe){ x.fillStyle=stripe; x.fillRect(0,150,256,46); x.fillStyle="rgba(0,0,0,.18)"; for(let i=0;i<10;i++) x.fillRect(Math.random()*256,150,6+Math.random()*14,46); }
    x.strokeStyle="rgba(0,0,0,.40)"; x.lineWidth=1.4;
    for(let g=0;g<=256;g+=32){ x.beginPath();x.moveTo(g,0);x.lineTo(g,256);x.stroke(); x.beginPath();x.moveTo(0,g);x.lineTo(256,g);x.stroke(); }
    for(let i=0;i<46;i++){ x.fillStyle="rgba(0,0,0,"+(0.05+Math.random()*0.14)+")"; x.beginPath();x.arc(Math.random()*256,Math.random()*256,2+Math.random()*9,0,7);x.fill(); }
    for(let i=0;i<80;i++){ x.fillStyle="rgba(255,255,255,.07)"; x.beginPath();x.arc(Math.random()*256,Math.random()*256,1,0,7);x.fill(); }
    const t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t;
  }
  const _hullTex=shipHullTex("#33373E","#C0631E");
  const _hullPlain=shipHullTex("#2C3037",null);
  const ship=new THREE.Group(); ship.visible=false; scene.add(ship);
  const _shipFill=new THREE.PointLight(0xCFE0FF,1.35,150,2.0); _shipFill.position.set(6,10,14); ship.add(_shipFill);
  let _cinedbg=document.getElementById("cinedbg"); if(!_cinedbg){ _cinedbg=document.createElement("div"); _cinedbg.id="cinedbg"; _cinedbg.style.cssText="position:fixed;top:96px;left:10px;z-index:120;font:10px/1.3 ui-monospace,monospace;color:#7fe;background:rgba(0,0,0,.45);padding:4px 7px;border-radius:7px;pointer-events:none;display:none;letter-spacing:.02em"; document.body.appendChild(_cinedbg); }
  if(!document.getElementById("expflash")){ const _ef=document.createElement("div"); _ef.id="expflash";
    _ef.style.cssText="position:fixed;inset:0;z-index:57;pointer-events:none;opacity:0;mix-blend-mode:screen;background:radial-gradient(circle at 50% 54%, rgba(255,184,96,.9), rgba(255,120,40,.28) 46%, transparent 72%)"; document.body.appendChild(_ef); }
  if(!document.getElementById("bossflash")){ const _bf=document.createElement("div"); _bf.id="bossflash"; _bf.style.cssText="position:fixed;inset:0;z-index:58;pointer-events:none;opacity:0;mix-blend-mode:screen;background:radial-gradient(circle at 50% 50%, rgba(255,255,255,.96), rgba(255,210,150,.5) 42%, transparent 74%)"; document.body.appendChild(_bf); }
  if(!document.getElementById("beamflash")){ const _bfx=document.createElement("div"); _bfx.id="beamflash";
    _bfx.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:58;opacity:0;mix-blend-mode:screen;background:radial-gradient(circle at 50% 48%, rgba(225,242,255,.95), rgba(150,200,255,.55) 42%, rgba(120,180,255,0) 75%);transition:opacity .05s linear;"; document.body.appendChild(_bfx); }
  (function(){
    const hull =new THREE.MeshStandardMaterial({map:_hullTex,bumpMap:_hullTex,bumpScale:.04,color:0xCBD0D8,roughness:.5,metalness:.66,envMapIntensity:.6,emissive:0x3A4A66,emissiveIntensity:.5});
    const hullP=new THREE.MeshStandardMaterial({map:_hullPlain,bumpMap:_hullPlain,bumpScale:.04,color:0xBCC2CC,roughness:.6,metalness:.6});
    const grey =new THREE.MeshStandardMaterial({color:0x767E8A,roughness:.46,metalness:.64,envMapIntensity:.55,emissive:0x2C3848,emissiveIntensity:.45});
    const dark =new THREE.MeshStandardMaterial({color:0x1B2026,roughness:.4,metalness:.74,envMapIntensity:.55,emissive:0x20303F,emissiveIntensity:.5});
    const black=new THREE.MeshStandardMaterial({color:0x0A0C10,roughness:.7,metalness:.4});
    const orange=new THREE.MeshStandardMaterial({color:0xC2611C,roughness:.55,metalness:.4});
    const glass=new THREE.MeshStandardMaterial({color:0x0E1620,roughness:.05,metalness:.6,emissive:0x3A6E9C,emissiveIntensity:.7});
    const hot  =new THREE.MeshBasicMaterial({color:0xCFefff});
    const eng=[], cannons=[], engJets=[];
    // ——— FUSELAGE : profil anguleux en plusieurs tronçons ———
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.92,1.0,4.6,8),hull); body.rotation.x=Math.PI/2; body.scale.y=.78; ship.add(body);
    // capot avant qui s'effile (hexagonal, anguleux)
    const fwd=new THREE.Mesh(new THREE.CylinderGeometry(.5,.92,2.4,8),hull); fwd.rotation.x=Math.PI/2; fwd.position.z=3.4; fwd.scale.y=.78; ship.add(fwd);
    // long nez plat type T-70 (boîte effilée)
    const beak=new THREE.Mesh(new THREE.CylinderGeometry(.12,.5,3.2,6),hullP); beak.rotation.x=Math.PI/2; beak.position.z=5.5; beak.scale.set(1.25,.55,1); ship.add(beak);
    const beakTip=new THREE.Mesh(new THREE.ConeGeometry(.13,.7,6),dark); beakTip.rotation.x=Math.PI/2; beakTip.position.z=7.2; beakTip.scale.set(1.25,.55,1); ship.add(beakTip);
    // bande orange ventrale
    const vstripe=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,5.4),orange); vstripe.position.set(0,-.62,1.2); ship.add(vstripe);
    // arrière : pont moteur
    const deck=new THREE.Mesh(new THREE.BoxGeometry(1.5,.7,2.2),hull); deck.position.set(0,.18,-2.0); ship.add(deck);
    const aft=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.18,1.4,8),dark); aft.rotation.x=Math.PI/2; aft.position.z=-3.0; aft.scale.y=.78; ship.add(aft);
    // greebles dorsaux
    for(let i=0;i<3;i++){ const gb=new THREE.Mesh(new THREE.BoxGeometry(.3,.22,.5),grey); gb.position.set((i-1)*.42,.6,-1.2); ship.add(gb); }
    // ——— COCKPIT caréné ———
    const tub=new THREE.Mesh(new THREE.BoxGeometry(1.05,.7,1.9),hull); tub.position.set(0,.5,.7); ship.add(tub);
    const glassM=new THREE.Mesh(new THREE.SphereGeometry(.56,18,14,0,Math.PI*2,0,Math.PI*.6),glass); glassM.rotation.x=Math.PI/2.1; glassM.position.set(0,.84,.7); ship.add(glassM);
    // arceaux de canopée
    [-.25,0,.25].forEach(z=>{ const ar=new THREE.Mesh(new THREE.TorusGeometry(.5,.035,6,16,Math.PI),grey); ar.rotation.x=Math.PI/2; ar.position.set(0,.84,.7+z); ship.add(ar); });
    // dôme techno derrière le cockpit (greeble générique)
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12,0,Math.PI*2,0,Math.PI*.6),grey); dome.position.set(0,.78,-.55); ship.add(dome);
    const domeTop=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.3,8),dark); domeTop.position.set(0,1.05,-.55); ship.add(domeTop);
    // ——— 4 AILES EN X (S-foils) détaillées ———
    const WING=[[1,1],[1,-1],[-1,1],[-1,-1]];
    WING.forEach(([uy,ux])=>{
      const wing=new THREE.Group(); wing.position.set(0,0,-1.9); wing.rotation.z=ux*(uy>0?-0.40:0.40); ship.add(wing);
      // panneau d'aile patiné + bande orange
      const panel=new THREE.Mesh(new THREE.BoxGeometry(6.6,.16,1.7),hull); panel.position.set(ux*4.1,0,0); wing.add(panel);
      const ostripe=new THREE.Mesh(new THREE.BoxGeometry(6.6,.18,.34),orange); ostripe.position.set(ux*4.1,0,.55); wing.add(ostripe);
      const wtip=new THREE.Mesh(new THREE.BoxGeometry(.5,.2,1.7),dark); wtip.position.set(ux*7.3,0,0); wing.add(wtip);
      // NACELLE MOTEUR avec PRISE D'AIR (turbine)
      const nac=new THREE.Mesh(new THREE.CylinderGeometry(.52,.5,2.6,16),grey); nac.rotation.x=Math.PI/2; nac.position.set(ux*1.5,0,-.5); wing.add(nac);
      const cowl=new THREE.Mesh(new THREE.CylinderGeometry(.6,.52,.7,16),hullP); cowl.rotation.x=Math.PI/2; cowl.position.set(ux*1.5,0,.95); wing.add(cowl);
      const intake=new THREE.Mesh(new THREE.TorusGeometry(.5,.09,10,20),dark); intake.position.set(ux*1.5,0,1.32); wing.add(intake);
      const recess=new THREE.Mesh(new THREE.CircleGeometry(.46,20),black); recess.position.set(ux*1.5,0,1.30); wing.add(recess);
      for(let f=0;f<7;f++){ const fin=new THREE.Mesh(new THREE.BoxGeometry(.5,.05,.06),grey); fin.position.set(ux*1.5,0,1.31); fin.rotation.z=f*Math.PI/7; wing.add(fin); }
      // tuyère arrière incandescente
      const noz=new THREE.Mesh(new THREE.CylinderGeometry(.5,.4,.6,16),dark); noz.rotation.x=Math.PI/2; noz.position.set(ux*1.5,0,-1.95); wing.add(noz);
      const disc=new THREE.Mesh(new THREE.CircleGeometry(.36,18),hot); disc.position.set(ux*1.5,0,-2.28); disc.rotation.y=Math.PI; wing.add(disc);
      const halo=glowSprite("#7FD0FF","rgba(160,215,255,1)"); halo.scale.set(2.0,2.0,1); halo.position.set(ux*1.5,0,-2.5); wing.add(halo); eng.push({halo,disc});
      // — PLASMA ionique multi-couches : colonne de sprites additifs (cœur blanc -> cyan -> bleu) —
      const _plume=new THREE.Group(); _plume.position.set(ux*1.5,0,-2.4);
      const _pcol=["#FFFFFF","#EAF8FF","#C4ECFF","#92D6FF","#5FACFF","#3E78E0"];
      for(let _s=0;_s<7;_s++){ const _sp=new THREE.Sprite(new THREE.SpriteMaterial({map:DOT,color:_pcol[Math.min(_pcol.length-1,_s)],transparent:true,opacity:.92-_s*.12,blending:THREE.AdditiveBlending,depthWrite:false}));
        const _w=1.6-_s*0.15; _sp.scale.set(_w,_w,1); _sp.position.z=-_s*0.6; _plume.add(_sp); }
      wing.add(_plume); engJets.push(_plume);
      // CANON long en bout d'aile (style T-70) + embout
      const cannon=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,4.4,10),dark); cannon.rotation.x=Math.PI/2; cannon.position.set(ux*7.4,0,2.0); wing.add(cannon);
      const cring=new THREE.Mesh(new THREE.TorusGeometry(.12,.04,6,12),grey); cring.rotation.x=Math.PI/2; cring.position.set(ux*7.4,0,1.0); wing.add(cring);
      const cmz=new THREE.Mesh(new THREE.CylinderGeometry(.12,.08,.5,10),dark); cmz.rotation.x=Math.PI/2; cmz.position.set(ux*7.4,0,4.3); wing.add(cmz);
      const mk=new THREE.Object3D(); mk.position.set(ux*7.4,0,4.6); wing.add(mk); cannons.push(mk);
    });
    // — PLASMA central plus long (colonne) + pointe (nose) pour le rayon —
    const _cPlume=new THREE.Group(); _cPlume.position.set(0,.18,-2.4);
    const _ccol=["#FFFFFF","#EAF8FF","#CAEEFF","#9AD8FF","#6FB4FF","#4A86F0","#3060C8"];
    for(let _s=0;_s<9;_s++){ const _sp=new THREE.Sprite(new THREE.SpriteMaterial({map:DOT,color:_ccol[Math.min(_ccol.length-1,_s)],transparent:true,opacity:.85-_s*.09,blending:THREE.AdditiveBlending,depthWrite:false}));
      const _w=2.15-_s*0.18; _sp.scale.set(_w,_w,1); _sp.position.z=-_s*0.7; _cPlume.add(_sp); }
    ship.add(_cPlume);
    const _nose=new THREE.Object3D(); _nose.position.set(0,0.15,3.4); ship.add(_nose);
    ship.userData={eng,cannons,nose:_nose,jets:{engPlumes:engJets,cenPlume:_cPlume}};
    const TN=70, tg=new THREE.BufferGeometry(), tv=new Float32Array(TN*3);
    for(let i=0;i<TN;i++){ tv[i*3+1]=-9999; }
    tg.setAttribute("position",new THREE.BufferAttribute(tv,3));
    const trail=new THREE.Points(tg,new THREE.PointsMaterial({color:0xAFE0FF,size:1.3,map:DOT,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
    trail.frustumCulled=false; trail.visible=false; scene.add(trail);
    ship.userData.trail=trail; ship.userData.trailV=tv; ship.userData.trailHead=0;
    ship.scale.setScalar(1.45);
  })();
  const shipPos=new THREE.Vector3(0,0,0), shipPrev=new THREE.Vector3(0,0,0), _vel=new THREE.Vector3(0,0,1), _tmpV=new THREE.Vector3(), _lead=new THREE.Vector3(), _canV=new THREE.Vector3();

  /* ====== TIRS LASER — gros boltz (cœur + manteau + halo + flash) ====== */
  const BOLTS=[];
  const _boltCore=new THREE.CylinderGeometry(.15,.15,9,8); _boltCore.rotateX(Math.PI/2);
  const _boltShell=new THREE.CylinderGeometry(.4,.4,8,10); _boltShell.rotateX(Math.PI/2);
  const _coreMat =new THREE.MeshBasicMaterial({color:0xFFF2EC,transparent:true,opacity:.98,blending:THREE.AdditiveBlending,depthWrite:false});
  const _shellMat=new THREE.MeshBasicMaterial({color:0xFF2A18,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false});
  function _glowTexBolt(){ const cv=document.createElement("canvas");cv.width=cv.height=64;const cx=cv.getContext("2d");
    const g=cx.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.4,"rgba(255,120,90,.7)");g.addColorStop(1,"rgba(255,40,20,0)");
    cx.fillStyle=g;cx.fillRect(0,0,64,64); return new THREE.CanvasTexture(cv); }
  const _boltGlowTex=_glowTexBolt();
  for(let i=0;i<24;i++){
    const grp=new THREE.Group();
    grp.add(new THREE.Mesh(_boltShell,_shellMat));
    grp.add(new THREE.Mesh(_boltCore,_coreMat));
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:_boltGlowTex,color:0xFFFFFF,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
    halo.scale.set(2.1,2.1,1); halo.position.z=5; grp.add(halo);
    grp.visible=false; grp.frustumCulled=false; scene.add(grp);
    BOLTS.push({mesh:grp,active:false,v:new THREE.Vector3(),life:0});
  }
  function fireBolt(from,dir){
    const b=BOLTS.find(x=>!x.active); if(!b) return;
    b.active=true; b.life=0; b.v.copy(dir).normalize().multiplyScalar(27);
    b.mesh.position.copy(from); b.mesh.visible=true; b.mesh.lookAt(from.clone().add(b.v));
    // flash de bouche
    if(typeof _muzzle==="function") _muzzle(from);
    if(SFX) SFX.laser();
  }

  /* ====== MISSILES TÊTE CHERCHEUSE + RAYON KAMEHAMEHA ====== */
  const MISSILES=[];
  const _msBody=new THREE.CylinderGeometry(.3,.42,1.9,10); _msBody.rotateX(Math.PI/2);
  for(let i=0;i<8;i++){
    const grp=new THREE.Group();
    grp.add(new THREE.Mesh(_msBody,new THREE.MeshBasicMaterial({color:0xE6EEFF})));
    const mhalo=new THREE.Sprite(new THREE.SpriteMaterial({map:_boltGlowTex,color:0xFF9A3C,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
    mhalo.scale.set(3.6,3.6,1); mhalo.position.z=-1.2; grp.add(mhalo);
    const TN2=20, tg2=new THREE.BufferGeometry(), tv2=new Float32Array(TN2*3); for(let k=0;k<TN2;k++){tv2[k*3+1]=-9999;}
    tg2.setAttribute("position",new THREE.BufferAttribute(tv2,3));
    const mtrail=new THREE.Points(tg2,new THREE.PointsMaterial({color:0xFFC078,size:2.0,map:DOT,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));
    mtrail.frustumCulled=false; scene.add(mtrail);
    grp.visible=false; grp.frustumCulled=false; scene.add(grp);
    MISSILES.push({mesh:grp,halo:mhalo,trail:mtrail,tv:tv2,head:0,active:false,v:new THREE.Vector3(),target:null,life:0});
  }
  function launchMissile(from,dir,target){
    const m=MISSILES.find(x=>!x.active); if(!m) return;
    m.active=true; m.life=0; m.target=target||null; m.v.copy(dir).normalize().multiplyScalar(5.5);
    m.mesh.position.copy(from); m.mesh.visible=true; m.mesh.lookAt(from.clone().add(m.v));
    for(let k=0;k<m.tv.length/3;k++){ m.tv[k*3]=from.x; m.tv[k*3+1]=from.y; m.tv[k*3+2]=from.z; }
    m.trail.geometry.attributes.position.needsUpdate=true; m.head=0; m.trail.visible=true;
    if(SFX&&SFX.whoosh) SFX.whoosh();
  }
  const _msD=new THREE.Vector3(), _msL=new THREE.Vector3();
  function updateMissiles(tNow){
    for(let i=0;i<MISSILES.length;i++){ const m=MISSILES[i]; if(!m.active) continue; m.life++;
      let tgt=m.target; if(tgt&&cineRocks.indexOf(tgt)<0) tgt=m.target=null;
      if(!tgt){ let bd=1e9; for(let r=0;r<cineRocks.length;r++){ const d=cineRocks[r].position.distanceTo(m.mesh.position); if(d<bd){bd=d;tgt=cineRocks[r];} } m.target=tgt; }
      const spd=Math.min(18,m.v.length()*1.035);
      if(tgt){ _msD.copy(tgt.position).sub(m.mesh.position).normalize().multiplyScalar(spd); m.v.lerp(_msD,0.1); }
      if(m.v.length()>0) m.v.setLength(spd);
      m.mesh.position.add(m.v); _msL.copy(m.mesh.position).add(m.v); m.mesh.lookAt(_msL);
      m.head=(m.head+1)%(m.tv.length/3); const hh=m.head*3; m.tv[hh]=m.mesh.position.x; m.tv[hh+1]=m.mesh.position.y; m.tv[hh+2]=m.mesh.position.z;
      m.trail.geometry.attributes.position.needsUpdate=true;
      m.halo.material.opacity=.72+.25*Math.sin(tNow*30+i);
      if(m.head%3===0){ const pm=new THREE.Sprite(new THREE.SpriteMaterial({map:_softTex,color:0xB8C4D4,transparent:true,opacity:.5,depthWrite:false})); pm.position.copy(m.mesh.position); pm.scale.set(1.6,1.6,1); scene.add(pm); cineFx.push({t:"smoke",o:pm,life:0,max:.7,r0:1.5,vy:.015}); }
      let hit=null; for(let r=0;r<cineRocks.length;r++){ if(m.mesh.position.distanceTo(cineRocks[r].position)<cineRocks[r].userData.rad+3.0){ hit=cineRocks[r]; break; } }
      if(hit||m.life>300){ if(hit) explodeRock(hit); m.active=false; m.mesh.visible=false;
        m.trail.visible=false; for(let k2=0;k2<m.tv.length/3;k2++){ m.tv[k2*3+1]=-9999; } m.trail.geometry.attributes.position.needsUpdate=true; }
    }
  }
  const _beamShell=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,1,18,1,true),new THREE.MeshBasicMaterial({color:0x4FA8FF,transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); _beamShell.visible=false; _beamShell.frustumCulled=false; scene.add(_beamShell);
  const _beamCore=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,1,12),new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:.96,blending:THREE.AdditiveBlending,depthWrite:false})); _beamCore.visible=false; _beamCore.frustumCulled=false; scene.add(_beamCore);
  const _chargeBall=new THREE.Sprite(new THREE.SpriteMaterial({map:_boltGlowTex,color:0xCDEEFF,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false})); _chargeBall.visible=false; scene.add(_chargeBall);
  const _beamGlow=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,1,20,1,true),new THREE.MeshBasicMaterial({color:0x6FC8FF,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); _beamGlow.visible=false; _beamGlow.frustumCulled=false; scene.add(_beamGlow);
  const _beamHit=new THREE.Sprite(new THREE.SpriteMaterial({map:_boltGlowTex,color:0xEAF6FF,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false})); _beamHit.visible=false; _beamHit.frustumCulled=false; scene.add(_beamHit);
  const _beamPulses=[]; for(let i=0;i<4;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:_boltGlowTex,color:0xBFEBFF,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false})); sp.visible=false; sp.frustumCulled=false; scene.add(sp); _beamPulses.push(sp); }
  const _lockTex=(function(){ const cv=document.createElement("canvas");cv.width=cv.height=64;const c=cv.getContext("2d");
    c.strokeStyle="#54FF7E"; c.lineWidth=4; const L=14;
    [[4,4,1,1],[60,4,-1,1],[4,60,1,-1],[60,60,-1,-1]].forEach(function(q){ c.beginPath(); c.moveTo(q[0],q[1]+q[3]*L); c.lineTo(q[0],q[1]); c.lineTo(q[0]+q[2]*L,q[1]); c.stroke(); });
    return new THREE.CanvasTexture(cv); })();
  const _lockSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:_lockTex,color:0xFFFFFF,transparent:true,opacity:.95,depthWrite:false,depthTest:false})); _lockSpr.visible=false; _lockSpr.renderOrder=98; scene.add(_lockSpr);
  const _chargeSucks=[]; for(let i=0;i<8;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:_boltGlowTex,color:0x9FD8FF,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false})); sp.visible=false; scene.add(sp); _chargeSucks.push(sp); }
  const _Zax=new THREE.Vector3(0,0,1), _Yax=new THREE.Vector3(0,1,0), _beamDir=new THREE.Vector3(), _beamNose=new THREE.Vector3(), _beamMid=new THREE.Vector3(), _beamRel=new THREE.Vector3(), _beamTmp=new THREE.Vector3();
  function startBeam(){ _beamDir.set(0,0,1).applyQuaternion(ship.quaternion).normalize(); CINE.beam={phase:"charge",t:0}; if(SFX&&SFX.charge) SFX.charge(); }
  function updateBeam(tNow){ if(!CINE.beam) return; const B=CINE.beam; B.t+=DT;
    // ORIGINE = pointe du vaisseau
    _beamDir.set(0,0,1).applyQuaternion(ship.quaternion).normalize();
    if(ship.userData.nose) ship.userData.nose.getWorldPosition(_beamNose); else _beamNose.copy(shipPos).add(_beamTmp.copy(_beamDir).multiplyScalar(7));
    const flash=document.getElementById("beamflash");
    if(B.phase==="charge"){
      if(!B._boss){ B._boss=true; const bp=new THREE.Vector3().copy(_beamDir).multiplyScalar(330).add(_beamNose); B._bossMesh=spawnRock(bp, 24+Math.random()*6); B._bossMesh.userData.boss=true; }
      // l'énergie se concentre quelques secondes à la pointe (boule qui enfle + pulse)
      const CH=1.7, k=Math.min(1,B.t/CH);
      for(let i9=0;i9<_chargeSucks.length;i9++){ const sp=_chargeSucks[i9]; sp.visible=true;
        const kk=(B.t*1.6+i9/8)%1, an=i9*2.4+B.t*7, rr2=14*(1-kk);
        sp.position.copy(_beamNose).add(_beamTmp.set(Math.cos(an)*rr2, Math.sin(an*1.3)*rr2*.5, Math.sin(an)*rr2));
        const ss=1.6*(1-kk)+.3; sp.scale.set(ss,ss,1); sp.material.opacity=.75*kk; }
      _chargeBall.visible=true; _chargeBall.position.copy(_beamNose);
      const sc=(1.5+20*k*k)*(0.92+0.08*Math.sin(tNow*42)); _chargeBall.scale.set(sc,sc,1); _chargeBall.material.opacity=.5+.5*k;
      if(flash) flash.style.opacity=(0.16*k*k).toFixed(3);
      if(B.t>=CH){ B.phase="fire"; B.t=0; B._blasted=false; for(const sp of _chargeSucks) sp.visible=false; if(SFX&&SFX.boom) SFX.boom(); }
    } else if(B.phase==="fire"){
      // IMPACT au point d'arrivée — le rayon se CONNECTE à l'explosion
      const dur=0.85, grow=Math.min(1,B.t/0.26);
      if(!B._blasted){ B._blasted=true; let ip=null;
        if(B._bossMesh){ ip=B._bossMesh.position.clone(); }
        else { let near=1e9; for(let r=0;r<cineRocks.length;r++){ _beamRel.copy(cineRocks[r].position).sub(_beamNose); const al=_beamRel.dot(_beamDir); const pp=_beamRel.addScaledVector(_beamDir,-al).length(); if(al>50&&al<420&&pp<110&&al<near){ near=al; ip=cineRocks[r].position.clone(); } }
          if(!ip){ ip=_beamTmp.copy(_beamDir).multiplyScalar(300).add(_beamNose).clone(); } }
        B._ip=ip;
        if(B._bossMesh){ const br=B._bossMesh.userData.rad||20; nuclearBlast(ip,14); bossDebris(ip,br); bossFlash(); SHAKE=1;
          scene.remove(B._bossMesh); const bi=cineRocks.indexOf(B._bossMesh); if(bi>=0) cineRocks.splice(bi,1); B._bossMesh=null;
        } else { nuclearBlast(ip,7); }
      }
      // viser précisément l'impact (le rayon relie le nez à l'explosion)
      _beamDir.subVectors(B._ip,_beamNose).normalize();
      const dist=Math.min(460,_beamNose.distanceTo(B._ip)); const len=Math.max(8,dist*grow);
      const fade=B.t>(dur-0.18)? Math.max(0,1-(B.t-(dur-0.18))/0.18) : 1;
      _beamMid.copy(_beamDir).multiplyScalar(len/2).add(_beamNose);
      _beamShell.visible=_beamCore.visible=_beamGlow.visible=true;
      _beamShell.position.copy(_beamMid); _beamShell.quaternion.setFromUnitVectors(_Yax,_beamDir);
      const wgrow=1+Math.min(1,B.t*1.15)*0.5;
      const rs=(1.05+0.22*Math.sin(tNow*90))*wgrow; _beamShell.scale.set(rs,len,rs); _beamShell.material.opacity=.55*fade;
      _beamCore.position.copy(_beamMid); _beamCore.quaternion.copy(_beamShell.quaternion);
      const rc=(1.0+0.45*Math.sin(tNow*150))*wgrow; _beamCore.scale.set(rc,len,rc); _beamCore.material.opacity=.82*fade;
      _beamGlow.position.copy(_beamMid); _beamGlow.quaternion.copy(_beamShell.quaternion);
      const rg=(2.8+0.6*Math.sin(tNow*60))*wgrow; _beamGlow.scale.set(rg,len,rg); _beamGlow.material.opacity=.20*fade;
      // flash au canon
      _chargeBall.visible=true; _chargeBall.position.copy(_beamNose); const cb=2.2+3*Math.max(0,1-B.t/0.3); _chargeBall.scale.set(cb,cb,1); _chargeBall.material.opacity=Math.max(.18,1-B.t/0.5)*.85*fade;
      // impulsions d'énergie qui filent le long du rayon
      for(let i=0;i<_beamPulses.length;i++){ const sp=_beamPulses[i]; sp.visible=true; const fr=((B.t*1.8)+i/_beamPulses.length)%1; sp.position.copy(_beamDir).multiplyScalar(fr*len).add(_beamNose); const ps=2.4+1.7*Math.sin((fr+tNow)*6); sp.scale.set(ps,ps,1); sp.material.opacity=(.85*fade)*(0.45+0.55*Math.sin(fr*Math.PI)); }
      // éclat d'impact à l'arrivée (rend l'explosion bien visible)
      _beamHit.visible=true; _beamHit.position.copy(B._ip); const hs=4+1.5*Math.sin(tNow*30); _beamHit.scale.set(hs,hs,1); _beamHit.material.opacity=.45*fade;
      if(flash){ const fo=B.t<0.1? (0.22*(B.t/0.1)) : 0.22*fade; flash.style.opacity=fo.toFixed(3); }
      let destroyed=0;
      for(let r=cineRocks.length-1;r>=0 && destroyed<2;r--){ const m=cineRocks[r];
        _beamRel.copy(m.position).sub(_beamNose); const along=_beamRel.dot(_beamDir);
        if(along>0&&along<len){ const perp=_beamRel.addScaledVector(_beamDir,-along).length(); if(perp<30){ explodeRock(m); destroyed++; } } }
      if(B.t>=dur){ _beamCore.visible=_beamShell.visible=_beamGlow.visible=false; _chargeBall.visible=false; _beamHit.visible=false; for(const sp of _beamPulses) sp.visible=false; B.phase="flash"; B.t=0; }
    } else { // FLASH : retour au normal en ~1 seconde
      if(flash){ flash.style.opacity=Math.max(0,0.28*(1-B.t/0.5)).toFixed(3); }
      if(B.t>=1.0){ if(flash) flash.style.opacity=0; CINE.beam=null; }
    }
  }
  const _wpFwd=new THREE.Vector3();
  function _bestTarget(){ _wpFwd.set(0,0,1).applyQuaternion(ship.quaternion); let best=null,bd=1e9;
    for(let r=0;r<cineRocks.length;r++){ const m=cineRocks[r]; _canV.copy(m.position).sub(shipPos); const d=_canV.length();
      if(d>1 && _canV.normalize().dot(_wpFwd)>0.02 && d<bd){ bd=d; best=m; } } return best; }
  function updateWeapons(tNow){
    try{ updateMissiles(tNow); }catch(_){}
    try{ updateBeam(tNow); }catch(_){}
    if(CINE.phase!=="approach") return;
    const cann=ship.userData.cannons||[]; const T=CINE.t;
    // UNE salve de missiles tête-chercheuse, une seule fois (traînées + un impact net)
    // ===== LOCK-ON façon Star Fox : réticule vert qui accroche, puis missile tête chercheuse =====
    if(cineRocks.length){
      if(!CINE._lk) CINE._lk={n:0,tgt:null,t0:0};
      const LK=CINE._lk;
      if(!LK.tgt && LK.n<2 && T>1.5+LK.n*1.1 && !CINE.beam){ const best=_bestTarget(); if(best){ LK.tgt=best; LK.t0=T; if(SFX&&SFX.lock) SFX.lock(); } }
      if(LK.tgt){
        if(cineRocks.indexOf(LK.tgt)<0 || CINE.beam){ LK.tgt=null; _lockSpr.visible=false; }
        else { _lockSpr.visible=true; _lockSpr.position.copy(LK.tgt.position);
          const lp=1+0.35*Math.sin((T-LK.t0)*22), lr=Math.max(6,LK.tgt.userData.rad*2.6)*lp; _lockSpr.scale.set(lr,lr,1);
          _lockSpr.material.rotation=(T-LK.t0)*2.2;
          if(T-LK.t0>0.55){ const mk=cann[LK.n%2===0?0:3]||cann[0];
            if(mk){ const from=mk.getWorldPosition(_canV); launchMissile(from,_tmpV.copy(LK.tgt.position).sub(from),LK.tgt); }
            LK.n++; LK.tgt=null; _lockSpr.visible=false; } } }
    }
    // LE Kaméha : une seule fois par approche, bien cadré -> L'EXPLOSION spectacle
    if(!CINE._firedBeam && T>4.4 && !CINE.beam){ CINE._firedBeam=true; startBeam(); }
  }

  /* ====== ASTÉROÏDES & EXPLOSIONS (boule de feu + débris, textures partagées) ====== */
  const cineRocks=[], cineFx=[];
  const _rockTex=(function(){ const cv=document.createElement("canvas"); cv.width=cv.height=128; const c=cv.getContext("2d");
    c.fillStyle="#8E8578"; c.fillRect(0,0,128,128);
    for(let i=0;i<340;i++){ const x=Math.random()*128,y=Math.random()*128,r=1+Math.random()*4;
      c.fillStyle=Math.random()<.5? "rgba(58,52,45,"+(0.12+Math.random()*.2)+")" : "rgba(196,188,172,"+(0.10+Math.random()*.16)+")";
      c.beginPath(); c.arc(x,y,r,0,6.29); c.fill(); }
    for(let i=0;i<14;i++){ const x=Math.random()*128,y=Math.random()*128,r=5+Math.random()*11;   // cratères : ombre + liseré éclairé
      c.fillStyle="rgba(40,36,31,.4)"; c.beginPath(); c.arc(x,y,r,0,6.29); c.fill();
      c.strokeStyle="rgba(210,200,184,.35)"; c.lineWidth=1.6; c.beginPath(); c.arc(x-1.2,y-1.2,r,.6,3.6); c.stroke(); }
    const tx=new THREE.CanvasTexture(cv); tx.wrapS=tx.wrapT=THREE.RepeatWrapping; tx.repeat.set(2,2); return tx; })();
  const _ROCKG=[]; for(let k=0;k<4;k++){ const g=new THREE.IcosahedronGeometry(1,2), pa=g.attributes.position; const v=new THREE.Vector3();
    for(let i=0;i<pa.count;i++){ v.fromBufferAttribute(pa,i).normalize();
      let n=Math.sin(v.x*5.1+k*7.3)+Math.sin(v.y*4.3+k*3.1)+Math.sin(v.z*6.7+k*5.7)+0.55*Math.sin((v.x+v.y)*9.7+k)+0.4*Math.sin((v.y-v.z)*12.3);
      n=(n+3.5)/7;                                             // 0..1
      const r=0.62+0.5*n - 0.16*Math.max(0,Math.sin(v.y*3.1+k*2)); // creux/bosses façon patatoïde minéral
      pa.setXYZ(i, v.x*r, v.y*r, v.z*r); }
    g.computeVertexNormals(); _ROCKG.push(g); }
  const _rockGeo=_ROCKG[0];
  const _rockMat=new THREE.MeshStandardMaterial({map:_rockTex,bumpMap:_rockTex,bumpScale:.5,color:0xA89E8F,roughness:.98,metalness:.02,flatShading:true});
  const _emberMat=new THREE.MeshBasicMaterial({color:0xFF7A2A});
  const _softTex=(function(){ const cv=document.createElement("canvas");cv.width=cv.height=128;const cx=cv.getContext("2d");
    const g=cx.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.35,"rgba(255,255,255,.55)");g.addColorStop(1,"rgba(255,255,255,0)");
    cx.fillStyle=g;cx.fillRect(0,0,128,128); return new THREE.CanvasTexture(cv); })();
  const _fireTex=(function(){ const cv=document.createElement("canvas");cv.width=cv.height=128;const cx=cv.getContext("2d");
    const g=cx.createRadialGradient(64,60,4,64,64,64); g.addColorStop(0,"rgba(255,245,210,1)");g.addColorStop(.3,"rgba(255,170,60,.95)");g.addColorStop(.7,"rgba(200,60,20,.5)");g.addColorStop(1,"rgba(80,20,10,0)");
    cx.fillStyle=g;cx.fillRect(0,0,128,128); return new THREE.CanvasTexture(cv); })();
  const _ringTex=(function(){ const cv=document.createElement("canvas");cv.width=cv.height=128;const cx=cv.getContext("2d");
    cx.strokeStyle="rgba(255,235,200,1)";cx.lineWidth=8;cx.beginPath();cx.arc(64,64,54,0,7);cx.stroke(); return new THREE.CanvasTexture(cv); })();
  function fxSprite(tex,hex,op){ return new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:new THREE.Color(hex),transparent:true,opacity:op==null?1:op,blending:THREE.AdditiveBlending,depthWrite:false})); }
  function _muzzle(pos){ const m=fxSprite(_softTex,"#FFD9B0"); m.scale.set(5,5,1); m.position.copy(pos); scene.add(m); cineFx.push({t:"flash",o:m,life:0,max:.14,rad:.8}); }
  function spawnRock(pos,rad){
    const m=new THREE.Mesh(_ROCKG[(Math.random()*_ROCKG.length)|0],_rockMat);
    m.scale.set(rad*(0.82+Math.random()*.4), rad*(0.7+Math.random()*.5), rad*(0.82+Math.random()*.4));
    m.position.copy(pos); m.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
    m.userData={rad, spin:new THREE.Vector3((Math.random()-.5)*.04,(Math.random()-.5)*.04,(Math.random()-.5)*.04)};
    scene.add(m); cineRocks.push(m); return m;
  }
  function bossFlash(){ try{ const _bf=document.getElementById("bossflash"); if(!_bf) return;
      _bf.style.transition="none";
      _bf.style.background="radial-gradient(circle at 50% 50%, rgba(255,255,255,.97), rgba(255,228,184,.55) 42%, transparent 74%)";
      _bf.style.opacity="0.62";
      requestAnimationFrame(function(){ _bf.style.transition="opacity .85s ease-out, background .5s ease-out";
        _bf.style.background="radial-gradient(circle at 50% 54%, rgba(255,150,60,.82), rgba(255,90,30,.3) 46%, transparent 74%)"; _bf.style.opacity="0"; }); }catch(_){} }
  function bossDebris(pos,rad){ for(let i=0;i<18;i++){ const f=new THREE.Mesh(_rockGeo, Math.random()<.5?_emberMat:_rockMat); const fs=Math.max(2.2,rad*(.14+Math.random()*.32)); f.scale.setScalar(fs); f.position.copy(pos);
      const v=new THREE.Vector3((Math.random()-.5),(Math.random()-.5),(Math.random()-.5)).normalize().multiplyScalar(3.2+Math.random()*7.6);
      f.userData={v,spin:new THREE.Vector3(Math.random()*.4,Math.random()*.4,Math.random()*.4)};
      scene.add(f); cineFx.push({t:"frag",o:f,life:0,max:1.9+Math.random()*.9}); } }
  function nuclearBlast(pos,rad){
    if(SFX) SFX.boom();
    // traits incandescents qui giclent (façon Star Wars)
    for(let sp7=0;sp7<12;sp7++){ const sk=new THREE.Sprite(new THREE.SpriteMaterial({map:_shootTex,color:(sp7%3? 0xFFD27A : 0xFFF4E0),transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));
      sk.position.copy(pos); const vv=new THREE.Vector3((Math.random()-.5),(Math.random()-.42),(Math.random()-.5)).normalize().multiplyScalar((2.6+Math.random()*4.2)*(rad/9));
      sk.userData={v:vv}; const ln2=(6+Math.random()*8)*(rad/9); sk.scale.set(ln2,ln2*.10,1);
      sk.material.rotation=Math.atan2(vv.y,vv.x);
      scene.add(sk); cineFx.push({t:"spark",o:sk,life:0,max:.55+Math.random()*.4}); }
    const R=Math.max(rad,2)*1.7;
    // éclair BREF et contenu — un accent, surtout PAS un mur blanc
    const fl=fxSprite(_softTex,"#FFF4E2"); fl.position.copy(pos); scene.add(fl); cineFx.push({t:"flash",o:fl,life:0,max:.22,rad:R*0.7});
    // noyau incandescent qui pulse puis refroidit
    const core=fxSprite(_fireTex,"#FFEBC2"); core.position.copy(pos); scene.add(core); cineFx.push({t:"core",o:core,life:0,max:2.4,r0:R*3.4});
    const coreIn=fxSprite(_fireTex,"#FFE6C0"); coreIn.position.copy(pos); scene.add(coreIn); cineFx.push({t:"core",o:coreIn,life:0,max:1.0,r0:R*1.5});
    // BOULE DE FEU en bouffées (jaune -> orange -> rouge -> sombre) qui gonfle : LE spectacle
    const cols=["#FFF2C0","#FFD874","#FFB146","#F4822E","#D8521C","#A33414"];
    for(let i=0;i<22;i++){ const fb=fxSprite(_fireTex,cols[Math.min(cols.length-1,Math.floor(i/4))]);
      const r2=R*(2.6+Math.random()*3.6);
      fb.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*R*3.6,(Math.random()-.5)*R*3.6,(Math.random()-.5)*R*3.6));
      scene.add(fb); cineFx.push({t:"fire",o:fb,life:-i*0.032,max:1.8+Math.random()*1.1,r0:r2}); }
    // ONDES DE CHOC — signature : anneaux concentriques qui balaient l'espace
    for(let i=0;i<4;i++){ const ring=fxSprite(_ringTex,i?"#FFCE8A":"#FFF6E6"); ring.position.copy(pos); ring.material.rotation=Math.random()*6; scene.add(ring); cineFx.push({t:"shock",o:ring,life:-i*0.14,max:1.3,rad:R*(2.2+i*1.3)}); }
    // DÉBRIS incandescents projetés
    for(let i=0;i<30;i++){ const sp=fxSprite(_fireTex,i%3?"#FFB861":"#FFE6B0"); const ss=R*(.45+Math.random()*.85); sp.scale.set(ss,ss,1); sp.position.copy(pos);
      const v=new THREE.Vector3((Math.random()-.5),(Math.random()-.5),(Math.random()-.5)).normalize().multiplyScalar(5.5+Math.random()*12); sp.userData={v}; scene.add(sp); cineFx.push({t:"spark",o:sp,life:0,max:.85+Math.random()*.75}); }
    // FUMÉE qui s'élève et s'élargit
    for(let i=0;i<6;i++){ const sm=fxSprite(_softTex,"#221C16",.0); sm.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*R*2.6,(Math.random()-.5)*R*2.6,(Math.random()-.5)*R*2.6)); scene.add(sm); cineFx.push({t:"smoke",o:sm,life:-i*0.13,max:3.4+Math.random()*1.1,r0:R*5.2,vy:.15+Math.random()*.34}); }
    // DÉTONATION SECONDAIRE retardée -> drama
    for(let i=0;i<9;i++){ const fb=fxSprite(_fireTex,cols[Math.min(cols.length-1,2+Math.floor(i/3))]); const r2=R*(1.6+Math.random()*2.2);
      fb.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*R*4.8,(Math.random()-.5)*R*4.8,(Math.random()-.5)*R*4.8));
      scene.add(fb); cineFx.push({t:"fire",o:fb,life:-0.42-i*0.03,max:1.4+Math.random()*.7,r0:r2}); }
    const ring2=fxSprite(_ringTex,"#FFD89A"); ring2.position.copy(pos); ring2.material.rotation=Math.random()*6; scene.add(ring2); cineFx.push({t:"shock",o:ring2,life:-0.42,max:1.15,rad:R*2.8});
    try{ const _ef=document.getElementById("expflash"); if(_ef){ _ef.style.transition="none"; _ef.style.opacity="0.10"; requestAnimationFrame(function(){ _ef.style.transition="opacity .5s ease-out"; _ef.style.opacity="0"; }); } }catch(_){}
  }
  function explodeRock(m){
    const pos=m.position.clone(), rad=m.userData.rad;
    if(SFX) SFX.boom();
    // IMPACT BLANC instantané (la couleur arrive juste après)
    const wf=fxSprite(_softTex,"#FFFFFF"); wf.scale.set(rad*13,rad*13,1); wf.position.copy(pos); scene.add(wf); cineFx.push({t:"flash",o:wf,life:0,max:.2,rad:rad*0.9});
    // DOUBLE ÉCLAIR : flash intense + halo retardé
    const fl=fxSprite(_softTex,"#FFFFFF"); fl.scale.set(rad*9,rad*9,1); fl.position.copy(pos); scene.add(fl);
    cineFx.push({t:"flash",o:fl,life:0,max:.42,rad:rad*0.7});
    const fl2=fxSprite(_softTex,"#FFE6C0"); fl2.scale.set(rad*6,rad*6,1); fl2.position.copy(pos); scene.add(fl2);
    cineFx.push({t:"flash",o:fl2,life:-.07,max:.55,rad:rad*0.6});
    // BOULE DE FEU qui enfle en bouffées décalées (billowing)
    for(let i=0;i<8;i++){ const fb=fxSprite(_fireTex,"#FFFFFF"); const r2=rad*(i?2.4+Math.random()*1.6:4.2);
      fb.scale.set(r2,r2,1); fb.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*rad*2.4,(Math.random()-.5)*rad*2.4,(Math.random()-.5)*rad*2.4));
      scene.add(fb); cineFx.push({t:"fire",o:fb,life:-i*0.05,max:1.0+Math.random()*.6,r0:r2}); }
    // NOYAU incandescent persistant
    const core=fxSprite(_fireTex,"#FFF2D0"); core.scale.set(rad*3.4,rad*3.4,1); core.position.copy(pos); scene.add(core);
    cineFx.push({t:"core",o:core,life:0,max:1.4,r0:rad*3.4});
    // ONDES DE CHOC multiples
    for(let i=0;i<3;i++){ const ring=fxSprite(_ringTex,i?"#FFD9A0":"#FFFFFF"); ring.scale.set(rad*2,rad*2,1); ring.position.copy(pos);
      ring.material.rotation=Math.random()*6; scene.add(ring); cineFx.push({t:"shock",o:ring,life:-i*0.13,max:.75,rad:rad*(1+i*.35)}); }
    // DÉBRIS 3D (plus nombreux, projetés plus loin)
    const N=Math.min(30, 16+Math.floor(rad*2));
    for(let i=0;i<N;i++){ const f=new THREE.Mesh(_rockGeo, Math.random()<.5?_emberMat:_rockMat); f.scale.setScalar(rad*(.12+Math.random()*.42));
      f.position.copy(pos);
      const v=new THREE.Vector3((Math.random()-.5),(Math.random()-.5),(Math.random()-.5)).normalize().multiplyScalar(1.0+Math.random()*3.4);
      f.userData={v,spin:new THREE.Vector3(Math.random()*.4,Math.random()*.4,Math.random()*.4)};
      scene.add(f); cineFx.push({t:"frag",o:f,life:0,max:1.5+Math.random()*.7}); }
    // ÉTINCELLES brillantes ultra-rapides
    for(let i=0;i<20;i++){ const sp=fxSprite(_softTex,i%2?"#FFD27A":"#FFFFFF"); const ss=rad*(.28+Math.random()*.4); sp.scale.set(ss,ss,1); sp.position.copy(pos);
      const v=new THREE.Vector3((Math.random()-.5),(Math.random()-.5),(Math.random()-.5)).normalize().multiplyScalar(2.6+Math.random()*4.8);
      sp.userData={v}; scene.add(sp); cineFx.push({t:"spark",o:sp,life:0,max:.5+Math.random()*.45}); }
    // FUMÉE persistante (plus dense, plus longue)
    for(let i=0;i<5;i++){ const sm=fxSprite(_softTex,"#3A3026",.0); sm.scale.set(rad*3.4,rad*3.4,1);
      sm.position.copy(pos).add(new THREE.Vector3((Math.random()-.5)*rad*1.6,(Math.random()-.5)*rad*1.6,(Math.random()-.5)*rad*1.6));
      scene.add(sm); cineFx.push({t:"smoke",o:sm,life:-i*0.1,max:2.5+Math.random()*.7,r0:rad*3.4,vy:.15+Math.random()*.35}); }
    scene.remove(m); const idx=cineRocks.indexOf(m); if(idx>=0) cineRocks.splice(idx,1);
  }
  function clearRocks(){ cineRocks.slice().forEach(m=>scene.remove(m)); cineRocks.length=0;
    cineFx.forEach(f=>{ scene.remove(f.o); if(f.o.isSprite&&f.o.material.dispose) f.o.material.dispose(); }); cineFx.length=0;
    BOLTS.forEach(b=>{ b.active=false; b.mesh.visible=false; }); }
  function updateCineFx(){
    cineRocks.forEach(m=>{ m.rotation.x+=m.userData.spin.x; m.rotation.y+=m.userData.spin.y; m.rotation.z+=m.userData.spin.z; });
    // bolts
    for(let i=0;i<BOLTS.length;i++){ const b=BOLTS[i]; if(!b.active) continue;
      b.mesh.position.add(b.v); b.life++;
      let hit=null; for(let r=0;r<cineRocks.length;r++){ if(b.mesh.position.distanceTo(cineRocks[r].position)<cineRocks[r].userData.rad+2.4){ hit=cineRocks[r]; break; } }
      if(hit){ explodeRock(hit); b.active=false; b.mesh.visible=false; continue; }
      if(b.life>120){ b.active=false; b.mesh.visible=false; } }
    for(let i=cineFx.length-1;i>=0;i--){ const f=cineFx[i]; f.life+=DT;
      if(f.life<0){ if(f.o.material) f.o.material.opacity=0; continue; }
      const k=f.life/f.max;
      if(f.t==="flash"){ f.o.material.opacity=Math.max(0,1-k); f.o.scale.setScalar(f.rad*6*(1+k*.7)); }
      else if(f.t==="fire"){ f.o.material.opacity=Math.max(0,(1-k)*.95); f.o.scale.setScalar(f.r0*(1+k*1.5)); }
      else if(f.t==="core"){ f.o.material.opacity=Math.max(0,(1-k)*(1-k)); f.o.scale.setScalar(f.r0*(1+k*.5)); }
      else if(f.t==="shock"){ f.o.material.opacity=Math.max(0,.85*(1-k)); f.o.scale.setScalar(f.rad*2*(1+k*9)); }
      else if(f.t==="spark"){ f.o.position.add(f.o.userData.v); f.o.userData.v.multiplyScalar(.9); f.o.material.opacity=Math.max(0,1-k); f.o.scale.multiplyScalar(.965); }
      else if(f.t==="frag"){ f.o.position.add(f.o.userData.v); f.o.userData.v.multiplyScalar(.975); f.o.userData.v.y-=.012;
        f.o.rotation.x+=f.o.userData.spin.x; f.o.rotation.y+=f.o.userData.spin.y; if(k>.6) f.o.scale.multiplyScalar(.95); }
      else if(f.t==="smoke"){ const op=k<.22?(k/.22)*.55:.55*(1-(k-.22)/.78); f.o.material.opacity=Math.max(0,op);
        f.o.position.y+=f.vy; f.o.scale.setScalar(f.r0*(1+k*1.9)); }
      if(f.life>=f.max){ scene.remove(f.o); if(f.o.isSprite&&f.o.material.dispose) f.o.material.dispose(); cineFx.splice(i,1); }
    }
  }

  /* ====== SON CINÉMA (Web Audio HD) ====== */
  const SFX={ctx:null,master:null,
    init(){ if(this.ctx) return; try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
      this.ctx=new AC(); if(this.ctx.state==="suspended") this.ctx.resume();
      this.master=this.ctx.createGain(); this.master.gain.value=.9; this.master.connect(this.ctx.destination);
      // bus d'écho partagé (donne la profondeur "spatiale")
      this.delay=this.ctx.createDelay(); this.delay.delayTime.value=.11;
      this.fb=this.ctx.createGain(); this.fb.gain.value=.32;
      this.wet=this.ctx.createGain(); this.wet.gain.value=.5;
      this.delay.connect(this.fb); this.fb.connect(this.delay); this.delay.connect(this.wet); this.wet.connect(this.master);
    }catch(_){} },
    laser(){ const c=this.ctx; if(!c) return; const t=c.currentTime;
      // ZAP principal : sweep descendant rapide (le "pew")
      const o=c.createOscillator(), g=c.createGain(), f=c.createBiquadFilter();
      o.type="sawtooth"; o.frequency.setValueAtTime(2400,t); o.frequency.exponentialRampToValueAtTime(150,t+.20);
      f.type="bandpass"; f.frequency.value=1500; f.Q.value=7;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.20,t+.004); g.gain.exponentialRampToValueAtTime(.0001,t+.24);
      o.connect(f); f.connect(g); g.connect(this.master); g.connect(this.delay);
      o.start(t); o.stop(t+.26);
      // harmonique métallique aiguë
      const o2=c.createOscillator(), g2=c.createGain();
      o2.type="square"; o2.frequency.setValueAtTime(3200,t); o2.frequency.exponentialRampToValueAtTime(380,t+.13);
      g2.gain.setValueAtTime(.06,t); g2.gain.exponentialRampToValueAtTime(.0001,t+.16);
      o2.connect(g2); g2.connect(this.master); g2.connect(this.delay); o2.start(t); o2.stop(t+.18);
      // click d'attaque
      const o3=c.createOscillator(), g3=c.createGain(); o3.type="triangle"; o3.frequency.setValueAtTime(600,t); o3.frequency.exponentialRampToValueAtTime(90,t+.04);
      g3.gain.setValueAtTime(.12,t); g3.gain.exponentialRampToValueAtTime(.0001,t+.05); o3.connect(g3); g3.connect(this.master); o3.start(t); o3.stop(t+.06);
    },
    lock(){ const c=this.ctx; if(!c) return; const t=c.currentTime;
      [0,.09].forEach((d,i)=>{ const o=c.createOscillator(),g=c.createGain(); o.type="square"; o.frequency.value=i?1560:1180;
        g.gain.setValueAtTime(.0001,t+d); g.gain.exponentialRampToValueAtTime(.14,t+d+.008); g.gain.exponentialRampToValueAtTime(.0001,t+d+.07);
        o.connect(g); g.connect(this.master); o.start(t+d); o.stop(t+d+.08); }); },
    whoosh(){ const c=this.ctx; if(!c) return; const t=c.currentTime;
      const nb=c.createBuffer(1,Math.floor(c.sampleRate*.5),c.sampleRate), nd=nb.getChannelData(0);
      for(let i=0;i<nd.length;i++) nd[i]=(Math.random()*2-1)*(1-i/nd.length);
      const src=c.createBufferSource(); src.buffer=nb;
      const f=c.createBiquadFilter(); f.type="bandpass"; f.Q.value=1.2; f.frequency.setValueAtTime(2600,t); f.frequency.exponentialRampToValueAtTime(320,t+.45);
      const g=c.createGain(); g.gain.setValueAtTime(.22,t); g.gain.exponentialRampToValueAtTime(.0001,t+.5);
      src.connect(f); f.connect(g); g.connect(this.master); g.connect(this.delay); src.start(t); },
    charge(){ const c=this.ctx; if(!c) return; const t=c.currentTime;
      const o=c.createOscillator(),g=c.createGain(),o2=c.createOscillator(),g2=c.createGain();
      o.type="sawtooth"; o.frequency.setValueAtTime(70,t); o.frequency.exponentialRampToValueAtTime(760,t+1.65);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.16,t+.3); g.gain.setValueAtTime(.16,t+1.5); g.gain.exponentialRampToValueAtTime(.0001,t+1.72);
      o2.type="sine"; o2.frequency.setValueAtTime(140,t); o2.frequency.exponentialRampToValueAtTime(1520,t+1.65);
      g2.gain.setValueAtTime(.06,t); g2.gain.exponentialRampToValueAtTime(.0001,t+1.7);
      o.connect(g); g.connect(this.master); o2.connect(g2); g2.connect(this.delay);
      o.start(t); o.stop(t+1.75); o2.start(t); o2.stop(t+1.75); },
    fanfare(){ const c=this.ctx; if(!c) return; const t0=c.currentTime;
      [[523.25,0],[659.25,.12],[783.99,.24],[1046.5,.4],[783.99,.62],[1046.5,.78],[1318.5,1.0]].forEach(function(nt){
        const o=c.createOscillator(),g=c.createGain(); o.type="triangle"; o.frequency.value=nt[0];
        g.gain.setValueAtTime(.0001,t0+nt[1]); g.gain.exponentialRampToValueAtTime(.20,t0+nt[1]+.02); g.gain.exponentialRampToValueAtTime(.0001,t0+nt[1]+.55);
        o.connect(g); g.connect(SFX.master); g.connect(SFX.delay); o.start(t0+nt[1]); o.stop(t0+nt[1]+.6); });
      const ob=c.createOscillator(),gb=c.createGain(); ob.type="sine"; ob.frequency.value=130.8;
      gb.gain.setValueAtTime(.14,t0); gb.gain.exponentialRampToValueAtTime(.0001,t0+1.8);
      ob.connect(gb); gb.connect(this.master); ob.start(t0); ob.stop(t0+1.85); },
    boom(){ const c=this.ctx; if(!c) return; const t=c.currentTime;
      // CRACK initial (souffle haute fréquence très bref)
      const nb=c.createBuffer(1,Math.floor(c.sampleRate*.12),c.sampleRate), nd=nb.getChannelData(0);
      for(let i=0;i<nd.length;i++) nd[i]=(Math.random()*2-1)*Math.pow(1-i/nd.length,1.2);
      const ns=c.createBufferSource(); ns.buffer=nb; const hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=900;
      const ng=c.createGain(); ng.gain.setValueAtTime(.5,t); ng.gain.exponentialRampToValueAtTime(.0001,t+.13);
      ns.connect(hp); hp.connect(ng); ng.connect(this.master); ns.start(t); ns.stop(t+.13);
      // CORPS : souffle large filtré (lowpass qui se ferme)
      const bb=c.createBuffer(1,Math.floor(c.sampleRate*.8),c.sampleRate), bd=bb.getChannelData(0);
      for(let i=0;i<bd.length;i++) bd[i]=(Math.random()*2-1)*Math.pow(1-i/bd.length,1.7);
      const bs=c.createBufferSource(); bs.buffer=bb; const lp=c.createBiquadFilter(); lp.type="lowpass";
      lp.frequency.setValueAtTime(2200,t); lp.frequency.exponentialRampToValueAtTime(110,t+.6);
      const bg=c.createGain(); bg.gain.setValueAtTime(.55,t); bg.gain.exponentialRampToValueAtTime(.0001,t+.75);
      bs.connect(lp); lp.connect(bg); bg.connect(this.master); bg.connect(this.delay); bs.start(t); bs.stop(t+.8);
      // BOOM grave (sub sine)
      const o=c.createOscillator(), og=c.createGain(); o.type="sine"; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(34,t+.5);
      og.gain.setValueAtTime(.6,t); og.gain.exponentialRampToValueAtTime(.0001,t+.6); o.connect(og); og.connect(this.master); o.start(t); o.stop(t+.62);
      // GRONDEMENT de queue
      const o4=c.createOscillator(), g4=c.createGain(); o4.type="triangle"; o4.frequency.setValueAtTime(60,t); o4.frequency.exponentialRampToValueAtTime(28,t+.9);
      g4.gain.setValueAtTime(.0001,t); g4.gain.exponentialRampToValueAtTime(.18,t+.08); g4.gain.exponentialRampToValueAtTime(.0001,t+.95);
      o4.connect(g4); g4.connect(this.master); o4.start(t); o4.stop(t+1.0);
    }
  };

  /* ====== ESPACE PROFOND — merveilles lointaines ====== */
  // trou noir avec disque d'accrétion
  const bhGroup=new THREE.Group();
  bhGroup.add(new THREE.Mesh(new THREE.SphereGeometry(34,32,32), new THREE.MeshBasicMaterial({color:0x000000})));
  const acc1=new THREE.Mesh(new THREE.TorusGeometry(58,7,12,90), new THREE.MeshBasicMaterial({color:0xFF9D3B,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));
  const acc2=new THREE.Mesh(new THREE.TorusGeometry(78,3.5,10,90), new THREE.MeshBasicMaterial({color:0x6FB8FF,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false}));
  acc1.rotation.x=acc2.rotation.x=Math.PI/2.25; bhGroup.add(acc1); bhGroup.add(acc2);
  const bhGlow=glowSprite("#FFB060","rgba(255,190,110,.6)"); bhGlow.scale.set(220,220,1); bhGlow.material.opacity=.25; bhGroup.add(bhGlow);
  bhGroup.position.set(-1750,360,-2150); scene.add(bhGroup);
  // pulsar : strobe + faisceaux jumeaux
  const pulsar=new THREE.Group();
  const pCore=glowSprite("#BFE2FF","rgba(255,255,255,1)"); pCore.scale.set(30,30,1); pulsar.add(pCore);
  const beam1=glowSprite("#9FD4FF","rgba(190,225,255,.9)"); beam1.scale.set(8,420,1); pulsar.add(beam1);
  const beam2=glowSprite("#9FD4FF","rgba(190,225,255,.9)"); beam2.scale.set(8,420,1); beam2.material.rotation=Math.PI; pulsar.add(beam2);
  pulsar.position.set(2300,800,1600); scene.add(pulsar);
  // rémanent de supernova : nébuleuse qui respire
  const nova=glowSprite("#FF7AD9","rgba(255,170,230,.6)"); nova.scale.set(380,380,1);
  nova.material.opacity=.12; nova.position.set(1500,-650,-2500); scene.add(nova);
  // constellations : lignes éphémères entre étoiles brillantes
  const constel=[];
  for(let i=0;i<9;i++){
    const a=brights[Math.floor(Math.random()*brights.length)], b=brights[Math.floor(Math.random()*brights.length)];
    if(a===b) continue;
    const g2=new THREE.BufferGeometry().setFromPoints([a.position,b.position]);
    const ln=new THREE.Line(g2,new THREE.LineBasicMaterial({color:0x8FB4E8,transparent:true,opacity:0,blending:THREE.AdditiveBlending}));
    ln.userData={ph:Math.random()*40}; scene.add(ln); constel.push(ln);
  }
  // galaxies en collision (couple en contre-rotation)
  const gxA=new THREE.Sprite(new THREE.SpriteMaterial({map:spTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5}));
  const gxB=new THREE.Sprite(new THREE.SpriteMaterial({map:spTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.45}));
  gxA.scale.set(190,130,1); gxB.scale.set(150,105,1);
  gxA.position.set(-2600,1200,1900); gxB.position.set(-2480,1130,1860);
  scene.add(gxA); scene.add(gxB);
  // station orbitale H : avant-poste clignotant
  const station=new THREE.Group();
  const sm=new THREE.MeshStandardMaterial({color:0xC9D6EE,metalness:.7,roughness:.3,emissive:0x6FE3FF,emissiveIntensity:.25});
  const hub=new THREE.Mesh(new THREE.BoxGeometry(3.2,1.1,1.1),sm);
  const pan1=new THREE.Mesh(new THREE.BoxGeometry(.15,.9,2.6),sm.clone()); pan1.position.x=2.4;
  const pan2=pan1.clone(); pan2.position.x=-2.4;
  station.add(hub); station.add(pan1); station.add(pan2);
  const beacon=glowSprite("#FF6B5A","rgba(255,120,100,1)"); beacon.scale.set(4,4,1); station.add(beacon);
  scene.add(station); let stA=0;
  // poussière de parallaxe proche (profondeur au mouvement)
  const ndg=new THREE.BufferGeometry(), ndv=[];
  for(let i=0;i<260;i++){ const a=Math.random()*7, R=120+Math.random()*220;
    ndv.push(Math.cos(a)*R,(Math.random()-.5)*90,Math.sin(a)*R); }
  ndg.setAttribute("position",new THREE.Float32BufferAttribute(ndv,3));
  const nearDust=new THREE.Points(ndg,new THREE.PointsMaterial({color:0xC4D4EE,size:.55,map:DOT,transparent:true,opacity:.16,depthWrite:false}));
  scene.add(nearDust);
  // comète émeraude (seconde, inclinée)
  const comet2=new THREE.Mesh(new THREE.SphereGeometry(1.9,16,16),
    new THREE.MeshStandardMaterial({color:0xBFFFE0,emissive:0x6FE6B0,emissiveIntensity:.8}));
  scene.add(comet2);
  const comet2Glow=glowSprite("#8FF2C8","rgba(200,255,225,.95)"); comet2Glow.scale.set(17,17,1); scene.add(comet2Glow);
  const t2g=new THREE.BufferGeometry();
  t2g.setAttribute("position",new THREE.Float32BufferAttribute(new Array(60*3).fill(0),3));
  const tail2=new THREE.Points(t2g,new THREE.PointsMaterial({color:0x9FF2CC,size:2.0,map:DOT,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false}));
  scene.add(tail2); let c2Th=Math.random()*7;
  /* ====== ÉTOILES FILANTES ====== */
  const meteors=[]; const METC=["#FFFFFF","#BFE2FF","#FFD9A0","#C8FFD8","#FFFFFF","#E8C8FF"];
  for(let i=0;i<6;i++){
    const m=glowSprite(METC[i],"rgba(255,255,255,1)"); m.scale.set(10,2.4,1);
    m.userData={vel:new THREE.Vector3(),life:-1}; scene.add(m); meteors.push(m);
  }

  /* ====== MODE SURFACE v2 : monde explorable ====== */
  const SURF={on:false,id:null,yaw:0,pitch:.04,alt:16,targetAlt:16,T:0,cache:{},
    pos:new THREE.Vector3(0,0,60), heading:-Math.PI/2, target:null};
  const surfCam=new THREE.PerspectiveCamera(64, innerWidth/innerHeight, .1, 4000);
  function surfH(x,z,seed,theme){
    let h=fbm(x*.012+9,z*.012,seed,5)*.7+fbm(x*.04,z*.04,seed+21,4)*.3;
    h=Math.pow(h,theme==="warn"?1.6:1.25);
    const amp=theme==="risk"?34:theme==="warn"?16:30;
    return (h-.32)*amp;
  }
  function groundDetailTex(theme,seed){
    const W=512,cv=document.createElement("canvas");cv.width=cv.height=W;
    const cx=cv.getContext("2d"),img=cx.createImageData(W,W);
    for(let y=0;y<W;y++)for(let x=0;x<W;x++){
      const n=fbm(x/W*22,y/W*22,seed+3,4), m=fbm(x/W*90,y/W*90,seed+8,2);
      let k=.74+n*.2+m*.10; if(m>.72) k*=.82;
      const i4=(y*W+x)*4; const v=Math.min(255,k*255);
      img.data[i4]=v;img.data[i4+1]=v;img.data[i4+2]=v;img.data[i4+3]=255;
    }
    cx.putImageData(img,0,0);
    const t2=new THREE.CanvasTexture(cv); t2.wrapS=t2.wrapT=THREE.RepeatWrapping; t2.repeat.set(14,14);
    return t2;
  }
  function puffTex(){
    const cv=document.createElement("canvas");cv.width=cv.height=128;const cx=cv.getContext("2d");
    const g=cx.createRadialGradient(64,58,4,64,64,60);
    g.addColorStop(0,"rgba(255,255,255,.95)");g.addColorStop(.55,"rgba(250,252,255,.55)");g.addColorStop(1,"rgba(255,255,255,0)");
    cx.fillStyle=g;cx.beginPath();cx.arc(64,64,60,0,7);cx.fill();
    return new THREE.CanvasTexture(cv);
  }
  function cloudSpriteTex(){ return puffTex(); }
  /* ====== VOXEL SANDBOX : monde cubique éditable & persistant ====== */
  const VOX={on:false, size:4, N:34, edits:{}, meshes:[], lookup:null, group:null, id:null, tool:"break", block:1};
  const VOXTOP={}; // par entité : hauteur du plus haut bloc (en cases) pour la collision caméra
  try{ window.VOX=VOX; }catch(_){}
  // palette de blocs (id → couleur + nom)
  const BLOCKS={
    1:{n:"Herbe",   top:0x6BAE3A, side:0x6B4A28},
    2:{n:"Terre",   top:0x6B4A28, side:0x6B4A28},
    3:{n:"Pierre",  top:0x8A8F98, side:0x7A7F88},
    4:{n:"Sable",   top:0xE6D29A, side:0xDCC78E},
    5:{n:"Eau",     top:0x2E78C8, side:0x2E78C8, alpha:.72},
    6:{n:"Bois",    top:0x9A7B3A, side:0x6B4A22},
    7:{n:"Feuilles",top:0x2E7A36, side:0x2E7A36},
    8:{n:"Roche sombre",top:0x33323A, side:0x2A2930},
    9:{n:"Lave",    top:0xFF6A20, side:0xCC4A10, emis:true},
    10:{n:"Neige",  top:0xF2F6FF, side:0xE2EAF4},
    11:{n:"Verre",  top:0xAFE0FF, side:0xAFE0FF, alpha:.45},
    12:{n:"Or",     top:0xFFD24A, side:0xE0A828, emis:true}
  };
  let _ANISO=4; try{ _ANISO=Math.min(8,ren.capabilities.getMaxAnisotropy()); }catch(_){}
  function blockTex(hex,emis){
    const cv=document.createElement("canvas");cv.width=cv.height=64;const cx=cv.getContext("2d");
    const c=new THREE.Color(hex), hx="#"+c.getHexString();
    cx.fillStyle=hx;cx.fillRect(0,0,64,64);
    // pavés internes : 4 quadrants légèrement nuancés (lecture du bloc)
    for(let qy=0;qy<2;qy++)for(let qx=0;qx<2;qx++){
      const v=(Math.random()-.5)*.10; const cc=c.clone(); cc.offsetHSL(0,0,v);
      cx.fillStyle="#"+cc.getHexString(); cx.fillRect(qx*32+1,qy*32+1,30,30); }
    // grain doux basse fréquence (anti-moiré)
    for(let i=0;i<22;i++){ const a=Math.random()*.06; cx.fillStyle=(Math.random()<.5?"rgba(0,0,0,":"rgba(255,255,255,")+a+")";
      const sz=5+Math.random()*9; cx.fillRect(Math.random()*64|0,Math.random()*64|0,sz,sz); }
    // arêtes sombres pour détacher chaque cube
    cx.strokeStyle="rgba(0,0,0,.28)";cx.lineWidth=4;cx.strokeRect(2,2,60,60);
    const t=new THREE.CanvasTexture(cv);
    t.anisotropy=Math.max(_ANISO,8); t.generateMipmaps=true;
    t.minFilter=THREE.LinearMipmapLinearFilter; t.magFilter=THREE.LinearFilter;
    return t;
  }
  const BLOCKTEX={};
  function faceMat(hex,b){
    if(BLOCKTEX[hex]) return BLOCKTEX[hex];
    const m=new THREE.MeshStandardMaterial({map:blockTex(hex,b.emis),vertexColors:true,
      roughness:b.alpha?.18:.96, metalness:b.alpha?.32:.02,
      transparent:!!b.alpha, opacity:b.alpha||1,
      emissive:b.emis?new THREE.Color(hex):0x000000, emissiveIntensity:b.emis?.5:0});
    BLOCKTEX[hex]=m; return m;
  }
  function voxKey(x,y,z){ return x+","+y+","+z; }
  // hauteur en blocs + type de surface selon biome
  function voxColumn(gx,gz,seed,theme,N){
    const wx=(gx-N/2)*1.0, wz=(gz-N/2)*1.0;
    const h0=surfH(wx*4,wz*4,seed,theme);
    const h=Math.max(3,Math.round((h0+30)/2.6));
    return h;
  }
  function baseBlock(theme,y,h,hn){
    if(theme==="risk"){ if(y===h-1) return hn>.6?8:9; if(y>h-3) return 8; return 3; }
    if(theme==="warn"){ if(y>=h-2) return 4; if(y>h-5) return 2; return 3; }
    // tempéré
    if(hn>.82) return 10;          // neige
    if(y===h-1) return hn<.18?4:1; // sable littoral / herbe
    if(y>h-3) return 2; return 3;
  }
  function buildVoxelWorld(e){
    const seed=seedOf(e.id), theme=e.risk, N=VOX.N;
    VOX.edits=(DATA.voxelEdits&&DATA.voxelEdits[e.id])?Object.assign({},DATA.voxelEdits[e.id]):{};
    // carte des blocs pleins : base + edits
    const solid={}, heights=[];
    let maxH=1;
    for(let gx=0;gx<N;gx++){ heights[gx]=[]; for(let gz=0;gz<N;gz++){
      const h=voxColumn(gx,gz,seed,theme,N); heights[gx][gz]=h; if(h>maxH)maxH=h;
      const hn=Math.min(1,h/14);
      for(let y=0;y<h;y++) solid[voxKey(gx,y,gz)]=baseBlock(theme,y,h,hn);
    }}
    // eau : remplir les creux sous le niveau de la mer (mondes tempérés)
    const sea = theme==="ok"?5:(theme==="warn"?3:4);
    if(theme==="ok"){
      for(let gx=0;gx<N;gx++)for(let gz=0;gz<N;gz++){ const h=heights[gx][gz];
        for(let y=h;y<sea;y++) if(!solid[voxKey(gx,y,gz)]) solid[voxKey(gx,y,gz)]=5; } }
    // RNG déterministe par cellule (paysage reproductible)
    function rng(a,b){ let n=Math.sin((a*73.13+b*131.7+seed*0.917))*43758.5453; return n-Math.floor(n); }
    // ===== FILONS DE MINERAI dans la pierre profonde =====
    for(let gx=0;gx<N;gx++)for(let gz=0;gz<N;gz++){ const h=heights[gx][gz];
      for(let y=1;y<h-3;y++){ const r=rng(gx*7+y*3,gz*5-y); 
        if(solid[voxKey(gx,y,gz)]===3){ if(r>0.985) solid[voxKey(gx,y,gz)]=12; else if(r>0.95) solid[voxKey(gx,y,gz)]=8; } } }
    // ===== ARBRES VOXEL (mondes tempérés) : tronc bois + canopée de feuilles =====
    if(theme==="ok"){
      for(let gx=2;gx<N-2;gx++)for(let gz=2;gz<N-2;gz++){
        const h=heights[gx][gz];
        if(h<=sea) continue;                       // pas dans l'eau
        if(solid[voxKey(gx,h-1,gz)]!==1) continue; // uniquement sur l'herbe
        if(rng(gx,gz)>0.06) continue;              // densité forestière
        const th=3+Math.floor(rng(gx+9,gz-4)*3);   // hauteur de tronc 3..5
        for(let t=0;t<th;t++) solid[voxKey(gx,h+t,gz)]=6;
        const top=h+th;
        // canopée : 2 couches larges + chapeau
        for(let dy=0;dy<2;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
          if(Math.abs(dx)===2&&Math.abs(dz)===2&&rng(gx+dx,gz+dz)>0.5) continue;
          const kk=voxKey(gx+dx,top-1+dy,gz+dz); if(!solid[kk]) solid[kk]=7;
        }
        for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
          if(Math.abs(dx)===1&&Math.abs(dz)===1&&rng(gx-dx,gz-dz)>0.6) continue;
          const kk=voxKey(gx+dx,top+1,gz+dz); if(!solid[kk]) solid[kk]=7;
        }
        solid[voxKey(gx,top+2,gz)]=7;
      }
    }
    // ===== CACTUS / ROCHERS (mondes arides) =====
    if(theme==="warn"){
      for(let gx=2;gx<N-2;gx++)for(let gz=2;gz<N-2;gz++){
        const h=heights[gx][gz];
        if(solid[voxKey(gx,h-1,gz)]!==4) continue;
        const r=rng(gx,gz);
        if(r<0.018){ const ch=2+Math.floor(rng(gx+3,gz+7)*3); for(let t=0;t<ch;t++) solid[voxKey(gx,h+t,gz)]=7; } // cactus (feuilles vertes)
        else if(r>0.985){ solid[voxKey(gx,h,gz)]=3; } // rocher
      }
    }
    // ===== COULÉES / CRISTAUX (mondes volcaniques) =====
    if(theme==="risk"){
      for(let gx=1;gx<N-1;gx++)for(let gz=1;gz<N-1;gz++){
        const h=heights[gx][gz]; const r=rng(gx,gz);
        if(r>0.97 && solid[voxKey(gx,h-1,gz)]===8) solid[voxKey(gx,h,gz)]=9; // flaque de lave
        else if(r<0.015) solid[voxKey(gx,h,gz)]=12; // cristal d'or
      }
    }
    // appliquer les modifications persistées
    for(const k in VOX.edits){ const v=VOX.edits[k]; if(v===0) delete solid[k]; else solid[k]=v; }
    VOX.lookup=solid; VOX.heights=heights;
    VOX._lookups=VOX._lookups||{}; VOX._lookups[e.id]=solid;
    // sommets réels (arbres/édits inclus) pour que la caméra survole les cubes au lieu de les traverser
    const top=[]; for(let gx=0;gx<N;gx++){ top[gx]=[]; for(let gz=0;gz<N;gz++){ let ty=0;
      for(let y=maxH+10;y>=0;y--){ if(solid[voxKey(gx,y,gz)]){ ty=y+1; break; } } top[gx][gz]=ty; } }
    VOXTOP[e.id]=top;
    return rebuildVoxMeshes(solid);
  }
  function exposed(solid,x,y,z){
    return !solid[voxKey(x+1,y,z)]||!solid[voxKey(x-1,y,z)]||!solid[voxKey(x,y+1,z)]
         ||!solid[voxKey(x,y-1,z)]||!solid[voxKey(x,y,z+1)]||!solid[voxKey(x,y,z-1)];
  }
  // 6 directions de face : [normale, 4 coins (offsets unitaires), teinte d'ombrage]
  const VOX_FACES=[
    {n:[1,0,0],  v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]], sh:0.82},
    {n:[-1,0,0], v:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]], sh:0.82},
    {n:[0,1,0],  v:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]], sh:1.00, top:true},
    {n:[0,-1,0], v:[[0,0,1],[0,0,0],[1,0,0],[1,0,1]], sh:0.55},
    {n:[0,0,1],  v:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]], sh:0.90},
    {n:[0,0,-1], v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]], sh:0.90}
  ];
  function rebuildVoxMeshes(solid){
    const group=new THREE.Group();
    const S=VOX.size, N=VOX.N;
    // émettre UNIQUEMENT les faces exposées → aucune face interne → aucun z-fighting
    // buffers séparés par couleur (top vs flanc) ; vertex color = ombrage directionnel gris
    const buf={};
    function bufFor(hex,b){ return buf[hex]||(buf[hex]={pos:[],col:[],nor:[],uv:[],b:b}); }
    function push(type,face,x,y,z){
      const b=BLOCKS[type]; const hex=face.top?b.top:(face.n[1]<0? b.side : b.side);
      const B=bufFor(hex,b);
      const sh=face.sh; // gris d'ombrage qui multiplie la texture
      const ox=(x-N/2)*S, oy=y*S, oz=(z-N/2)*S;
      const q=face.v.map(o=>[ox+(o[0]-0.5)*S, oy+(o[1]-0.5)*S, oz+(o[2]-0.5)*S]);
      const UV=[[0,0],[0,1],[1,1],[1,0]];
      [0,1,2,0,2,3].forEach(idx=>{ B.pos.push(q[idx][0],q[idx][1],q[idx][2]);
        B.col.push(sh,sh,sh); B.nor.push(face.n[0],face.n[1],face.n[2]);
        B.uv.push(UV[idx][0],UV[idx][1]); });
    }
    for(const k in solid){ const [x,y,z]=k.split(",").map(Number); const type=solid[k];
      VOX_FACES.forEach(f=>{ const nx=x+f.n[0],ny=y+f.n[1],nz=z+f.n[2];
        const nb=solid[voxKey(nx,ny,nz)];
        const trans=BLOCKS[type].alpha, nbTrans=nb?BLOCKS[nb].alpha:true;
        if(!nb || (nbTrans && !trans) || (trans && nb!==type && nbTrans)) push(type,f,x,y,z);
      });
    }
    Object.keys(buf).forEach(hex=>{
      const B=buf[hex];
      const g=new THREE.BufferGeometry();
      g.setAttribute("position",new THREE.Float32BufferAttribute(B.pos,3));
      g.setAttribute("color",new THREE.Float32BufferAttribute(B.col,3));
      g.setAttribute("normal",new THREE.Float32BufferAttribute(B.nor,3));
      g.setAttribute("uv",new THREE.Float32BufferAttribute(B.uv,2));
      const mesh=new THREE.Mesh(g, faceMat(+hex,B.b));
      if(B.b.alpha){ mesh.renderOrder=3; }
      group.add(mesh);
    });
    return group;
  }
  function voxWorldToCell(p){
    const S=VOX.size, N=VOX.N;
    return [Math.round(p.x/S+N/2), Math.round(p.y/S), Math.round(p.z/S+N/2)];
  }
  function applyVoxEdit(){
    if(!VOX.id) return;
    DATA.voxelEdits=DATA.voxelEdits||{};
    DATA.voxelEdits[VOX.id]=VOX.edits;
    Store.save(DATA);
  }
  function voxDebris(cell, type){
    const S=SURF.cache[VOX.id]; if(!S||!S.scene) return;
    const B=VOX.size, N=VOX.N;
    const wx=(cell[0]-N/2)*B, wy=cell[1]*B, wz=(cell[2]-N/2)*B;
    const n=14, g=new THREE.BufferGeometry(), pos=[], vel=[];
    for(let i=0;i<n;i++){ pos.push(wx+(Math.random()-.5)*B, wy+(Math.random()-.5)*B, wz+(Math.random()-.5)*B);
      vel.push((Math.random()-.5)*.9,(Math.random()*.9+.3),(Math.random()-.5)*.9); }
    g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
    const col=new THREE.Color((BLOCKS[type]||BLOCKS[2]).top);
    const pts=new THREE.Points(g,new THREE.PointsMaterial({color:col,size:1.4,map:DOT,transparent:true,opacity:1,depthWrite:false}));
    S.scene.add(pts);
    let life=0; const up=(t)=>{ life+=DT; const a=g.attributes.position.array;
      for(let i=0;i<n;i++){ vel[i*3+1]-=.045; a[i*3]+=vel[i*3]; a[i*3+1]+=vel[i*3+1]; a[i*3+2]+=vel[i*3+2]; }
      g.attributes.position.needsUpdate=true; pts.material.opacity=Math.max(0,1-life/0.8);
      if(life>=0.82){ S.scene.remove(pts); pts.geometry.dispose(); pts.material.dispose();
        const idx=S.ups.indexOf(up); if(idx>=0) S.ups.splice(idx,1); } };
    S.ups.push(up);
  }
  function pointToCell(point,normal,inward){
    const S=VOX.size, N=VOX.N, s=inward?-0.5:0.5;
    const x=Math.round((point.x + normal.x*S*s)/S + N/2);
    const y=Math.round((point.y + normal.y*S*s)/S);
    const z=Math.round((point.z + normal.z*S*s)/S + N/2);
    return [x,y,z];
  }
  function voxBreak(point,normal){
    const cell=pointToCell(point,normal,true);
    const k=voxKey(...cell);
    const type=VOX.lookup[k]; if(!type) return;
    if(BLOCKS[type] && BLOCKS[type].n==="Eau") return;
    voxDebris(cell, type);
    delete VOX.lookup[k]; VOX.edits[k]=0;
    refreshVox(); applyVoxEdit();
  }
  function voxPlace(point,normal){
    const cell=pointToCell(point,normal,false);
    if(cell[1]<0||cell[1]>80) return;
    const k=voxKey(...cell);
    if(VOX.lookup[k]) return;
    VOX.lookup[k]=VOX.block; VOX.edits[k]=VOX.block;
    refreshVox(); applyVoxEdit();
  }
  function refreshVox(){
    const S=SURF.cache[VOX.id]; if(!S||!VOX.group) return;
    S.scene.remove(VOX.group);
    VOX.group=rebuildVoxMeshes(VOX.lookup);
    S.scene.add(VOX.group);
    S.voxGroup=VOX.group;
    VOX._lookups=VOX._lookups||{}; VOX._lookups[VOX.id]=VOX.lookup;
  }
  function voxTopY(wx,wz){
    if(!VOX.heights) return null;
    const S=VOX.size, N=VOX.N;
    const gx=Math.round(wx/S+N/2), gz=Math.round(wz/S+N/2);
    if(gx<0||gx>=N||gz<0||gz>=N||!VOX.heights[gx]) return null;
    // hauteur du sommet : on tient compte des blocs cassés/ajoutés sur la colonne
    let h=VOX.heights[gx][gz];
    // ajuster avec les éditions persistées (sommet réel)
    for(let y=h+8;y>=0;y--){ if(VOX.lookup&&VOX.lookup[voxKey(gx,y,gz)]){ h=y+1; break; } }
    return (h-1)*S + S/2;
  }
  try{ window.buildVoxelWorld=buildVoxelWorld; window.voxBreak=voxBreak; window.voxPlace=voxPlace; window.pointToCell=pointToCell; window.BLOCKS=BLOCKS; window.voxTopY=voxTopY; }catch(_){}


/* ===== Interactions barre voxel ===== */
(function(){
  const pal=$("#vb-palette"); if(!pal) return;
  for(const id in BLOCKS){
    const b=BLOCKS[id], d=document.createElement("div");
    d.className="vb-blk"+(+id===VOX.block?" on":"");
    d.style.background="linear-gradient(150deg,#"+b.top.toString(16).padStart(6,"0")+",#"+b.side.toString(16).padStart(6,"0")+")";
    d.title=b.n; d.dataset.id=id; d.style.animationDelay=(+id*0.025)+"s";
    d.addEventListener("click",()=>{ VOX.block=+id;
      pal.querySelectorAll(".vb-blk").forEach(x=>x.classList.remove("on")); d.classList.add("on");
      if(VOX.tool==="break"){ setTool("place"); }
    });
    pal.appendChild(d);
  }
  function setTool(t){ VOX.tool=t;
    document.querySelectorAll(".vb-tool").forEach(x=>x.classList.toggle("on",x.dataset.tool===t)); }
  window._voxSetTool=setTool;
  document.querySelectorAll(".vb-tool").forEach(btn=>{
    btn.addEventListener("click",()=>setTool(btn.dataset.tool));
  });
})();

  function makeSurface(e){
    const theme=e.risk, seed=seedOf(e.id);
    const sc=new THREE.Scene();
    const pal=theme==="risk"
      ? {skyT:"#240D0A",skyB:"#C84A1E",fog:0x6E2A1A,sun:"#FFA050",amb:.7,far:400}
      : theme==="warn"
      ? {skyT:"#27406B",skyB:"#F0C088",fog:0xD8B086,sun:"#FFE6B8",amb:.8,far:430}
      : {skyT:"#16395E",skyB:"#AEDCF5",fog:0xBFD9EC,sun:"#FFF6DC",amb:.9,far:480};
    sc.fog=new THREE.Fog(pal.fog, 85, pal.far);
    const skyTex=noiseTex(16,256,(cx,w,h)=>{ const g=cx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,pal.skyT); g.addColorStop(.78,pal.skyB);
      g.addColorStop(1,"#"+new THREE.Color(pal.fog).getHexString()); cx.fillStyle=g; cx.fillRect(0,0,w,h); });
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(1600,24,16),
      new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide,fog:false})));
    sc.add(new THREE.HemisphereLight(new THREE.Color(pal.skyB),new THREE.Color("#33291E"),pal.amb));
    const sun2=new THREE.DirectionalLight(new THREE.Color(pal.sun), theme==="risk"?1.0:1.6);
    sun2.position.set(-340,170,-520); sc.add(sun2);
    const fill=new THREE.DirectionalLight(0x9AB8E0,.35); fill.position.set(300,120,400); sc.add(fill);
    const sunSp=glowSprite(pal.sun,"rgba(255,255,255,.95)"); sunSp.scale.set(300,300,1);
    sunSp.position.set(-820,360,-1240); sunSp.material.fog=false; sc.add(sunSp);
    for(let i=0;i<2;i++){ const ray2=glowSprite(pal.sun,"rgba(255,250,230,.5)");
      ray2.scale.set(34,800,1); ray2.material.opacity=.05; ray2.material.fog=false;
      ray2.position.set(-700+i*120,140,-1100); ray2.material.rotation=.5-i*.3; sc.add(ray2); }
    const SEG=150, SIZE=520;
    const geo=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG); geo.rotateX(-Math.PI/2);
    const pos=geo.attributes.position, colors=[];
    const cTint=new THREE.Color(e.color);
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i), z=pos.getZ(i);
      const h=surfH(x,z,seed,theme); pos.setY(i,h);
      let r,g,b;
      const hn=Math.max(0,Math.min(1,(h+10)/40));
      if(theme==="risk"){ const k=.25+hn*.45; r=.30*k+.12; g=.22*k+.09; b=.21*k+.09;
        if(hn<.16){ r=.92; g=.30; b=.05; } }
      else if(theme==="warn"){ const k=.55+hn*.45; r=.84*k; g=.66*k; b=.42*k;
        if(hn>.8){ r*=.85;g*=.85;b*=.88; } }
      else { if(hn<.20){ r=.13;g=.27;b=.44; }
        else if(hn<.27){ r=.74;g=.68;b=.47; }
        else if(hn<.58){ const k=.5+hn*.55; r=.16*k;g=.43*k;b=.19*k; }
        else if(hn<.84){ const k=.42+hn*.5; r=.40*k;g=.36*k;b=.32*k; }
        else { r=.93;g=.96;b=1; } }
      const ao=.78+.22*hn; r*=ao; g*=ao; b*=ao;
      r=r*.86+cTint.r*.14; g=g*.86+cTint.g*.14; b=b*.86+cTint.b*.14;
      colors.push(r,g,b);
    }
    geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    geo.computeVertexNormals();
    const terr=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,
      map:groundDetailTex(theme,seed), bumpMap:groundDetailTex(theme,seed+40), bumpScale:.55,
      roughness:.94,metalness:.02,flatShading:theme==="risk"}));
    sc.add(terr);
    const ups=[];
    // ============================================================
    // 3.87 : CIEL CELESTE - contexte orbital visible depuis la surface du monde
    // lunes (emprunts) en croissant, anneaux (mondes anneles), planetes voisines
    // ============================================================
    (function celestialSky(){
      const SKY=1350; // rayon de placement dans la voute (sphere ciel=1600)
      // — LUNES : une par emprunt (max 3), eclairees par le soleil (croissant), derive lente —
      const nMoons=Math.min(3,(e.loans||[]).length);
      for(let m=0;m<nMoons;m++){
        const mr=24+m*11, el=.42+m*.18, az0=-2.0+m*1.5;
        const moon=new THREE.Mesh(new THREE.SphereGeometry(mr,28,20),
          new THREE.MeshStandardMaterial({color:0xC6CCDA,roughness:.96,metalness:.02,
            emissive:new THREE.Color(e.color).multiplyScalar(.1),emissiveIntensity:1,
            bumpMap:moonTexture(seed+m*23,e.color),bumpScale:.5}));
        moon.material.map=moonTexture(seed+m*23,e.color); moon.material.fog=false;
        const rr=SKY*Math.cos(el);
        moon.position.set(Math.cos(az0)*rr,SKY*Math.sin(el),Math.sin(az0)*rr);
        sc.add(moon);
        ups.push(t=>{ const a=az0+t*0.006*(m%2?1:-1);
          moon.position.set(Math.cos(a)*rr,SKY*Math.sin(el),Math.sin(a)*rr); moon.rotation.y+=.0015; });
      }
      // — ANNEAUX : grand arc en travers du ciel pour les mondes anneles (archetype banded) —
      if(e.arch==="banded"){
        const mkRing=(ri,ro,col,op)=>{ const rg=new THREE.Mesh(new THREE.RingGeometry(ri,ro,120,1),
          new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,side:THREE.DoubleSide,depthWrite:false,fog:false}));
          rg.rotation.x=Math.PI*.40; rg.rotation.z=.34; sc.add(rg); return rg; };
        mkRing(SKY*.86,SKY*1.30,0xE8D6B0,.13);
        mkRing(SKY*.94,SKY*1.05,0xFFF1D6,.20);
        mkRing(SKY*1.10,SKY*1.20,0xD8C4A0,.11);
      }
      // — PLANETES VOISINES : 2 autres vehicules, disques colores bas sur l'horizon —
      DATA.entities.filter(o=>o.id!==e.id).slice(0,2).forEach((o,k)=>{
        const hx="#"+new THREE.Color(o.color).getHexString();
        const disc=glowSprite(hx,"rgba(255,255,255,.7)");
        const dsz=54+k*26; disc.scale.set(dsz,dsz,1); disc.material.fog=false; disc.material.opacity=.42;
        const az=1.5-k*1.15, el=.10+k*.05, rr=SKY*Math.cos(el);
        disc.position.set(Math.cos(az)*rr,SKY*Math.sin(el),Math.sin(az)*rr); sc.add(disc);
        const core=new THREE.Mesh(new THREE.SphereGeometry(dsz*.26,18,12),
          new THREE.MeshStandardMaterial({color:new THREE.Color(o.color),roughness:.8,metalness:.05,
            emissive:new THREE.Color(o.color).multiplyScalar(.25),emissiveIntensity:1}));
        core.material.fog=false; core.position.copy(disc.position); sc.add(core);
      });
      // — VOL D'OISEAUX EN FORMATION (faune) : mondes temperes uniquement —
      if(theme==="ok"){
        const flock=new THREE.Group();
        const bmat=new THREE.MeshBasicMaterial({color:0x1A1A22,fog:true});
        for(let b=0;b<9;b++){
          const wing=new THREE.Mesh(new THREE.ConeGeometry(1.1,4.2,3),bmat);
          wing.rotation.z=Math.PI/2; wing.scale.set(1,.3,1);
          const row=Math.floor(b/2), side=(b%2)?1:-1;
          wing.position.set(side*row*2.4, -row*.6, row*2.2); flock.add(wing);
        }
        flock.position.set(-40,70,-60); sc.add(flock);
        ups.push(t=>{ const a=t*.12;
          flock.position.set(Math.cos(a)*90, 66+Math.sin(t*.5)*6, Math.sin(a)*90);
          flock.rotation.y=-a+Math.PI/2;
          flock.children.forEach((w,i)=>{ w.rotation.x=Math.sin(t*6+i)*.5; }); });
      }
    })();
    const clTex=cloudSpriteTex();
    function cumulus(scale2,tint,op){
      const grp=new THREE.Group(); const np=6+Math.floor(Math.random()*3);
      for(let p4=0;p4<np;p4++){
        const cl=new THREE.Sprite(new THREE.SpriteMaterial({map:clTex,transparent:true,
          opacity:op*(p4===0?1:.8), depthWrite:false, color:tint}));
        const core=p4===0;
        const w2=(core?70:34+Math.random()*30)*scale2;
        cl.scale.set(w2,w2*(core?.62:.7),1);
        // base plate, dôme bombé
        cl.position.set((Math.random()-.5)*(core?0:64*scale2), core?0:Math.random()*16*scale2, (Math.random()-.5)*22*scale2);
        grp.add(cl);
      }
      return grp;
    }
    for(let c2=0;c2<(theme==="risk"?4:9);c2++){
      const grp=cumulus(1+Math.random()*.8, theme==="risk"?0xC89084:0xFFFFFF, theme==="risk"?.25:.8);
      const ph=Math.random()*7, rr=Math.random()*SIZE*.5, hh=100+Math.random()*60;
      sc.add(grp);
      ups.push(t=>{ grp.position.set(Math.cos(ph)*rr+((t*2.0+ph*60)%(SIZE*1.5))-SIZE*.75, hh+Math.sin(t*.3+ph)*2, Math.sin(ph)*rr); });
    }
    // ORAGE : cumulonimbus sombre + éclairs (mondes tempérés)
    if(theme==="ok"){
      const storm=cumulus(2.6, 0x5A6678, .95);
      const flash=glowSprite("#FFFFFF","rgba(240,245,255,1)"); flash.scale.set(70,70,1);
      flash.material.opacity=0; storm.add(flash);
      const sLight=new THREE.PointLight(0xBFD4FF,0,320,1.6); storm.add(sLight);
      // rideau de pluie : segments verticaux qui tombent
      const RN=900, rg4=new THREE.BufferGeometry(), rv=[];
      for(let i=0;i<RN;i++) rv.push((Math.random()-.5)*150,Math.random()*120,(Math.random()-.5)*150);
      rg4.setAttribute("position",new THREE.Float32BufferAttribute(rv,3));
      const rain=new THREE.Points(rg4,new THREE.PointsMaterial({color:0xAFC8E6,size:.9,transparent:true,opacity:.5,depthWrite:false}));
      storm.add(rain);
      // éclair ramifié (segments)
      const boltMat=new THREE.LineBasicMaterial({color:0xEAF2FF,transparent:true,opacity:0});
      const boltGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,-110,0)]);
      const bolt=new THREE.Line(boltGeo,boltMat); bolt.position.y=-10; storm.add(bolt);
      sc.add(storm);
      let nextBolt=4+Math.random()*7, boltT=-1;
      ups.push(t=>{
        const x=((t*1.2)%(SIZE*1.7))-SIZE*.85;
        storm.position.set(x, 125, Math.sin(t*.06)*110);
        // pluie qui tombe en boucle
        const ra=rain.geometry.attributes.position.array;
        for(let i=0;i<RN;i++){ ra[i*3+1]-=3.4; if(ra[i*3+1]<-110) ra[i*3+1]=120; }
        rain.geometry.attributes.position.needsUpdate=true;
        if(t>nextBolt){ boltT=t; nextBolt=t+5+Math.random()*9;
          // re-tracer l'éclair en zigzag
          const pts=[new THREE.Vector3(0,0,0)]; let yy=0,xx=0,zz=0;
          while(yy>-110){ yy-=12+Math.random()*10; xx+=(Math.random()-.5)*20; zz+=(Math.random()-.5)*20; pts.push(new THREE.Vector3(xx,yy,zz)); }
          bolt.geometry.setFromPoints(pts);
        }
        const dt2=t-boltT;
        const k=dt2<.5?Math.max(0,Math.sin(dt2*22))*(dt2<.12?1:.5):0;
        flash.material.opacity=k*.9; sLight.intensity=k*11; boltMat.opacity=k>.1?1:0;
      });
    }
    // TORNADE : entonnoir tournant qui erre (mondes arides)
    if(theme==="warn"){
      const torn=new THREE.Group();
      for(let seg=0;seg<9;seg++){
        const tp=new THREE.Sprite(new THREE.SpriteMaterial({map:clTex,color:0xB89A78,transparent:true,opacity:.5-seg*.03,depthWrite:false}));
        const w5=6+seg*4.2; tp.scale.set(w5,9,1); tp.position.y=seg*8;
        tp.userData={seg}; torn.add(tp);
      }
      const baseDust=cumulus(.8,0xC8A878,.5); baseDust.position.y=2; torn.add(baseDust);
      sc.add(torn);
      ups.push(t=>{
        const x=Math.cos(t*.05)*140, z=Math.sin(t*.037)*140;
        torn.position.set(x,surfH(x,z,seed,theme),z);
        torn.children.forEach(c3=>{ if(c3.userData&&c3.userData.seg!=null){
          const sg=c3.userData.seg;
          c3.position.x=Math.sin(t*2.2+sg*.7)*(1+sg*.4);
          c3.position.z=Math.cos(t*2.2+sg*.7)*(1+sg*.4);
          c3.material.rotation+=.06; } });
      });
    }
    const M4=new THREE.Matrix4(), Q=new THREE.Quaternion(), V3=new THREE.Vector3(), SC=new THREE.Vector3();
    function scatter(count, fit){ const list=[]; let tries=0;
      while(list.length<count && tries<count*9){ tries++;
        const x=(Math.random()-.5)*SIZE*.92, z=(Math.random()-.5)*SIZE*.92;
        const h=surfH(x,z,seed,theme); if(fit(h)) list.push([x,h,z]); }
      return list; }
    if(theme==="ok"){
      const spots=scatter(380, h=>h>1.5&&h<15);
      const trunkM=new THREE.MeshStandardMaterial({color:0x5A3A22,roughness:.95});
      const leafM=new THREE.MeshStandardMaterial({color:0x1C4A24,roughness:.9});
      const leafM2=new THREE.MeshStandardMaterial({color:0x2A6232,roughness:.9});
      const trunkI=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.34,1.8,5),trunkM,spots.length);
      const t1I=new THREE.InstancedMesh(new THREE.ConeGeometry(1.7,3.0,7),leafM,spots.length);
      const t2I=new THREE.InstancedMesh(new THREE.ConeGeometry(1.15,2.2,7),leafM2,spots.length);
      spots.forEach(([x,h,z],i)=>{
        const k=.65+Math.random()*.9; SC.set(k,k,k); Q.setFromAxisAngle(V3.set(0,1,0),Math.random()*7);
        M4.compose(new THREE.Vector3(x,h+.9*k,z),Q,SC); trunkI.setMatrixAt(i,M4);
        M4.compose(new THREE.Vector3(x,h+3.2*k,z),Q,SC); t1I.setMatrixAt(i,M4);
        M4.compose(new THREE.Vector3(x,h+4.9*k,z),Q,SC); t2I.setMatrixAt(i,M4);
      });
      sc.add(trunkI); sc.add(t1I); sc.add(t2I);
      // ===== OCÉAN : surface ondulante, transparence, profondeur, écume de côte =====
      const SEAY=-1.8;
      const wGeo=new THREE.PlaneGeometry(SIZE,SIZE,90,90); wGeo.rotateX(-Math.PI/2);
      const wBase=wGeo.attributes.position.array.slice();
      const wTex=groundDetailTex("ok",seed+77); wTex.repeat.set(44,44);
      const water=new THREE.Mesh(wGeo,new THREE.MeshStandardMaterial({color:0x1E5A92,transparent:true,opacity:.6,
        roughness:.07,metalness:.66,bumpMap:wTex,bumpScale:.3}));
      water.position.y=SEAY; water.renderOrder=2; sc.add(water);
      const bed=new THREE.Mesh(new THREE.PlaneGeometry(SIZE,SIZE),new THREE.MeshBasicMaterial({color:0x06243E}));
      bed.rotation.x=-Math.PI/2; bed.position.y=SEAY-6; sc.add(bed);
      const sunGlint=glowSprite(pal.sun,"rgba(255,250,230,.9)"); sunGlint.scale.set(130,52,1);
      sunGlint.position.set(-180,SEAY+5,-240); sunGlint.material.opacity=.3; sc.add(sunGlint);
      ups.push(t=>{
        const a=wGeo.attributes.position.array;
        for(let i=0;i<a.length;i+=3){ const x=wBase[i], z=wBase[i+2];
          a[i+1]=Math.sin(x*.06+t*1.3)*.55+Math.cos(z*.08+t*1.0)*.45+Math.sin((x+z)*.03+t*.6)*.4; }
        wGeo.attributes.position.needsUpdate=true; wGeo.computeVertexNormals();
        wTex.offset.set(t*.01,t*.014); sunGlint.material.opacity=.22+.12*Math.sin(t*.8);
      });
      // écume sur la ligne de côte
      const foamPts=[];
      for(let i=0;i<2600;i++){ const x=(Math.random()-.5)*SIZE*.96, z=(Math.random()-.5)*SIZE*.96;
        const h=surfH(x,z,seed,theme); if(h>SEAY-.6&&h<SEAY+1.4) foamPts.push(x,SEAY+.18,z); }
      const fgF=new THREE.BufferGeometry(); fgF.setAttribute("position",new THREE.Float32BufferAttribute(foamPts,3));
      const foamSurf=new THREE.Points(fgF,new THREE.PointsMaterial({color:0xFFFFFF,size:2.0,map:DOT,transparent:true,opacity:.8,depthWrite:false}));
      foamSurf.renderOrder=3; sc.add(foamSurf);
      ups.push(t=>{ foamSurf.material.opacity=.5+.4*Math.abs(Math.sin(t*1.6)); foamSurf.material.size=1.7+.7*Math.sin(t*1.6); });
      const vill=scatter(5,h=>h>2&&h<10);
      vill.forEach(([x,h,z],v2)=>{ for(let j=0;j<7;j++){
        const d=glowSprite("#FFD9A0","rgba(255,220,160,1)"); d.scale.set(2.6,2.6,1);
        d.position.set(x+(Math.random()-.5)*18, surfH(x,z,seed,theme)+1.6, z+(Math.random()-.5)*18);
        sc.add(d); ups.push(t=>{ d.material.opacity=.5+.35*Math.sin(t*2+j+v2); }); } });
      for(let b2=0;b2<9;b2++){ const bird=glowSprite("#FFFFFF","rgba(255,255,255,.9)"); bird.scale.set(1.8,.55,1);
        const ph=Math.random()*7, rr=60+Math.random()*150, hh=30+Math.random()*36;
        sc.add(bird); ups.push(t=>{ bird.position.set(Math.cos(t*.1+ph)*rr, hh+Math.sin(t*.8+ph)*3, Math.sin(t*.1+ph)*rr); }); }
      for(let p2=0;p2<10;p2++){ const fly=glowSprite(["#FFD24A","#FF8AC8","#8AD4FF"][p2%3],"rgba(255,255,255,.9)");
        fly.scale.set(.8,.8,1); const ph=Math.random()*7, ox=(Math.random()-.5)*90, oz=(Math.random()-.5)*90;
        sc.add(fly); ups.push(t=>{ const x=ox+Math.sin(t*.9+ph)*7, z=oz+Math.cos(t*.7+ph)*7;
          fly.position.set(x, surfH(x,z,seed,theme)+2.2+Math.sin(t*3+ph), z); }); }
    }
    if(theme==="warn"){
      const spots=scatter(160,h=>h>0);
      const rockM=new THREE.MeshStandardMaterial({color:0x8A7458,roughness:.96,flatShading:true});
      const rockI=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.4,0),rockM,spots.length);
      spots.forEach(([x,h,z],i)=>{ const k=.5+Math.random()*2.0; SC.set(k,k*.75,k);
        Q.setFromAxisAngle(V3.set(0,1,0),Math.random()*7); M4.compose(new THREE.Vector3(x,h+.6*k,z),Q,SC); rockI.setMatrixAt(i,M4); });
      sc.add(rockI);
      const dryM=new THREE.MeshStandardMaterial({color:0xB89A5A,roughness:1});
      const sp2=scatter(220,h=>h>0&&h<8);
      const dryI=new THREE.InstancedMesh(new THREE.ConeGeometry(.5,1.6,4),dryM,sp2.length);
      sp2.forEach(([x,h,z],i)=>{ const k=.5+Math.random(); SC.set(k,k,k);
        Q.setFromAxisAngle(V3.set(0,1,0),Math.random()*7); M4.compose(new THREE.Vector3(x,h+.7*k,z),Q,SC); dryI.setMatrixAt(i,M4); });
      sc.add(dryI);
      for(let d2=0;d2<3;d2++){ const dust=glowSprite("#E0BC8E","rgba(225,195,150,.6)"); dust.scale.set(9,30,1);
        const ph=Math.random()*7; sc.add(dust);
        ups.push(t=>{ const x=Math.cos(t*.05+ph)*150, z=Math.sin(t*.04+ph)*150;
          dust.position.set(x,surfH(x,z,seed,theme)+13,z); dust.material.opacity=.16+.1*Math.sin(t+ph); }); }
    }
    if(theme==="risk"){
      const lavaPlane=new THREE.Mesh(new THREE.PlaneGeometry(SIZE,SIZE),
        new THREE.MeshBasicMaterial({color:0xFF4A14,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false}));
      lavaPlane.rotation.x=-Math.PI/2; lavaPlane.position.y=-4.7; sc.add(lavaPlane);
      ups.push(t=>{ lavaPlane.material.opacity=.24+.12*Math.sin(t*2.4); });
      const lp2=scatter(420,h=>h<-4.5);
      const lg2=new THREE.BufferGeometry();
      const lf=[]; lp2.forEach(([x,h,z])=>{ lf.push(x,h+.7,z); });
      lg2.setAttribute("position",new THREE.Float32BufferAttribute(lf,3));
      const lp=new THREE.Points(lg2,new THREE.PointsMaterial({color:0xFF8A30,size:3.4,map:DOT,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
      sc.add(lp); ups.push(t=>{ lp.material.opacity=.6+.3*Math.sin(t*3.4); });
      const spikes=scatter(120,h=>h>4);
      const spM=new THREE.MeshStandardMaterial({color:0x2A2026,roughness:.9,flatShading:true});
      const spI=new THREE.InstancedMesh(new THREE.ConeGeometry(1.2,6,5),spM,spikes.length);
      spikes.forEach(([x,h,z],i)=>{ const k=.6+Math.random()*1.6; SC.set(k,k*1.4,k);
        Q.setFromAxisAngle(V3.set(0,1,0),Math.random()*7); M4.compose(new THREE.Vector3(x,h+3*k,z),Q,SC); spI.setMatrixAt(i,M4); });
      sc.add(spI);
      const emb=new THREE.BufferGeometry(), ev=[];
      for(let i=0;i<160;i++) ev.push((Math.random()-.5)*SIZE*.8, Math.random()*46, (Math.random()-.5)*SIZE*.8);
      emb.setAttribute("position",new THREE.Float32BufferAttribute(ev,3));
      const embers=new THREE.Points(emb,new THREE.PointsMaterial({color:0xFFAA50,size:1.7,map:DOT,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
      sc.add(embers);
      ups.push(()=>{ const a2=embers.geometry.attributes.position.array;
        for(let i=0;i<160;i++){ a2[i*3+1]+=.13; if(a2[i*3+1]>50) a2[i*3+1]=0; }
        embers.geometry.attributes.position.needsUpdate=true; });
    }
    if(e.fx&&e.fx.indexOf("saturnRings")>-1){
      [[1100,52,.32],[1260,30,.20]].forEach(([R,tube,op])=>{
        const ring=new THREE.Mesh(new THREE.TorusGeometry(R,tube,8,120),
          new THREE.MeshBasicMaterial({color:0xFFD98A,transparent:true,opacity:op,fog:false,depthWrite:false}));
        ring.rotation.x=Math.PI/2-.07; ring.rotation.z=.03; ring.position.y=-40; sc.add(ring); });
    }
    // ===== MÉGA-DÉTAILS =====
    // ombres de nuages qui glissent sur le terrain (tous biomes)
    for(let sh=0;sh<(theme==="risk"?3:7);sh++){
      const shd=new THREE.Sprite(new THREE.SpriteMaterial({map:clTex,color:0x000000,transparent:true,opacity:.13,depthWrite:false}));
      const w3=140+Math.random()*180; shd.scale.set(w3,w3*.42,1);
      const ph=Math.random()*7, rr=Math.random()*SIZE*.45;
      shd.material.rotation=Math.PI/2; // posée à plat visuellement via position basse
      sc.add(shd);
      ups.push(t=>{ const x=Math.cos(ph)*rr+((t*2.2+ph*60)%(SIZE*1.4))-SIZE*.7, z=Math.sin(ph)*rr;
        shd.position.set(x, surfH(x,z,seed,theme)+1.2, z); });
    }
    if(theme==="ok"){
      // ÉCLAIRCIES : le soleil perce les nuages par cycles
      ups.push(t=>{ const k=.5+.5*Math.sin(t*.07);
        sun2.intensity=1.25+.7*k; sunSp.material.opacity=.6+.35*k; });
      // ===== CITÉ SIMCITY : plateau aplani, quartiers en damier, downtown gradué =====
      (function(){
        // trouver une cuvette plate et basse pour poser la ville
        let cx0=0,cz0=0,best=1e9;
        for(let tr=0;tr<60;tr++){ const x=(Math.random()-.5)*SIZE*.45, z=(Math.random()-.5)*SIZE*.45;
          const h0=surfH(x,z,seed,theme);
          if(h0>1.5&&h0<8){ const slope=Math.abs(surfH(x+10,z,seed,theme)-h0)+Math.abs(surfH(x,z+10,seed,theme)-h0)+Math.abs(h0-4);
            if(slope<best){ best=slope; cx0=x; cz0=z; } } }
        const GROUND=surfH(cx0,cz0,seed,theme);
        sc.userData.cityPos={x:cx0,z:cz0};
        const CITY=130;                       // demi-emprise
        const BLK=11;                          // trame plus serrée = ville plus dense
        const ROAD=4.2;                        // largeur de rue
        // dalle urbaine plane (asphalte clair) qui efface le relief sous la ville
        const slab=new THREE.Mesh(new THREE.BoxGeometry(CITY*2+10,3,CITY*2+10),
          new THREE.MeshStandardMaterial({color:0x161B24,roughness:.95}));
        slab.position.set(cx0,GROUND-1.4,cz0); sc.add(slab);
        // texture fenêtres
        const winTex=noiseTex(128,256,(c2,w,h)=>{ c2.fillStyle="#080C14"; c2.fillRect(0,0,w,h);
          for(let yy=6;yy<h-6;yy+=9)for(let xx=5;xx<w-5;xx+=8)
            if(Math.random()<.62){ const lit=Math.random(); c2.fillStyle=lit<.7?"#FFE0A8":lit<.9?"#9AD4FF":"#FFFFFF"; c2.fillRect(xx,yy,4,6); } });
        winTex.anisotropy=4;
        const bM=new THREE.MeshStandardMaterial({color:0x141A24,roughness:.5,metalness:.4,
          emissive:0xFFE2AE,emissiveIntensity:.95,emissiveMap:winTex});
        const glassM=new THREE.MeshStandardMaterial({color:0x1A2738,roughness:.18,metalness:.7,
          emissive:0x9AC8FF,emissiveIntensity:.5,emissiveMap:winTex});
        // damier d'immeubles : un par cellule, hauteur ∝ proximité downtown
        const cells=[];
        for(let gx=-CITY+BLK/2; gx<CITY; gx+=BLK) for(let gz=-CITY+BLK/2; gz<CITY; gz+=BLK){
          const dd=Math.hypot(gx,gz)/CITY;
          if(dd>1) continue;
          if(Math.random()<.08+dd*.18) continue;     // parcs/places
          cells.push([gx,gz,dd]);
        }
        const N=cells.length*3;
        const bI=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),bM,N);
        const gI=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),glassM,N);
        const bM2=new THREE.MeshStandardMaterial({color:0x4A4238,roughness:.8,metalness:.1,emissive:0xFFD9A0,emissiveIntensity:.7,emissiveMap:winTex});
        const cI=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),bM2,N);
        const rfI=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x232B37,roughness:.85}),cells.length);
        let bi=0, gi2=0, ci=0, ri=0;
        const tallSpots=[];
        cells.forEach(([gx,gz,dd])=>{
          const foot=BLK-ROAD-(Math.random()*2);
          const core=Math.pow(Math.max(0,1-dd),1.6);
          const hgt=4 + core*(40+Math.random()*46) + (1-core)*Math.random()*8;
          const fam=Math.random(); const which=(fam<.38+core*.3)?0:(fam<.78?1:2);
          const put=function(w,h,d,x,y,z){ SC.set(w,h,d); Q.identity(); M4.compose(new THREE.Vector3(x,y,z),Q,SC);
            if(which===0) gI.setMatrixAt(gi2++,M4); else if(which===1) bI.setMatrixAt(bi++,M4); else cI.setMatrixAt(ci++,M4); };
          const w0=foot*(.7+Math.random()*.25), d0=foot*(.7+Math.random()*.25);
          if(hgt>26){ // TOUR À RETRAITS : 3 segments rétrécissants (silhouette Manhattan)
            const h1=hgt*.55, h2=hgt*.3, h3=hgt*.15;
            put(w0,h1,d0, cx0+gx, GROUND+h1/2, cz0+gz);
            put(w0*.74,h2,d0*.74, cx0+gx, GROUND+h1+h2/2, cz0+gz);
            put(w0*.5,h3,d0*.5, cx0+gx, GROUND+h1+h2+h3/2, cz0+gz);
          } else {
            put(w0,hgt,d0, cx0+gx, GROUND+hgt/2, cz0+gz);
            if(Math.random()<.5){ SC.set(Math.max(1.2,w0*.34),2.2,Math.max(1.2,d0*.34)); Q.identity();
              M4.compose(new THREE.Vector3(cx0+gx+(Math.random()-.5)*w0*.3, GROUND+hgt+1.1, cz0+gz+(Math.random()-.5)*d0*.3),Q,SC); rfI.setMatrixAt(ri++,M4); }
          }
          if(hgt>34) tallSpots.push([cx0+gx,GROUND+hgt,cz0+gz]);
        });
        bI.count=bi; gI.count=gi2; cI.count=ci; rfI.count=ri; sc.add(bI); sc.add(gI); sc.add(cI); sc.add(rfI);
        // toits : petits volumes techniques + balises rouges sur les tours
        tallSpots.slice(0,30).forEach(([x,y,z],i)=>{
          if(i<10){ const bb=glowSprite("#FF5A48","rgba(255,120,100,1)"); bb.scale.set(2,2,1);
            bb.position.set(x,y+2,z); sc.add(bb);
            ups.push(t=>{ bb.material.opacity=Math.sin(t*3+i)>.4?1:.05; }); }
        });
        // LA FLÈCHE : tour signature au centre exact
        const spire=new THREE.Mesh(new THREE.CylinderGeometry(1.4,4,96,6),
          new THREE.MeshStandardMaterial({color:0x1E2836,roughness:.3,metalness:.7,emissive:0xFFE2AE,emissiveIntensity:1.0,emissiveMap:winTex}));
        spire.position.set(cx0,GROUND+48,cz0); sc.add(spire);
        const ant=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,16,4),
          new THREE.MeshStandardMaterial({color:0x66707E,emissive:0xFF5A48,emissiveIntensity:.7}));
        ant.position.set(cx0,GROUND+104,cz0); sc.add(ant);
        // PARC CENTRAL : pelouse, étang, bosquet
        const park=new THREE.Mesh(new THREE.BoxGeometry(30,1.2,22),new THREE.MeshStandardMaterial({color:0x2E7D3A,roughness:.95}));
        park.position.set(cx0+26,GROUND-0.2,cz0-20); sc.add(park);
        const pond=new THREE.Mesh(new THREE.CylinderGeometry(6,6,.6,14),new THREE.MeshStandardMaterial({color:0x2B6FB8,roughness:.25,metalness:.4}));
        pond.position.set(cx0+30,GROUND+0.45,cz0-22); sc.add(pond);
        const ptreeI=new THREE.InstancedMesh(new THREE.ConeGeometry(1.5,4.5,6),new THREE.MeshStandardMaterial({color:0x3AA34E,roughness:.9,flatShading:true}),10);
        for(let pt=0;pt<10;pt++){ SC.set(1,1,1); Q.identity(); M4.compose(new THREE.Vector3(cx0+14+Math.random()*24,GROUND+2.6,cz0-31+Math.random()*20),Q,SC); ptreeI.setMatrixAt(pt,M4); }
        sc.add(ptreeI);
        // AVENUES : tirets médians clairs sur les 2 axes
        const dashI=new THREE.InstancedMesh(new THREE.BoxGeometry(3.4,.15,.5),new THREE.MeshBasicMaterial({color:0xC9D2E0}),40);
        for(let dsh=0;dsh<20;dsh++){ SC.set(1,1,1); Q.identity();
          M4.compose(new THREE.Vector3(cx0-CITY+8+dsh*13,GROUND+0.4,cz0+BLK/2-ROAD/2),Q,SC); dashI.setMatrixAt(dsh,M4);
          Q.setFromAxisAngle(V3.set(0,1,0),Math.PI/2); M4.compose(new THREE.Vector3(cx0+BLK/2-ROAD/2,GROUND+0.4,cz0-CITY+8+dsh*13),Q,SC); dashI.setMatrixAt(20+dsh,M4); }
        sc.add(dashI);
        // WATER TOWERS (charme new-yorkais) sur les toits
        const wtC=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.1,1.1,2.4,8),new THREE.MeshStandardMaterial({color:0x6B4A32,roughness:.85}),6);
        const wtT=new THREE.InstancedMesh(new THREE.ConeGeometry(1.3,1.2,8),new THREE.MeshStandardMaterial({color:0x3A3F49,roughness:.8}),6);
        tallSpots.slice(6,12).forEach(function(sp8,wi){ SC.set(1,1,1); Q.identity();
          M4.compose(new THREE.Vector3(sp8[0]+2,sp8[1]+1.2,sp8[2]+2),Q,SC); wtC.setMatrixAt(wi,M4);
          M4.compose(new THREE.Vector3(sp8[0]+2,sp8[1]+3.0,sp8[2]+2),Q,SC); wtT.setMatrixAt(wi,M4); });
        sc.add(wtC); sc.add(wtT);
        const crown=glowSprite("#BFE0FF","rgba(220,240,255,1)"); crown.scale.set(9,9,1);
        crown.position.set(cx0,GROUND+112,cz0); sc.add(crown);
        ups.push(t=>{ crown.material.opacity=Math.sin(t*2.5)>0?1:.1; });
        // ===== RÉSEAU DE RUES : damier complet sur l'emprise =====
        const roadMat=new THREE.MeshStandardMaterial({color:0x0A0D13,roughness:.9});
        const roadGrp=new THREE.Group();
        for(let g=-CITY; g<=CITY; g+=BLK){
          const rH=new THREE.Mesh(new THREE.PlaneGeometry(CITY*2,ROAD),roadMat);
          rH.rotation.x=-Math.PI/2; rH.position.set(cx0,GROUND+.05,cz0+g); roadGrp.add(rH);
          const rV=new THREE.Mesh(new THREE.PlaneGeometry(ROAD,CITY*2),roadMat);
          rV.rotation.x=-Math.PI/2; rV.position.set(cx0+g,GROUND+.05,cz0); roadGrp.add(rV);
        }
        sc.add(roadGrp);
        // lampadaires aux carrefours
        const lampG=new THREE.BufferGeometry(), lv2=[];
        for(let g=-CITY; g<=CITY; g+=BLK) for(let g2b=-CITY; g2b<=CITY; g2b+=BLK)
          if(Math.random()<.5) lv2.push(cx0+g+ROAD*.6, GROUND+3, cz0+g2b+ROAD*.6);
        lampG.setAttribute("position",new THREE.Float32BufferAttribute(lv2,3));
        sc.add(new THREE.Points(lampG,new THREE.PointsMaterial({color:0xFFC878,size:1.1,map:DOT,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false})));
        // ===== TRAFIC : flux de phares/feux sur 8 axes, circulant en damier =====
        const AX=[-CITY*.6,-CITY*.2,CITY*.2,CITY*.6];
        AX.forEach(off2=>{
          [["h",1,0xFFF2D0],["h",-1,0xFF4A38],["v",1,0xFFF2D0],["v",-1,0xFF4A38]].forEach(([axis,dir,col])=>{
            const nC=14, cg=new THREE.BufferGeometry();
            cg.setAttribute("position",new THREE.Float32BufferAttribute(new Array(nC*3).fill(0),3));
            const cars=new THREE.Points(cg,new THREE.PointsMaterial({color:col,size:1.7,map:DOT,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
            sc.add(cars);
            const ph2=Math.random()*200;
            ups.push(t=>{ const a4=cars.geometry.attributes.position.array;
              for(let i=0;i<nC;i++){ const u4=((t*dir*9+ph2+i*((CITY*2)/nC))%(CITY*2)+(CITY*2))%(CITY*2)-CITY;
                if(axis==="h"){ a4[i*3]=cx0+u4; a4[i*3+1]=GROUND+.7; a4[i*3+2]=cz0+off2+dir*1.1; }
                else { a4[i*3]=cx0+off2+dir*1.1; a4[i*3+1]=GROUND+.7; a4[i*3+2]=cz0+u4; } }
              cars.geometry.attributes.position.needsUpdate=true; });
          });
        });
        // brume urbaine basse entre les tours (profondeur atmosphérique)
        for(let f=0;f<5;f++){ const haze=glowSprite("#9FB4D4","rgba(180,200,230,.5)");
          haze.scale.set(90+f*30,30,1); haze.position.set(cx0+(Math.random()-.5)*120, GROUND+6+f*4, cz0+(Math.random()-.5)*120);
          haze.material.opacity=.06; sc.add(haze); }
        // halo lumineux global de la ville
        const halo=glowSprite("#FFD9A0","rgba(255,220,160,.8)"); halo.scale.set(200,80,1);
        halo.position.set(cx0,GROUND+34,cz0); halo.material.opacity=.16; sc.add(halo);
        // toits techniques sur les tours hautes (volumes blancs)
        const roofM=new THREE.MeshStandardMaterial({color:0x3A4452,roughness:.6,metalness:.4});
        const roofI=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),roofM,Math.min(40,tallSpots.length));
        tallSpots.slice(0,40).forEach(([x,y,z],i)=>{ const sz=1.5+Math.random()*2.5;
          SC.set(sz,1+Math.random()*2,sz); Q.identity(); M4.compose(new THREE.Vector3(x,y+1,z),Q,SC); roofI.setMatrixAt(i,M4); });
        roofI.count=Math.min(40,tallSpots.length); sc.add(roofI);
      })();
      // FORÊT DENSE basse altitude : feuillus amazoniens (canopée en sphères)
      const can=scatter(330,h=>h>1.2&&h<7.5);
      const trkM=new THREE.MeshStandardMaterial({color:0x4A3018,roughness:.95});
      const canM=new THREE.MeshStandardMaterial({color:0x1E5A28,roughness:.88});
      const canM2=new THREE.MeshStandardMaterial({color:0x2E7A36,roughness:.88});
      const trkI=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.28,2.2,5),trkM,can.length);
      const cI=new THREE.InstancedMesh(new THREE.SphereGeometry(1.6,7,6),canM,can.length);
      const cI2=new THREE.InstancedMesh(new THREE.SphereGeometry(1.1,6,5),canM2,can.length);
      can.forEach(([x,h,z],i)=>{ const k=.6+Math.random()*.9;
        Q.setFromAxisAngle(V3.set(0,1,0),Math.random()*7); SC.set(k,k,k);
        M4.compose(new THREE.Vector3(x,h+1.1*k,z),Q,SC); trkI.setMatrixAt(i,M4);
        M4.compose(new THREE.Vector3(x,h+2.8*k,z),Q,SC); cI.setMatrixAt(i,M4);
        M4.compose(new THREE.Vector3(x+(Math.random()-.5)*1.4,h+3.6*k,z+(Math.random()-.5)*1.4),Q,SC); cI2.setMatrixAt(i,M4); });
      sc.add(trkI); sc.add(cI); sc.add(cI2);
      // vent : balancement subtil de la canopée + rafales visibles
      ups.push(t=>{ const w4=Math.sin(t*.9)*.012+Math.sin(t*2.3)*.005;
        cI.rotation.z=w4; cI2.rotation.z=w4*1.4; });
      for(let g3=0;g3<6;g3++){ const gust=glowSprite("#FFFFFF","rgba(255,255,255,.35)");
        gust.scale.set(46,3,1); gust.material.opacity=.05; const ph=Math.random()*7, hh=6+Math.random()*16;
        sc.add(gust); ups.push(t=>{ const x=((t*26+ph*120)%(SIZE*1.3))-SIZE*.65;
          gust.position.set(x,hh+Math.sin(t+ph)*2,(ph-3.5)*46); gust.material.opacity=.03+.04*Math.sin(t*2+ph); }); }
      // VAGUES & ÉCUME : plan de mousse défilant + liseré de rivage scintillant
      // VOL EN V + lucioles du soir
      const vG=new THREE.Group();
      for(let b4=0;b4<7;b4++){ const bd=glowSprite("#FFFFFF","rgba(255,255,255,.95)"); bd.scale.set(1.7,.5,1);
        bd.position.set(Math.abs(b4-3)*3.2-(b4>3?0:0), -Math.abs(b4-3)*.5, (b4-3)*3.2); vG.add(bd); }
      sc.add(vG);
      ups.push(t=>{ const x=((t*9)%(SIZE*1.5))-SIZE*.75;
        vG.position.set(x, 40+Math.sin(t*.6)*4, Math.sin(t*.15)*80); vG.rotation.y=Math.PI; });
      for(let f3=0;f3<16;f3++){ const fl2=glowSprite("#B8FF8A","rgba(220,255,180,1)"); fl2.scale.set(.55,.55,1);
        const ox=(Math.random()-.5)*100, oz=(Math.random()-.5)*100, ph=Math.random()*7;
        sc.add(fl2); ups.push(t=>{ const x=ox+Math.sin(t*.5+ph)*4, z=oz+Math.cos(t*.4+ph)*4;
          fl2.position.set(x,surfH(x,z,seed,theme)+1.4+Math.sin(t*1.4+ph)*.8,z);
          fl2.material.opacity=Math.max(0,Math.sin(t*2.4+ph))*.9; }); }
    }
    if(theme==="risk"){
      // CHALEUR : visibilité qui ondule (brume thermique) + mirages + fumées volcaniques
      ups.push(t=>{ sc.fog.near=42+10*Math.sin(t*.5); sc.fog.far=300+50*Math.sin(t*.31); });
      for(let m3=0;m3<5;m3++){ const mir=glowSprite("#FF9A60","rgba(255,170,110,.5)");
        mir.scale.set(90,5,1); mir.material.opacity=.05; const ph=Math.random()*7;
        sc.add(mir); ups.push(t=>{ const x=Math.cos(ph)*120, z=Math.sin(ph)*120;
          mir.position.set(x,surfH(x,z,seed,theme)+3+Math.sin(t*3+ph)*1.2,z);
          mir.material.opacity=.04+.05*Math.abs(Math.sin(t*1.8+ph)); }); }
      const vents=scatter(4,h=>h>8);
      vents.forEach(([x,h,z],v3)=>{ for(let p3=0;p3<6;p3++){
        const smk=new THREE.Sprite(new THREE.SpriteMaterial({map:clTex,color:0x4A3A38,transparent:true,opacity:.3,depthWrite:false}));
        smk.scale.set(16,10,1); sc.add(smk);
        ups.push(t=>{ const u2=((t*.16)+p3/6+v3*.21)%1;
          smk.position.set(x+u2*9*Math.sin(v3), h+2+u2*44, z+u2*7);
          const k2=1+u2*2.4; smk.scale.set(16*k2,10*k2,1);
          smk.material.opacity=.32*(1-u2); }); } });
      // lueur pulsante générale + lumières ponctuelles de lave
      ups.push(t=>{ sun2.intensity=1.0+.3*Math.sin(t*.9); });
      const pl1=new THREE.PointLight(0xFF5A20,1.6,140,1.8); pl1.position.set(40,2,-30); sc.add(pl1);
      const pl2=new THREE.PointLight(0xFF7A30,1.2,120,1.8); pl2.position.set(-70,2,50); sc.add(pl2);
      ups.push(t=>{ pl1.intensity=1.3+.6*Math.sin(t*2.7); pl2.intensity=1.0+.5*Math.sin(t*3.4+2); });
      // VOLCAN MAJEUR : cône silhouette, cratère incandescent, panache
      const vx=120,vz=-140, vh=surfH(vx,vz,seed,theme);
      const volc=new THREE.Mesh(new THREE.ConeGeometry(46,64,9),
        new THREE.MeshStandardMaterial({color:0x1E1418,roughness:.95,flatShading:true,emissive:0x3A0E06,emissiveIntensity:.4}));
      volc.position.set(vx,vh+24,vz); sc.add(volc);
      const crater=glowSprite("#FF6A20","rgba(255,140,60,1)"); crater.scale.set(26,16,1);
      crater.position.set(vx,vh+58,vz); sc.add(crater);
      ups.push(t=>{ crater.material.opacity=.6+.35*Math.sin(t*1.8); });
      for(let p5=0;p5<8;p5++){
        const smk2=new THREE.Sprite(new THREE.SpriteMaterial({map:clTex,color:0x38201C,transparent:true,opacity:.4,depthWrite:false}));
        sc.add(smk2);
        ups.push(t=>{ const u3=((t*.1)+p5/8)%1;
          smk2.position.set(vx+u3*26*Math.sin(p5), vh+56+u3*90, vz+u3*16);
          const k3=1+u3*3.4; smk2.scale.set(20*k3,13*k3,1); smk2.material.opacity=.42*(1-u3); }); }
      // braises portées par le vent (horizontal)
      const wEmb=new THREE.BufferGeometry(), wv2=[];
      for(let i=0;i<90;i++) wv2.push((Math.random()-.5)*SIZE,2+Math.random()*22,(Math.random()-.5)*SIZE);
      wEmb.setAttribute("position",new THREE.Float32BufferAttribute(wv2,3));
      const wEmbers=new THREE.Points(wEmb,new THREE.PointsMaterial({color:0xFF8A40,size:1.3,map:DOT,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));
      sc.add(wEmbers);
      ups.push(()=>{ const a3=wEmbers.geometry.attributes.position.array;
        for(let i=0;i<90;i++){ a3[i*3]+=.22; a3[i*3+1]+=.03*Math.sin(i); if(a3[i*3]>SIZE/2) a3[i*3]=-SIZE/2; }
        wEmbers.geometry.attributes.position.needsUpdate=true; });
    }
    if(theme==="warn"){
      // chaleur sèche : tremblements d'horizon + soleil écrasant
      ups.push(t=>{ sc.fog.far=400+40*Math.sin(t*.4); sunSp.material.opacity=.8+.15*Math.sin(t*.6); });
    }
    /* ===== SITE DE L'ACTIF — l'immeuble de la SCI, thématisé et animé ===== */
    (function(){
      /* Specs du bâtiment de surface : champ surf de l'entité (données). */
      const C=e.surf||{w:26,d:16,h:10,col:0xC8CCD4,band:0x8899AA,sign:(e.name||"").toUpperCase(),anim:"win",vcol:0x8899AA};
      // emplacement plat
      const ax=0, az=118; // CAMPUS : devant le chunk voxel (bord à ~68), jamais dessous
      const G0=surfH(ax,az,seed,theme)+0.3;
      const site=new THREE.Group(); site.position.set(ax,G0,az); sc.add(site);
      // parvis enrobé + marquages
      const padW=C.w+44, padD=C.d+40;
      site.add(new THREE.Mesh(new THREE.BoxGeometry(padW,1.6,padD), new THREE.MeshStandardMaterial({color:0x14181F,roughness:.96})));
      const lineM=new THREE.MeshBasicMaterial({color:0xC8CFDA});
      for(let li=0;li<6;li++){ const ln=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,5),lineM); ln.position.set(-padW/2+7+li*5.4,0.85,padD/2-6.5); site.add(ln); }
      // fenêtres émissives (texture)
      const winT=noiseTex(96,192,(c2,w,h)=>{ c2.fillStyle="#0A0F16"; c2.fillRect(0,0,w,h);
        for(let yy=7;yy<h-7;yy+=11)for(let xx=6;xx<w-6;xx+=9) if(Math.random()<.6){ c2.fillStyle=Math.random()<.75?"#FFE0A8":"#9AD4FF"; c2.fillRect(xx,yy,5,7); } });
      const bodyM=new THREE.MeshStandardMaterial({color:C.col,roughness:.62,metalness:.18,emissive:0xFFE2AE,emissiveIntensity:.5,emissiveMap:winT});
      const bandM=new THREE.MeshStandardMaterial({color:C.band,roughness:.5,metalness:.3,emissive:C.band,emissiveIntensity:.28});
      // annexe technique (au bord du parvis) — le bâtiment principal est le voxel central
      const AW=Math.min(C.w,20), AH=6, AD=Math.min(C.d,10);
      const bld=new THREE.Mesh(new THREE.BoxGeometry(AW,AH,AD),bodyM); bld.position.set(-padW/2+AW/2+4, AH/2+0.8, -padD/2+AD/2+4); site.add(bld);
      const band=new THREE.Mesh(new THREE.BoxGeometry(AW+0.3,1.0,AD+0.3),bandM); band.position.set(bld.position.x, AH+0.3, bld.position.z); site.add(band);
      // enseigne au NOM (canvas)
      const nmT=(function(){ const cv=document.createElement("canvas"); cv.width=512; cv.height=96; const c3=cv.getContext("2d");
        c3.clearRect(0,0,512,96); c3.font="bold 52px 'JetBrains Mono',monospace"; c3.textAlign="center"; c3.textBaseline="middle";
        c3.shadowColor="#"+new THREE.Color(C.vcol).getHexString(); c3.shadowBlur=22; c3.fillStyle="#FFFFFF"; c3.fillText(C.sign,256,50);
        const tx=new THREE.CanvasTexture(cv); return tx; })();
      const signW=Math.max(26, 2.2*C.sign.length+8);
      const sign=new THREE.Mesh(new THREE.PlaneGeometry(signW,signW*96/512), new THREE.MeshBasicMaterial({map:nmT,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
      sign.position.set(0,26,-padD/2-2); site.add(sign);
      const signGlow=glowSprite("#"+new THREE.Color(C.vcol).getHexString(),"rgba(255,255,255,.8)"); signGlow.scale.set(signW*1.2,9,1); signGlow.position.copy(sign.position); signGlow.material.opacity=.28; site.add(signGlow);
      ups.push(t=>{ sign.lookAt(SURF.pos.x, sign.getWorldPosition(V3).y, SURF.pos.z); signGlow.material.opacity=.2+.12*Math.sin(t*1.7); });
      // véhicules va-et-vient (cabine + remorque + essieux)
      function mkTruck(col){ const g=new THREE.Group();
        const cab=new THREE.Mesh(new THREE.BoxGeometry(4.2,4.2,4.6),new THREE.MeshStandardMaterial({color:col,roughness:.45,metalness:.25,emissive:col,emissiveIntensity:.18})); cab.position.set(0,3.1,6.6); g.add(cab);
        const wind=new THREE.Mesh(new THREE.BoxGeometry(4.0,1.4,.3),new THREE.MeshStandardMaterial({color:0x9AD4FF,roughness:.15,metalness:.5,emissive:0x9AD4FF,emissiveIntensity:.35})); wind.position.set(0,3.9,8.85); g.add(wind);
        const trl=new THREE.Mesh(new THREE.BoxGeometry(4.5,5.3,14.2),new THREE.MeshStandardMaterial({color:0xE8ECF2,roughness:.55})); trl.position.set(0,3.75,-3.2); g.add(trl);
        const bandT=new THREE.Mesh(new THREE.BoxGeometry(4.6,1.1,14.3),new THREE.MeshStandardMaterial({color:col,roughness:.5})); bandT.position.set(0,4.6,-3.2); g.add(bandT);
        const axM=new THREE.MeshStandardMaterial({color:0x11151B,roughness:.9});
        [[5.6],[.8],[-6.8],[-9.4]].forEach(([zz])=>{ const ax2=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,5.0,8),axM); ax2.rotation.z=Math.PI/2; ax2.position.set(0,1.05,zz); g.add(ax2); });
        return g; }
      const nT=(C.anim==="trucks"||C.anim==="yard")?3:2;
      for(let v4=0;v4<nT;v4++){ const tr2=mkTruck(C.vcol); site.add(tr2);
        const lane=-padD/2+10+v4*11.5, range=padW/2-14, ph=Math.random()*6, sp2=.12+Math.random()*.08;
        ups.push(t=>{ const u=Math.sin(t*sp2+ph); tr2.position.set(u*range,0.9,lane);
          tr2.rotation.y=(Math.cos(t*sp2+ph)>=0? -Math.PI/2 : Math.PI/2); }); }
      // ANIM SIGNATURE par entité
      if(C.anim==="crane"){ const crane=new THREE.Group(); crane.position.set(padW/2-8,0.8,-padD/2+8); site.add(crane);
        const mast=new THREE.Mesh(new THREE.BoxGeometry(1.4,22,1.4),new THREE.MeshStandardMaterial({color:0xF2C438,roughness:.6})); mast.position.y=11; crane.add(mast);
        const arm=new THREE.Group(); arm.position.y=21.4; crane.add(arm);
        const jib=new THREE.Mesh(new THREE.BoxGeometry(20,1.1,1.1),mast.material); jib.position.x=7.4; arm.add(jib);
        const cjib=new THREE.Mesh(new THREE.BoxGeometry(7,1.1,1.1),mast.material); cjib.position.x=-5.4; arm.add(cjib);
        const cable=new THREE.Mesh(new THREE.BoxGeometry(.14,9,.14),new THREE.MeshBasicMaterial({color:0x22262E})); cable.position.set(13,-4.6,0); arm.add(cable);
        const load=new THREE.Mesh(new THREE.BoxGeometry(2.6,2.0,2.6),new THREE.MeshStandardMaterial({color:0x8A9098,roughness:.8})); load.position.set(13,-9.6,0); arm.add(load);
        ups.push(t=>{ arm.rotation.y=Math.sin(t*.16)*1.1; const yy=-5.5+Math.sin(t*.4)*3.4; cable.scale.y=(-yy)/9*2; cable.position.y=yy/2-1; load.position.y=yy-1.2; }); }
      if(C.anim==="smoke"){ const chim=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.5,9,10),new THREE.MeshStandardMaterial({color:0xB8452A,roughness:.8}));
        chim.position.set(bld.position.x, AH+4.6, bld.position.z); site.add(chim);
        for(let s5=0;s5<5;s5++){ const pm=new THREE.Sprite(new THREE.SpriteMaterial({map:clTex,color:0xD8DEE8,transparent:true,opacity:.5,depthWrite:false}));
          site.add(pm); const off=s5*1.1, bx=bld.position.x, bz=bld.position.z;
          ups.push(t=>{ const k=((t*.7+off)%5)/5; pm.position.set(bx+k*6*Math.sin(t*.2), AH+9.2+k*16, bz); const sw=3+k*9; pm.scale.set(sw,sw*.7,1); pm.material.opacity=.42*(1-k); }); } }
      if(C.anim==="flag"){ const pole=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,10,6),new THREE.MeshStandardMaterial({color:0x9AA4B2}));
        pole.position.set(-padW/2+6,5.8,padD/2-6); site.add(pole);
        const flag=new THREE.Mesh(new THREE.PlaneGeometry(5,3,10,4),new THREE.MeshBasicMaterial({color:C.vcol,side:THREE.DoubleSide}));
        flag.position.set(-padW/2+8.6,9.6,padD/2-6); site.add(flag);
        const fb=flag.geometry.attributes.position.array.slice();
        ups.push(t=>{ const a3=flag.geometry.attributes.position.array;
          for(let i5=0;i5<a3.length;i5+=3){ const xr=(fb[i5]+2.5)/5; a3[i5+2]=Math.sin(xr*6+t*5)*.5*xr; }
          flag.geometry.attributes.position.needsUpdate=true; }); }
      if(C.anim==="yard"){ const stM=new THREE.MeshStandardMaterial({color:0x7A8894,roughness:.85});
        for(let p6=0;p6<6;p6++){ const st=new THREE.Mesh(new THREE.BoxGeometry(4,1.6+Math.random()*2.4,3),stM);
          st.position.set(-padW/2+10+p6*7,1.6,-padD/2+7); site.add(st); } }
      ups.push(t=>{ bodyM.emissiveIntensity=.42+.14*Math.sin(t*1.1)+.05*Math.sin(t*7.3); });
      sc.userData.sitePos={x:ax,z:az};
      sc.userData.campus={x:ax,z:az,hw:padW/2+4,hd:padD/2+4,y:G0};
    })();
    const marker=glowSprite("#6FE3FF","rgba(255,255,255,.95)"); marker.scale.set(7,7,1);
    marker.visible=false; sc.add(marker);
    // monde voxel éditable superposé (couche cubique sandbox)
    let voxGroup=null;
    return {scene:sc, ups, seed, theme, terr, size:SIZE, pal, marker, voxGroup};
  }
  function landOn(eid){
    SURF.on=true; SURF.id=eid; SURF.T=0; SURF.yaw=0; SURF.pitch=.04;
    SURF.alt=110; SURF.targetAlt=30; SURF.target=null; SURF.heading=-Math.PI/2;
    SURF.pos.set(0,0,150); SURF._camY=null;
    clearFG();
    // activer le sandbox voxel de cette planète
    try{
      const S=SURF.cache[eid];
      if(S && !S.voxGroup){ VOX.id=eid; VOX.group=buildVoxelWorld(Engine.entity(eid)); S.scene.add(VOX.group); S.voxGroup=VOX.group; }
      else if(S){ VOX.id=eid; VOX.group=S.voxGroup; VOX.lookup=(VOX._lookups&&VOX._lookups[eid])||VOX.lookup; }
      if(S && S.terr) S.terr.visible=false;            // le voxel devient le sol
      $("#surf-vignette").classList.add("show");
      VOX.on=true; $("#voxbar").classList.add("show");
      // musique propre à la planète
      if(Music.on){ Music.setPlanet(Engine.entity(eid)); }
    }catch(err){ console.warn("voxel:",err.message); }
    $("#twin").classList.remove("open");
    document.body.classList.add("surf");
    $("#g-exit").textContent="Quitter la surface"; $("#g-exit").classList.add("show"); $("#g-exit").classList.add("surf");
    $("#g-legend").style.display="none";
    toast("Surface de "+Engine.entity(eid).name+" — glissez : regarder · double-tap : s'y rendre · pincez : altitude");
  }
  let DIVING=false;
  function enterSurface(eid){
    const e=Engine.entity(eid); if(!e) return;
    try{ if(!SURF.cache[eid]) SURF.cache[eid]=makeSurface(e); }
    catch(err){ toast("Surface indisponible : "+err.message); return; }
    const pal=SURF.cache[eid].pal, dv=$("#dive");
    if(FOCUS.host && FOCUS.id===eid && !DIVING){
      DIVING=true;
      const host=FOCUS.host, r0=host.userData.r;
      // ACTE 1 — PLONGÉE ORBITALE : la caméra fonce vers la planète (le globe grossit), nuages qui défilent
      const t0=performance.now(), R0=radius, R1=r0*1.05;
      $("#g-exit").classList.remove("show");
      (function diveAnim(){
        const k=Math.min(1,(performance.now()-t0)/1400);
        const e2=1-Math.pow(1-k,3); // ease-out cubic
        targetR=R0+(R1-R0)*e2; radius=targetR;
        // accélère la rotation des nuages de la planète ciblée (sensation de descente)
        if(host.userData_cloudMat) host.userData_cloudMat.map && (host.rotation.y+=.0014*e2);
        if(k<1) requestAnimationFrame(diveAnim);
        else {
          // ACTE 2 — TRAVERSÉE D'ATMOSPHÈRE : voile blanc → couleur du ciel
          dv.style.background="radial-gradient(circle at 50% 42%, rgba(255,255,255,.96) 0%, "+pal.skyB+" 38%, "+pal.skyT+" 100%)";
          dv.classList.add("on");
          clearFG();
          setTimeout(function(){
            // ACTE 3 — ÉMERGENCE AU SOL : on apparaît très haut, descente douce, le voile se lève
            landOn(eid);
            SURF.alt=120; SURF.targetAlt=30; SURF.pitch=.14; SURF.pos.set(0,0,150); SURF._camY=null; SURF.heading=-Math.PI/2; SURF.yaw=0; // arrivée carte postale : campus + monde voxel en face
            setTimeout(function(){ dv.classList.remove("on"); DIVING=false; },700);
          }, 760);
        }
      })();
    } else if(!DIVING) landOn(eid);
  }
  function exitSurface(){
    SURF.on=false; VOX.on=false;
    const _S=SURF.cache[SURF.id]; if(_S&&_S.terr) _S.terr.visible=true;
    $("#surf-vignette").classList.remove("show");
    $("#voxbar").classList.remove("show");
    if(Music.on){ Music.setPlanet(null); }
    document.body.classList.remove("surf");
    $("#g-exit").textContent="← Retour système"; $("#g-exit").classList.remove("surf");
    if(SURF.id){ focusPlanet(SURF.id); } else exitFocus();
  }
  window.enterSurface=enterSurface; window.exitSurface=exitSurface;

  /* ====== PASSE PREMIER PLAN : l'objet focalisé rendu devant la fiche ====== */
  const fgCanvas=document.getElementById("fg-canvas");
  let fgRen=null, fgScene=null, fgCam=null;
  function ensureFG(){
    if(fgRen) return;
    fgRen=new THREE.WebGLRenderer({canvas:fgCanvas,alpha:true,antialias:true});
    fgRen.setPixelRatio(Math.min(devicePixelRatio,1.6));
    fgRen.toneMapping=THREE.ACESFilmicToneMapping; fgRen.toneMappingExposure=1.2;
    fgRen.setSize(innerWidth,innerHeight); fgRen.setClearColor(0x000000,0);
    fgScene=new THREE.Scene();
    fgCam=new THREE.PerspectiveCamera(55, innerWidth/innerHeight, .1, 9000);
    fgScene.add(new THREE.AmbientLight(0x1B2740,.24));
    const fgRim=new THREE.DirectionalLight(0x51719F,.5); fgRim.position.set(-260,190,-330); fgScene.add(fgRim);
    fgScene.add(new THREE.PointLight(0xFFE2B0,4.4,5200,1.6));
  }
  let FG={root:null, pairs:[]};
  function buildFG(srcObj, withMoons){
    ensureFG();
    if(FG.root) fgScene.remove(FG.root);
    const holder=new THREE.Group();
    const srcs=[srcObj], clones=[srcObj.clone(true)];
    if(withMoons) moons.filter(mn=>mn.userData.host===srcObj).forEach(mn=>{ srcs.push(mn); clones.push(mn.clone(true)); });
    FG.pairs=[];
    srcs.forEach((sObj,i)=>{
      holder.add(clones[i]);
      const a=[],b=[]; sObj.traverse(o=>a.push(o)); clones[i].traverse(o=>b.push(o));
      for(let k=0;k<a.length;k++) FG.pairs.push([a[k],b[k]]);
    });
    fgScene.add(holder); FG.root=holder;
    fgCanvas.classList.add("on");
  }
  function clearFG(){ if(FG.root&&fgScene){ fgScene.remove(FG.root); FG.root=null; FG.pairs=[]; }
    if(fgRen) fgRen.clear(); fgCanvas.classList.remove("on"); }
  addEventListener("resize",()=>{ if(fgRen) fgRen.setSize(innerWidth,innerHeight); });

  /* ====== MODE FOCUS : zoom planète + entourage procédural ====== */
  const FOCUS={id:null, group:null, updates:[]};
  const ENT_CACHE={};
  flows.forEach(f=>{ f.pts.material.map=DOT; f.pts.material.size=1.3; f.pts.material.needsUpdate=true; });
  swarm.material.map=DOT; swarm.material.needsUpdate=true;
  kuiper.material.map=DOT; kuiper.material.needsUpdate=true;
  function holoLabel(txt,color){
    const cv=document.createElement("canvas"); cv.width=384; cv.height=72;
    const cx=cv.getContext("2d");
    cx.fillStyle="rgba(6,12,26,.55)"; cx.fillRect(0,0,384,72);
    cx.strokeStyle=color; cx.lineWidth=2; cx.strokeRect(2,2,380,68);
    cx.font="600 30px Rajdhani, sans-serif"; cx.fillStyle=color; cx.textAlign="center";
    cx.shadowColor=color; cx.shadowBlur=10; cx.fillText(txt,192,46);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false}));
    sp.scale.set(36,7,1); return sp;
  }
  function buildEntourage(e, host){
    const g=new THREE.Group(), ups=[], r=host.userData.r;
    const debt=Engine.debt(e), ltv=e.marketValue>0?debt/e.marketValue:(debt>0?.8:0);
    const health=e.risk==="ok"?1:e.risk==="warn"?.55:.25;
    // 1. lumières de civilisation (densité ∝ santé du bilan) — ~14 mégapoles en amas
    const nLights=Math.round(380+720*health);
    const lg=new THREE.BufferGeometry(), lv=[], lc=[];
    const centers=[]; for(let c=0;c<14;c++) centers.push([Math.random()*Math.PI*2, Math.acos(2*Math.random()-1)]);
    for(let i=0;i<nLights;i++){
      const c=centers[i%14];
      const a=c[0]+(Math.random()-.5)*.55, b=c[1]+(Math.random()-.5)*.4;
      const R=r*1.015;
      lv.push(R*Math.sin(b)*Math.cos(a), R*Math.cos(b), R*Math.sin(b)*Math.sin(a));
      const warm=Math.random()<.8;
      lc.push(warm?1:.7, warm?.83:.9, warm?.55:1);
    }
    lg.setAttribute("position",new THREE.Float32BufferAttribute(lv,3));
    lg.setAttribute("color",new THREE.Float32BufferAttribute(lc,3));
    const lights=new THREE.Points(lg,new THREE.PointsMaterial({size:.42,map:DOT,vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
    g.add(lights);
    ups.push(t=>{ lights.rotation.y=host.rotation.y; lights.material.opacity=.75+.2*Math.sin(t*2.4); });
    // 1bis. lumière de contour douce (rim) — remplace le halo en gros plan
    const rim=glowSprite(e.color, e.color+"55"); rim.scale.set(r*3.1,r*3.1,1); rim.material.opacity=.20; g.add(rim);
    // 2. hologramme structurel (couleur = état)
    const gridCol=e.risk==="risk"?0xFF6B5A:e.risk==="warn"?0xFFB454:0x6FE3FF;
    const grid=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(r*1.3,16,10)),
      new THREE.LineBasicMaterial({color:gridCol,transparent:true,opacity:.06,depthWrite:false}));
    g.add(grid); ups.push(t=>{ grid.rotation.y=t*.06; });
    // 3. anneaux de données — fins & lumineux : trait net + halo doux + fines particules scintillantes
    [[1.74,.42],[2.12,-.30]].forEach(([k,sp],ri)=>{
      const tilt=Math.PI/2+(ri?-.16:.12);
      const glow=new THREE.Mesh(new THREE.TorusGeometry(r*k,r*.085,12,140),
        new THREE.MeshBasicMaterial({color:gridCol,transparent:true,opacity:.055,blending:THREE.AdditiveBlending,depthWrite:false}));
      glow.rotation.x=tilt; g.add(glow);
      const line=new THREE.Mesh(new THREE.TorusGeometry(r*k,r*.011,8,180),
        new THREE.MeshBasicMaterial({color:gridCol,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
      line.rotation.x=tilt; g.add(line);
      const pN=90, pg=new THREE.BufferGeometry(), pv=[];
      for(let i=0;i<pN;i++){ const a=Math.random()*Math.PI*2, rr=r*k*(1+(Math.random()-.5)*.03); pv.push(Math.cos(a)*rr,0,Math.sin(a)*rr); }
      pg.setAttribute("position",new THREE.Float32BufferAttribute(pv,3));
      const parts=new THREE.Points(pg,new THREE.PointsMaterial({color:gridCol,size:r*.05,map:STAR,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));
      parts.rotation.x=tilt; g.add(parts);
      ups.push(t=>{ glow.rotation.z=t*sp; line.rotation.z=t*sp; parts.rotation.z=t*sp*1.04; parts.material.opacity=.45+.4*Math.abs(Math.sin(t*1.3+ri)); });
    });
    // 4. satellites artificiels (trafic ∝ loyer)
    const nSat=Math.min(26, 6+Math.round((e.rent||0)/60000));
    const sats=[];
    for(let i=0;i<nSat;i++){
      const sat=new THREE.Mesh(new THREE.BoxGeometry(.7,.25,.25),
        new THREE.MeshStandardMaterial({color:0xCFE0F8,emissive:0x6FE3FF,emissiveIntensity:.6,metalness:.6,roughness:.3}));
      const u={d:r*(1.45+Math.random()*1.0), a:Math.random()*7, s:(.9+Math.random())*(Math.random()<.5?1:-1), tilt:(Math.random()-.5)*1.6, ph:Math.random()*7};
      g.add(sat); sats.push([sat,u]);
    }
    ups.push(t=>{ sats.forEach(([sat,u])=>{
      u.a+=u.s*.012;
      sat.position.set(Math.cos(u.a)*u.d, Math.sin(u.a)*u.d*Math.sin(u.tilt), Math.sin(u.a)*u.d*Math.cos(u.tilt));
      sat.lookAt(0,0,0);
      sat.material.emissiveIntensity=.35+.5*Math.max(0,Math.sin(t*5+u.ph));
    }); });
    // 5. ceinture de dette : débris ∝ LTV
    if(ltv>.15){
      const nd=Math.round(60+ltv*420);
      const dgm=new THREE.BufferGeometry(), dvv=[];
      for(let i=0;i<nd;i++){ const a=Math.random()*7, R=r*(2.5+Math.random()*.6);
        dvv.push(Math.cos(a)*R,(Math.random()-.5)*r*.25,Math.sin(a)*R); }
      dgm.setAttribute("position",new THREE.Float32BufferAttribute(dvv,3));
      const deb=new THREE.Points(dgm,new THREE.PointsMaterial({color:ltv>.7?0xFF8A7A:0x9AA6BD,size:.65,map:DOT,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
      g.add(deb); ups.push(t=>{ deb.rotation.y=t*.05; });
    }
    // 6. aurores polaires si bilan sain
    if(e.risk==="ok"){
      [1,-1].forEach(s2=>{ const au=glowSprite("#5CE6C8","rgba(120,255,210,.8)");
        au.scale.set(r*2.0,r*1.1,1); au.position.y=s2*r*1.12; g.add(au);
        ups.push(t=>{ au.material.opacity=.30+.18*Math.sin(t*1.7+s2); }); });
    }
    // 7. tempêtes rouges si alerte (vortex en surface, tournant avec la planète)
    if(e.risk==="risk"){
      for(let i=0;i<4;i++){
        const st=glowSprite("#FF5A48","rgba(255,120,90,.95)");
        st.scale.set(r*.8,r*.55,1);
        const sa=Math.random()*7, sb=.6+Math.random()*1.6;
        g.add(st);
        ups.push(t=>{ const a=sa+host.rotation.y;
          st.position.set(Math.sin(sb)*Math.cos(a)*r*1.06, Math.cos(sb)*r*1.06, Math.sin(sb)*Math.sin(a)*r*1.06);
          st.material.opacity=.5+.3*Math.sin(t*3+sa); });
      }
    }
    // 8. cargos de trésorerie : navettes planète → soleil si loyers
    if((e.rent||0)>0){
      const nShip=Math.min(5,1+Math.round(e.rent/250000)), ships=[];
      for(let i=0;i<nShip;i++){
        const sh=new THREE.Mesh(new THREE.ConeGeometry(.5,2.2,6),
          new THREE.MeshStandardMaterial({color:0xFFE3A6,emissive:0xFFC861,emissiveIntensity:.8}));
        const tr=glowSprite("#FFD98A","rgba(255,220,150,.9)"); tr.scale.set(4,4,1);
        scene.add(sh); scene.add(tr); ships.push([sh,tr,Math.random()]);
        FOCUS._extra=(FOCUS._extra||[]).concat([sh,tr]);
      }
      ups.push(t=>{ ships.forEach(([sh,tr,ph])=>{
        const u=((t*.06+ph)%1), P=host.position;
        sh.position.set(P.x*(1-u), P.y*(1-u)+Math.sin(u*Math.PI)*24, P.z*(1-u));
        sh.lookAt(0,0,0); tr.position.copy(sh.position);
        tr.material.opacity=.4+.4*Math.sin(t*6+ph*7);
      }); });
    }
    return {group:g, updates:ups};
  }
  function focusPlanet(id){
    exitFocus(true);
    const host=planets.find(p=>p.userData.id===id); if(!host) return;
    if(!ENT_CACHE[id]) ENT_CACHE[id]=buildEntourage(Engine.entity(id), host);
    FOCUS.id=id; FOCUS.host=host;
    FOCUS.group=ENT_CACHE[id].group; FOCUS.updates=ENT_CACHE[id].updates;
    scene.add(FOCUS.group);
    targetR=host.userData.r*14;
    lbls.forEach(l=>l.visible=false); sunLbl.visible=false;
    halos.forEach(h=>h.visible=false);
    planets.forEach(p=>{ p.material.emissiveIntensity = p.userData.id===id ? 1.3 : .3; });
    flows.forEach(f=>f.pts.visible=false);
    $("#g-legend").style.display="none";
    $("#g-exit").classList.add("show");
    if(innerWidth<700) $("#twin").classList.add("sheet");
    ping(host.position.x,host.position.y,host.position.z, Engine.entity(id).color);
    buildFG(host,true);
  }
  function exitFocus(silent){
    if(FOCUS.group){ scene.remove(FOCUS.group); (FOCUS._extra||[]).forEach(o=>scene.remove(o)); FOCUS._extra=[]; }
    FOCUS.id=null; FOCUS.group=null; FOCUS.updates=[]; FOCUS.host=null;
    clearFG();
    lbls.forEach(l=>l.visible=true); sunLbl.visible=true;
    halos.forEach(h=>{h.visible=true;h.material.opacity=.55;});
    planets.forEach(p=>{ p.material.emissiveIntensity=p.userData_eI!=null?p.userData_eI:1.15; });
    flows.forEach(f=>f.pts.visible=false);
    $("#g-legend").style.display="";
    $("#g-exit").classList.remove("show");
    $("#twin").classList.remove("sheet");
    if(!silent){ targetR=560; phi=Math.min(phi,1.3); CTRt.set(0,0,0); }
  }
  window.galaxyFocus=focusPlanet; window.galaxyExit=exitFocus;
  $("#g-exit").onclick=()=>{ if(SURF.on){ exitSurface(); } else { exitFocus(); $("#twin").classList.remove("open"); } };

  /* ====== ÉTIQUETTES ====== */
  function makeLabel(txt,color){
    const cv=document.createElement("canvas"); cv.width=512; cv.height=96;
    const cx=cv.getContext("2d");
    cx.font="600 42px Rajdhani, sans-serif"; cx.fillStyle=color; cx.textAlign="center";
    cx.shadowColor=color; cx.shadowBlur=16; cx.fillText(txt,256,60);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false}));
    sp.scale.set(82,15.5,1); return sp;
  }
  const sunLbl=makeLabel(DATA.meta.brandDisplay,"#FFE3A6"); sunLbl.position.set(0,44,0); scene.add(sunLbl);
  const lbls=DATA.entities.map(e=>{ const s2=makeLabel(e.name,e.color); scene.add(s2); return s2; });
  // 3.89 : gouvernance humaine - stations d'équipe (données people) proches du soleil
  const govTeam=[];
  (DATA.people||[]).forEach(g=>{
    const grp=new THREE.Group();
    // corps : noyau + module
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(2.4,1),
      new THREE.MeshStandardMaterial({color:new THREE.Color(g.col),roughness:.35,metalness:.7,emissive:new THREE.Color(g.col).multiplyScalar(.4),emissiveIntensity:1}));
    grp.add(core);
    const panel=new THREE.Mesh(new THREE.BoxGeometry(.35,1.6,5.2),
      new THREE.MeshStandardMaterial({color:0x27408A,roughness:.3,metalness:.6,emissive:0x122650,emissiveIntensity:.6}));
    grp.add(panel);
    if(g.ring){ const rg=new THREE.Mesh(new THREE.TorusGeometry(4.2,.35,10,32),
      new THREE.MeshStandardMaterial({color:new THREE.Color(g.col),roughness:.4,metalness:.8})); rg.rotation.x=1.2; grp.add(rg); }
    const halo=glowSprite(g.col,"rgba(255,255,255,.7)"); halo.scale.set(20,20,1); halo.material.opacity=.5; grp.add(halo);
    scene.add(grp);
    const lbl=makeLabel(g.n,g.col); lbl.scale.set(64,12,1); scene.add(lbl);
    govTeam.push({grp,lbl,rad:g.rad,sp:g.sp,el:g.el,ph:g.ph,core});
  });
  (function animGov(){ requestAnimationFrame(animGov);
    const t=performance.now()*.001;
    govTeam.forEach(g=>{ const a=t*g.sp+g.ph, x=Math.cos(a)*g.rad, z=Math.sin(a)*g.rad, y=Math.sin(a*1.3)*g.rad*g.el;
      g.grp.position.set(x,y,z); g.grp.rotation.y=-a*2; g.core.rotation.x+=.01;
      g.lbl.position.set(x,y+9,z); });
  })();

  /* ====== CAMÉRA : navigation libre fluide (inertie, zoom directionnel, pan) ====== */
  const INTRO_THETA=.62, INTRO_PHI=1.12, INTRO_R=Math.max(760,lastDist*1.55);
  let theta=INTRO_THETA, phi=INTRO_PHI, radius=INTRO_R, targetR=INTRO_R;
  let drag=false, px=0, py=0, pinchD=0, pinchMid=null, pinchInit=false, vTheta=0, vPhi=0, lastTouch=0;
  const CTR=new THREE.Vector3(0,0,0), CTRt=new THREE.Vector3(0,0,0);
  const _camFwd=new THREE.Vector3(), _camD=new THREE.Vector3();
  const el=ren.domElement;
  const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0), pRay=new THREE.Raycaster(), pV=new THREE.Vector2(), hitP=new THREE.Vector3();
  function groundPoint(cx,cy){
    pV.x=(cx/innerWidth)*2-1; pV.y=-(cy/innerHeight)*2+1;
    pRay.setFromCamera(pV,cam);
    return pRay.ray.intersectPlane(plane,hitP)?hitP.clone():null;
  }
  function minRad(){ return FOCUS.host ? Math.max(22, FOCUS.host.userData.r*1.18) : 60; }
  function camAxes(){
    const fwd=new THREE.Vector3(); cam.getWorldDirection(fwd);
    const right=new THREE.Vector3().crossVectors(fwd,cam.up).normalize();
    const up=new THREE.Vector3().crossVectors(right,fwd).normalize();
    return {right,up};
  }
  el.addEventListener("mousedown",e=>{drag=true;px=e.clientX;py=e.clientY;vTheta=0;vPhi=0;lastTouch=Date.now();});
  addEventListener("mousemove",e=>{ if(!drag)return;
    if(SURF.on){ SURF.yaw-=(e.clientX-px)*.0042; SURF.pitch=Math.min(.7,Math.max(-.45,SURF.pitch+(e.clientY-py)*.0028)); px=e.clientX; py=e.clientY; return; }
    const dT=-(e.clientX-px)*.005, dP=(e.clientY-py)*.004;
    theta+=dT; phi=Math.min(1.4,Math.max(.06,phi+dP));
    vTheta=dT; vPhi=dP; px=e.clientX;py=e.clientY; lastTouch=Date.now(); });
  addEventListener("mouseup",()=>drag=false);
  el.addEventListener("contextmenu",e=>e.preventDefault());
  el.addEventListener("touchstart",e=>{
    e.preventDefault();
    lastTouch=Date.now();
    if(e.touches.length===2){
      pinchD=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
      pinchMid={x:(e.touches[0].clientX+e.touches[1].clientX)/2, y:(e.touches[0].clientY+e.touches[1].clientY)/2};
      pinchInit=true; drag=false;
    } else { drag=true; px=e.touches[0].clientX; py=e.touches[0].clientY; vTheta=0; vPhi=0; }
  },{passive:false});
  el.addEventListener("touchmove",e=>{
    lastTouch=Date.now();
    if(e.touches.length===2){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
      const mid={x:(e.touches[0].clientX+e.touches[1].clientX)/2, y:(e.touches[0].clientY+e.touches[1].clientY)/2};
      if(SURF.on){ if(pinchD>0 && !pinchInit){ SURF.targetAlt=Math.min(95,Math.max(8,SURF.targetAlt*(pinchD/d))); } pinchInit=false; pinchD=d; pinchMid=mid; return; }
      if(pinchD>0 && !pinchInit && Math.abs(d-pinchD)>1.4){
        const k=pinchD/d;
        targetR=Math.min(1600,Math.max(minRad(),targetR*k));
        if(!FOCUS.id){
          // zoom-IN : on plonge doucement vers le point pincé. zoom-OUT : aucun recentrage parasite.
          if(k<1){ const gp=groundPoint(mid.x,mid.y); if(gp) CTRt.lerp(gp,(1-k)*.5); }
          const {right,up}=camAxes();
          const sc=radius*.0016;
          CTRt.addScaledVector(right,-(mid.x-pinchMid.x)*sc);
          CTRt.addScaledVector(up,(mid.y-pinchMid.y)*sc);
        }
      }
      pinchInit=false; pinchD=d; pinchMid=mid;
    } else if(drag){
      const t=e.touches[0];
      if(SURF.on){ SURF.yaw-=(t.clientX-px)*.0042; SURF.pitch=Math.min(.7,Math.max(-.45,SURF.pitch+(t.clientY-py)*.0028)); px=t.clientX; py=t.clientY; return; }
      const dT=-(t.clientX-px)*.005, dP=(t.clientY-py)*.004;
      theta+=dT; phi=Math.min(1.4,Math.max(.06,phi+dP));
      vTheta=dT; vPhi=dP; px=t.clientX; py=t.clientY;
    }
  },{passive:true});
  el.addEventListener("touchend",e=>{ if(e.touches.length<2){pinchD=0;pinchMid=null;} if(e.touches.length===0) drag=false; },{passive:true});
  el.addEventListener("wheel",e=>{
    lastTouch=Date.now();
    if(SURF.on){ SURF.targetAlt=Math.min(95,Math.max(4,SURF.targetAlt*(e.deltaY>0?1.07:.93))); return; }
    const k=e.deltaY>0?1.08:0.92;
    targetR=Math.min(1600,Math.max(minRad(),targetR*k));
    if(!FOCUS.id){ if(k<1){ const gp=groundPoint(e.clientX,e.clientY); if(gp) CTRt.lerp(gp,.16); } else CTRt.multiplyScalar(.93); }
  },{passive:true});
  // double-tap / double-clic dans le vide : plonger vers ce point
  let lastTap=0;
  el.addEventListener("pointerdown",e=>{
    const now=Date.now();
    if(now-lastTap<320 && !FOCUS.id){
      const gp=groundPoint(e.clientX,e.clientY);
      if(gp){ CTRt.copy(gp); targetR=Math.max(90,targetR*.45); }
    }
    lastTap=now;
  });
  /* ====== SÉLECTION & SURVOL ====== */
  const ray=new THREE.Raycaster(), mouse=new THREE.Vector2(); let downT=0,downX=0,downY=0,lastPlanetTap=0,_longTimer=null,_longFired=false;
  el.addEventListener("pointerdown",e=>{ downT=Date.now();downX=e.clientX;downY=e.clientY; _longFired=false; clearTimeout(_longTimer); _longTimer=null;
    if(!CINE.on && !SURF.on){ _longTimer=setTimeout(()=>{ _tryLongPress(downX,downY); }, 420); } });
  el.addEventListener("pointermove",e=>{ if(_longTimer && Math.hypot(e.clientX-downX,e.clientY-downY)>10){ clearTimeout(_longTimer); _longTimer=null; } });
  function _tryLongPress(x,y){ if(CINE.on||SURF.on) return;
    mouse.x=(x/innerWidth)*2-1; mouse.y=-(y/innerHeight)*2+1; ray.setFromCamera(mouse,cam);
    const hit=ray.intersectObjects([sun,...planets,...moons])[0]; if(!hit) return;
    const id=hit.object.userData.id;
    if(id==="moon"){ focusMoon(hit.object); openLoanTwin(hit.object.userData.entityId, hit.object.userData.loanIdx); }
    else if(id==="oriondemo"){ focusSun(); openHoldingTwin(); }
    else { focusPlanet(id); openTwin(id); }
    _longFired=true; try{ if(navigator.vibrate) navigator.vibrate(14); }catch(_){}
    try{ const tw=$("#twin"); if(tw){ tw.classList.add("lp-in"); setTimeout(()=>tw.classList.remove("lp-in"),700); } }catch(_){}
  }
  let surfTap=0;
  el.addEventListener("pointerup",e=>{
    if(SURF.on){
      if(Date.now()-downT>280||Math.hypot(e.clientX-downX,e.clientY-downY)>9) return;
      const S=SURF.cache[SURF.id]; if(!S) return;
      mouse.x=(e.clientX/innerWidth)*2-1; mouse.y=-(e.clientY/innerHeight)*2+1;
      ray.setFromCamera(mouse,surfCam);
      // MODE CASSER / POSER : un tap agit sur le bloc visé
      if(VOX.on && VOX.tool!=="move" && VOX.group){
        const vh=ray.intersectObjects(VOX.group.children,false)[0];
        if(vh && vh.face){
          if(VOX.tool==="break") voxBreak(vh.point, vh.face.normal);
          else voxPlace(vh.point, vh.face.normal);
        }
        return;
      }
      // MODE DÉPLACER : double-tap pour filer vers un point
      const now=Date.now();
      if(now-surfTap<340){
        const targets=VOX.group?[S.terr,...VOX.group.children]:[S.terr];
        const hit=ray.intersectObjects(targets,false)[0];
        if(hit){
          const L=S.size*.45;
          SURF.target={x:Math.max(-L,Math.min(L,hit.point.x)), z:Math.max(-L,Math.min(L,hit.point.z))};
          S.marker.position.set(SURF.target.x, surfH(SURF.target.x,SURF.target.z,S.seed,S.theme)+3, SURF.target.z);
          S.marker.visible=true;
        }
      }
      surfTap=now; return;
    }
    if(CINE.on) return;
    clearTimeout(_longTimer); _longTimer=null;
    if(_longFired){ _longFired=false; return; }
    if(Date.now()-downT>280||Math.hypot(e.clientX-downX,e.clientY-downY)>9) return;
    mouse.x=(e.clientX/innerWidth)*2-1; mouse.y=-(e.clientY/innerHeight)*2+1;
    ray.setFromCamera(mouse,cam);
    const hit=ray.intersectObjects([sun,...planets,...moons])[0];
    if(hit){ const id=hit.object.userData.id;
      if(id==="moon"){ focusMoon(hit.object); }
      else if(id!=="oriondemo"){
        const now=Date.now();
        if(FOCUS.id===id && now-lastPlanetTap<360){
          enterSurface(id); // double-tap : atterrissage
        } else { focusPlanet(id); } // tap court : on cadre juste la planète
        lastPlanetTap=now;
      }
      else { focusSun(); } }
    else if($("#twin").classList.contains("open")){
      $("#twin").classList.remove("open"); exitFocus();
    }
  });
  function focusMoon(mn){
    exitFocus(true);
    FOCUS.id="moon:"+mn.userData.entityId+":"+mn.userData.loanIdx; FOCUS.host=mn;
    FOCUS.group=new THREE.Group(); FOCUS.updates=[]; scene.add(FOCUS.group);
    targetR=Math.max(28, mn.userData.r*16);
    lbls.forEach(l=>l.visible=false); sunLbl.visible=false;
    halos.forEach(h=>h.visible=false);
    flows.forEach(f=>f.pts.visible=false);
    $("#g-legend").style.display="none";
    $("#g-exit").classList.add("show");
    if(innerWidth<700) $("#twin").classList.add("sheet");
    ping(mn.position.x,mn.position.y,mn.position.z,"#BFD4F2");
    buildFG(mn,false);
  }
  const CINE={on:false,i:0,t:0,_cur:null,_id:null};
  const _projV=new THREE.Vector3(), _ZERO=new THREE.Vector3(0,0,0), _fwd=new THREE.Vector3(), _up=new THREE.Vector3();
  function cineCardFill(id){
    if(CINE._id===id) return; CINE._id=id;
    const e=Engine.entity(id); if(!e){ cineCardHide(); return; }
    const d=Engine.debt?Engine.debt(e):(e.loans||[]).reduce((a,l)=>a+(l.crd||0),0);
    const yld=e.rent&&e.marketValue?e.rent/e.marketValue:0;
    const ltv=e.marketValue>0?d/e.marketValue:0;
    const body=document.querySelector("#cine-card .cc-body");
    if(body) body.innerHTML=
      '<div class="cc-name" style="-webkit-text-fill-color:'+e.color+';text-shadow:0 0 22px '+e.color+'AA">'+e.name+'</div><div class="cc-sep"></div>'+
      '<div class="cc-row"><span class="l">Quote-part</span><span class="v gold">'+pct(e.stake)+'</span></div>'+
      '<div class="cc-row"><span class="l">QP + CC</span><span class="v">'+fmtK(Engine.navShare(e))+'</span></div>'+
      (yld?'<div class="cc-row"><span class="l">Rendement</span><span class="v green">'+pct(yld)+'</span></div>'
          :'<div class="cc-row"><span class="l">LTV</span><span class="v '+(ltv>.75?'red':'')+'">'+(e.marketValue>0?pct(ltv):'—')+'</span></div>');
    const card=$("#cine-card"); if(card) card.classList.add("show");
  }
  function cineCardHide(){ const c=$("#cine-card"); if(c) c.classList.remove("show"); CINE._id=null; }
  try{ window.cineCardFill=cineCardFill; window.cineCardTrack=cineCardTrack; window.CINE=CINE; }catch(_){}
  function cineCardTrack(){
    const card=$("#cine-card"); if(!card) return;
    if(!CINE.on || !CINE._cur){ if(card.classList.contains("show")) card.classList.remove("show"); return; }
    // projeter la position monde de la planète vers l'écran
    CINE._cur.getWorldPosition(_projV); _projV.project(cam);
    if(_projV.z>1){ card.style.opacity=0; return; }
    const x=(_projV.x*0.5+0.5)*innerWidth, y=(-_projV.y*0.5+0.5)*innerHeight;
    // garder le cartouche dans l'écran : bascule le corps à gauche si trop à droite
    const right = x>innerWidth-230;
    const line=card.querySelector(".cc-line"), bodyEl=card.querySelector(".cc-body");
    if(line&&bodyEl){ if(right){ line.style.transform="scaleX(-1)"; bodyEl.style.left="auto"; bodyEl.style.right="54px"; }
      else { line.style.transform="scaleX(1)"; bodyEl.style.right="auto"; bodyEl.style.left="54px"; } }
    card.style.left=x+"px"; card.style.top=y+"px";
    if(CINE._cur) card.classList.add("show"); else card.classList.remove("show");
  }
  function setTravel(on){ document.body.classList.toggle("travel",on); }
  function cineStart(){
    try{ SFX.init(); }catch(_){}
    CINE.on=true; CINE.i=0; CINE.t=0; CINE.phase="approach"; CINE._setup=false; CINE.roll=0; CINE._userCam=false;
    CINE._lastYaw=null; CINE.bank=0; CINE._planetC=null; CINE._err=0; CINE._fireT=0; CINE._msCd=150; CINE._beamCd=340; CINE.beam=null;
    shipPos.set(180,46,180); shipPrev.copy(shipPos); CTR.copy(shipPos); CTRt.copy(shipPos); targetR=110;
    setTravel(true);
    exitFocus(true); $("#twin").classList.remove("open"); clearFG();
    document.body.classList.add("cine"); document.body.classList.add("imm");
    try{ const _el=document.documentElement; if(_el.requestFullscreen){ const _p=_el.requestFullscreen(); if(_p&&_p.catch)_p.catch(()=>{}); } }catch(_){}
    try{ if(screen.orientation&&screen.orientation.lock) screen.orientation.lock("landscape").catch(()=>{}); }catch(_){}
    toast("Mode cinéma — tournez en paysage pour l'expérience complète · touchez pour la planète suivante");
  }
  function cineStop(){
    CINE.on=false; document.body.classList.remove("cine"); document.body.classList.remove("travel"); document.body.classList.remove("imm");
    try{ if(document.fullscreenElement&&document.exitFullscreen){ const _p=document.exitFullscreen(); if(_p&&_p.catch)_p.catch(()=>{}); } }catch(_){}
    try{ if(screen.orientation&&screen.orientation.unlock) screen.orientation.unlock(); }catch(_){}
    // retour FORCÉ à la vue d'intro paisible (anti écran noir, quel que soit l'état caméra)
    theta=INTRO_THETA; phi=INTRO_PHI; radius=INTRO_R; targetR=INTRO_R; CTRt.set(0,0,0); CTR.set(0,0,0);
    DIVING=false; CINE._look=null; try{ const _dv=document.getElementById("dive"); if(_dv) _dv.classList.remove("on"); }catch(_){}
    CINE._cur=null; CINE.phase=null; cineCardHide();
    if(typeof ship!=="undefined"){ ship.visible=false; ship.scale.setScalar(1.45); }
    CINE.beam=null;
    try{ _beamCore.visible=false; _beamShell.visible=false; _beamGlow.visible=false; _beamHit.visible=false; for(const sp of _beamPulses) sp.visible=false; _chargeBall.visible=false; const _bfx=document.getElementById("beamflash"); if(_bfx)_bfx.style.opacity=0; const _bsf=document.getElementById("bossflash"); if(_bsf)_bsf.style.opacity=0;
      for(let i=cineFx.length-1;i>=0;i--){ const f=cineFx[i]; scene.remove(f.o); if(f.o.isSprite&&f.o.material&&f.o.material.dispose) f.o.material.dispose(); } cineFx.length=0;
      _lockSpr.visible=false; for(const sp of _chargeSucks) sp.visible=false; for(const m of MISSILES){ m.active=false; m.mesh.visible=false; m.trail.visible=false; } }catch(_){} try{ if(window.updateGalaxyNav) window.updateGalaxyNav(); }catch(_){}
    try{ MISSILES.forEach(m=>{ m.active=false; m.mesh.visible=false; }); }catch(_){}
    try{ clearRocks(); }catch(_){}
  }
  function cineAdvance(){
    if(!CINE.on) return;
    if(CINE.phase==="orbit"){
      CINE.i++; CINE._cur=null; cineCardHide(); CINE._userCam=false;
      if(CINE.i<planets.length){ CINE.phase="approach"; CINE.t=0; CINE._setup=false; setTravel(true); }
      else { CINE.phase="finale"; CINE.t=0; setTravel(false); }
    }
  }
  window.cineAdvance=cineAdvance;
  window.cineStop=cineStop;
  $("#bt-cine").onclick=e=>{ e.stopPropagation(); CINE.on?cineStop():cineStart(); };
  $("#bt-full").onclick=async e=>{ e.stopPropagation();
    const d=document, el2=d.documentElement;
    try{
      if(!d.fullscreenElement && el2.requestFullscreen){ await el2.requestFullscreen(); }
      else if(d.fullscreenElement){ await d.exitFullscreen(); }
      else { document.body.classList.toggle("imm"); }
    }catch(err){ document.body.classList.toggle("imm"); }
    toast(document.body.classList.contains("imm")||document.fullscreenElement?"Plein écran — ⤢ pour sortir":"Affichage normal");
  };
  el.addEventListener("pointerdown",(e)=>{ if(CINE.on){ CINE._downX=e.clientX; CINE._downY=e.clientY; CINE._downT=Date.now(); CINE._moved=false; } });
  el.addEventListener("pointermove",(e)=>{ if(CINE.on && CINE._downT){ if(Math.hypot(e.clientX-CINE._downX,e.clientY-CINE._downY)>10){ CINE._moved=true; CINE._userCam=true; } } });
  el.addEventListener("pointerup",(e)=>{ if(!CINE.on||!CINE._downT) return; const tap=!CINE._moved && Date.now()-CINE._downT<300; CINE._downT=0;
    if(tap){ cineAdvance(); } });
  window.galaxyFocusMoon=function(eid,k){ const mn=moons.find(m2=>m2.userData.entityId===eid&&m2.userData.loanIdx===k); if(mn){ focusMoon(mn); } };
  function focusSun(){
    exitFocus(true);
    FOCUS.id="oriondemo"; FOCUS.host=null;
    targetR=26*sunGroup.scale.x*12;
    lbls.forEach(l=>l.visible=false); sunLbl.visible=false;
    halos.forEach(h=>h.visible=false);
    flows.forEach(f=>f.pts.visible=false);
    $("#g-legend").style.display="none";
    $("#g-exit").classList.add("show");
    if(innerWidth<700) $("#twin").classList.add("sheet");
    ping(0,0,0,"#FFC861");
    buildFG(sunGroup,false);
  }
  // onde sonar à l'entrée en focus
  const PINGS=[];
  function ping(x,y,z,color){
    const p=glowSprite(color||"#6FE3FF","rgba(255,255,255,.9)");
    p.position.set(x,y,z); p.userData={life:0}; scene.add(p); PINGS.push(p);
  }
  const tip=$("#g-tip");
  el.addEventListener("pointermove",e=>{
    if(e.pointerType==="touch") return;
    mouse.x=(e.clientX/innerWidth)*2-1; mouse.y=-(e.clientY/innerHeight)*2+1;
    ray.setFromCamera(mouse,cam);
    const hit=ray.intersectObjects(planets)[0];
    if(hit){
      const ent=Engine.entity(hit.object.userData.id);
      tip.style.display="block"; tip.style.left=(e.clientX+16)+"px"; tip.style.top=(e.clientY+10)+"px";
      tip.innerHTML=`<b style="color:${ent.color}">${ent.name}</b><br>QP NAV+CC : <span style="color:#FFC861">${fmtK(Engine.navShare(ent))}</span> · ${ent.rent?fmtK(ent.rent)+"/an":"holding"} · ${ent.loans.length} lune(s) = emprunts`;
      el.style.cursor="pointer";
    } else { tip.style.display="none"; el.style.cursor="grab"; }
  });
  $("#g-legend").innerHTML=`<span style="font-family:var(--disp);letter-spacing:.3em;color:var(--sun)">☀ ${DATA.meta.brandDisplay}</span>`+
    DATA.entities.map(e=>`<span style="color:${e.color}"><i style="background:${e.color};color:${e.color}"></i><span style="color:var(--dim)">${e.name} · ${pct(e.stake)}</span></span>`).join("")+
    `<span style="color:var(--faint);margin-top:4px">○ lunes = emprunts · ☄ comète · ceintures de débris</span>`;

  /* ====== BOUCLE ====== */
  const clock=new THREE.Clock();
  let DT=.016, _lastMs=0, SHAKE=0;
  function loop(){
    requestAnimationFrame(loop);
    const t=clock.getElapsedTime();
    const _nowMs=performance.now(); DT=_lastMs? Math.min(0.05,Math.max(0.004,(_nowMs-_lastMs)/1000)) : .016; _lastMs=_nowMs;
    // — éco : on suspend tout le rendu 3D quand la galaxie n'est pas à l'écran (batterie/chaleur) —
    if(!(document.getElementById("m-galaxy").classList.contains("on")||CINE.on||(typeof SURF!=="undefined"&&SURF.on))){ window._bgF=(window._bgF||0)+1; if(window._bgF%3) return; }
    if(!DIVING) radius+=(targetR-radius)*.08;
    sun.rotation.y+=.0022; sunSkin.rotation.y-=.0016;
    { const _pl=.9+.06*Math.sin(t*1.1); coreGlow.material.opacity=_pl; coreHalo.material.opacity=.5+.08*Math.sin(t*.8+1); }
    sunTex.offset.x+=.00018; sunTex2.offset.x-=.00026;
    const sc=sunGroup.scale.x+(sunScaleTarget-sunGroup.scale.x)*.04;
    sunGroup.scale.set(sc,sc,sc);
    eqBand.material.opacity=.22+.18*Math.sin(t*2.1);
    eqBand.rotation.z=t*.15;
    // décor vivant : Voie lactée en dérive, étoiles filantes, comète anti-solaire
    milkyWay.rotation.y=t*0.0035;
    for(const S of SHOOTS){ if(!S.sp.visible){ S.wait-=DT; if(S.wait<=0){ const th2=Math.random()*6.28, r2=760+Math.random()*260, y2=(Math.random()-.35)*420;
          S.sp.position.set(Math.cos(th2)*r2,y2,Math.sin(th2)*r2); S.v.set((Math.random()-.5),(Math.random()-.2)*.5,(Math.random()-.5)).normalize().multiplyScalar(340+Math.random()*260);
          S.life=0; S.max=0.9+Math.random()*0.6; S.sp.visible=true; S.sp.material.rotation=Math.random()*6.28; } }
      else { S.life+=DT; S.sp.position.addScaledVector(S.v,DT); const k2=S.life/S.max; S.sp.material.opacity=Math.sin(Math.min(1,k2)*Math.PI)*.9; if(k2>=1){ S.sp.visible=false; S.wait=5+Math.random()*11; } } }
    for(const SH of SHUTTLES){ const tt2=t*SH.w+SH.ph, k3=(Math.sin(tt2*.7)+1)/2, rr3=SH.r1+(SH.r2-SH.r1)*k3;
      SH.g.position.set(Math.cos(tt2)*rr3, Math.sin(tt2*1.7)*14, Math.sin(tt2)*rr3);
      const tn=tt2+0.06, kn=(Math.sin(tn*.7)+1)/2, rn=SH.r1+(SH.r2-SH.r1)*kn;
      SH.g.lookAt(Math.cos(tn)*rn, Math.sin(tn*1.7)*14, Math.sin(tn)*rn); }
    { const ca=COMET.ph+t*COMET.w; COMET.head.position.set(Math.cos(ca)*COMET.a, 42*Math.sin(ca*0.7), Math.sin(ca)*COMET.b);
      _tmpV.copy(COMET.head.position).normalize(); for(let i2=0;i2<COMET.tail.length;i2++){ const tt=COMET.tail[i2]; tt.position.copy(COMET.head.position).addScaledVector(_tmpV,(i2+1)*6.5); tt.material.opacity=.5*(1-i2/COMET.tail.length); const s2=7*(1-i2/COMET.tail.length*0.7); tt.scale.set(s2,s2,1); } }
    cmes.forEach(c=>{ c.userData.life+=DT;
      const L2=c.userData.life%9;
      if(L2<2.4){ const k=60+L2*150; c.scale.set(k,k,1); c.material.opacity=.35*(1-L2/2.4); }
      else c.material.opacity=0; });
    { const ap=solarWind.geometry.attributes.position; for(let i=0;i<SWN;i++){ const v=swV[i]; v.rad+=v.sp*2.3; if(v.rad>700) v.rad=26;
        ap.array[i*3]=v.dir.x*v.rad; ap.array[i*3+1]=v.dir.y*v.rad; ap.array[i*3+2]=v.dir.z*v.rad; } ap.needsUpdate=true; }
    corona.material.opacity=.55+Math.sin(t*1.3)*.08;
    corona2.material.opacity=.26+Math.sin(t*.9+1)*.06;
    corona3.material.opacity=.10+Math.sin(t*.6+2)*.03;
    flareGroup.rotation.y+=.0022;
    flares.forEach(f=>{ f.material.opacity=.25+.45*Math.max(0,Math.sin(t*.7+f.userData.ph)); });
    starsA.rotation.y+=.00009; starsB.rotation.y-=.00007; starsC.rotation.y+=.00005;
    starsB.material.opacity=.7+Math.sin(t*.8)*.2; starsC.material.opacity=.65+Math.sin(t*1.1+2)*.25;
    brights.forEach(b=>{ b.material.opacity=.15+.10*Math.sin(t*1.6+b.userData.ph); });
    mwGroup.rotation.y+=.00003;
    const sa=swarm.geometry.attributes.position.array;
    for(let i=0;i<420;i++){
      const a=t*.25+swSeed[i], r0=34+10*Math.sin(t*.6+swSeed[i]*3), b=swSeed[i]*2;
      sa[i*3]=r0*Math.sin(b)*Math.cos(a+swSeed[i]); sa[i*3+1]=r0*Math.cos(b)*Math.sin(t*.3+swSeed[i]); sa[i*3+2]=r0*Math.sin(b)*Math.sin(a+swSeed[i]);
    }
    swarm.geometry.attributes.position.needsUpdate=true;
    const ORB=FOCUS.id?0.07:1;
    const _sd=new THREE.Vector3();
    planets.forEach((m,i)=>{
      const u=m.userData;
      u.angle+=u.speed*.016*ORB;
      const y=Math.sin(u.angle)*u.dist*Math.sin(u.incl)+Math.sin(u.angle*.6+i)*4;
      m.position.set(Math.cos(u.angle)*u.dist, y, Math.sin(u.angle)*u.dist*Math.cos(u.incl));
      m.rotation.y+=u.spin;
      if(m.userData_sparkle) m.userData_sparkle.material.opacity=.5+.4*Math.sin(t*2.6+u.angle*3);
      if(m.userData_mag) m.userData_mag.rotation.y+=.004;
      m.rotation.z=Math.sin(t*.05+(u.precess||0))*.05+(u.baseZ!=null?u.baseZ:(u.baseZ=m.rotation.z));
      halos[i].position.copy(m.position);
      lbls[i].position.set(m.position.x, m.position.y+u.r+12, m.position.z);
      if(m.material.userData.uSunDir){
        _sd.copy(m.position).multiplyScalar(-1).normalize().transformDirection(cam.matrixWorldInverse);
        m.material.userData.uSunDir.value.copy(_sd);
      }
    });
    trails.forEach(tr=>{
      tr.hist.unshift([tr.host.position.x,tr.host.position.y,tr.host.position.z]);
      if(tr.hist.length>16) tr.hist.pop();
      const a2=tr.pts.geometry.attributes.position.array;
      for(let k=0;k<16;k++){ const h=tr.hist[Math.min(k,tr.hist.length-1)]||[0,0,0]; a2[k*3]=h[0];a2[k*3+1]=h[1];a2[k*3+2]=h[2]; }
      tr.pts.geometry.attributes.position.needsUpdate=true;
      tr.pts.visible=!FOCUS.id;
    });
    clouds.forEach(c=>{ c.rotation.y-=.004; });
    alerts.forEach(a=>{ const k=1+.12*Math.sin(t*3.2); a.scale.set(k,k,k); a.material.opacity=.45+.3*Math.sin(t*3.2); });
    moons.forEach(mn=>{
      const u=mn.userData; u.ma+=u.ms*.016;
      const hx=u.host.position;
      mn.position.set(hx.x+Math.cos(u.ma)*u.md, hx.y+Math.sin(u.ma)*u.md*Math.sin(u.tilt), hx.z+Math.sin(u.ma)*u.md*Math.cos(u.tilt));
      mn.rotation.y+=.01;
    });
    for(let i=0;i<AST;i++){
      aAng[i]+=aSpd[i];
      dummy.position.set(Math.cos(aAng[i])*aRad[i], aY[i], Math.sin(aAng[i])*aRad[i]);
      dummy.rotation.set(aRx[i]+t*.3, aRy[i]+t*.2, 0);
      dummy.scale.set(aScl[i]*aSx[i],aScl[i],aScl[i]*aSz[i]);
      dummy.updateMatrix(); belt.setMatrixAt(i,dummy.matrix);
    }
    belt.instanceMatrix.needsUpdate=true;
    for(let i=0;i<NCR;i++){ const d=crystD[i]; d.ang+=d.spd; d.rx+=d.vrx; d.ry+=d.vry; d.rz+=d.vrz;
      _crP.set(Math.cos(d.ang)*d.rad,d.y,Math.sin(d.ang)*d.rad); _crE.set(d.rx,d.ry,d.rz); _crQ.setFromEuler(_crE); _crS.set(d.sc,d.sc*1.75,d.sc);
      _crM.compose(_crP,_crQ,_crS); cryst.setMatrixAt(i,_crM); }
    cryst.instanceMatrix.needsUpdate=true;
    _twMat.uniforms.uT.value=t;
    { const _zb=Math.max(0,Math.min(1,(620-radius)/430)); _twMat.uniforms.uBright.value=1+_zb*.9; crystMat.emissiveIntensity=.06+_zb*.22; }
    kuiper.rotation.y+=.00012;
    // 3.73 : vie orbitale
    SATS.forEach(s2=>{ const a=t*s2.sp+s2.ph;
      const x=Math.cos(a)*s2.r, zz=Math.sin(a)*s2.r;
      s2.g.position.set(s2.p.position.x+x, s2.p.position.y+zz*s2.si, s2.p.position.z+zz*s2.ci);
      s2.g.rotation.y=-a; if(s2.st){ s2.g.rotation.z=t*.55*(s2.sp>0?1:-1); }
      if(s2.bec) s2.bec.material.opacity=(Math.sin(t*6.5+s2.ph*9)>.84)?.95:0;
    });
    clouds.forEach(c2=>{ c2.rotation.y+=.00035; });
    // vent solaire
    {const a2=wind.geometry.attributes.position.array;
     for(let i=0;i<swind.n;i++){ wR[i]+=.9; if(wR[i]>520) wR[i]=40;
       a2[i*3]=wDir[i*3]*wR[i]; a2[i*3+1]=wDir[i*3+1]*wR[i]; a2[i*3+2]=wDir[i*3+2]*wR[i]; }
     wind.geometry.attributes.position.needsUpdate=true;
     wind.material.opacity=.22+.12*Math.sin(t*1.4);}
    // piliers de lumière
    pillars.forEach((p,i)=>{ p.material.rotation+=.0009*(i%2?1:-1); p.material.opacity=.03+.03*Math.sin(t*.5+p.userData.ph); });
    // 3.73 : eblouissement camera - voile lumineux + iris quand on fixe le soleil
    {const toSun=new THREE.Vector3(0,0,0).sub(cam.position).normalize();
     const dir=new THREE.Vector3(); cam.getWorldDirection(dir);
     const d=Math.min(1,Math.max(0,(dir.dot(toSun)-.955)/.045));
     const sm=d*d*(3-2*d);
     const prox=Math.max(.3,Math.min(1,(820-cam.position.length())/560));
     const gl=(FOCUS.id?0:1)*sm*prox;
     if(GLARE_EL) GLARE_EL.style.opacity=(gl*.8).toFixed(3);
     ren.toneMappingExposure=1.32+gl*.24;
     streak.material.opacity=0;
     corona.material.opacity=(.55+Math.sin(t*1.3)*.08)*(1+d*.4);
     corona4.material.opacity=(.055+.02*Math.sin(t*.9+1))*(1+d*.6);
     coronaCool.material.opacity=(.03+.012*Math.sin(t*.6+2))*(1+d*.5);
     chromo.material.opacity=.26+.1*Math.sin(t*1.6); if(chromo.userData.billboard) chromo.quaternion.copy(cam.quaternion);
     const _stk=(.15+.04*Math.sin(t*.7))*(1+d*.9)*(FOCUS.id?.35:1);
     diffH.material.opacity=_stk; diffH2.material.opacity=_stk*1.55; diffV.material.opacity=(.05+d*.05)*(FOCUS.id?.35:1);}
    // trou noir
    acc1.rotation.z=t*.5; acc2.rotation.z=-t*.32;
    bhGlow.material.opacity=.2+.08*Math.sin(t*.8);
    // pulsar
    {const k=Math.max(0,Math.sin(t*4.8)); pCore.material.opacity=.25+.75*k*k;
     beam1.material.rotation+=.02; beam2.material.rotation+=.02;
     beam1.material.opacity=beam2.material.opacity=.12+.5*k*k;}
    // supernova qui respire
    {const k=1+.18*Math.sin(t*.35); nova.scale.set(380*k,380*k,1); nova.material.opacity=.09+.06*Math.sin(t*.35);}
    // constellations éphémères
    constel.forEach(c=>{ const k=Math.sin((t+c.userData.ph)*.18); c.material.opacity=Math.max(0,k)*.18; });
    // galaxies en collision
    gxA.material.rotation+=.0011; gxB.material.rotation-=.0014;
    // station orbitale
    stA+=.004;
    station.position.set(Math.cos(stA)*72, 10+Math.sin(stA*2)*4, Math.sin(stA)*72);
    station.lookAt(0,0,0);
    beacon.material.opacity=Math.max(0,Math.sin(t*4))>.7?1:.05;
    // poussière proche en contre-rotation + densité au zoom
    nearDust.rotation.y-=.00045;
    nearDust.material.opacity=radius<300?.14:.10;
    // étincelles de la ceinture d'astéroïdes (visibles en approche)
    if(beltSpark){ beltSpark.visible=radius<420;
      if(beltSpark.visible){ beltSpark.rotation.y+=.0004; beltSpark.material.opacity=.3+.25*Math.sin(t*2.6); } }
    // nébuleuses : dérive chromatique lente
    nebulae.forEach((nb,i)=>{ nb.material.opacity=.024+.009*Math.sin(t*.12+i*1.7);
      const k=1+.06*Math.sin(t*.07+i); nb.scale.x=nb.userData_w||(nb.userData_w=nb.scale.x); nb.scale.set(nb.userData_w*k,nb.userData_w*.7*k,1); });
    // comète émeraude (plan incliné)
    {const e2=.58, a2b=lastDist*1.25;
     const rr2=a2b*(1-e2*e2)/(1+e2*Math.cos(c2Th));
     c2Th+=.0030*Math.pow((a2b/rr2),1.5)*.5;
     comet2.position.set(Math.cos(c2Th)*rr2*.92, Math.sin(c2Th)*rr2*.38, Math.sin(c2Th)*rr2*.78);
     comet2Glow.position.copy(comet2.position);
     const aw=comet2.position.clone().normalize();
     const ta2=tail2.geometry.attributes.position.array;
     const tl2=Math.min(95, 14000/rr2);
     for(let k=0;k<60;k++){ const f=k/60;
       ta2[k*3]=comet2.position.x+aw.x*f*tl2+(Math.random()-.5)*f*7;
       ta2[k*3+1]=comet2.position.y+aw.y*f*tl2+(Math.random()-.5)*f*7;
       ta2[k*3+2]=comet2.position.z+aw.z*f*tl2+(Math.random()-.5)*f*7; }
     tail2.geometry.attributes.position.needsUpdate=true;}
    // comète sur orbite elliptique (vitesse képlérienne approchée)
    const e0=.62, a0=lastDist*1.05;
    const rr=a0*(1-e0*e0)/(1+e0*Math.cos(cTh));
    cTh+=.0035*Math.pow((a0/rr),1.5)*.5;
    comet.position.set(Math.cos(cTh)*rr, Math.sin(cTh*.5)*14, Math.sin(cTh)*rr*.85);
    cometGlow.position.copy(comet.position);
    const away=comet.position.clone().normalize();
    const ta=tail.geometry.attributes.position.array;
    const tl=Math.min(120, 18000/rr);
    for(let k=0;k<80;k++){
      const f=k/80;
      ta[k*3]=comet.position.x+away.x*f*tl+(Math.random()-.5)*f*8;
      ta[k*3+1]=comet.position.y+away.y*f*tl+(Math.random()-.5)*f*8;
      ta[k*3+2]=comet.position.z+away.z*f*tl+(Math.random()-.5)*f*8;
    }
    tail.geometry.attributes.position.needsUpdate=true;
    // étoiles filantes
    meteors.forEach(m=>{
      if(m.userData.life>0){
        m.position.add(m.userData.vel); m.userData.life-=.016;
        m.material.opacity=Math.min(1,m.userData.life);
      } else if(Math.random()<.004){
        m.position.set((Math.random()-.5)*3000,(Math.random()-.2)*1600,(Math.random()-.5)*3000);
        m.userData.vel=new THREE.Vector3((Math.random()-.5)*26,-(6+Math.random()*10),(Math.random()-.5)*26);
        m.userData.life=1.4+Math.random();
      } else m.material.opacity=0;
    });
    flows.forEach(f=>{
      const arr=f.pts.geometry.attributes.position.array, P=f.planet.position;
      for(let k=0;k<22;k++){
        const u=((t*f.speed+f.phase+k/22)%1);
        const lift=Math.sin(u*Math.PI)*30;
        arr[k*3]=P.x*(1-u); arr[k*3+1]=P.y*(1-u)+lift; arr[k*3+2]=P.z*(1-u);
      }
      f.pts.geometry.attributes.position.needsUpdate=true;
      f.pts.material.opacity=0;
    });
    // mode cinéma : odyssée automatique de planète en planète
    if(CINE.on){
     try{
      CINE.t+=DT*((CINE.phase==="approach"&&CINE.beam)?0.16:1); // slow-mo dramatique pendant le Kaméha
      const N=planets.length;
      const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
      shipPrev.copy(shipPos);

      if(CINE.phase==="approach" && CINE.i<N){
        const seq=planets[CINE.i]; seq.getWorldPosition(_projV); const pc=_projV.clone();
        const rr=seq.userData.r;
        const out=pc.clone().normalize(); if(out.lengthSq()<.01) out.set(1,0,0);
        const side=new THREE.Vector3(-out.z,0.22,out.x).normalize();
        // point d'entrée en orbite (à l'extérieur de la planète)
        const orbR=rr*2.6+18;
        const wp=pc.clone().add(out.multiplyScalar(orbR));
        if(!CINE._setup){ CINE._setup=true; CINE.fromS=shipPos.clone(); CINE._id=null; CINE.dur=9.5; CINE._camBlend=0; CINE._firedMsl=false; CINE._firedBeam=false; CINE._boltT=0; if(typeof ship!=="undefined") ship.scale.setScalar(1.45);
          // semer des astéroïdes le long du trajet (cibles)
          clearRocks();
          const dir=wp.clone().sub(shipPos);
          for(let r2=0;r2<6;r2++){ const tt=.28+r2*0.11;
            const base=shipPos.clone().addScaledVector(dir,tt);
            base.addScaledVector(side,(r2%2?1:-1)*(40+Math.random()*44)); // décalés sur les côtés : CIBLES, jamais obstacles
            base.y+=(Math.random()-.5)*26;
            spawnRock(base, 2.6+Math.random()*3.0); }
        }
        const p=Math.min(1,CINE.t/CINE.dur), e=ease(p);
        shipPos.lerpVectors(CINE.fromS,wp,e);
        // vol FLUIDE : lacet doux et ample, aucune esquive brutale -> le vaisseau reste cadré
        shipPos.addScaledVector(side, Math.sin(p*Math.PI*1.4)*rr*0.55);
        shipPos.y+=Math.sin(p*Math.PI*2.2+1.3)*rr*0.16;
        // RAFALES de bolts sur les rochers (rythme avant le Kaméha)
        if(CINE.t>1.4&&CINE.t<4.0){ CINE._boltT=(CINE._boltT||0)-DT; if(CINE._boltT<=0){ CINE._boltT=0.42;
          _beamDir.set(0,0,1).applyQuaternion(ship.quaternion).normalize();
          if(ship.userData.nose) ship.userData.nose.getWorldPosition(_beamNose); else _beamNose.copy(shipPos);
          let bt=null,bd=1e9; for(const m of cineRocks){ if(m.userData.boss) continue; _beamRel.copy(m.position).sub(_beamNose); const al=_beamRel.dot(_beamDir); if(al>20&&al<260){ const pp=_beamRel.addScaledVector(_beamDir,-al).length(); if(pp<70&&al<bd){bd=al;bt=m;} } }
          if(bt){ fireBolt(_beamNose, _beamTmp.copy(bt.position).sub(_beamNose)); }
        } }
        if(p>=1){ CINE.phase="orbit"; CINE.t=0; CINE._setup=false; CINE._userCam=false; CINE.orbA=Math.atan2(shipPos.z-pc.z, shipPos.x-pc.x); setTravel(false); }
      }
      else if(CINE.phase==="orbit" && CINE.i<N){
        const seq=planets[CINE.i]; seq.getWorldPosition(_projV); const pc=_projV.clone();
        const rr=seq.userData.r, orbR=rr*3.0+26;
        if(typeof ship!=="undefined") ship.scale.setScalar(0.9);
        // ORBITE TRÈS DOUCE autour de la planète
        CINE.orbA=(CINE.orbA||0)+0.0026;
        const tx=pc.x+Math.cos(CINE.orbA)*orbR, tz=pc.z+Math.sin(CINE.orbA)*orbR, ty=pc.y+Math.sin(CINE.orbA*0.6)*rr*0.45;
        shipPos.lerp(new THREE.Vector3(tx,ty,tz),0.05);
        CINE._planetC=pc; CINE._orbR=orbR; CINE._rr=rr;
        cineCardFill(seq.userData.id); CINE._cur=seq;
      }
      else { // FINALE — apothéose sur le SOLEIL CENTRAL puis retour à l'intro paisible (~10s)
        if(CINE.phase!=="finale"){ CINE.phase="finale"; CINE.t=0; CINE._userCam=false; CINE.fromS=shipPos.clone();
          CTR.copy(_ZERO); CTRt.copy(_ZERO); radius=380; targetR=380; phi=1.0; // CUT NET sur le soleil : la caméra est déjà cadrée dessus
          CINE.fromR=380; CINE.fromTh=theta; CINE.fromPh=1.0; CINE._cur=null; CINE._fus=false; cineCardHide(); clearRocks(); setTravel(false); }
        const T=CINE.t;
        if(T<3.4){ // CHASE-CAM : collée derrière le vaisseau qui pique vers le soleil
          const e=ease(Math.min(1,T/3.4));
          shipPos.lerpVectors(CINE.fromS,_ZERO,e);
          _camFwd.set(0,0,1).applyQuaternion(ship.quaternion).normalize();
          const bth2=Math.atan2(-_camFwd.x,-_camFwd.z);
          let dth2=bth2-theta; while(dth2>Math.PI)dth2-=6.28318530718; while(dth2<-Math.PI)dth2+=6.28318530718;
          theta+=dth2*0.1; phi+=(1.06-phi)*0.08;
          targetR=Math.max(46,120-84*e); radius+=(targetR-radius)*.12;
          CTRt.copy(shipPos).addScaledVector(_camFwd,30+130*e); CTR.lerp(CTRt,0.14); // le regard glisse du vaisseau vers le soleil
          if(typeof ship!=="undefined"){ const sc=1.45*Math.max(0.10,1-e*0.90); ship.scale.setScalar(sc); ship.visible=(e<=0.96); }
          if(T>2.9&&!CINE._fus){ CINE._fus=true; CINE._sunS0=sunScaleTarget; sunScaleTarget*=1.16; nuclearBlast(new THREE.Vector3(0,8,0),15); bossFlash(); SHAKE=0.85; if(SFX&&SFX.fanfare) SFX.fanfare(); } // FUSION : éruption + fanfare
        } else if(T<6.6){ // PLAN HÉROS : le soleil central, légère dérive
          if(CINE._fus&&CINE._sunS0) sunScaleTarget+=(CINE._sunS0-sunScaleTarget)*0.03;
          targetR+=(300-targetR)*0.05; radius+=(targetR-radius)*.06; phi+=(0.96-phi)*0.05; theta+=0.0016;
          if(typeof ship!=="undefined") ship.visible=false;
        } else { // RETOUR à la vue d'intro
          const e=ease(Math.min(1,(T-6.6)/3.0));
          targetR=300+(INTRO_R-300)*e; radius+=(targetR-radius)*.06; phi=0.96+(INTRO_PHI-0.96)*e;
          let dth=INTRO_THETA-theta; while(dth>Math.PI)dth-=6.28318530718; while(dth<-Math.PI)dth+=6.28318530718; theta+=dth*0.04;
        }
        if(CINE.t>=9.9){ if(typeof ship!=="undefined") ship.scale.setScalar(1.45); cineStop(); }
      }

      // === anti-traversée : le vaisseau ne pénètre jamais une planète ===
      if(CINE.phase!=="finale"){
        for(let pi=0; pi<planets.length; pi++){ planets[pi].getWorldPosition(_tmpV); const rr2=planets[pi].userData.r;
          const isTarget=(pi===CINE.i); const margin=isTarget? rr2*1.04 : rr2*1.4+14;
          const dd=shipPos.distanceTo(_tmpV);
          if(dd<rr2+margin){ shipPos.add(_tmpV.clone().sub(shipPos).setLength(-(rr2+margin-dd))); } }
      }
      // === orientation : nez vers la vitesse + virage banké lissé (réaliste, constant) ===
      _vel.subVectors(shipPos,shipPrev); const spd=_vel.length();
      const _aimT=(CINE.beam&&CINE.beam._bossMesh)?CINE.beam._bossMesh.position:((CINE.beam&&CINE.beam._ip)?CINE.beam._ip:null);
      if(_aimT){ ship.lookAt(_aimT.x,_aimT.y,_aimT.z); }
      else if(_vel.lengthSq()>1e-6){ ship.lookAt(shipPos.x+_vel.x*40, shipPos.y+_vel.y*40, shipPos.z+_vel.z*40); }
      if(CINE.phase==="approach"&&CINE.t>0.7&&CINE.t<2.1){ ship.rotateZ(ease((CINE.t-0.7)/1.4)*Math.PI*2); } // BARREL ROLL d'entrée
      ship.position.copy(shipPos); ship.visible=true;
      const yawNow=Math.atan2(_vel.x,_vel.z);
      let turn=yawNow-(CINE._lastYaw==null?yawNow:CINE._lastYaw);
      if(turn>Math.PI) turn-=2*Math.PI; else if(turn<-Math.PI) turn+=2*Math.PI;
      CINE._lastYaw=yawNow;
      const _tb=Math.max(-0.16,Math.min(0.16,turn)); const bankT=Math.max(-0.65,Math.min(0.65,-_tb*10));
      CINE.bank=(CINE.bank||0)+(bankT-(CINE.bank||0))*0.08;
      ship.rotateZ(CINE.bank);
      ship.rotateX(Math.max(-0.28,Math.min(0.28,-_vel.y*0.05)));
      ship.updateMatrixWorld(true);
      // réacteurs : halo pulsé (selon vitesse) — joli et discret
      const eng=ship.userData.eng;
      if(eng) eng.forEach(g=>{ const o=.5+.32*Math.sin(CINE.t*26)+Math.min(.45,spd*.12); g.halo.material.opacity=o;
        const sc=1.25+.3*Math.sin(CINE.t*26)+Math.min(.7,spd*.16); g.halo.scale.set(sc,sc,1); });
      // traînée fine
      const _J=ship.userData.jets;
      if(_J){
        (_J.engPlumes||[]).forEach((pl,pi)=>{ const fk=0.62+0.3*Math.sin(t*30+pi*1.7)+0.12*Math.sin(t*61+pi)+0.06*Math.random();
          pl.children.forEach((sp,si)=>{ const w=(1.6-si*0.15)*(0.78+0.42*Math.max(0,fk)); sp.scale.set(w,w,1);
            sp.material.opacity=Math.max(0,(0.92-si*0.12)*Math.max(.18,fk));
            sp.position.x=Math.sin(t*47+si*1.9+pi*2.3)*0.06*si; sp.position.y=Math.cos(t*39+si*1.3+pi)*0.045*si; }); });
        const _cp=_J.cenPlume; if(_cp){ const bk=0.62+0.3*Math.sin(t*27)+0.13*Math.sin(t*53)+0.05*Math.random();
          _cp.children.forEach((sp,si)=>{ const w=(2.15-si*0.18)*(0.78+0.42*Math.max(0,bk)); sp.scale.set(w,w,1);
            sp.material.opacity=Math.max(0,(0.85-si*0.09)*Math.max(.18,bk));
            sp.position.x=Math.sin(t*43+si*1.5)*0.08*si; sp.position.y=Math.cos(t*35+si)*0.055*si; }); }
      }
      // === TIRS façon SW : 2 bolts depuis les bouches de canon, vers le rocher le plus proche ===
      CINE._fireT=(CINE._fireT||0)+1;
      try{ updateWeapons(t); }catch(_e){}
      updateCineFx();
      // === caméra ===
      if(CINE.phase==="approach" || (CINE.phase==="orbit" && CINE._planetC)){
        // ===== CAMÉRA CONFORT (approche + orbite) : dérive orbitale lente CONSTANTE, regard qui GLISSE, zéro chasse de cap =====
        if(!CINE._look) CINE._look=new THREE.Vector3().copy(shipPos);
        let dLook, dR, dPhi;
        if(CINE.phase==="orbit"){ dLook=CINE._planetC; dR=CINE._orbR*1.7+CINE._rr*2.6; dPhi=1.12; }
        else { dLook=shipPos; dR=155; dPhi=1.16; }
        CINE._look.lerp(dLook, 0.06);                 // la cible de regard glisse doucement -> AUCUN saut entre phases
        const _firing = CINE.beam && (CINE.beam.phase==="charge"||CINE.beam.phase==="fire");
        if(!CINE._userCam && _firing){
          // ===== CAMÉRA ÉPAULE : derrière le nez, regard le long du rayon -> le tir s'enfonce vers l'explosion =====
          _camFwd.set(0,0,1).applyQuaternion(ship.quaternion).normalize();
          const bth=Math.atan2(-_camFwd.x,-_camFwd.z);   // derrière, à l'HORIZONTALE (insensible au tangage)
          let dth=bth-theta; while(dth>Math.PI)dth-=6.28318530718; while(dth<-Math.PI)dth+=6.28318530718;
          theta+=dth*0.08; phi+=(1.12-phi)*0.08; targetR+=(134-targetR)*0.08;  // angle au-dessus-arrière CONSTANT
          CTRt.copy(shipPos).addScaledVector(_camFwd,48); CTR.lerp(CTRt,0.12);
        } else {
          CTRt.copy(CINE._look); CTR.lerp(CTRt, 0.09);
          if(!CINE._userCam){
            theta+=0.0026;                            // orbite lente et constante : confort total, jamais d'à-coup
            phi+=(dPhi-phi)*0.025;
            targetR+=(dR-targetR)*0.025;
          }
        }
      } else {
        // finale : la caméra cadre le centre (soleil central) ; le mouvement gère orbite/zoom
        CTRt.copy(_ZERO); CTR.lerp(_ZERO,0.07);
      }
      CINE.roll=0;
     }catch(_ce){ if(!CINE._err){ CINE._err=1; console.warn('cine:',_ce&&_ce.message); } cineStop(); }
    }
    // inertie + dérive contemplative
    if(!drag){ theta+=vTheta; phi=Math.min(1.4,Math.max(.06,phi+vPhi)); vTheta*=.92; vPhi*=.92; }
    if(Date.now()-lastTouch>9000 && !FOCUS.id){ theta+=.00035; phi=Math.min(1.4,Math.max(.06,phi+Math.sin(t*.1)*.00018)); }
    // pings sonar
    PINGS.forEach(p=>{ p.userData.life+=DT; const L2=p.userData.life;
      const k=20+L2*240; p.scale.set(k,k,1); p.material.opacity=Math.max(0,.5-L2*.4);
      if(L2>1.4){ scene.remove(p); PINGS.splice(PINGS.indexOf(p),1); } });
    // centre de navigation lissé
    if(FOCUS.id&&FOCUS.host){
      const P=FOCUS.host.position;
      CTRt.set(P.x, P.y - (($("#twin").classList.contains("sheet")&&$("#twin").classList.contains("open"))?radius*.11:0), P.z);
      FOCUS.group.position.copy(P);
      FOCUS.updates.forEach(u=>u(t));
    } else if(FOCUS.id==="oriondemo"){ CTRt.set(0, ($("#twin").classList.contains("sheet")&&$("#twin").classList.contains("open"))?-radius*.11:0, 0); }
    if(!FOCUS.id && !CINE.on && radius>620) CTRt.multiplyScalar(.985);
    if(!FOCUS.id) CTRt.clampLength(0,560);
    CTR.lerp(CTRt,.10);
    // garde-fou : si une valeur caméra devient invalide, on rétablit la vue d'intro (anti écran noir)
    if(!isFinite(radius)||!isFinite(phi)||!isFinite(theta)||!isFinite(CTR.x)||!isFinite(CTR.y)||!isFinite(CTR.z)){ radius=INTRO_R; targetR=INTRO_R; phi=INTRO_PHI; theta=INTRO_THETA; CTR.set(0,0,0); CTRt.set(0,0,0); }
    cam.position.set(CTR.x+radius*Math.sin(phi)*Math.sin(theta), CTR.y+radius*Math.cos(phi), CTR.z+radius*Math.sin(phi)*Math.cos(theta));
    if(SHAKE>0.004){ cam.position.x+=(Math.random()-.5)*SHAKE*3.4; cam.position.y+=(Math.random()-.5)*SHAKE*3.4; cam.position.z+=(Math.random()-.5)*SHAKE*1.6; SHAKE*=Math.exp(-DT*5.2); }
    if(_cinedbg){ _cinedbg.style.display="none"; }
    if(SURF.on){
      const S=SURF.cache[SURF.id];
      if(!S){ SURF.on=false; return; }
      SURF.T+=DT;
      S.ups.forEach(u=>u(t));
      SURF.alt+=(SURF.targetAlt-SURF.alt)*(SURF.T<6?.022:.06);
      if(SURF.target){
        const dx=SURF.target.x-SURF.pos.x, dz=SURF.target.z-SURF.pos.z, dist=Math.hypot(dx,dz);
        if(dist<5){ SURF.target=null; S.marker.visible=false; }
        else {
          // déplacement DIRECT vers la cible (le corps glisse, sans faire pivoter la vue)
          const want=Math.atan2(dz,dx);
          const sp=Math.min(1.4,.35+dist*.006);
          SURF.pos.x+=Math.cos(want)*sp; SURF.pos.z+=Math.sin(want)*sp;
          // le CAP s'aligne en douceur sur la marche par le plus court chemin (sert de référence à la vue libre)
          let dh=want-SURF.heading; while(dh>Math.PI)dh-=2*Math.PI; while(dh<-Math.PI)dh+=2*Math.PI;
          SURF.heading+=dh*.05;
          S.marker.material.opacity=.5+.4*Math.sin(t*5);
        }
      }
      let ground=surfH(SURF.pos.x,SURF.pos.z,S.seed,S.theme);
      const _vt=VOXTOP[SURF.id];
      if(_vt){ const _S=VOX.size,_N=VOX.N, gx0=Math.round(SURF.pos.x/_S+_N/2), gz0=Math.round(SURF.pos.z/_S+_N/2);
        for(let dgx=-1;dgx<=1;dgx++)for(let dgz=-1;dgz<=1;dgz++){ const gx=gx0+dgx,gz=gz0+dgz;
          if(gx>=0&&gx<_N&&gz>=0&&gz<_N){ const vh=_vt[gx][gz]*_S; if(vh>ground) ground=vh; } } }
      const _cp2=S.scene.userData.campus;
      if(_cp2 && Math.abs(SURF.pos.x-_cp2.x)<_cp2.hw && Math.abs(SURF.pos.z-_cp2.z)<_cp2.hd){ const ch=_cp2.y+10; if(ch>ground) ground=ch; }
      if(VOX.on){ const vy=voxTopY(SURF.pos.x,SURF.pos.z); if(vy!=null) ground=Math.max(ground,vy); }
      const wantY=Math.max(ground+6.5, ground+SURF.alt)+Math.sin(SURF.T*1.2)*.4;
      // lissage de l'altitude pour franchir les marches de blocs sans à-coup ni clipping
      SURF._camY=(SURF._camY==null)?wantY:SURF._camY+(wantY-SURF._camY)*.18;
      if(SURF._camY<ground+6) SURF._camY=ground+6; // garde-fou anti-pénétration (au-dessus des cubes)
      const camY=SURF._camY;
      surfCam.position.set(SURF.pos.x, camY, SURF.pos.z);
      // la vue reste TOUJOURS pilotée par le doigt (yaw libre), même pendant le trajet
      const ly=SURF.heading+SURF.yaw;
      surfCam.lookAt(SURF.pos.x+Math.cos(ly)*40, camY+SURF.pitch*40-5, SURF.pos.z+Math.sin(ly)*40);
      surfCam.aspect=innerWidth/innerHeight; surfCam.updateProjectionMatrix();
      ren.render(S.scene,surfCam);
      return;
    }
    const fovT=(CINE.on?47:55)+Math.min(6,Math.abs(targetR-radius)*.02);
    if(Math.abs(cam.fov-fovT)>.05){ cam.fov+=(fovT-cam.fov)*.08; cam.updateProjectionMatrix(); }
    if(CINE.on && Math.abs(CINE.roll||0)>0.001){
      _fwd.set(CTR.x-cam.position.x,CTR.y-cam.position.y,CTR.z-cam.position.z).normalize();
      _up.set(0,1,0).applyAxisAngle(_fwd,CINE.roll); cam.up.copy(_up);
    } else cam.up.set(0,1,0);
    cam.lookAt(CTR.x,CTR.y,CTR.z);
    cineCardTrack();
    // lensflare : suit la position écran du soleil, s'éteint hors champ
    _tmpV.set(0,0,0).project(cam);
    if(_tmpV.z<1 && Math.abs(_tmpV.x)<1.6 && Math.abs(_tmpV.y)<1.6){
      const ndx=_tmpV.x, ndy=_tmpV.y;
      const vis=Math.max(0,1-Math.max(Math.abs(ndx),Math.abs(ndy))*0.75);
      const d0=10, hh=Math.tan(cam.fov*Math.PI/360)*d0, hw=hh*cam.aspect;
      FLARE.visible=false;
      for(const sp of _flare){ sp.position.set(ndx*sp.userData.f*hw, ndy*sp.userData.f*hh, -d0); sp.material.opacity=sp.userData.o*vis; }
    } else FLARE.visible=false;
    ren.render(scene,cam);
    if(FG.root && fgRen && FOCUS.host){
      FG.pairs.forEach(([a2,b2])=>{ b2.position.copy(a2.position); b2.quaternion.copy(a2.quaternion); b2.scale.copy(a2.scale); b2.visible=a2.visible; });
      fgCam.position.copy(cam.position); fgCam.quaternion.copy(cam.quaternion);
      fgCam.fov=cam.fov; fgCam.aspect=cam.aspect; fgCam.updateProjectionMatrix();
      fgRen.render(fgScene,fgCam);
    } else if(FG.root && fgRen){ /* soleil */ 
      FG.pairs.forEach(([a2,b2])=>{ b2.position.copy(a2.position); b2.quaternion.copy(a2.quaternion); b2.scale.copy(a2.scale); b2.visible=a2.visible; });
      fgCam.position.copy(cam.position); fgCam.quaternion.copy(cam.quaternion);
      fgCam.fov=cam.fov; fgCam.aspect=cam.aspect; fgCam.updateProjectionMatrix();
      fgRen.render(fgScene,fgCam);
    }
  }
  loop();
  addEventListener("resize",()=>{ cam.aspect=wrap.clientWidth/wrap.clientHeight; cam.updateProjectionMatrix(); ren.setSize(wrap.clientWidth,wrap.clientHeight); });
  addEventListener("orientationchange",()=>{ setTimeout(()=>{ try{ cam.aspect=wrap.clientWidth/wrap.clientHeight; cam.updateProjectionMatrix(); ren.setSize(wrap.clientWidth,wrap.clientHeight); if(fgRen) fgRen.setSize(innerWidth,innerHeight); }catch(_){} }, 300); });
  GX=true;
}

