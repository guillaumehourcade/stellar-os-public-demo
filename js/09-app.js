/* ============ FOND ÉTOILÉ 2D ============ */
function bgStars(){
  const cv=$("#stars-bg"), cx=cv.getContext("2d");
  function draw(){ cv.width=innerWidth; cv.height=innerHeight; cx.clearRect(0,0,cv.width,cv.height);
    for(let i=0;i<230;i++){ cx.fillStyle=`rgba(178,198,236,${Math.random()*.4+.07})`;
      const r=Math.random()<.06?1.3:.75; cx.beginPath(); cx.arc(Math.random()*cv.width, Math.random()*cv.height, r, 0, 6.29); cx.fill(); } }
  draw(); addEventListener("resize",draw);
}

/* ============ BRIEF DU JOUR — version démo : stub local, aucun appel réseau ============ */
const Daily={
  async fetch(force){
    /* Version publique de démonstration : brief IA désactivé — aucun appel réseau. */
    const el=$("#brief-status"); if(el) el.textContent="Brief IA désactivé dans cette version de démonstration.";
  },
  render(){
    const d=DATA.daily||{};
    const chip=$("#wx-chip");
    if(chip && d.weather){ chip.innerHTML=`${d.weather.icon||"🌡"} <b>${Math.round(d.weather.t)}°C</b> ${d.weather.cond||""}`; chip.classList.add("show"); }
    const box=$("#brief-list");
    if(box && d.news){ box.innerHTML=d.news.map((n,i)=>`<div class="brief-item"><span class="bn">${"0"+(i+1)}</span>${n}</div>`).join("");
      const st=$("#brief-status"); if(st) st.textContent="Édition du "+new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long"}); }
  }
};
try{ window.Daily=Daily; }catch(_){}
/* ============ GRAPHIQUES CINÉMA ============ */
if(window.Chart){
  Chart.defaults.color="#8FA3C6";
  Chart.defaults.font.family="'IBM Plex Mono',monospace";
  Chart.defaults.font.size=10;
  Chart.defaults.interaction={mode:"index",intersect:false};
  Chart.defaults.animation.duration=900;
  Chart.defaults.animation.easing="easeOutQuart";
  Object.assign(Chart.defaults.plugins.tooltip,{
    enabled:true, backgroundColor:"rgba(8,14,30,.94)", borderColor:"rgba(111,227,255,.35)", borderWidth:1,
    titleColor:"#9FE9FF", titleFont:{family:"Rajdhani",size:13,weight:"700"},
    bodyColor:"#E4EDFB", bodyFont:{family:"'IBM Plex Mono',monospace",size:11},
    padding:12, cornerRadius:10, displayColors:true, boxWidth:8, boxHeight:8, boxPadding:4, caretSize:6,
    callbacks:{label:c=>` ${c.dataset.label||""} : ${typeof c.parsed.y==="number"?(Math.abs(c.parsed.y)>=1000?fmtK(c.parsed.y):c.parsed.y.toLocaleString("fr-FR")):c.parsed.y}`}
  });
  // crosshair : ligne verticale lumineuse qui suit le doigt
  Chart.register({id:"hpCross",
    afterDraw(ch){
      const a=ch.tooltip&&ch.tooltip.getActiveElements&&ch.tooltip.getActiveElements();
      if(!a||!a.length) return;
      const x=a[0].element.x, area=ch.chartArea, c=ch.ctx;
      c.save();
      const g=c.createLinearGradient(0,area.top,0,area.bottom);
      g.addColorStop(0,"rgba(111,227,255,0)");g.addColorStop(.5,"rgba(111,227,255,.55)");g.addColorStop(1,"rgba(111,227,255,0)");
      c.strokeStyle=g; c.lineWidth=1.2; c.setLineDash([3,3]);
      c.beginPath(); c.moveTo(x,area.top); c.lineTo(x,area.bottom); c.stroke();
      c.setLineDash([]);
      // point lumineux sur chaque série
      a.forEach(el=>{ c.beginPath(); c.arc(el.element.x,el.element.y,4.5,0,7);
        c.fillStyle="rgba(255,255,255,.95)"; c.shadowColor="#6FE3FF"; c.shadowBlur=12; c.fill(); });
      c.restore();
    }});
  // halo lumineux sur les lignes
  Chart.register({id:"hpGlow",
    beforeDatasetDraw(ch,args){ const ds=ch.data.datasets[args.index];
      if(ch.config.type==="line"&&ds.borderColor&&typeof ds.borderColor==="string"){
        ch.ctx.save(); ch.ctx.shadowColor=ds.borderColor; ch.ctx.shadowBlur=10; } },
    afterDatasetDraw(ch,args){ const ds=ch.data.datasets[args.index];
      if(ch.config.type==="line"&&ds.borderColor&&typeof ds.borderColor==="string") ch.ctx.restore(); }});
  // grilles discrètes par défaut
  Chart.defaults.scale.grid={color:"rgba(143,163,198,.08)",drawTicks:false};
  Chart.defaults.scale.border={display:false};
}
function gradFill(color,aTop,aBot){
  return c2=>{ const ar=c2.chart.chartArea; if(!ar) return color+"22";
    const g=c2.chart.ctx.createLinearGradient(0,ar.top,0,ar.bottom);
    g.addColorStop(0,color+(aTop||"55")); g.addColorStop(1,color+(aBot||"00")); return g; };
}
/* ============ AMBIANCE SPATIALE (Web Audio) ============ */
const Music={ctx:null,on:false,master:null,stops:[],_t:[],
  // — Composition : "Orbite Haute" — progression ambient en Ré, pads évolutifs, basse, motif pentatonique
  CHORDS:[
    {name:"Dmaj9", notes:[50,57,61,64,69], bass:38},
    {name:"Bm11",  notes:[47,54,59,62,66], bass:35},
    {name:"Gmaj9", notes:[43,55,59,62,66], bass:31},
    {name:"A(add9)",notes:[45,52,57,61,64], bass:33}
  ],
  MELODY:[62,64,66,69,71,74,76,78], // pentatonique de Ré, deux octaves
  f(m){return 440*Math.pow(2,(m-69+(this.tr||0))/12);},
  start(){
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    const ctx=this.ctx=this.ctx||new AC(); if(ctx.state==="suspended") ctx.resume();
    const t0=ctx.currentTime;
    this.master=ctx.createGain(); this.master.gain.setValueAtTime(0,t0);
    this.master.gain.linearRampToValueAtTime(.17,t0+4);
    // espace : double délai croisé + filtre global
    const d1=ctx.createDelay(3),d2=ctx.createDelay(3),fb1=ctx.createGain(),fb2=ctx.createGain(),wet=ctx.createGain();
    d1.delayTime.value=.52; d2.delayTime.value=.81; fb1.gain.value=.38; fb2.gain.value=.30; wet.gain.value=.55;
    d1.connect(fb1).connect(d2); d2.connect(fb2).connect(d1); d1.connect(wet); d2.connect(wet);
    const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=this.brightness||1500; lp.Q.value=.3;
    this.master.connect(lp).connect(ctx.destination); wet.connect(lp);
    this.bus=ctx.createGain(); this.bus.connect(this.master); this.bus.connect(d1);
    // souffle stellaire
    const nb=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),nd=nb.getChannelData(0);
    for(let i=0;i<nd.length;i++) nd[i]=(Math.random()*2-1)*.4;
    const ns=ctx.createBufferSource(); ns.buffer=nb; ns.loop=true;
    const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=2400; bp.Q.value=.6;
    const ng=ctx.createGain(); ng.gain.value=.008;
    ns.connect(bp).connect(ng).connect(this.master); ns.start(); this.stops.push(()=>ns.stop());
    const self=this; this.on=true;
    let ci=0;
    // — PADS : accords tuilés (crossfade), 2 oscillateurs désaccordés par voix, filtre respirant
    function chord(){
      if(!self.on) return;
      const ch=self.CHORDS[ci%self.CHORDS.length]; ci++;
      const now=ctx.currentTime, DUR=16, FADE=6;
      ch.notes.forEach((m,vi)=>{
        const g=ctx.createGain(); g.gain.setValueAtTime(0,now);
        g.gain.linearRampToValueAtTime(.030+.012*Math.sin(vi*2),now+FADE);
        g.gain.setValueAtTime(.030+.012*Math.sin(vi*2),now+DUR-FADE);
        g.gain.linearRampToValueAtTime(0,now+DUR);
        const fl=ctx.createBiquadFilter(); fl.type="lowpass"; fl.Q.value=.6;
        fl.frequency.setValueAtTime(420,now);
        fl.frequency.linearRampToValueAtTime(980,now+DUR/2);
        fl.frequency.linearRampToValueAtTime(420,now+DUR);
        [[-5,"sawtooth"],[5,"sawtooth"],[0,"sine"]].forEach(([cents,type])=>{
          const o=ctx.createOscillator(); o.type=type;
          o.frequency.value=self.f(m); o.detune.value=cents;
          const og=ctx.createGain(); og.gain.value=type==="sine"?.5:.32;
          o.connect(og).connect(fl); o.start(now); o.stop(now+DUR+.2);
        });
        fl.connect(g).connect(self.bus);
      });
      // basse profonde : fondamentale, une octave de respiration
      const b=ctx.createOscillator(), bg=ctx.createGain();
      b.type="sine"; b.frequency.value=self.f(ch.bass);
      bg.gain.setValueAtTime(0,now); bg.gain.linearRampToValueAtTime(.075,now+FADE);
      bg.gain.setValueAtTime(.075,now+DUR-FADE); bg.gain.linearRampToValueAtTime(0,now+DUR);
      b.connect(bg).connect(self.master); b.start(now); b.stop(now+DUR+.2);
      self._t.push(setTimeout(chord,(DUR-FADE)*1000)); // tuilage
    }
    chord();
    // — MOTIF : notes pentatoniques rares, cristallines, dans l'espace du délai
    let mi=Math.floor(Math.random()*4);
    function motif(){
      if(!self.on) return;
      // marche douce sur la gamme (pas de sauts brusques)
      mi=Math.max(0,Math.min(self.MELODY.length-1, mi+[ -1,1,1,2,-2 ][Math.floor(Math.random()*5)]));
      const m=self.MELODY[mi]+12, now=ctx.currentTime;
      const o=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain();
      o.type="sine"; o2.type="triangle";
      o.frequency.value=self.f(m); o2.frequency.value=self.f(m); o2.detune.value=3;
      const og2=ctx.createGain(); og2.gain.value=.25;
      g.gain.setValueAtTime(0,now);
      g.gain.linearRampToValueAtTime(.055,now+.9);
      g.gain.exponentialRampToValueAtTime(.0001,now+7);
      o.connect(g); o2.connect(og2).connect(g); g.connect(self.bus);
      o.start(now); o2.start(now); o.stop(now+7.5); o2.stop(now+7.5);
      self._t.push(setTimeout(motif, 4200+Math.random()*5600));
    }
    self._t.push(setTimeout(motif,6000));
    // — CLOCHE GRAVE : ponctuation toutes les ~45 s (harmoniques inharmoniques douces)
    function bell(){
      if(!self.on) return;
      const now=ctx.currentTime, base=self.f(38);
      [1,2.76,5.4].forEach((h,i)=>{
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type="sine"; o.frequency.value=base*h;
        g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(.05/(i+1),now+.05);
        g.gain.exponentialRampToValueAtTime(.0001,now+10);
        o.connect(g).connect(self.bus); o.start(now); o.stop(now+10.5);
      });
      self._t.push(setTimeout(bell, 38000+Math.random()*20000));
    }
    self._t.push(setTimeout(bell,16000));
  },
  // — Profils harmoniques par planète : chaque monde sa couleur sonore —
  MODES:{
    bright:{ // mondes sereins (ok) — majeur/lydien lumineux
      chords:[{notes:[50,57,61,64,69],bass:38},{notes:[52,59,64,66,71],bass:40},
              {notes:[45,52,57,61,64],bass:33},{notes:[47,54,59,62,66],bass:35}],
      melody:[62,64,66,69,71,74,76,78], bright:1700 },
    modal:{ // mondes arides (warn) — dorien modal, suspendu
      chords:[{notes:[50,57,60,65,67],bass:38},{notes:[48,55,60,63,67],bass:36},
              {notes:[53,60,63,67,70],bass:41},{notes:[46,53,58,60,65],bass:34}],
      melody:[60,62,63,65,67,69,70,72], bright:1200 },
    dark:{ // mondes volcaniques (risk) — mineur/phrygien tendu
      chords:[{notes:[45,52,56,59,64],bass:33},{notes:[43,50,55,58,62],bass:31},
              {notes:[41,48,53,56,60],bass:29},{notes:[46,53,57,60,65],bass:34}],
      melody:[57,59,60,62,64,65,67,69], bright:880 }
  },
  setPlanet(e){
    if(!this._defC){ this._defC=this.CHORDS; this._defM=this.MELODY; }
    if(!e){ this.tr=0; this.CHORDS=this._defC; this.MELODY=this._defM; this.brightness=1500;
      if(this.on) this._restart(); return; }
    const sd=seedOf(e.id);
    // intervalle de transposition propre à chaque planète (couleur unique)
    this.tr=[-5,-3,-2,0,2,3,5][Math.floor(sd/100*7)%7];
    const md=e.risk==="risk"?this.MODES.dark:e.risk==="warn"?this.MODES.modal:this.MODES.bright;
    this.CHORDS=md.chords.map(c=>({notes:c.notes.slice(),bass:c.bass}));
    this.MELODY=md.melody.slice(); this.brightness=md.bright;
    if(this.on) this._restart();
  },
  _restart(){ const self=this; this.stop(); this.on=true;
    if(this._rt) clearTimeout(this._rt);
    this._rt=setTimeout(()=>{ if(self.on){ self.on=false; self.start(); } }, 420); },
  stop(){
    if(!this.ctx) return;
    this.on=false; this._t.forEach(clearTimeout); this._t=[];
    if(this.master) this.master.gain.linearRampToValueAtTime(0,this.ctx.currentTime+1.5);
    const st=this.stops; this.stops=[];
    setTimeout(()=>st.forEach(f=>{try{f()}catch(e){}}),1800);
  },
  toggle(){
    if(this.on){ this.stop(); $("#bt-music").classList.remove("on"); toast("Ambiance coupée"); }
    else { this.start(); $("#bt-music").classList.add("on");
      if(typeof SURF!=="undefined" && SURF.on && SURF.id){ this.setPlanet(Engine.entity(SURF.id)); toast("♬ Thème de "+Engine.entity(SURF.id).name); }
      else toast("♬ Orbite Haute — composition générative"); }
  }
};
$("#bt-music").addEventListener("click",()=>Music.toggle());



