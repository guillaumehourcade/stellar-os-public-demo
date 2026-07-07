/* ============ DATA ROOM : complétude par véhicule ============ */
/* Les familles de pièces attendues vivent dans les données (docExpected). */
const DOC_EXPECTED=DEFAULT_DATA.docExpected;
function docCompleteness(e){
  const hay=(e.docs||[]).join(" • ").toLowerCase();
  const got=DOC_EXPECTED.map(([label,keys])=>keys.some(k=>hay.includes(k)));
  const n=got.filter(Boolean).length;
  return {got, n, pct:n/DOC_EXPECTED.length};
}
function renderDataRoom(){
  const box=$("#dataroom"); if(!box) return;
  box.innerHTML=DATA.entities.map(e=>{
    const c=docCompleteness(e);
    const led=c.pct>=.99?"led-g":c.pct>=.5?"led-o":"led-r";
    const rows=DOC_EXPECTED.map((d2,i)=>`<div class="dr-doc ${c.got[i]?'have':'miss'}"><span class="dot">${c.got[i]?'✓':'○'}</span><div><b>${d2[0]}</b><span class="hint">${d2[2]}</span></div></div>`).join("");
    return `<div class="dr-row" onclick="this.classList.toggle('open')">
      <span class="led ${led}"></span>
      <b style="color:${e.color}">${e.name}</b>
      <div class="dr-bar"><div class="dr-fill ${led}" style="width:${Math.round(c.pct*100)}%"></div></div>
      <span class="dr-pct">${c.n}/${DOC_EXPECTED.length}</span>
      <div class="dr-miss">${c.n<DOC_EXPECTED.length?`<div class="dr-head">${DOC_EXPECTED.length-c.n} pièce(s) manquante(s) pour finaliser la data room :</div>`:`<div class="dr-head ok">Data room complète — prête pour le banquier ✓</div>`}<div class="dr-docs">${rows}</div></div>
    </div>`;
  }).join("");
}
/* ============ DOCUMENT AI ============ */
let DOC_STATE={file:null, extracted:null};
function renderDocAI(){
  if($("#dropzone")) return;
  $("#docai-pad").innerHTML=`
  <div class="section-title">Document AI — les documents deviennent la source de vérité</div>
  <div class="card">
    <div id="dropzone" onclick="demoDocMessage()">
      <div class="big">DÉPOSER UN DOCUMENT</div>
      <div class="sub">Bilan · liasse · bail · expertise · AG · relevé — PDF, image, Excel (xlsx/csv)</div>
    </div>
    <div class="pipe">
      <span class="pstep" id="ps1">1 · Lecture</span><span class="parrow">→</span>
      <span class="pstep" id="ps2">2 · Extraction IA</span><span class="parrow">→</span>
      <span class="pstep" id="ps3">3 · Proposition</span><span class="parrow">→</span>
      <span class="pstep" id="ps4">4 · Application base</span><span class="parrow">→</span>
      <span class="pstep" id="ps5">5 · KPIs & projections recalculés</span>
    </div>
    <div id="doc-out" class="sub" style="min-height:24px">Le système lit le document, en extrait les chiffres clés, identifie le véhicule concerné et vous propose la mise à jour. Rien n'est appliqué sans votre validation.</div>
  </div>
  <div class="section-title">Data room — complétude documentaire par véhicule</div>
  <div class="card sub" style="margin-bottom:10px">Chaque véhicule attend 6 familles de pièces. Le voyant passe au vert quand la data room est complète — les pièces déposées ci-dessus sont rattachées automatiquement.</div>
  <div id="dataroom"></div>
  <div id="doc-proposal"></div>`;
  renderDataRoom();
  const dz=$("#dropzone");
  ["dragover","dragenter"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("over");}));
  ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("over");}));
  dz.addEventListener("drop",e=>{ demoDocMessage(); });
}
function demoDocMessage(){
  /* Démo publique : aucun fichier n'est lu, stocké ni transmis. */
  pstep(0); $("#doc-proposal").innerHTML="";
  $("#doc-out").innerHTML="🛰 <b>Import réel désactivé en démo publique — simulation disponible.</b> Dans la version complète, le document déposé est lu localement, ses chiffres clés sont extraits puis proposés à la validation avant application à la base.";
}
function pstep(n,state){ for(let i=1;i<=5;i++){ const el=$("#ps"+i); el.classList.remove("on","done"); if(i<n) el.classList.add("done"); if(i===n&&state!=="done") el.classList.add("on"); if(i<=n&&state==="done") el.classList.add("done"); } }
async function handleDoc(){ demoDocMessage(); }
async function applyDoc(){
  const x=DOC_STATE.extracted; if(!x) return;
  const e=Engine.entity($("#doc-ent").value); if(!e) return;
  pstep(4);
  const take=k=>{ const cb=$("#dk-"+k); return cb&&cb.checked ? +($("#dv-"+k).value) : null; };
  let n=0;
  const mv=take("valeur_venale"); if(mv!=null){e.marketValue=mv;n++;}
  const tr=take("tresorerie"); if(tr!=null){e.cash=tr;e.finAssets=0;n++;}
  const lo=take("loyer_annuel"); if(lo!=null){e.rent=lo;n++;}
  const cc=take("cc_holding"); if(cc!=null){e.ccHP=cc;n++;}
  const rn=take("resultat_net"); if(rn!=null){e.result=rn;n++;}
  const dc=take("dette_crd"); if(dc!=null&&e.loans.length){ const tot=Engine.debt(e)||1; e.loans.forEach(l=>l.crd=Math.round(dc*l.crd/tot)); n++; }
  if(DOC_STATE.file) (e.docs=e.docs||[]).unshift("📥 "+DOC_STATE.file.name+" ("+new Date().toLocaleDateString("fr-FR")+")");
  await Store.save(DATA);
  pstep(5,"done");
  $("#doc-out").innerHTML="<span style='color:var(--ok)'>✓ "+n+" champ(s) appliqué(s) à "+e.name+" — NAV, KPIs et projections recalculés. Le Neural Ledger raisonne désormais sur ces données.</span>";
  $("#doc-proposal").innerHTML="";
  renderAll(); renderDataRoom(); toast("Base patrimoniale mise à jour depuis « "+(DOC_STATE.file?DOC_STATE.file.name:"document")+" »");
}

