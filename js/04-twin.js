/* ============ DIGITAL TWIN ============ */
function renderAssets(){
  $("#assets-pad").innerHTML=`<div class="section-title">Jumeaux numériques — ${DATA.entities.length} véhicules</div>
  <div class="grid g3">${DATA.entities.map(e=>{
    const d=Engine.debt(e), yld=e.marketValue>0?e.rent/e.marketValue:0;
    return `<div class="card asset" onclick="openTwin('${e.id}')">
      <div class="stake">${pct(e.stake)}</div>
      <div class="nm" style="color:${e.color};text-shadow:0 0 14px ${e.color}55">${e.name}</div>
      <div class="tp">${e.type}</div>${riskPill(e.risk)}
      <div class="mini">
        <span class="k">Valeur vénale</span><span class="v">${e.marketValue?fmtK(e.marketValue):"n/a"}</span>
        <span class="k">Dette CRD</span><span class="v">${d?fmtK(d):"—"}</span>
        <span class="k">Loyer / an</span><span class="v">${e.rent?fmtK(e.rent):"—"}</span>
        <span class="k">Rendement</span><span class="v">${yld?pct(yld):"—"}</span>
        <span class="k">Cash-flow</span><span class="v" style="color:${Engine.entityCF(e)>=0?'var(--ok)':'var(--risk)'}">${e.rent||d?fmtK(Engine.entityCF(e)):"—"}</span>
        <span class="k">QP NAV + CC</span><span class="v" style="color:var(--sun)">${fmtK(Engine.navShare(e))}</span>
      </div></div>`;}).join("")}</div>`;
}
function openTwin(id){
  const e=Engine.entity(id); if(!e) return;
  const d=Engine.debt(e), net=Engine.entityNet(e), yld=e.marketValue>0?e.rent/e.marketValue:null, cf=Engine.entityCF(e);
  const h=e.history||{};
  $("#twin").style.setProperty("--ac", e.color);
  $("#twin-body").innerHTML=`
    <div class="phero">
      <div class="phero-glow"></div>
      <div class="phero-top">
        <span class="phero-tag">${e.type}</span>${riskPill(e.risk)}
      </div>
      <h2 class="phero-name">${e.name}</h2>
      <div class="phero-addr">${e.addr}</div>
      <div class="phero-stats">
        <div class="ps"><span class="psl">Quote-part ${DATA.meta.brandShort}</span><span class="psv">${pct(e.stake)}</span></div>
        <div class="ps"><span class="psl">QP + CC</span><span class="psv gold">${fmtK(Engine.navShare(e))}</span></div>
        <div class="ps"><span class="psl">Rendement</span><span class="psv green">${yld?pct(yld):"—"}</span></div>
      </div>
    </div>
    <div class="grid g2" style="margin-top:14px">
      <div class="card metric"><div class="mlabel">ANR 100%</div><div class="mval">${fmtK(net)}</div><div class="mfoot">Actif net réévalué</div></div>
      <div class="card metric gold"><div class="mlabel">Loyer annuel</div><div class="mval green">${e.rent?fmtK(e.rent):"—"}</div><div class="mfoot">${e.rent||d?"CF "+fmtK(cf)+"/an":"—"}</div></div>
      <div class="card metric"><div class="mlabel">Dette</div><div class="mval red">${d?fmtK(d):"—"}</div><div class="mfoot">Tréso ${fmtK(e.cash+e.finAssets)}</div></div>
      <div class="card metric"><div class="mlabel">LTV</div><div class="mval">${e.marketValue>0?pct(d/e.marketValue):"—"}</div><div class="ltvbar" style="margin-top:8px"><div class="ltvfill ${e.marketValue>0&&d/e.marketValue>.75?"hot":""}" style="width:${e.marketValue>0?Math.min(100,d/e.marketValue*100):0}%"></div></div></div>
    </div>
    <div class="specs card" style="margin-top:14px">
      <div class="sp-row"><span>🏢 Surface</span><b>${e.addr.split("—")[1]||e.addr}</b></div>
      <div class="sp-row"><span>👤 Locataire</span><b>${(e.tenant||"—").split("(")[0]}</b></div>
      ${e.leaseEnd?`<div class="sp-row"><span>📅 Bail ferme</span><b>${e.leaseEnd}</b></div>`:""}
    </div>
    ${h.years && (h.rn||h.debt) ? `<div class="section-title">Historique ${h.years[0]} → ${h.years[h.years.length-1]}</div>
      <div class="card"><div class="chart-box small"><canvas class="ch" id="tw-ch1"></canvas></div></div>`:""}
    ${h.years && h.debt ? `<div class="card" style="margin-top:12px"><div class="chart-box small"><canvas class="ch" id="tw-ch2"></canvas></div></div>`:""}
    ${e.loans.length?`<div class="section-title">Trajectoire de désendettement</div>
      <div class="card"><div class="chart-box small"><canvas class="ch" id="tw-ch3"></canvas></div></div>`:""}
    <div class="section-title">Locataire & bail</div>
    <div class="card"><div style="line-height:1.6">${e.tenant||"—"}${e.leaseEnd?`<br><span style="color:var(--dim)">Échéance ferme : ${e.leaseEnd}</span>`:""}</div></div>
    ${e.loans.length?`<div class="section-title">Dette</div><div class="card"><table class="dt"><thead><tr><th>Prêt</th><th class="r">CRD</th><th class="r">Taux</th><th class="r">Fin</th></tr></thead><tbody>
      ${e.loans.map(l=>`<tr><td>${l.label}</td><td class="r">${fmt(l.crd)}</td><td class="r">${l.rate.toLocaleString("fr-FR")}%</td><td class="r">${l.end}</td></tr>`).join("")}</tbody></table></div>`:""}
    <div class="section-title">Comptes courants</div>
    <div class="card"><table class="dt"><tbody>
      <tr><td>CC ${DATA.meta.brand} (créance)</td><td class="r" style="color:var(--sun)">${fmt(e.ccHP)}</td></tr>
      <tr><td>CC totaux au passif</td><td class="r">${fmt(e.ccTotal)}</td></tr></tbody></table></div>
    ${e.events&&e.events.length?`<div class="section-title">Timeline de l'actif</div>
      <div class="card">${e.events.sort((a,b)=>a.y-b.y).map(ev=>`<div class="docrow"><span class="dn"><span class="fev ${ev.t}" style="padding:2px 8px;margin-right:8px">${ev.y}</span>${ev.txt}</span></div>`).join("")}</div>`:""}
    ${e.docs&&e.docs.length?`<div class="section-title">Documents de référence</div>
      <div class="card">${e.docs.map(dd=>`<div class="docrow"><span class="dn">📄 ${dd}</span><span class="dk">source vérifiée</span></div>`).join("")}
      <div class="sub" style="margin-top:8px">Ajoutez de nouvelles pièces via le module Document AI : extraction et mise à jour automatiques.</div></div>`:""}
    <div class="section-title">Notes d'analyse</div>
    <div class="card" style="line-height:1.7;color:var(--dim)">${e.notes}</div>
    <div class="section-title">Hypothèses ajustables</div>
    <div class="card">
      <label class="lbl">Valeur vénale (€)</label><input class="inp" type="number" id="tw-mv" value="${e.marketValue}">
      <label class="lbl">Trésorerie + placements (€)</label><input class="inp" type="number" id="tw-cash" value="${e.cash+e.finAssets}">
      <label class="lbl">Loyer annuel (€)</label><input class="inp" type="number" id="tw-rent" value="${e.rent}">
      <div style="margin-top:14px"><button class="btn gold" onclick="saveTwin('${e.id}')">Enregistrer & recalculer</button></div>
    </div>`;
  $("#twin").classList.add("open");
  // graphes historiques
  setTimeout(()=>{
    if(h.years&&(h.rn||h.ca)){
      const ds=[];
      if(h.ca) ds.push({label:"CA",data:h.ca,borderColor:"#5CE6A1",tension:.35,borderWidth:2,pointRadius:2});
      if(h.rn) ds.push({label:"Résultat net",data:h.rn,borderColor:e.color,backgroundColor:e.color+"22",fill:!h.ca,tension:.35,borderWidth:2,pointRadius:2});
      if(h.cp) ds.push({label:"Capitaux propres",data:h.cp,borderColor:"#FFC861",tension:.35,borderWidth:2,pointRadius:2});
      chart("tw-ch1",{type:"line",data:{labels:h.years,datasets:ds},
        options:{maintainAspectRatio:false,plugins:{legend:LEG,tooltip:{callbacks:{label:x=>x.dataset.label+" : "+fmtK(x.parsed.y)}}},scales:{x:AXC,y:{...AXC,ticks:{...AXC.ticks,callback:v=>fmtK(v)}}}}});
    }
    if(h.years&&h.debt){
      chart("tw-ch2",{type:"bar",data:{labels:h.years,datasets:[{label:"Dette CRD",data:h.debt,backgroundColor:"rgba(255,107,90,.5)",borderRadius:4},
        ...(h.cash?[{label:"Trésorerie",data:h.cash,backgroundColor:"rgba(111,227,255,.5)",borderRadius:4}]:[])]},
        options:{maintainAspectRatio:false,plugins:{legend:LEG,tooltip:{callbacks:{label:x=>x.dataset.label+" : "+fmtK(x.parsed.y)}}},scales:{x:AXC,y:{...AXC,ticks:{...AXC.ticks,callback:v=>fmtK(v)}}}}});
    }
    if(e.loans.length){
      const yrs=[],crd=[]; for(let y=YEAR_NOW;y<=2042;y++){ yrs.push(y); crd.push(e.loans.reduce((s,l)=>s+Engine.loanCRD(l,y),0)); }
      chart("tw-ch3",{type:"line",data:{labels:yrs,datasets:[{label:"CRD projeté",data:crd,borderColor:"#FF6B5A",backgroundColor:"rgba(255,107,90,.12)",fill:true,tension:.3,borderWidth:2,pointRadius:0}]},
        options:{maintainAspectRatio:false,plugins:{legend:LEG,tooltip:{callbacks:{label:x=>fmtK(x.parsed.y)}}},scales:{x:AXC,y:{...AXC,ticks:{...AXC.ticks,callback:v=>fmtK(v)}}}}});
    }
  },60);
}
function openLoanTwin(eid,k){
  const e=Engine.entity(eid); if(!e||!e.loans[k]) return;
  const l=e.loans[k];
  const yearNow=2026, yearsLeft=Math.max(0,(l.end||2040)-yearNow);
  const interests=Math.round(l.crd*(l.rate||0));
  const amort=l.amortYear||Math.round(l.crd/Math.max(1,yearsLeft));
  const annuity=amort+interests;
  const rentShare=e.rent>0?annuity/e.rent:null;
  const proj=[]; let crd=l.crd;
  for(let y=yearNow;y<=Math.min(l.end||yearNow+20, yearNow+20);y++){ proj.push({y,crd:Math.max(0,Math.round(crd))}); crd-=amort; }
  $("#twin-body").innerHTML=`
    <div style="font-size:10px;color:var(--faint);letter-spacing:.2em;text-transform:uppercase">Lune de ${e.name} · Emprunt ${k+1}/${e.loans.length}</div>
    <h2 style="font-family:var(--disp);font-size:25px;letter-spacing:.06em;color:#CFE0F8;text-shadow:0 0 20px rgba(190,220,255,.4);margin:4px 0 6px">${l.bank||"Emprunt"}</h2>
    <div style="font-size:12px;color:var(--dim);margin-bottom:8px">${l.label||""} · Échéance ${l.end||"—"}</div>
    <span class="pill ${rentShare!=null&&rentShare>.8?"warn":"info"}">${rentShare!=null?"Service de dette "+pct(rentShare)+" du loyer":"Portage holding"}</span>
    <div class="grid g2" style="margin-top:16px">
      <div class="card"><h3>Capital restant dû</h3><div class="kpi red">${fmtK(l.crd)}</div><div class="sub">Taille de la lune ∝ CRD</div></div>
      <div class="card"><h3>Taux</h3><div class="kpi">${l.rate!=null?(l.rate*100).toFixed(2)+" %":"—"}</div><div class="sub">${l.fixed===false?"Variable":"Fixe"}</div></div>
      <div class="card"><h3>Amortissement / an</h3><div class="kpi cyan">${fmtK(amort)}</div><div class="sub">≈ création de valeur annuelle par désendettement</div></div>
      <div class="card"><h3>Intérêts / an</h3><div class="kpi">${fmtK(interests)}</div><div class="sub">Annuité ≈ ${fmtK(annuity)}</div></div>
    </div>
    <div class="section-title">Trajectoire du capital restant dû</div>
    <div class="card"><canvas id="loan-ch" height="170"></canvas></div>
    <div class="section-title">Lecture stratégique</div>
    <div class="card" style="line-height:1.7;color:var(--dim)">
      ${rentShare!=null
        ? `Le loyer de ${e.name} couvre l'annuité ${rentShare<.6?"très confortablement":rentShare<.85?"correctement":"avec peu de marge"} (${pct(rentShare)}). Chaque année, ${fmtK(amort)} de dette deviennent de la valeur nette — c'est la lune qui rétrécit pendant que la planète garde sa masse.`
        : `Emprunt porté sans loyer dédié — surveiller la trésorerie du véhicule.`}
      ${yearsLeft>0?` Extinction prévue en ${l.end} (${yearsLeft} ans).`:""}
    </div>
    <div style="margin-top:14px"><button class="btn" onclick="galaxyFocus('${e.id}');openTwin('${e.id}')">← Voir ${e.name}</button></div>`;
  $("#twin").classList.add("open");
  const ctx=$("#loan-ch");
  if(ctx&&window.Chart){
    new Chart(ctx,{type:"line",data:{labels:proj.map(p=>p.y),datasets:[{label:"CRD",data:proj.map(p=>p.crd),
      borderColor:"#FF8A7A",borderWidth:2.5,pointRadius:0,fill:true,tension:.35,
      backgroundColor:c2=>{const a=c2.chart.chartArea;if(!a)return"rgba(255,107,90,.1)";
        const g=c2.chart.ctx.createLinearGradient(0,a.top,0,a.bottom);
        g.addColorStop(0,"rgba(255,107,90,.30)");g.addColorStop(1,"rgba(255,107,90,0)");return g;}}]},
      options:{plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{ticks:{callback:v=>fmtK(v)}}}}});
  }
}
let _navPT=null;
function navPressStart(ev){ _navPT=setTimeout(()=>{ if(navigator.vibrate)navigator.vibrate(12); openNavCard(); }, 420); }
function navPressEnd(){ if(_navPT){ clearTimeout(_navPT); _navPT=null; } }
function openNavCard(){
  const c=Engine.consolidate(), p=Engine.project();
  // annee de croisement NAV > dette
  let cross=null; for(let i=0;i<p.years.length;i++){ if(p.navS[i]>=p.debtS[i]){ cross=p.years[i]; break; } }
  const nav0=p.navS[0], nav5=p.navS[Math.min(5,p.navS.length-1)], nav10=p.navS[Math.min(10,p.navS.length-1)];
  $("#twin-body").innerHTML=`
    <div style="font-size:10px;color:var(--faint);letter-spacing:.2em;text-transform:uppercase">Actif Net Réévalué · trajectoire de désendettement</div>
    <h2 style="margin:6px 0 2px;font-size:30px;color:var(--sun-hi)">${fmtM(c.nav)}</h2>
    <div class="sub" style="margin-bottom:12px">Composition : QP d'ANR des véhicules + comptes courants + trésorerie holding</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
      <div class="ck" style="min-width:0"><div class="l">Patrimoine brut QP</div><div class="v">${fmtM(c.grossAssets)}</div></div>
      <div class="ck" style="min-width:0"><div class="l">− Dette QP</div><div class="v red">${fmtM(c.debtQP)}</div></div>
      <div class="ck" style="min-width:0"><div class="l">LTV</div><div class="v ${c.ltv>0.7?'warn':'green'}">${pct(c.ltv)}</div></div>
    </div>
    <div class="chart-box tall"><canvas id="nav-proj-ch"></canvas></div>
    <div class="sub" style="margin-top:10px">La NAV (or) croît par amortissement ; la dette (rouge) décroît à mesure que les loyers remboursent le capital.${cross?` <b style="color:var(--sun-hi)">Croisement estimé en ${cross}</b> — au-delà, tes fonds propres dépassent ta dette.`:''}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px">
      <div class="ck" style="min-width:0"><div class="l">Aujourd'hui</div><div class="v">${fmtM(nav0)}</div></div>
      <div class="ck" style="min-width:0"><div class="l">+5 ans</div><div class="v green">${fmtM(nav5)}</div></div>
      <div class="ck" style="min-width:0"><div class="l">+10 ans</div><div class="v green">${fmtM(nav10)}</div></div>
    </div>`;
  $("#twin").classList.add("open");
  const ctx=$("#nav-proj-ch");
  if(ctx&&window.Chart){
    new Chart(ctx,{type:"line",data:{labels:p.years,datasets:[
      {label:"NAV "+DATA.meta.brand,data:p.navS,borderColor:"#FFC861",backgroundColor:gradFill("#FFC861","48","00"),fill:true,borderWidth:2.8,pointRadius:0,tension:.35},
      {label:"Dette QP",data:p.debtS,borderColor:"#FF6B5A",borderWidth:2,pointRadius:0,tension:.3,borderDash:[5,4]}]},
      options:{maintainAspectRatio:false,interaction:{mode:"index",intersect:false},
        plugins:{legend:{display:true,labels:{color:"#9FB4D8",boxWidth:12,font:{size:10}}},
          tooltip:{callbacks:{label:x=>x.dataset.label+" : "+fmtM(x.parsed.y)}}},
        scales:{x:{grid:{display:false},ticks:{color:"#5A6B8C",maxTicksLimit:8}},y:{grid:{color:"rgba(90,107,140,.12)"},ticks:{color:"#5A6B8C",callback:v=>fmtM(v)}}}}});
  }
}
function openHoldingTwin(){
  const c=Engine.consolidate(), h=DATA.holding;
  $("#twin-body").innerHTML=`
    <div style="font-size:10px;color:var(--faint);letter-spacing:.2em;text-transform:uppercase">${h.kicker||""}</div>
    <h2 style="font-family:var(--disp);font-size:27px;letter-spacing:.06em;color:var(--sun-hi);text-shadow:0 0 24px rgba(255,200,97,.5);margin:4px 0 6px">${DATA.meta.brandDisplay}</h2>
    <div style="font-size:12px;color:var(--dim);margin-bottom:8px">${h.sub||""}</div>
    <span class="pill info">Étoile centrale</span>
    <div class="grid g2" style="margin-top:16px">
      <div class="card gold"><h3>NAV consolidée</h3><div class="kpi gold">${fmtM(c.nav)}</div><div class="sub">Le diamètre du soleil suit cette valeur</div></div>
      <div class="card"><h3>Consolidé perso</h3><div class="kpi">${fmtM(c.perso)}</div><div class="sub">${((h.personal&&h.personal.items)||[]).map(i=>"+ "+i.lbl+" "+(i.f==="k"?fmtK(i.v):fmt(i.v))).join(" ")}</div></div>
      <div class="card"><h3>Trésorerie holding</h3><div class="kpi cyan">${fmtK(h.cash)}</div><div class="sub">Charges ${fmt(h.monthlyCharges)}${h.chargesNote||""}</div></div>
      <div class="card"><h3>CC à récupérer</h3><div class="kpi cyan">${fmtK(c.ccHP)}</div><div class="sub">${DATA.entities.length} flux lumineux convergent vers l'étoile — extraction sans flat tax</div></div>
      <div class="card"><h3>Loyers QP</h3><div class="kpi green">${fmtK(c.rentQP)}<small> /an</small></div><div class="sub">Cash-flow QP ${fmtK(c.holdingCF)}/an · LTV ${pct(c.ltv)}</div></div>
      <div class="card"><h3>Dette QP</h3><div class="kpi red">${fmtM(c.debtQP)}</div><div class="sub">100% véhicules : ${fmtM(c.debt100)}</div></div>
    </div>
    <div class="section-title">Doctrine du groupe</div>
    <div class="card" style="line-height:1.7;color:var(--dim)">${DATA.ui.doctrine}</div>
    <div class="section-title">Système</div>
    <div class="card"><table class="dt"><tbody>
      ${DATA.entities.map(e=>`<tr style="cursor:pointer" onclick="galaxyFocus('${e.id}');openTwin('${e.id}')"><td style="color:${e.color}">${e.name}</td><td class="r">${pct(e.stake)}</td><td class="r" style="color:var(--sun)">${fmtK(Engine.navShare(e))}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="section-title">Hypothèses holding</div>
    <div class="card">
      <label class="lbl">Trésorerie ${DATA.meta.brand} (€)</label><input class="inp" type="number" id="hd-cash" value="${h.cash}">
      <div style="margin-top:14px"><button class="btn gold" onclick="saveHolding()">Enregistrer & recalculer</button></div>
    </div>`;
  $("#twin").classList.add("open");
}
async function saveHolding(){
  DATA.holding.cash=+$("#hd-cash").value||0;
  await Store.save(DATA); renderAll();
  toast("Trésorerie holding mise à jour — le soleil s'ajuste");
  openHoldingTwin();
}
async function saveTwin(id){
  const e=Engine.entity(id);
  e.marketValue=+$("#tw-mv").value||0;
  e.cash=+$("#tw-cash").value||0; e.finAssets=0;
  e.rent=+$("#tw-rent").value||0;
  const where=await Store.save(DATA);
  renderAll(); openTwin(id);
  toast("Hypothèses enregistrées ("+(where==="cloud"?"stockage distant":where==="local"?"cet appareil":"session")+") — recalcul effectué");
}