/* ============ NAVIGATION & BOOT ============ */
function show(m){
  document.querySelectorAll(".mod").forEach(x=>x.classList.remove("on"));
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on",x.dataset.m===m));
  $("#m-"+m).classList.add("on");
  if(m==="galaxy") initGalaxy();
  if(m==="gov") renderGov();
  if(m==="assets") renderAssets();
  if(m==="command") renderCommand();
  if(m==="docai") renderDocAI();
  if(m==="timeline") renderTimeline();
  if(m==="map") renderMap();
  if(m==="neural") renderNeural();
  if(m==="valuation") renderValuation();
}
/* ============ VALEURS DES BÂTIMENTS ============ */
/* Les valeurs/surfaces des bâtiments vivent dans les données (buildings). */
const BLD=DEFAULT_DATA.buildings;
function eur(n){ return (n==null||isNaN(n)||n===0)?"—":Math.round(n).toLocaleString("fr-FR")+" €"; }
let _valT=null;
function valPersistSoon(){ clearTimeout(_valT); _valT=setTimeout(function(){ try{ if(window.Store&&Store.save) Store.save(DATA); }catch(_){} },350); }
function valReadAll(){ Object.keys(BLD).forEach(function(id){ try{ valReadInputs(id); }catch(_){} }); }
function valReadInputs(id){ const b=BLD[id]; DATA.valuation=DATA.valuation||{};
  const v=DATA.valuation[id]=DATA.valuation[id]||{px:{},s:{}}; v.px=v.px||{}; v.s=v.s||{};
  b.parts.forEach(p=>{ const se=document.getElementById("vs-"+id+"-"+p.k), pe=document.getElementById("vp-"+id+"-"+p.k);
    if(se) v.s[p.k]=+se.value||0; if(pe) v.px[p.k]=+pe.value||0; });
  const ge=document.getElementById("vg-"+id); if(ge) v.global=+ge.value||0;
  const ae=document.getElementById("va-"+id); if(ae) v.annee=ae.value;
  const re=document.getElementById("vr-"+id); if(re) v.reno=re.value; return v; }