/* ============ NEURAL LEDGER ============ */
const CHAT=[];
function renderNeural(){
  if($("#chat-log")) return;
  $("#neural-pad").innerHTML=`
  <div class="section-title">${DATA.ai.neuralTitle}</div>
  <div class="card">
    <div id="chat-log"><div class="msg a">${DATA.ai.neuralWelcome}</div></div>
    <div id="chat-row">
      <input class="inp" id="chat-inp" placeholder="Posez votre question patrimoniale…" onkeydown="if(event.key==='Enter')askNeural()">
      <button class="btn gold" onclick="askNeural()">Envoyer</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      ${DATA.ai.chips.map(c2=>`<button class="chip" onclick="quickAsk('${c2.q}')">${c2.lbl}</button>`).join("\r\n      ")}
    </div>
  </div>`;
}
function quickAsk(q){ $("#chat-inp").value=q; askNeural(); }
function addMsg(cls,txt){ const d=document.createElement("div"); d.className="msg "+cls; d.textContent=txt; $("#chat-log").appendChild(d); $("#chat-log").scrollTop=1e9; return d; }
async function askNeural(){
  /* Version publique de démonstration : copilote IA désactivé — stub local, aucun appel réseau. */
  const inp=$("#chat-inp"), q=inp.value.trim(); if(!q) return;
  inp.value=""; addMsg("u",q);
  const c=Engine.consolidate();
  addMsg("a","🛰 Copilote IA désactivé dans cette version démo. Moteur local : NAV "+fmtM(c.nav)+" · dette QP "+fmtM(c.debtQP)+" · LTV "+pct(c.ltv)+" · CF QP "+fmtK(c.holdingCF)+"/an. Toutes les données affichées sont fictives.");
  $("#chat-log").scrollTop=1e9;
}

