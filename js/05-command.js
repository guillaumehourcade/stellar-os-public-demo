/* ============ STRATEGIC COMMAND ============ */
function renderCommand(){
  $("#command-pad").innerHTML=`
  <div class="section-title">Strategic Command — cœur décisionnel</div>
  <div class="grid g2">
    <div class="card">
      <h3>Paramètres du scénario</h3>
      <label class="lbl">Type d'opération</label>
      <select class="inp" id="sc-type" onchange="scForm()">
        <option value="cc">Remboursement de compte courant</option>
        <option value="div">Distribution de dividende (mère-fille)</option>
        <option value="refi">Refinancement</option>
        <option value="sale">Cession d'actif</option>
        <option value="buy">Nouvelle acquisition</option>
      </select>
      <div id="sc-form"></div>
      <div style="margin-top:16px"><button class="btn gold" onclick="runScenario()">Simuler l'impact</button></div>
    </div>
    <div class="card gold"><h3>Impact immédiat</h3>
      <div class="impact" id="sc-impact">
        ${["NAV","Tréso "+DATA.meta.brandShort,"Cash-flow /an","Dette QP","LTV"].map(l=>`<div class="imp"><div class="l">${l}</div><div class="v flat">—</div></div>`).join("")}
      </div>
      <div id="sc-result" style="line-height:1.8;color:var(--dim);margin-top:14px">Configurez un scénario. Bac à sable : la base réelle n'est jamais modifiée.</div>
    </div>
  </div>
  <div class="section-title">Scénarios pré-chargés</div>
  <div class="grid g3">
    ${DATA.ui.presets.map(p2=>`<div class="card asset" onclick="${p2.call}"><div class="nm" style="color:${p2.color};font-size:14px">${p2.nm}</div><div class="sub">${p2.sub}</div></div>`).join("\r\n    ")}
  </div>`;
  scForm();
}
function scForm(){
  const t=$("#sc-type").value;
  const entOpts=()=>DATA.entities.map(e=>`<option value="${e.id}">${e.name}</option>`).join("");
  let h="";
  if(t==="cc") h=`<label class="lbl">Véhicule</label><select class="inp" id="sc-ent">${entOpts()}</select>
    <label class="lbl">Montant remboursé à ${DATA.meta.brand} (€)</label><input class="inp" type="number" id="sc-amt" value="${DATA.ui.scDefaults.cc}">`;
  if(t==="div") h=`<label class="lbl">Véhicule distributeur</label><select class="inp" id="sc-ent">${entOpts()}</select>
    <label class="lbl">Dividende 100% (€)</label><input class="inp" type="number" id="sc-amt" value="${DATA.ui.scDefaults.div}">`;
  if(t==="refi") h=`<label class="lbl">Véhicule</label><select class="inp" id="sc-ent">${entOpts()}</select>
    <label class="lbl">Nouvelle dette levée (€)</label><input class="inp" type="number" id="sc-amt" value="${DATA.ui.scDefaults.refi}">
    <label class="lbl">Taux (%)</label><input class="inp" type="number" step="0.1" id="sc-rate" value="${DATA.ui.scDefaults.rate}">
    <label class="lbl">Durée (ans)</label><input class="inp" type="number" id="sc-dur" value="${DATA.ui.scDefaults.dur}">`;
  if(t==="sale") h=`<label class="lbl">Actif cédé</label><select class="inp" id="sc-ent">${entOpts()}</select>
    <label class="lbl">Prix de cession (€)</label><input class="inp" type="number" id="sc-amt" value="${DATA.ui.scDefaults.sale}">
    <label class="lbl">IS estimé sur plus-value (€)</label><input class="inp" type="number" id="sc-tax" value="${DATA.ui.scDefaults.tax}">`;
  if(t==="buy") h=`<label class="lbl">Prix de revient (€)</label><input class="inp" type="number" id="sc-amt" value="${DATA.ui.scDefaults.buy}">
    <label class="lbl">LTV (%)</label><input class="inp" type="number" id="sc-ltv" value="${DATA.ui.scDefaults.ltv}">
    <label class="lbl">Taux (%)</label><input class="inp" type="number" step="0.1" id="sc-rate" value="${DATA.ui.scDefaults.rate}">
    <label class="lbl">Rendement locatif (%)</label><input class="inp" type="number" step="0.1" id="sc-yld" value="${DATA.ui.scDefaults.yld}">
    <label class="lbl">Quote-part ${DATA.meta.brand} (%)</label><input class="inp" type="number" id="sc-stk" value="${DATA.ui.scDefaults.stk}">`;
  $("#sc-form").innerHTML=h;
}
function presetCC(id,amt){ $("#sc-type").value="cc"; scForm(); $("#sc-ent").value=id; $("#sc-amt").value=amt; runScenario(); }
function presetSale(id){ $("#sc-type").value="sale"; scForm(); $("#sc-ent").value=id; $("#sc-amt").value=Engine.entity(id).marketValue; runScenario(); }
function presetBuy(){ $("#sc-type").value="buy"; scForm(); runScenario(); }
function paintImpact(d){ // {nav,cash,cf,debt,ltv} deltas
  const c=Engine.consolidate();
  const cells=[
    {v:d.nav, f:sgn, base:fmtM(c.nav)},
    {v:d.cash, f:sgn, base:fmtK(DATA.holding.cash)},
    {v:d.cf, f:n=>sgn(n)+"/an", base:fmtK(c.holdingCF)},
    {v:d.debt, f:sgn, base:fmtM(c.debtQP)},
    {v:d.ltv, f:n=>(n>=0?"+":"")+(n*100).toLocaleString("fr-FR",{maximumFractionDigits:1})+" pt", base:pct(c.ltv)}
  ];
  $("#sc-impact").innerHTML=["NAV","Tréso "+DATA.meta.brandShort,"Cash-flow","Dette QP","LTV"].map((l,i)=>{
    const x=cells[i], cls=Math.abs(x.v)<1e-9?"flat":(i>=3? (x.v>0?"down":"up") : (x.v>0?"up":"down"));
    return `<div class="imp"><div class="l">${l}</div><div class="v ${cls}">${Math.abs(x.v)<1e-9?"=":x.f(x.v)}</div><div class="l" style="margin-top:2px">${x.base}</div></div>`;
  }).join("");
}
function runScenario(){
  const t=$("#sc-type").value, c0=Engine.consolidate(); let out="", D={nav:0,cash:0,cf:0,debt:0,ltv:0};
  if(t==="cc"){
    const e=Engine.entity($("#sc-ent").value), amt=+$("#sc-amt").value||0;
    D.cash=amt; D.cf = e.ccRate ? -amt*e.ccRate/100 : 0;
    out=`<b style="color:var(--ink)">Remboursement CC — ${e.name}</b><br>
    Créance transformée en cash : <b style="color:var(--ok)">zéro fiscalité</b> (vs flat tax 30% en direct). NAV neutre.<br>
    Tréso du véhicule : ${fmtK(e.cash)} → ${fmtK(e.cash-amt)} · CC HP restant : ${fmt(Math.max(0,e.ccHP-amt))}.
    ${e.ccRate?"<br><span style='color:var(--warn)'>"+(e.ccNote||"")+"</span>":""}`;
  }
  if(t==="div"){
    const e=Engine.entity($("#sc-ent").value), amt=+$("#sc-amt").value||0;
    const part=amt*e.stake, recu=part*(1-0.0125);
    D.cash=recu; D.nav=-part*0.0125;
    out=`<b style="color:var(--ink)">Dividende — ${e.name}</b><br>
    100% : ${fmt(amt)} → QP ${DATA.meta.brand} (${pct(e.stake)}) : ${fmt(part)} → net mère-fille (−1,25%) : <b style="color:var(--ok)">${fmt(recu)}</b>.<br>
    <span style="color:var(--warn)">${DATA.ui.divNote}</span>`;
  }
  if(t==="refi"){
    const e=Engine.entity($("#sc-ent").value), amt=+$("#sc-amt").value||0,
          rate=(+$("#sc-rate").value||0)/100, dur=+$("#sc-dur").value||15;
    const svc=amt/dur+amt*rate;
    D.debt=amt*e.stake; D.cf=-svc*e.stake; D.ltv=( (c0.debtQP+amt*e.stake)/c0.assetValQP )-c0.ltv;
    out=`<b style="color:var(--ink)">Refinancement — ${e.name}</b><br>
    Dette levée ${fmt(amt)} à ${(rate*100).toLocaleString("fr-FR")}% sur ${dur} ans → service ≈ ${fmt(svc)}/an.<br>
    Cash dégagé dans le véhicule : ${fmt(amt)} — mobilisable en remboursement de CC vers ${DATA.meta.brand} (alors Tréso ${DATA.meta.brandShort} +${fmtK(Math.min(amt,e.ccHP))} possible).<br>
    NAV neutre (cash = dette). LTV et cash-flow se dégradent : à réserver aux actifs désendettés à loyer sécurisé.`;
  }
  if(t==="sale"){
    const e=Engine.entity($("#sc-ent").value), px=+$("#sc-amt").value||0, tax=+$("#sc-tax").value||0;
    const d=Engine.debt(e);
    const boni=px - d - tax + e.cash + e.finAssets - e.ccTotal;
    const hp=boni*e.stake + e.ccHP;
    D.nav=hp-Engine.navShare(e); D.cash=hp; D.cf=-(Engine.entityCF(e))*e.stake; D.debt=-d*e.stake;
    D.ltv=( (c0.debtQP-d*e.stake)/Math.max(1,c0.assetValQP-e.marketValue*e.stake) )-c0.ltv;
    out=`<b style="color:var(--ink)">Cession — ${e.name}</b><br>
    Prix ${fmt(px)} − dette ${fmt(d)} − IS PV ${fmt(tax)} + tréso ${fmt(e.cash+e.finAssets)} − CC ${fmt(e.ccTotal)} = boni 100% ${fmt(boni)}.<br>
    Retour total ${DATA.meta.brand} (QP + CC) : <b style="color:var(--sun)">${fmt(hp)}</b>. Loyers QP perdus : ${fmtK(e.rent*e.stake)}/an.`;
  }
  if(t==="buy"){
    const px=+$("#sc-amt").value||0, ltv=(+$("#sc-ltv").value||0)/100, rate=(+$("#sc-rate").value||0)/100,
          yld=(+$("#sc-yld").value||0)/100, stk=(+$("#sc-stk").value||0)/100;
    const debt=px*ltv, equity=px-debt, rent=px*yld, svc=debt*(rate+1/14.5), cf=rent-svc;
    D.cash=-equity*stk; D.cf=cf*stk; D.debt=debt*stk;
    D.ltv=( (c0.debtQP+debt*stk)/(c0.assetValQP+px*stk) )-c0.ltv;
    out=`<b style="color:var(--ink)">Acquisition</b><br>
    Prix ${fmt(px)} · Dette ${fmt(debt)} (LTV ${pct(ltv)}) · FP ${fmt(equity)} dont ${DATA.meta.brand} ${fmt(equity*stk)}<br>
    Loyer ${fmt(rent)}/an · Service ≈ ${fmt(svc)}/an · DSCR ${(rent/svc).toLocaleString("fr-FR",{maximumFractionDigits:2})} · CF véhicule <b style="color:${cf>=0?'var(--ok)':'var(--risk)'}">${fmt(cf)}/an</b><br>
    ${DATA.ui.buyNote}`;
  }
  paintImpact(D); $("#sc-result").innerHTML=out;
}