function valCompute(id){ const b=BLD[id]; DATA.valuation=DATA.valuation||{}; const v=DATA.valuation[id]||{px:{},s:{}};
  let comp=0; const parts=b.parts.map(p=>{ const s=(v.s&&v.s[p.k]!=null)?v.s[p.k]:p.s; const px=(v.px&&v.px[p.k])||0; const sub=s*px; comp+=sub; return {k:p.k,lbl:p.lbl,s,px,sub}; });
  const global=v.global||0, retained=global>0?global:comp; const e=Engine.entity(id); const qp=retained*(e?e.stake:0);
  return {parts,comp,global,retained,qp}; }
function valCard(id){ const b=BLD[id], e=Engine.entity(id); DATA.valuation=DATA.valuation||{}; const v=DATA.valuation[id]||{px:{},s:{}}, r=valCompute(id);
  const rows=b.parts.map(p=>{ const s=(v.s&&v.s[p.k]!=null)?v.s[p.k]:p.s; const px=(v.px&&v.px[p.k])||0;
    return `<div class="vrow"><div class="vlbl">${p.lbl}</div>`
      +`<div class="vin"><input id="vs-${id}-${p.k}" class="vinp" type="number" inputmode="numeric" value="${s||''}" oninput="valRecalc('${id}')" onchange="valSave('${id}')"><span class="vu">m²</span></div>`
      +`<div class="vx">×</div>`
      +`<div class="vin"><input id="vp-${id}-${p.k}" class="vinp" type="number" inputmode="numeric" value="${px||''}" placeholder="prix" oninput="valRecalc('${id}')" onchange="valSave('${id}')"><span class="vu">€/m²</span></div>`
      +`<div class="vsub" id="vsub-${id}-${p.k}">${eur(s*px)}</div></div>`; }).join("");
  return `<div class="card valcard" style="border-color:${b.c}33">
    <div class="vhead"><div><div class="vname" style="color:${b.c}">${e?e.name:id}</div><div class="vaddr">${b.addr}</div></div>
      <button class="vlink" onclick="valLink('${id}')" style="--ac:${b.c}">Voir la fiche →</button></div>
    <div class="vmeta">
      <label class="vml">Année de construction<input id="va-${id}" class="vmi" value="${v.annee||''}" placeholder="—" onchange="valSave('${id}')"></label>
      <label class="vml">Travaux / rénovation<input id="vr-${id}" class="vmi" value="${(v.reno!=null?v.reno:(b.reno||'')).replace(/"/g,'&quot;')}" onchange="valSave('${id}')"></label>
    </div>
    ${b.parts.length?`<div class="vparts">${rows}<div class="vrow vtotrow"><div class="vlbl" style="opacity:.65">Somme des composantes</div><div class="vsub strong" id="vcomp-${id}">${eur(r.comp)}</div></div></div>`:`<div class="vnote">Bien résidentiel — saisis directement le prix global ci-dessous.</div>`}
    <div class="vglob"><label class="vml">Prix global (prioritaire s'il est rempli)<input id="vg-${id}" class="vmi big" type="number" inputmode="numeric" value="${v.global||''}" placeholder="optionnel — sinon somme des composantes" oninput="valRecalc('${id}')" onchange="valSave('${id}')"></label></div>
    <div class="vfoot">
      <div class="vret"><span class="vrl">Valeur retenue · 100%</span><span class="vrv" id="vret-${id}">${eur(r.retained)}</span></div>
      <div class="vret"><span class="vrl">Quote-part (${pct(e?e.stake:0)})</span><span class="vrv qp" id="vqp-${id}">${fmtK(r.qp)}</span></div>
      <button class="btn gold" onclick="valApply('${id}')">Appliquer à la NAV</button>
    </div></div>`; }
