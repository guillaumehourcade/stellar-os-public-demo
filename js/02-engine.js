/* ============ MOTEUR FINANCIER ============ */
const fmt = n => (n==null||isNaN(n))?"—":Math.round(n).toLocaleString("fr-FR")+" €";
const fmtK = n => (n==null||isNaN(n))?"—":(Math.round(n/1000).toLocaleString("fr-FR"))+" k€";
const fmtM = n => (n==null||isNaN(n))?"—":(n/1e6).toLocaleString("fr-FR",{maximumFractionDigits:2})+" M€";
const pct = n => (n*100).toLocaleString("fr-FR",{maximumFractionDigits:2})+" %";
const sgn = n => (n>=0?"+":"")+fmtK(n);

const Engine = {
  entity(id){ return DATA.entities.find(e=>e.id===id); },
  debt(e){ return e.loans.reduce((s,l)=>s+l.crd,0); },
  debtService(e){ return e.loans.reduce((s,l)=>s+l.amortYear+l.crd*l.rate/100,0); },
  entityNet(e){ return e.marketValue + e.cash + e.finAssets - this.debt(e) - e.ccTotal; },
  navShare(e){ return this.entityNet(e)*e.stake + e.ccHP; },
  entityCF(e){ return e.rent - this.debtService(e); },
  loanCRD(l, year){ const y=Math.max(0,year-YEAR_NOW); return Math.max(0, l.crd - l.amortYear*y); },
  consolidate(){
    let nav=DATA.holding.cash, grossAssets=DATA.holding.cash, gross100=DATA.holding.cash, debtQP=0, debt100=0,
        cashQP=DATA.holding.cash, rentQP=0, rent100=0, ccHP=0, assetValQP=0, cfQP=0;
    DATA.entities.forEach(e=>{
      const d=this.debt(e);
      nav += this.navShare(e);
      grossAssets += (e.marketValue+e.cash+e.finAssets)*e.stake + e.ccHP;
      gross100 += e.marketValue+e.cash+e.finAssets;
      debtQP += d*e.stake; debt100 += d;
      cashQP += (e.cash+e.finAssets)*e.stake;
      rentQP += e.rent*e.stake; rent100 += e.rent;
      ccHP += e.ccHP;
      assetValQP += e.marketValue*e.stake;
      cfQP += this.entityCF(e)*e.stake;
    });
    const holdingCF = cfQP - DATA.holding.monthlyCharges*12;
    const ltv = assetValQP>0 ? debtQP/assetValQP : 0;
    const perso = nav + ((DATA.holding.personal&&DATA.holding.personal.items)||[]).reduce((s,i)=>s+(+i.v||0),0);
    return {nav, grossAssets, gross100, debtQP, debt100, cashQP, rentQP, rent100, ccHP, holdingCF, ltv, assetValQP, cfQP, perso};
  },
  project(){
    const years=[], navS=[], debtS=[], rentS=[], cfS=[];
    for(let y=YEAR_NOW;y<=2045;y++){
      let nav=DATA.holding.cash, debt=0, rent=0, cf=0;
      DATA.entities.forEach(e=>{
        const d=e.loans.reduce((s,l)=>s+this.loanCRD(l,y),0);
        const svc=e.loans.reduce((s,l)=>{const c=this.loanCRD(l,y); return s+(c>0?l.amortYear+c*l.rate/100:0);},0);
        const idx=Math.pow(1.0175, y-YEAR_NOW);
        const r=(e.rentRamp && y===e.rentRamp.y)?e.rent*e.rentRamp.k:e.rent*idx;
        nav += (e.marketValue + e.cash + e.finAssets - d - e.ccTotal)*e.stake + e.ccHP;
        debt += d*e.stake; rent += r*e.stake; cf += (r-svc)*e.stake;
      });
      years.push(y); navS.push(nav); debtS.push(debt); rentS.push(rent); cfS.push(cf - DATA.holding.monthlyCharges*12);
    }
    return {years, navS, debtS, rentS, cfS};
  },
  loanSchedule(){
    const rows=[]; DATA.entities.forEach(e=>e.loans.forEach(l=>rows.push({entity:e.name, color:e.color, ...l})));
    return rows.sort((a,b)=>a.end-b.end);
  }
};

/* ============ UI HELPERS ============ */
const $ = s=>document.querySelector(s);
const CH={};
function chart(id,cfg){ if(CH[id]) CH[id].destroy(); const el=document.getElementById(id); if(!el) return; CH[id]=new Chart(el,cfg); }
function toast(t){ const e=$("#toast"); e.textContent=t; e.classList.add("show"); clearTimeout(e._t); e._t=setTimeout(()=>e.classList.remove("show"),2800); }
function riskPill(r){ return r==="risk"?'<span class="pill risk">Alerte</span>':r==="warn"?'<span class="pill warn">Vigilance</span>':'<span class="pill ok">Sain</span>'; }
const AXC={ticks:{color:"#5A6E92",font:{family:"IBM Plex Mono",size:10}},grid:{color:"rgba(111,227,255,.05)"}};
const LEG={labels:{color:"#93A7C6",font:{family:"IBM Plex Mono",size:10},boxWidth:9}};