/* ============ TIMELINE — frise stratégique ============ */
function attachTLScrubber(p){
  setTimeout(()=>{
    const cv=document.getElementById("ch-tl"), cur=document.getElementById("tl-cursor"), out=document.getElementById("tl-readout");
    if(!cv||!cur||!out) return;
    const ch=CH["ch-tl"];
    function paint(idx){
      idx=Math.max(0,Math.min(p.years.length-1,idx));
      const meta=ch.getDatasetMeta(0); if(!meta||!meta.data[idx]) return;
      const x=meta.data[idx].x, rect=cv.getBoundingClientRect(), pr=cv.parentElement.getBoundingClientRect();
      cur.style.left=(x)+"px"; cur.style.opacity=1;
      out.innerHTML=`<b style="color:var(--sun-hi);font-size:14px">${p.years[idx]}</b>`+
        `<span style="color:#FFC861">NAV ${fmtM(p.navS[idx])}</span>`+
        `<span style="color:#FF6B5A">Dette ${fmtM(p.debtS[idx])}</span>`+
        `<span style="color:#5CE6A1">Loyers ${fmtK(p.rentS[idx])}/an</span>`;
    }
    function fromEvent(e){
      const rect=cv.getBoundingClientRect();
      const cx=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
      const a=ch.chartArea, frac=(cx-a.left)/(a.right-a.left);
      paint(Math.round(frac*(p.years.length-1)));
    }
    let drag=false;
    const dn=e=>{drag=true;fromEvent(e);e.preventDefault();};
    const mv=e=>{if(drag)fromEvent(e);};
    const up=()=>{drag=false;};
    cv.addEventListener("pointerdown",dn); cv.addEventListener("pointermove",mv);
    window.addEventListener("pointerup",up);
    paint(0);
  },120);
}
function renderTimeline(){
  const p=Engine.project();
  const evByYear={}; DATA.globalEvents.forEach(e=>{ (evByYear[e.y]=evByYear[e.y]||[]).push(e); });
  let frieze="";
  for(let y=2026;y<=2045;y++){
    const evs=evByYear[y]||[];
    frieze+=`<div class="fy ${evs.length?'major':''}"><div class="yr">${y}</div>${evs.map(e=>`<div class="fev ${e.t}">${e.txt}</div>`).join("")}</div>`;
  }
  $("#timeline-pad").innerHTML=`
  <div class="section-title">Frise stratégique 2026 → 2045</div>
  <div class="card" style="padding:14px 10px"><div id="frieze"><div id="frieze-track">${frieze}</div></div>
  <div class="sub" style="padding:0 8px">⬤ <span style="color:var(--star)">Extinctions de prêts</span> · <span style="color:var(--warn)">Échéances de baux</span> · <span style="color:var(--ok)">Flux de cash</span> · <span style="color:var(--risk)">Décisions / risques</span> · <span style="color:var(--violet)">Opérations</span></div></div>
  <div class="section-title">Trajectoire financière</div>
  <div class="card"><div id="tl-readout" style="display:flex;gap:10px;flex-wrap:wrap;padding:2px 4px 10px;font-size:12px"></div><div class="chart-box tall" style="position:relative"><canvas class="ch" id="ch-tl"></canvas><div id="tl-cursor" style="position:absolute;top:0;bottom:0;width:2px;background:linear-gradient(#FFC861,#FF6B5A);pointer-events:none;opacity:0;box-shadow:0 0 8px rgba(255,200,97,.6)"></div></div>
  <div class="sub" style="margin-top:10px">Valeurs vénales constantes (prudence), loyers ILAT 1,75%/an, amortissement linéaire. La NAV croît mécaniquement par désendettement : chaque échéance payée par les locataires est de la valeur transférée vers ${DATA.meta.brand}.</div></div>
  <div class="card" style="margin-top:14px"><h3>Cash-flow quote-part projeté</h3><div class="chart-box small"><canvas class="ch" id="ch-cf"></canvas></div></div>`;
  chart("ch-tl",{type:"line",data:{labels:p.years,datasets:[
    {label:"NAV "+DATA.meta.brand,data:p.navS,borderColor:"#FFC861",backgroundColor:gradFill("#FFC861","48","00"),fill:true,borderWidth:2.6,pointRadius:0,tension:.35,tension:.3,borderWidth:2.5,pointRadius:0},
    {label:"Dette QP",data:p.debtS,borderColor:"#FF6B5A",tension:.3,borderWidth:2,pointRadius:0},
    {label:"Loyers QP /an",data:p.rentS,borderColor:"#5CE6A1",tension:.3,borderWidth:2,pointRadius:0,yAxisID:"y2"}]},
   options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},
    plugins:{legend:LEG,tooltip:{callbacks:{label:c=>c.dataset.label+" : "+fmtK(c.parsed.y)}}},
    scales:{x:AXC,y:{...AXC,ticks:{...AXC.ticks,callback:v=>fmtM(v)}},y2:{position:"right",ticks:{color:"#5CE6A1",callback:v=>fmtK(v)},grid:{display:false}}}}});
  attachTLScrubber(p);
  chart("ch-cf",{type:"bar",data:{labels:p.years,datasets:[{label:"CF QP après dette + charges "+DATA.meta.brandShort,data:p.cfS,
    backgroundColor:p.cfS.map(v=>v>=0?"rgba(92,230,161,.6)":"rgba(255,107,90,.6)"),borderRadius:4}]},
    options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:x=>fmtK(x.parsed.y)+"/an"}}},scales:{x:AXC,y:{...AXC,ticks:{...AXC.ticks,callback:v=>fmtK(v)}}}}});
}