function countUp(el,to,fmtFn,dur){ if(!el||typeof to!=="number"||isNaN(to)) return;
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches){ el.textContent=fmtFn(to); return; }
  const t0=performance.now(); dur=dur||850;
  (function step(now){ const k=Math.min(1,(now-t0)/dur); const e=1-Math.pow(1-k,3); el.textContent=fmtFn(to*e); if(k<1) requestAnimationFrame(step); else el.textContent=fmtFn(to); })(performance.now()); }
function renderValuation(){ DATA.valuation=DATA.valuation||{}; const ids=Object.keys(BLD);
  let tr=0,tq=0; ids.forEach(id=>{ const r=valCompute(id); tr+=r.retained; tq+=r.qp; });
  let html=`<div class="section-title">Valeurs des bâtiments</div>`;
  html+=`<div class="card val-hero">
    <div class="vh"><span class="vhl">Patrimoine immobilier estimé · 100%</span><span class="vhv" id="vtot-ret">${fmtM(tr)}</span></div>
    <div class="vh"><span class="vhl">Quote-part ${DATA.meta.brand}</span><span class="vhv qp" id="vtot-qp">${fmtM(tq)}</span></div>
    <div class="vh" style="flex:1;min-width:170px"><span class="vaddr">Saisis le prix au m² par composante (somme automatique) ou un prix global. « Appliquer à la NAV » met à jour la valeur vénale et recalcule tout le patrimoine.</span></div></div>`;
  ids.forEach(id=>{ html+=valCard(id); });
  $("#valuation-pad").innerHTML=html; countUp(document.getElementById("vtot-ret"),tr,fmtM); countUp(document.getElementById("vtot-qp"),tq,fmtM); }
