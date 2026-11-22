const TTL=30*60*1000, cache=new Map();
function validWebUrl(raw){try{return ['http:','https:'].includes(new URL(raw).protocol)}catch{return false}}
async function getJson(url,fetchImpl=global.fetch){const c=new AbortController(),timer=setTimeout(()=>c.abort(),8000);try{const r=await fetchImpl(url,{signal:c.signal,headers:{'user-agent':'OpportunityShield/1.0 (student opportunity discovery)','accept':'application/json'}});if(!r.ok)throw Error(`HTTP ${r.status}`);const raw=await r.text();if(Buffer.byteLength(raw)>8*1024*1024)throw Error('Response exceeds 8 MB');return JSON.parse(raw)}finally{clearTimeout(timer)}}
async function cached(key,loader,now=Date.now()){const old=cache.get(key);if(old&&old.until>now)return old.promise;const promise=Promise.resolve().then(loader).then(items=>({items,error:null,fetchedAt:new Date().toISOString()}),e=>({items:[],error:e.message||'unavailable',fetchedAt:new Date().toISOString()}));cache.set(key,{until:now+TTL,promise});return promise}
function resetCache(){cache.clear()}
module.exports={getJson,cached,resetCache,validWebUrl};
