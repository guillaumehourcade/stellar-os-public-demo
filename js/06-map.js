/* ============ MAP — fond vectoriel embarqué (préchargé) + satellite ============ */
let MAP=null, TILES={}, BASE=null, LBL=null, MODE=null, GEO=null;
function loadGeo(){
  if(GEO) return GEO;
  const bin=atob(GEOPACK_B64), u8=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
  GEO=JSON.parse(pako.ungzip(u8,{to:"string"}));
  return GEO;
}
function probeTile(url){
  return new Promise(res=>{
    const im=new Image();
    const t=setTimeout(()=>{ im.src=""; res(false); },2500);
    im.onload=()=>{ clearTimeout(t); res(true); };
    im.onerror=()=>{ clearTimeout(t); res(false); };
    im.src=url;
  });
}
const MAJORS=[["LYON",45.7578,4.832,1],["Saint-Étienne",45.44,4.39,1],["Valence",44.933,4.892,1],
 ["Villeurbanne",45.766,4.879,2],["Vénissieux",45.697,4.886,2],["Meyzieu",45.766,5.004,2],["Genay",45.898,4.841,2],
 ["Vienne",45.525,4.874,2],["Villefranche-s/S",45.99,4.72,2],["Bourgoin-Jallieu",45.586,5.273,2],["Romans-sur-Isère",45.046,5.052,2],["Mâcon",46.30,4.83,2],["Annonay",45.24,4.67,2]];