function valRecalc(id){ valReadInputs(id); const r=valCompute(id);
  r.parts.forEach(p=>{ const el=document.getElementById("vsub-"+id+"-"+p.k); if(el) el.textContent=eur(p.sub); });
  const c=document.getElementById("vcomp-"+id); if(c) c.textContent=eur(r.comp);
  const rr=document.getElementById("vret-"+id); if(rr) rr.textContent=eur(r.retained);
  const q=document.getElementById("vqp-"+id); if(q) q.textContent=fmtK(r.qp); valGrand(); valPersistSoon(); }
function valGrand(){ let tr=0,tq=0; Object.keys(BLD).forEach(id=>{ const r=valCompute(id); tr+=r.retained; tq+=r.qp; });
  const a=document.getElementById("vtot-ret"); if(a) a.textContent=fmtM(tr);
  const b=document.getElementById("vtot-qp"); if(b) b.textContent=fmtM(tq); }
function valSave(id){ valReadInputs(id); valPersistSoon(); }
async function valApply(id){ valReadAll(); const r=valCompute(id); const e=Engine.entity(id);
  if(e && r.retained>0){ e.marketValue=r.retained; }
  try{ await Store.save(DATA); }catch(_){}
  renderAll(); toast("Valeur de "+(e?e.name:id)+" : "+eur(r.retained)+" — NAV recalculée"); }
function valLink(id){ try{ if(window.galaxyFocus) galaxyFocus(id); if(window.openTwin) openTwin(id); }catch(_){} }
try{ window.renderValuation=renderValuation; window.valRecalc=valRecalc; window.valSave=valSave; window.valApply=valApply; window.valLink=valLink; }catch(_){}

function renderAll(){
  renderCockpit();
  if(window.updateGalaxyNav) updateGalaxyNav();
  if($("#m-gov").classList.contains("on")) renderGov();
  if($("#m-assets").classList.contains("on")) renderAssets();
  if($("#m-timeline").classList.contains("on")) renderTimeline();
  if($("#m-valuation").classList.contains("on") && !(document.activeElement&&document.activeElement.closest&&document.activeElement.closest("#m-valuation input,#m-valuation textarea"))) renderValuation();
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>show(b.dataset.m)));
$("#twin-close").addEventListener("click",()=>{ $("#twin").classList.remove("open"); if(window.galaxyExit) galaxyExit(); });
document.querySelector('[data-m="assets"]').insertAdjacentHTML("beforeend",'<span class="dot"></span>');

(async function boot(){
  bgStars(); tickClock(); setInterval(tickClock,30000);
  const saved=await Store.load();
  if(saved && saved.entities){
    saved.entities.forEach(s=>{ const d=DEFAULT_DATA.entities.find(x=>x.id===s.id);
      if(d){ d.marketValue=s.marketValue; d.cash=s.cash; d.finAssets=s.finAssets||0; d.rent=s.rent;
        if(s.ccHP!=null) d.ccHP=s.ccHP; if(s.result!=null) d.result=s.result;
        if(s.loans&&s.loans.length===d.loans.length) s.loans.forEach((sl,i)=>{ if(sl.crd!=null) d.loans[i].crd=sl.crd; });
        if(s.docs) s.docs.filter(x=>x.startsWith("📥")).reverse().forEach(x=>{ if(!d.docs.includes(x)) d.docs.unshift(x); });
      }});
    if(saved.holding&&saved.holding.cash!=null) DEFAULT_DATA.holding.cash=saved.holding.cash;
    if(saved.daily) DEFAULT_DATA.daily=saved.daily;
    if(saved.voxelEdits) DEFAULT_DATA.voxelEdits=saved.voxelEdits;
    DATA=JSON.parse(JSON.stringify(DEFAULT_DATA));
    if(saved.meta&&saved.meta.version!==DEFAULT_DATA.meta.version) await Store.save(DATA);
  }
  renderCockpit(); initGalaxy();
  toast("Stellar OS · build "+DEFAULT_DATA.meta.build+" — "+(DEFAULT_DATA.meta.bootNote||""));
  setTimeout(()=>{ try{ Daily.fetch(false); }catch(e){} }, 2500);
})();

/* ===== Explicateur appui long (3s) ===== */

