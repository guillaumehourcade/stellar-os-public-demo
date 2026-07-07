/* ============ COCKPIT ============ */
function renderCockpit(){ /*brief-rendered-below*/
  const c=Engine.consolidate();
  $("#cockpit").innerHTML=`
   <div class="ck prime" id="ck-nav" onpointerdown="navPressStart(event)" onpointerup="navPressEnd()" onpointercancel="navPressEnd()" onpointerleave="navPressEnd()" style="cursor:pointer;position:relative"><div class="l">NAV ${DATA.meta.brand} <span style="font-size:9px;opacity:.5">◉ appui long</span></div><div class="v">${fmtM(c.nav)}</div><div class="d">QP d'ANR + CC + tréso holding</div></div>
   <div class="ck"><div class="l">Patrimoine brut QP</div><div class="v">${fmtM(c.grossAssets)}</div><div class="d">100% véhicules : ${fmtM(c.gross100)}</div></div>
   <div class="ck"><div class="l">Dette QP</div><div class="v red">${fmtM(c.debtQP)}</div><div class="d">100% : ${fmtM(c.debt100)}</div></div>
   <div class="ck"><div class="l">LTV consolidé</div><div class="v ${c.ltv>0.85?'red':c.ltv>0.7?'warn':'green'}">${pct(c.ltv)}</div><div class="d">dette QP / valeur vénale QP</div></div>
   <div class="ck"><div class="l">Trésorerie QP</div><div class="v cyan">${fmtK(c.cashQP)}</div><div class="d">holding : ${fmtK(DATA.holding.cash)}</div></div>
   <div class="ck"><div class="l">Loyers QP</div><div class="v green">${fmtK(c.rentQP)}</div><div class="d">/an · 100% : ${fmtK(c.rent100)}</div></div>
   <div class="ck"><div class="l">Cash-flow QP</div><div class="v ${c.holdingCF<0?'warn':'green'}">${fmtK(c.holdingCF)}</div><div class="d">/an après service dette + charges ${DATA.meta.brandShort}</div></div>
   <div class="ck"><div class="l">CC à récupérer</div><div class="v cyan">${fmtK(c.ccHP)}</div><div class="d">sans flat tax</div></div>
   <div class="ck"><div class="l">Consolidé perso</div><div class="v gold" style="color:var(--sun-hi)">${fmtM(c.perso)}</div><div class="d">${DATA.holding.personal.sub}</div></div>
   <div class="ck brief"><div class="l" style="display:flex;justify-content:space-between;align-items:center">Brief du jour — monde & tech<button class="icobtn" style="font-size:11px;padding:4px 10px" onclick="Daily.fetch(true)">↻</button></div>
     <div id="brief-status" class="d" style="margin:4px 0 8px">Touchez ↻ pour charger météo & actus</div>
     <div id="brief-list"></div></div>`;
  try{ Daily.render(); }catch(_){}
}
function tickClock(){
  const d=new Date();
  $("#clockbox").textContent="BUILD "+DEFAULT_DATA.meta.build+" · "+d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"}).toUpperCase()+" · "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})+" · "+DEFAULT_DATA.meta.cityShort;
}

/* ============ GOVERNANCE ============ */
function renderGov(){
  const c=Engine.consolidate();
  $("#gov-pad").innerHTML=`
  <div class="grid g4">
    <div class="card gold"><h3>NAV consolidée</h3><div class="kpi gold">${fmtM(c.nav)}</div><div class="sub">Doctrine : QP × ANR + comptes courants détenus. Valeurs vénales = hypothèses ajustables dans chaque jumeau.</div></div>
    <div class="card"><h3>Cash-flow annuel QP</h3><div class="kpi ${c.holdingCF<0?'warn':'green'}">${fmtK(c.holdingCF)}<small> /an</small></div><div class="sub">Loyers QP ${fmtK(c.rentQP)} − service dette QP ${fmtK(c.rentQP-c.cfQP)} − charges ${DATA.meta.brandShort} ${fmtK(DATA.holding.monthlyCharges*12)}</div></div>
    <div class="card"><h3>LTV consolidé</h3><div class="kpi ${c.ltv>0.85?'red':c.ltv>0.7?'warn':'green'}">${pct(c.ltv)}</div><div class="sub">Dette QP ${fmtM(c.debtQP)} / valeur vénale QP ${fmtM(c.assetValQP)}</div></div>
    <div class="card alert"><h3>Risque n°1</h3><div class="kpi red" style="font-size:17px">${DATA.ui.risk1.title}</div><div class="sub">${DATA.ui.risk1.sub}</div></div>
  </div>
  <div class="section-title">Répartition de la NAV</div>
  <div class="grid g2">
    <div class="card"><div class="chart-box"><canvas class="ch" id="ch-nav"></canvas></div></div>
    <div class="card"><h3>Détail par véhicule</h3><table class="dt"><thead><tr><th>Véhicule</th><th class="r">QP</th><th class="r">ANR 100%</th><th class="r">QP + CC</th><th></th></tr></thead><tbody>
    ${DATA.entities.map(e=>`<tr style="cursor:pointer" onclick="openTwin('${e.id}')"><td style="color:${e.color}">${e.name}</td><td class="r">${pct(e.stake)}</td><td class="r">${fmtK(Engine.entityNet(e))}</td><td class="r" style="color:var(--sun)">${fmtK(Engine.navShare(e))}</td><td>${riskPill(e.risk)}</td></tr>`).join("")}
    <tr><td>HOLDING (tréso)</td><td class="r">100 %</td><td class="r">${fmtK(DATA.holding.cash)}</td><td class="r" style="color:var(--sun)">${fmtK(DATA.holding.cash)}</td><td></td></tr>
    </tbody></table></div>
  </div>
  <div class="section-title">Dette & extinction</div>
  <div class="grid g2">
    <div class="card"><table class="dt"><thead><tr><th>Véhicule</th><th>Prêt</th><th class="r">CRD 2026</th><th class="r">Taux</th><th class="r">Fin</th></tr></thead><tbody>
    ${Engine.loanSchedule().map(l=>`<tr><td style="color:${l.color}">${l.entity}</td><td>${l.label}</td><td class="r">${fmt(l.crd)}</td><td class="r">${l.rate.toLocaleString("fr-FR")} %</td><td class="r">${l.end}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="card"><div class="chart-box"><canvas class="ch" id="ch-debt"></canvas></div></div>
  </div>`;
  chart("ch-nav",{type:"doughnut",data:{
    labels:[...DATA.entities.map(e=>e.name),"Tréso holding"],
    datasets:[{data:[...DATA.entities.map(e=>Math.max(0,Engine.navShare(e))),DATA.holding.cash],
      backgroundColor:[...DATA.entities.map(e=>e.color),"#E6EEFB"], borderColor:"#03060E", borderWidth:3, hoverOffset:8}]},
    options:{cutout:"58%",plugins:{legend:{position:"right",...{labels:LEG.labels}},tooltip:{callbacks:{label:x=>x.label+" : "+fmtK(x.parsed)}}},maintainAspectRatio:false}});
  const p=Engine.project();
  chart("ch-debt",{type:"bar",data:{labels:p.years,datasets:[{label:"Dette QP",data:p.debtS,backgroundColor:gradFill("#FF6B5A","85","25"),borderRadius:5,borderRadius:4}]},
    options:{maintainAspectRatio:false,plugins:{legend:LEG,tooltip:{callbacks:{label:x=>fmtK(x.parsed.y)}}},scales:{x:AXC,y:{...AXC,ticks:{...AXC.ticks,callback:v=>fmtM(v)}}}}});
}