const PRIORITY=new Set(["Caluire-et-Cuire","Bron","Vaulx-en-Velin","Saint-Priest","Oullins","Écully","Tassin-la-Demi-Lune","Rillieux-la-Pape","Décines-Charpieu","Saint-Fons","Givors","Neuville-sur-Saône","Anse","Chassieu","Genas","Saint-Genis-Laval","Francheville","Craponne","Brignais","Irigny","Pierre-Bénite","Mions","Corbas","Feyzin","Tarare","Mornant","Montbrison","Tournon-sur-Rhône","Tain-l'Hermitage","Crémieu","La Tour-du-Pin","Saint-Chamond","Rive-de-Gier","Belleville-en-Beaujolais","Trévoux","Miribel","Montluel","Heyrieux","Chaponost","Dardilly","Limonest"]);
const PARKS=[
 ["Parc de la Tête d'Or",[[45.7846,4.8485],[45.7853,4.8536],[45.7826,4.8579],[45.7780,4.8585],[45.7752,4.8536],[45.7762,4.8478],[45.7800,4.8452]]],
 ["Grand Parc Miribel-Jonage",[[45.8050,4.9150],[45.8120,4.9600],[45.8060,5.0050],[45.7900,5.0200],[45.7800,4.9900],[45.7830,4.9450],[45.7950,4.9200]]],
 ["Parc de Gerland",[[45.7280,4.8245],[45.7292,4.8290],[45.7250,4.8320],[45.7218,4.8290],[45.7235,4.8240]]],
 ["Parc de Parilly",[[45.7105,4.8910],[45.7125,4.8985],[45.7080,4.9020],[45.7035,4.8960],[45.7060,4.8890]]],
 ["Parc de Lacroix-Laval",[[45.7860,4.7280],[45.7890,4.7370],[45.7830,4.7420],[45.7780,4.7350],[45.7810,4.7270]]],
 ["Parc de la Feyssine",[[45.7960,4.8780],[45.7990,4.8850],[45.7940,4.8890],[45.7910,4.8820]]]
];
function buildBase(){
  if(BASE) return BASE;
  const G=loadGeo();
  BASE=L.layerGroup();
  L.geoJSON(G.communes,{interactive:false,style:{color:"rgba(111,227,255,.13)",weight:.6,fillColor:"#0C1830",fillOpacity:.92}}).addTo(BASE);
  L.geoJSON(G.deps,{interactive:false,style:{color:"rgba(160,185,225,.42)",weight:1.4,fill:false}}).addTo(BASE);
  // parcs urbains
  PARKS.forEach(([n,coords])=>{
    L.polygon(coords,{interactive:false,color:"#3FA36B",weight:1,fillColor:"#1E5C3A",fillOpacity:.6}).addTo(BASE);
  });
  // lacs
  L.geoJSON(G.lakes,{interactive:false,style:{color:"#5FA8E0",weight:1,fillColor:"#1A4E86",fillOpacity:.78}}).addTo(BASE);
  // hydrographie
  const rw=n=>n==="Rhône"?3:(n==="Saône"||n==="Loire")?2.4:1.4;
  L.geoJSON(G.rivers,{interactive:false,style:f=>({color:"#2E6FB0",weight:rw(f.properties.name)+3.5,opacity:.18})}).addTo(BASE);
  L.geoJSON(G.rivers,{interactive:false,style:f=>({color:"#5FA8E0",weight:rw(f.properties.name),opacity:.9})}).addTo(BASE);
  // routes — or halo gloss
  const maj=G.roads.features.filter(f=>f.properties.type==="Major Highway");
  const sec=G.roads.features.filter(f=>f.properties.type==="Secondary Highway");
  const oth=G.roads.features.filter(f=>f.properties.type!=="Major Highway"&&f.properties.type!=="Secondary Highway");
  const fc=f=>({type:"FeatureCollection",features:f});
  L.geoJSON(fc(maj),{interactive:false,style:{color:"#FFC861",weight:7,opacity:.10}}).addTo(BASE);
  L.geoJSON(fc(maj),{interactive:false,style:{color:"#FFC861",weight:3,opacity:.45}}).addTo(BASE);
  L.geoJSON(fc(maj),{interactive:false,style:{color:"#FFE3A6",weight:1.3,opacity:.95}}).addTo(BASE);
  L.geoJSON(fc(sec),{interactive:false,style:{color:"#D9A24A",weight:1.3,opacity:.5}}).addTo(BASE);
  L.geoJSON(fc(oth),{interactive:false,style:{color:"#9A874E",weight:.9,opacity:.28}}).addTo(BASE);
  const LY=[45.7578,4.832];
  [[25000,"25 km"],[50000,"50 km"],[100000,"100 km"]].forEach(([r,lab])=>{
    L.circle(LY,{radius:r,color:"#6FE3FF",weight:.8,opacity:.11,fill:false,dashArray:"4 8",interactive:false}).addTo(BASE);
  });
  return BASE;
}
/* étiquettes : projection écran + anti-chevauchement par priorité */
function refreshLabels(){
  if(!MAP||MODE!=="plan") return;
  if(LBL){ MAP.removeLayer(LBL); }
  LBL=L.layerGroup();
  const z=MAP.getZoom(), b=MAP.getBounds(), placed=[];
  function free(la,lo,w,h,dx,dy){
    const p=MAP.latLngToContainerPoint([la,lo]);
    const r={x:p.x+dx,y:p.y+dy,w,h};
    for(const o of placed) if(!(r.x+r.w<o.x||o.x+o.w<r.x||r.y+r.h<o.y||o.y+o.h<r.y)) return false;
    placed.push(r); return true;
  }
  // réserver l'espace des pastilles d'actifs (prioritaires absolues)
  DATA.entities.filter(e=>e.lat&&b.contains([e.lat,e.lng])).forEach(e=>{
    const p=MAP.latLngToContainerPoint([e.lat,e.lng]);
    placed.push({x:p.x-10,y:p.y-14,w:150,h:34});
  });
  const queue=[];
  MAJORS.forEach(([n,la,lo,tier])=>queue.push({n,la,lo,pr:tier,fs:tier===1?15:12.5,col:tier===1?"#E4EDFB":"#AFC2E2",w:700,dot:true}));
  if(z>=9.6) loadGeo().labels.forEach(([n,la,lo])=>{ if(PRIORITY.has(n)) queue.push({n,la,lo,pr:3,fs:11,col:"#8FA3C6",w:600,dot:false}); });
  if(z>=11) loadGeo().labels.forEach(([n,la,lo])=>{ if(!PRIORITY.has(n)) queue.push({n,la,lo,pr:4,fs:z>=12?11.5:10,col:"#6C80A4",w:600,dot:false}); });
  if(z>=10.4) PARKS.forEach(([n,coords])=>{ const la=coords.reduce((a,p)=>a+p[0],0)/coords.length, lo=coords.reduce((a,p)=>a+p[1],0)/coords.length; queue.push({n:"🌳 "+n,la,lo,pr:2.5,fs:10.5,col:"#5FCB8E",w:600,dot:false}); });
  G_AIR: { const G=loadGeo(); G.airports.forEach(([n,la,lo,big])=>queue.push({n:"✈ "+n,la,lo,pr:big?1.5:2.6,fs:big?11.5:10,col:"#8FC6F2",w:650,dot:false})); }
  queue.sort((a,b2)=>a.pr-b2.pr);
  let count=0;
  for(const q of queue){
    if(count>=90) break;
    if(!b.contains([q.la,q.lo])) continue;
    const w=q.n.length*q.fs*.58+14, h=q.fs+8;
    if(!free(q.la,q.lo,w,h,q.dot?8:-w/2,-h/2)) continue;
    if(q.dot) L.circleMarker([q.la,q.lo],{radius:q.pr===1?4:2.6,color:"#AFC2E2",fillColor:"#AFC2E2",fillOpacity:.9,weight:0,interactive:false}).addTo(LBL);
    L.marker([q.la,q.lo],{interactive:false,icon:L.divIcon({className:"hp-marker",iconAnchor:q.dot?[-8,h/2]:[w/2,h/2],
      html:`<span class="city" style="font-size:${q.fs}px;color:${q.col};font-weight:${q.pr<=2?700:600};letter-spacing:${q.pr<=2?'.1em':'.05em'}">${q.n}</span>`})}).addTo(LBL);
    count++;
  }
  LBL.addTo(MAP);
}
function setMode(mode,avail){
  if(!MAP) return;
  if(TILES.sat) MAP.removeLayer(TILES.sat);
  if(BASE) MAP.removeLayer(BASE);
  if(LBL) MAP.removeLayer(LBL);
  const mapEl=document.getElementById("map");
  if(mode==="sat"&&TILES.sat){ TILES.sat.addTo(MAP); mapEl.style.background="#0a0f1d"; }
  else { mode="plan"; buildBase().addTo(MAP); mapEl.style.background="radial-gradient(120% 90% at 50% 20%, #101D3C 0%, #081025 55%, #04070F 100%)"; refreshLabels(); }
  MODE=mode;
  [["bt-plan","plan"],["bt-sat","sat"]].forEach(([id,m])=>{
    const b=document.getElementById(id);
    b.classList.toggle("gold",MODE===m);
    if(avail && m==="sat" && !avail.sat){ b.style.opacity=".4"; b.title="Tuiles satellite indisponibles dans cet environnement"; }
  });
}
function addAssetMarkers(){
  DATA.entities.filter(e=>e.lat).forEach(e=>{
    const yld=e.marketValue>0?e.rent/e.marketValue:null;
    const short=e.name.split(" ")[e.name.startsWith("EP")||e.name.startsWith("SCI")?1:0]||e.name;
    const icon=L.divIcon({className:"hp-marker",iconAnchor:[7,7],html:
      `<div class="pin2" style="--c:${e.color}"><div class="pulse"></div><div class="core2"></div>
       <div class="tag2"><b>${short}</b><span>${e.marketValue?fmtK(e.marketValue):fmtK(e.cash)}${yld?" · "+pct(yld):""}${e.risk==="risk"?" · ⚠":""}</span></div></div>`});
    const m=L.marker([e.lat,e.lng],{icon,zIndexOffset:1000}).addTo(MAP);
    m.bindPopup(`<div style="font-family:Rajdhani;font-weight:700;font-size:16px;letter-spacing:.06em;color:${e.color}">${e.name}</div>
      <div style="color:#93A7C6;margin-bottom:6px">${e.addr}</div>
      <table style="width:100%;font-size:11px;line-height:1.8">
      <tr><td style="color:#5A6E92">Valeur</td><td style="text-align:right">${e.marketValue?fmtK(e.marketValue):"n/a"}</td></tr>
      <tr><td style="color:#5A6E92">Dette</td><td style="text-align:right;color:#FF6B5A">${Engine.debt(e)?fmtK(Engine.debt(e)):"—"}</td></tr>
      <tr><td style="color:#5A6E92">Loyer</td><td style="text-align:right;color:#5CE6A1">${e.rent?fmtK(e.rent)+"/an":"—"}</td></tr>
      <tr><td style="color:#5A6E92">Rendement</td><td style="text-align:right">${yld?pct(yld):"—"}</td></tr>
      <tr><td style="color:#5A6E92">Locataire</td><td style="text-align:right">${(e.tenant||"—").split("(")[0].slice(0,28)}</td></tr>
      <tr><td style="color:#5A6E92">QP NAV+CC</td><td style="text-align:right;color:#FFC861;font-weight:600">${fmtK(Engine.navShare(e))}</td></tr></table>
      <a href="#" onclick="openTwin('${e.id}');return false" style="color:#6FE3FF;display:block;margin-top:7px">Ouvrir le jumeau numérique →</a>`,{className:"hp-pop",minWidth:240});
  });
}
async function renderMap(){
  if(MAP){ setTimeout(()=>MAP.invalidateSize(),120); return; }
  MAP=L.map("map",{zoomControl:true,attributionControl:false,minZoom:8,maxZoom:13,
    maxBounds:[[44.35,3.9],[46.55,6.15]]}).setView([45.62,4.90],9);
  // fond vectoriel embarqué : affiché immédiatement, zéro réseau
  setMode("plan");
  addAssetMarkers();
  MAP.on("moveend zoomend",refreshLabels);
  document.getElementById("bt-plan").onclick=()=>setMode("plan",AVAIL);
  document.getElementById("bt-sat").onclick=()=>setMode("sat",AVAIL);
  let AVAIL={plan:true,sat:false};
  document.getElementById("map-note").textContent="Fond embarqué : 1 630 communes, autoroutes, Rhône/Saône/Loire, lacs, aéroports — préchargé hors-ligne. Sonde satellite…";
  const okSat=await probeTile("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/365/525");
  AVAIL={plan:true,sat:okSat};
  if(okSat){
    TILES.sat=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19});
    MAP.setMaxZoom(19);
    document.getElementById("map-note").textContent="Fond embarqué complet · Satellite disponible.";
  } else {
    setMode("plan",AVAIL);
    document.getElementById("map-note").textContent="Fond embarqué complet (communes, autoroutes, hydrographie, aéroports) — hors-ligne. Satellite indisponible dans cet environnement de démonstration.";
  }
  setTimeout(()=>MAP.invalidateSize(),150);
}