(function(){
  "use strict";
  function __initExplain(){
  var META=(typeof DEFAULT_DATA!=="undefined"&&DEFAULT_DATA.meta)||{}, BRAND=META.brand||"Holding";
  var GCTX=(typeof DEFAULT_DATA!=="undefined"&&DEFAULT_DATA.glossaryCtx)||{};
  var GLOSSARY={
    "patrimoine brut qp":{t:"Patrimoine brut (quote-part)",d:"La valeur de marché de tous les actifs immobiliers, pondérée par ton pourcentage de détention — avant de déduire la moindre dette. C'est la taille du patrimoine que tu pilotes, vu « brut ».",c:"Patrimoine brut QP = Σ (valeur vénale de chaque actif × ta quote-part)."},
    "dette":{t:"Dette (quote-part)",d:"Le total des capitaux restant dus aux banques, ramené à ta quote-part. C'est ce qui pèse en face du patrimoine brut.",c:"Dette QP = Σ (capital restant dû de chaque prêt × ta quote-part)."},
    "valeur venale":{t:"Valeur vénale",d:"Le prix auquel le bien pourrait se vendre aujourd'hui dans des conditions normales de marché. C'est une estimation (souvent par expertise), pas un prix gravé.",c:"Estimée par un expert, ou par capitalisation : loyer annuel ÷ taux de rendement attendu du marché."},
    "dette crd":{t:"Dette — Capital Restant Dû (CRD)",d:"Le capital qu'il reste à rembourser à la banque à un instant donné, hors intérêts futurs. Il baisse à chaque échéance.",c:"CRD = capital emprunté − somme des remboursements de capital déjà effectués."},
    "loyer an":{t:"Loyer annuel",d:"Le revenu locatif sur douze mois généré par l'actif, tel que prévu au bail (souvent indexé chaque année).",c:"Loyer annuel = loyer mensuel × 12, ou loyer de base + surloyer le cas échéant."},
    "rendement":{t:"Rendement",d:"Ce que rapporte l'actif chaque année rapporté à sa valeur. Il dit si le bien « travaille » bien : plus il est élevé, plus l'actif est rentable au regard de son prix.",c:"Rendement = loyer annuel ÷ valeur vénale (× 100 pour l'avoir en %)."},
    "cash flow":{t:"Cash-flow",d:"L'argent qui reste réellement dans la poche du véhicule sur l'année, une fois la banque payée. Positif = le bien s'autofinance et dégage du cash ; négatif = il faut combler.",c:"Cash-flow ≈ loyers encaissés − service de la dette (capital + intérêts) − charges non récupérées − impôts."},
    "qp nav cc":{t:"QP NAV + CC",d:"Ta part de richesse dans ce véhicule : la quote-part d'actif net réévalué, augmentée des comptes courants d'associé que tu y as injectés (et que la société te doit).",c:"QP NAV + CC = (actif net réévalué du véhicule × ta quote-part) + ton compte courant dans ce véhicule."},
    "qp cc":{t:"Quote-part + Comptes courants",d:"Ta part dans le véhicule (selon ton pourcentage) augmentée des avances en compte courant que tu lui as faites.",c:"QP + CC = (valeur nette × quote-part) + comptes courants d'associé."},
    "quote part":{t:"Quote-part",d:"Ton pourcentage de détention dans le véhicule. Il commande ta part des résultats, des dividendes et de la valeur.",c:"Quote-part = tes parts ÷ total des parts de la société (× 100)."},
    "ltv":{t:"LTV — Loan To Value",d:"Le poids de la dette par rapport à la valeur du bien. Plus elle est haute, plus l'effet de levier — et le risque en cas de baisse des prix — sont importants.",c:"LTV = capital restant dû ÷ valeur vénale (× 100)."},
    "tresorerie placements":{t:"Trésorerie + placements",d:"Le cash disponible immédiatement plus les placements liquides (type OPCVM). C'est le coussin de sécurité du véhicule.",c:"Trésorerie + placements = comptes bancaires + valeurs mobilières de placement."},
    "resultat net":{t:"Résultat net",d:"Le bénéfice du véhicule sur l'exercice, une fois toutes les charges et l'impôt sur les sociétés déduits.",c:"Résultat net = produits (loyers…) − charges − dotations aux amortissements − intérêts − IS."},
    "is":{t:"Société à l'IS",d:"Le véhicule est soumis à l'Impôt sur les Sociétés : il paie l'impôt sur son bénéfice, et les amortissements réduisent ce bénéfice imposable.",c:"IS ≈ 15 % jusqu'à 42 500 € de bénéfice, 25 % au-delà (barème courant)."},
    "surloyer":{t:"Surloyer",d:"Un complément de loyer temporaire qui s'ajoute au loyer de base, en général pour rembourser des travaux ou aménagements faits pour le locataire.",c:"Loyer total = loyer de base + surloyer (sur une durée définie au bail)."},
    "ilat":{t:"ILAT (indexation)",d:"L'Indice des Loyers des Activités Tertiaires : il sert à réviser automatiquement les loyers de bureaux/activités chaque année.",c:"Nouveau loyer = loyer × (ILAT du trimestre de révision ÷ ILAT de référence)."},
    "valeur retenue":{t:"Valeur retenue",d:"La valeur que tu décides de retenir pour le bâtiment : soit la somme des composantes (m² × prix), soit le prix global que tu saisis.",c:"Valeur retenue = prix global si renseigné, sinon Somme (surface de chaque partie x prix au m2)."},
    "prix au m2":{t:"Prix au m2",d:"Le prix unitaire attribué à une catégorie de surface (activité, bureaux, terrain). Il sert à valoriser chaque composante du bâtiment.",c:"Valeur d'une composante = surface (m2) x prix au m2 (€/m2)."},
    "surface activite":{t:"Surface d'activité",d:"La surface dédiée à l'exploitation industrielle ou logistique (entrepôt, atelier, production), par opposition aux bureaux.",c:"Valeur activité = m2 d'activité x prix activité au m2 (souvent plus bas que les bureaux)."},
    "surface bureaux":{t:"Surface de bureaux",d:"La surface aménagée en bureaux. Elle se valorise en général à un prix au m2 supérieur à l'activité.",c:"Valeur bureaux = m2 de bureaux x prix bureaux au m2."},
    "terrain":{t:"Terrain",d:"L'emprise foncière (la parcelle) sur laquelle est implanté le bâtiment. Elle a sa propre valeur, distincte du bâti.",c:"Valeur terrain = surface du terrain (m2) x prix du foncier au m2."},
    "patrimoine immobilier estime":{t:"Patrimoine immobilier estimé",d:"La somme des valeurs retenues de tous tes bâtiments, à 100 % puis en quote-part. La photo de la valeur brute de la pierre.",c:"Total 100 % = Somme des valeurs retenues ; Quote-part = Somme (valeur retenue x ta détention)."},
    "service de la dette":{t:"Service de la dette",d:"Ce que tu rembourses chaque année à la banque : le capital plus les intérêts. La sortie de cash qui pèse face aux loyers.",c:"Service de la dette = remboursement de capital + intérêts sur l'année."},
    "amortissement":{t:"Amortissement",d:"La déduction comptable de l'usure du bâtiment, étalée sur sa durée de vie. Elle réduit le bénéfice imposable sans sortie d'argent.",c:"Amortissement annuel ≈ valeur du bâti ÷ durée d'amortissement (souvent 25-40 ans selon les composants)."},
    "report deficitaire":{t:"Report déficitaire",d:"Les pertes passées d'une société à l'IS, conservées pour effacer des bénéfices futurs et différer l'impôt.",c:"Bénéfice imposable = résultat de l'année − reports déficitaires antérieurs, jusqu'à épuisement."},
    "pfu":{t:"PFU (flat tax)",d:"Le Prélèvement Forfaitaire Unique de 30 % sur les dividendes et plus-values de valeurs mobilières.",c:"PFU = 12,8 % d'impôt sur le revenu + 17,2 % de prélèvements sociaux = 30 %."},
    "dividende":{t:"Dividende",d:"La part du bénéfice qu'une société distribue à ses associés. Côté bénéficiaire, il est taxé.",c:"Dividende net ≈ dividende brut x (1 − 30 % de PFU)."},
    "vacance locative":{t:"Vacance locative",d:"La période pendant laquelle un local est inoccupé, donc sans loyer. Le principal risque d'un actif locatif.",c:"Mois tenables = trésorerie disponible ÷ charges mensuelles à vide."},
    "expertise":{t:"Expertise (valeur d'expert)",d:"L'estimation de valeur vénale réalisée par un expert immobilier indépendant. Référence pour la banque et le bilan.",c:"L'expert combine comparables de marché et capitalisation des loyers (loyer ÷ taux de rendement)."},
    "acte en mains":{t:"Rentabilité acte en mains",d:"Le rendement calculé sur le prix « tout compris » : prix du bien plus tous les frais (notaire, etc.).",c:"Rentabilité acte en mains = loyer annuel ÷ (prix + frais d'acquisition)."},
    "bail ferme":{t:"Bail ferme",d:"La période pendant laquelle le locataire s'engage sans pouvoir partir. Elle sécurise les revenus futurs.",c:"Durée ferme = années pendant lesquelles le préavis de départ est exclu (ex. 12 ans fermes)."}
  };
  var NAVK=norm("nav "+BRAND), CCK=norm("cc "+BRAND);
  GLOSSARY[NAVK]={t:"NAV "+BRAND,d:"L'Actif Net Réévalué de la holding : ce qui resterait, en valeur, si on vendait tout aux prix de marché et qu'on remboursait toutes les dettes. C'est la richesse nette réelle de "+BRAND+".",c:"NAV = (valeurs vénales des actifs × quote-part) − dettes quote-part + comptes courants + trésorerie de la holding."};
  GLOSSARY[CCK]={t:"Compte courant "+BRAND,d:"L'argent que "+BRAND+" a avancé au véhicule. Juridiquement c'est une créance : la société te le doit et peut te le rembourser.",c:"Solde du compte courant = avances faites − remboursements reçus (+ intérêts éventuels)."};
  for(var _gk in GLOSSARY){ GLOSSARY[_gk].x=GCTX[_gk]||""; }
  GLOSSARY[NAVK].x=GCTX["nav-brand"]||""; GLOSSARY[CCK].x=GCTX["cc-brand"]||"";
  var ALIAS={"loyer  an":"loyer an","qp nav  cc":"qp nav cc","valeur venale eur":"valeur venale","societe immobiliere is":"is","societe immobiliere":"is","prix m2":"prix au m2","prix au metre carre":"prix au m2","patrimoine immobilier":"patrimoine immobilier estime","flat tax":"pfu","vacance":"vacance locative","amortissements":"amortissement","acte en main":"acte en mains","surface utile":"surface activite","activite entrepot":"surface activite"};
  ALIAS["nav"]=NAVK;
  function norm(s){return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();}
  function lookup(label){ if(!label) return null; var k=norm(label); if(ALIAS[k])k=ALIAS[k];
    if(GLOSSARY[k]) return {key:k,e:GLOSSARY[k]};
    // tolérance : la clé est contenue dans le libellé ou inversement
    for(var g in GLOSSARY){ if(k.indexOf(g)>=0||g.indexOf(k)>=0) return {key:g,e:GLOSSARY[g]}; } return null; }
  function findLV(el){ if(!el||!el.closest) return {label:null,value:null};
    var k=null,v=null;
    if(el.classList&&el.classList.contains("k")){k=el;v=el.nextElementSibling;}
    else if(el.classList&&el.classList.contains("v")){v=el;k=el.previousElementSibling;}
    if(!k){var kk=el.closest(".k");if(kk){k=kk;v=kk.nextElementSibling;}}
    if(!k){var ck=el.closest(".ck");if(ck){k=ck.querySelector(".l");v=ck.querySelector(".v");}}
    if(!k){var dt=el.closest("[data-term]");if(dt){return {label:dt.getAttribute("data-term"),value:null};}}
    return {label:k?k.textContent:el.textContent,value:v?v.textContent:null};
  }
  function lookupStrict(label){ if(!label) return null; var k=norm(label); if(k.length<2) return null; if(ALIAS[k])k=ALIAS[k]; return GLOSSARY[k]?{key:k,e:GLOSSARY[k]}:null; }
  function resolve(el){ var lv=findLV(el); var hit=lookup(lv.label);
    if(!hit){ // REPLI : marche partout — on remonte les parents et on teste les libellés courts voisins
      var node=el, depth=0;
      while(node && depth<4 && !hit){
        var cand=[]; if(node.getAttribute){ var dt=node.getAttribute("data-term"); if(dt) cand.push(dt); }
        var tx=(node.textContent||"").trim(); if(tx.length>=2 && tx.length<=42) cand.push(tx);
        if(node.children) for(var i=0;i<node.children.length;i++){ var ct=(node.children[i].textContent||"").trim(); if(ct.length>=2&&ct.length<=42) cand.push(ct); }
        for(var c=0;c<cand.length && !hit;c++){ hit=lookupStrict(cand[c]) || (cand[c].length<=24?lookup(cand[c]):null); if(hit) lv.label=cand[c]; }
        node=node.parentElement; depth++;
      }
    }
    if(!hit) return null;
    return {e:hit.e,value:(lv.value&&lv.value.trim()&&lv.value.indexOf("—")<0)?lv.value.trim():null}; }

  var ring=document.getElementById("hold-ring");
  var ex=document.getElementById("explain");
  function showRing(x,y){ if(!ring)return; ring.style.left=x+"px"; ring.style.top=y+"px"; ring.classList.add("show"); void ring.offsetWidth; ring.classList.add("go"); }
  function hideRing(){ if(!ring)return; ring.classList.remove("show","go"); }
  function openExplain(info){ if(!ex)return; var e=info.e;
    ex.querySelector(".ex-t").textContent=e.t;
    var vb=ex.querySelector(".ex-val"); if(info.value){vb.textContent=info.value;vb.style.display="";}else{vb.style.display="none";}
    ex.querySelector(".def").textContent=e.d; ex.querySelector(".calc").textContent=e.c; ex.querySelector(".ctx").textContent=e.x;
    ex.classList.add("on");
    try{ if(navigator.vibrate) navigator.vibrate(14); }catch(_){}
  }
  function closeExplain(){ if(ex) ex.classList.remove("on"); }
  if(ex){ ex.addEventListener("click",function(e){ if(e.target.classList.contains("ex-bg")||e.target.classList.contains("ex-x")) closeExplain(); }); }

  var t=null,sx=0,sy=0,info=null,swallow=false;
  function down(e){ if(ex&&ex.classList.contains("on")) return; if(e.pointerType==="touch"&&e.isPrimary===false){ cancel(); return; } var p=e.touches?e.touches[0]:e;
    var el=document.elementFromPoint(p.clientX,p.clientY)||e.target; var r=resolve(el); if(!r) return;
    sx=p.clientX; sy=p.clientY; info=r; showRing(sx,sy);
    t=setTimeout(function(){ hideRing(); openExplain(info); swallow=true; t=null; },2000); }
  function move(e){ if(t==null) return; var p=e.touches?e.touches[0]:e; if(Math.hypot(p.clientX-sx,p.clientY-sy)>12) cancel(); }
  function cancel(){ if(t){clearTimeout(t);t=null;} hideRing(); }
  document.addEventListener("pointerdown",down,true);
  document.addEventListener("pointermove",move,true);
  document.addEventListener("pointerup",cancel,true);
  document.addEventListener("pointercancel",cancel,true);
  document.addEventListener("touchstart",function(e){ if(e.touches&&e.touches.length>1) cancel(); },true);
  window.addEventListener("scroll",cancel,true);
  document.addEventListener("click",function(e){ if(swallow){ e.stopPropagation(); e.preventDefault(); swallow=false; } },true);
  }
  if(document.readyState!=="loading") __initExplain(); else document.addEventListener("DOMContentLoaded",__initExplain);
})();

