/* ============ STORAGE ============ */
const Store = {
  KEY:(window.STELLAR_DEMO===true?"stellar_demo_v2":"hp-stellar-v2"), OLD:(window.STELLAR_DEMO===true?"stellar_demo_v1":"hp-stellar-v1"), mem:null,
  async load(){
    try{ if(window.storage){ const r=await window.storage.get(this.KEY).catch(()=>null); if(r&&r.value) return JSON.parse(r.value);
         const o=await window.storage.get(this.OLD).catch(()=>null); if(o&&o.value) return JSON.parse(o.value); } }catch(e){}
    try{ if(window.localStorage){ const r=localStorage.getItem(this.KEY)||localStorage.getItem(this.OLD); if(r) return JSON.parse(r);} }catch(e){}
    return this.mem;
  },
  async save(d){
    this.mem=d;
    try{ if(window.storage){ await window.storage.set(this.KEY, JSON.stringify(d)); return "cloud";} }catch(e){}
    try{ if(window.localStorage){ localStorage.setItem(this.KEY, JSON.stringify(d)); return "local";} }catch(e){}
    return "mem";
  }
};
let DATA = JSON.parse(JSON.stringify(DEFAULT_DATA));

