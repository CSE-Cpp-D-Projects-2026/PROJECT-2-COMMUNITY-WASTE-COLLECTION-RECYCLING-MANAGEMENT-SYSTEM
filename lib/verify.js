const dns = require('node:dns').promises;
const net = require('node:net');
const tls = require('node:tls');
const cheerio = require('cheerio');
const refs = require('../data/references.json');
const LIMIT = 2 * 1024 * 1024;
const shorteners = ['bit.ly','tinyurl.com','t.co','goo.gl','ow.ly','is.gd'];
const companySearchCache=new Map(), COMPANY_SEARCH_TTL=30*60*1000;
const twoLevelSuffixes=new Set(['co.in','ac.in','org.in','net.in','gov.in','firm.in','edu.in','res.in','gen.in','co.uk','ac.uk','org.uk','gov.uk','me.uk','com.au','net.au','org.au','edu.au','gov.au','co.nz','org.nz','ac.nz','com.sg','com.my','com.hk','com.cn','co.jp','co.kr','com.br','com.mx','co.za']);
const matchesDomain = (host, domains) => domains.some(d => host === d || host.endsWith(`.${d}`));
function registrableDomain(host){const value=String(host||'').trim().toLowerCase().replace(/\.$/,'');if(net.isIP(value))return value;const labels=value.split('.').filter(Boolean);if(labels.length<=2)return value;const suffix=labels.slice(-2).join('.');return twoLevelSuffixes.has(suffix)?labels.slice(-3).join('.'):labels.slice(-2).join('.')}
function blocked(ip) {
  if (net.isIPv4(ip)) { const [a,b] = ip.split('.').map(Number); return a===10 || a===127 || a===0 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&b===168) || a>=224; }
  return net.isIPv6(ip) && (ip==='::1' || ip==='::' || ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd') || ip.toLowerCase().startsWith('fe80:'));
}
async function safeUrl(raw) {
  let u; try { u = new URL(raw); } catch { throw Error('Invalid link'); }
  if (!['http:','https:'].includes(u.protocol) || u.username || u.password) throw Error('Only public HTTP/HTTPS links are allowed');
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || net.isIP(host) && blocked(host)) throw Error('Private or local links are blocked');
  let ips; try { ips = net.isIP(host) ? [{address:host}] : await dns.lookup(host,{all:true}); } catch { throw Error('Link could not be reached'); }
  if (!ips.length || ips.some(x=>blocked(x.address))) throw Error('Private or local links are blocked');
  return u;
}
async function fetchPage(raw) {
  let u = await safeUrl(raw);
  for(let n=0;n<=3;n++) {
    const controller = new AbortController(), timer=setTimeout(()=>controller.abort(),8000);
    try {
      const res=await fetch(u,{redirect:'manual',signal:controller.signal,headers:{'user-agent':'OpportunityShield/1.0'}});
      if([301,302,303,307,308].includes(res.status)) { const loc=res.headers.get('location'); if(!loc||n===3) throw Error('Too many redirects'); u=await safeUrl(new URL(loc,u).href); continue; }
      if(!res.ok) throw Error('Link could not be reached');
      const reader=res.body.getReader(); let bytes=[],size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>LIMIT){await reader.cancel();throw Error('Page exceeds 2 MB');}bytes.push(value);}
      const html=Buffer.concat(bytes).toString('utf8'); const $=cheerio.load(html); const title=$('title').first().text().trim(); const description=$('meta[name="description"],meta[property="og:description"]').first().attr('content')||''; $('script,style,noscript').remove();
      return {url:u.href,host:u.hostname.toLowerCase(),title,description,text:$.text().replace(/\s+/g,' ').trim(),fetchedAt:new Date().toISOString()};
    } finally { clearTimeout(timer); }
  }
}
async function checkDomainAge(host,fetchImpl=global.fetch){
  const original=String(host||'').trim().toLowerCase().replace(/\.$/,'');const domain=registrableDomain(original);
  const lookup=async target=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const r=await fetchImpl(`https://rdap.org/domain/${encodeURIComponent(target)}`,{signal:controller.signal,headers:{'user-agent':'OpportunityShield/1.0','accept':'application/rdap+json, application/json'}});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json()}finally{clearTimeout(timer)}};
  try{
    let data;try{data=await lookup(original)}catch(first){if(domain===original)throw Error(`RDAP lookup failed for ${domain}: ${first.message}`);try{data=await lookup(domain)}catch(second){throw Error(`RDAP lookup failed for ${domain} after subdomain retry: ${second.message}`)}}
    const event=(data.events||[]).find(e=>/registration/i.test(e.eventAction||''));if(!event)throw Error('Registration date unavailable');const registered=new Date(event.eventDate);if(Number.isNaN(registered.getTime()))throw Error('Invalid registration date');const registrar=(data.entities||[]).find(e=>(e.roles||[]).includes('registrar'));const vcard=registrar&&registrar.vcardArray&&registrar.vcardArray[1]||[];const org=vcard.find(v=>v[0]==='fn'||v[0]==='org');const days=Math.floor((Date.now()-registered.getTime())/86400000);return {result:days<90?'Warning':'Match',severity:days<90?'medium':'info',ageDays:days,registeredAt:registered.toISOString(),registrar:org?String(org[3]):(registrar&&registrar.handle)||'Not listed',queriedDomain:domain}
  }catch(e){return {result:'Unknown',severity:'low',reason:e.name==='AbortError'?'RDAP lookup timed out':e.message||'RDAP lookup unavailable'}}
}
async function inspectCertificate(raw){try{const u=await safeUrl(raw);if(u.protocol!=='https:')return {result:'Unknown',severity:'low',reason:'Link does not use HTTPS'};const rows=await dns.lookup(u.hostname,{all:true});const ip=rows.find(x=>!blocked(x.address));if(!ip)throw Error('Public host address unavailable');return await new Promise(resolve=>{const socket=tls.connect({host:ip.address,family:ip.family,port:Number(u.port)||443,servername:u.hostname,rejectUnauthorized:false},()=>{const cert=socket.getPeerCertificate(),from=Date.parse(cert.valid_from),to=Date.parse(cert.valid_to),identity=tls.checkServerIdentity(u.hostname,cert),timeOk=Number.isFinite(from)&&Number.isFinite(to)&&Date.now()>=from&&Date.now()<=to;const valid=Boolean(cert.raw)&&timeOk&&!identity&&socket.authorized;resolve({result:valid?'Match':'Warning',severity:valid?'info':'medium',valid,validFrom:cert.valid_from||null,validTo:cert.valid_to||null,issuer:cert.issuer&&Object.values(cert.issuer).join(', ')||'Not listed',reason:valid?'Certificate is valid and trusted':identity?identity.message:socket.authorizationError||(!timeOk?'Certificate is outside its validity dates':'Certificate could not be trusted')});socket.end()});socket.setTimeout(8000,()=>{socket.destroy(Error('Certificate lookup timed out'))});socket.on('error',e=>resolve({result:'Unknown',severity:'low',reason:e.message||'Certificate lookup unavailable'}))})}catch(e){return {result:'Unknown',severity:'low',reason:e.message||'Certificate lookup unavailable'}}}
function companySearchLinks(name=''){const specs=[['MCA company search','https://www.mca.gov.in/content/mca/global/en/mca/fo-llp-services/company-llp-name-search.html',null],['LinkedIn','https://www.linkedin.com/search/results/companies/','keywords'],['Glassdoor','https://www.glassdoor.com/Search/results.htm','keyword'],['AmbitionBox','https://www.ambitionbox.com/search','q'],['Google internship reviews','https://www.google.com/search','q']];return specs.map(([label,base,param])=>{const u=new URL(base);if(param){const q=label==='Google internship reviews'?(name?`${name} internship reviews`:''):name;if(q)u.searchParams.set(param,q)}return {label,url:u.href,external:true,note:'External site, not verified by OpportunityShield'}})}
function resetCompanySearchCache(){companySearchCache.clear()}
async function searchEvidence(orgName,key=process.env.SEARCH_API_KEY,fetchImpl=global.fetch,now=Date.now()){if(!key)return {enabled:false,status:'Unknown',note:'Add a search key to enable web search',queries:[],results:[]};if(!orgName)return {enabled:true,status:'Unknown',note:'Company could not be identified',queries:[],results:[]};const cacheKey=orgName.trim().toLowerCase(),cached=companySearchCache.get(cacheKey);if(cached&&cached.until>now)return cached.promise;const queries=[`${orgName} official website`,`${orgName} LinkedIn`,`${orgName} internship reviews`];const promise=(async()=>{const groups=await Promise.all(queries.map(async query=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const u=new URL('https://api.search.brave.com/res/v1/web/search');u.searchParams.set('q',query);u.searchParams.set('count','5');const r=await fetchImpl(u,{signal:controller.signal,headers:{'X-Subscription-Token':key,'Accept':'application/json','User-Agent':'OpportunityShield/1.0'}});if(!r.ok)throw Error(`Search HTTP ${r.status}`);const data=await r.json();const results=(data.web?.results||[]).slice(0,5).map(x=>({title:x.title,url:x.url,description:x.description||'',fetchedAt:new Date().toISOString()}));return {query,status:'Match',results}}catch{return {query,status:'Unknown',results:[]}}finally{clearTimeout(timer)}}));const failed=groups.some(g=>g.status==='Unknown');return {enabled:true,status:failed?'Unknown':'Match',note:failed?'One or more searches could not be reached; results are Unknown.':'Leads to read yourself, not proof',queries:groups,results:groups.flatMap(g=>g.results)}})();companySearchCache.set(cacheKey,{until:now+COMPANY_SEARCH_TTL,promise});return promise}
function buildCompanyCheck(evidence,orgName,org,links,search){const name=(orgName||org?.name||'').trim(),inText=Boolean(name&&evidence.toLowerCase().includes(name.toLowerCase())),inPreview=Boolean(name&&links.some(l=>`${l.title||''} ${l.description||''}`.toLowerCase().includes(name.toLowerCase()))),identified=inText&&inPreview;return {status:identified?'Match':'Unknown',name:name||null,message:identified?'The organiser appears in the pasted text and page preview.':'Company could not be identified',why:identified?'Confirm the company independently before applying.':'The organiser was not confirmed in both the pasted text and page preview; this is unknown, not a warning.',search:search||{enabled:false,status:'Unknown',note:'Add a search key to enable web search',queries:[]},links:companySearchLinks(name)}}
function findOrg(text,name) {
  const q=(name||'').trim().toLowerCase();
  return refs.find(r=>[r.name,...r.aliases].some(s=>s.toLowerCase()===q)) || refs.find(r=>[r.name,...r.aliases].some(s=>new RegExp(`\\b${s.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&')}\\b`,'i').test(text))) || null;
}
function check(id,area,result,severity,snippet,why){return {id,area,result,severity,snippet:snippet||'',why};}
function buildReport({text='',links=[],orgName='',pdfText='',pdfUnreadable=false,webSearch=null,companySearch=null}) {
  const evidence=(text+' '+pdfText).trim(); const org=findOrg(evidence,orgName);
  const checks=[], linkResults=[];
  if(org) checks.push(check('known-organisation','A','Match','info',org.name,'This name is listed in the prototype reference store.'));
  else if(orgName || evidence) checks.push(check('known-organisation','A','Unknown','low',orgName||'No organisation named','The organisation could not be matched to the reference store.'));
  for(const link of links){
    const host=link.host;
    const official=org&&matchesDomain(host,org.officialDomains);
    checks.push(check('source-domain','A',official?'Match':'Unknown',official?'info':'low',link.url,official?'The link host matches a stored official domain.':'The host could not be confirmed as an official domain.'));
    if(shorteners.includes(host)) checks.push(check('shortener','A','Warning','medium',link.url,'Short links hide the destination; open only after checking it.'));
    if(new URL(link.url).protocol!=='https:') checks.push(check('https','A','Warning','medium',link.url,'HTTPS helps protect information sent to the site.'));
    if(org&&!matchesDomain(host,org.officialDomains)) checks.push(check('offer-host-mismatch','B','Mismatch','high',link.url,'The host does not match the named organisation; verify through its official site.'));
    if(link.fetchError)checks.push(check('page-fetch','A','Unknown','low',link.url,`The page could not be reached (${link.fetchError}); this is unknown, not a warning.`));
    if(link.domainAge){const d=link.domainAge;let detail=host;if(d.ageDays!==undefined)detail+=` · ${d.ageDays} days · registered ${d.registeredAt}`;detail+=d.registrar?` · registrar ${d.registrar}`:` · ${d.reason||''}`;checks.push(check('domain-age','A',d.result,d.severity,detail,d.result==='Warning'?'A very new domain is easier to abandon or replace; confirm it independently.':'Domain registration history provides context, not proof of legitimacy.'))}
    if(link.certificate){const c=link.certificate;let detail=`${host} · issuer ${c.issuer||'unknown'}`;if(c.validTo)detail+=` · valid to ${c.validTo}`;if(c.reason)detail+=` · ${c.reason}`;checks.push(check('https-certificate','A',c.result,c.severity,detail,c.result==='Warning'?'An invalid or untrusted certificate can expose or alter information sent to the site.':'A valid certificate protects the connection, but does not prove the offer is genuine.'))}
    const namedOrg=orgName||org?.name||'';const preview=(link.title+' '+link.description).trim();let previewResult='Unknown',previewWhy='Page title or description was unavailable for an organisation comparison.';if(namedOrg&&preview){previewResult=preview.toLowerCase().includes(namedOrg.toLowerCase())?'Match':'Unknown';previewWhy=previewResult==='Match'?'The page preview includes the organisation name; confirm the page independently.':'The page preview does not clearly identify the named organisation.'}link.previewMatch=previewResult;
    checks.push(check('page-preview','B',previewResult,previewResult==='Match'?'info':'low',`${link.title||'No page title'}${link.description?` · ${link.description}`:''}`,previewWhy));
    linkResults.push({...link,lastChecked:org&&official?org.lastChecked:null});
  }
  const tests=[
    ['payment',/\b(advance fee|deposit|registration fee|pay(?:ment)?|upi|paytm|gpay|google pay)\b/i,'high','Payment requests can put money at risk.'],
    ['sensitive-data',/\b(otp|password|bank details?|aadhaar|pan card|id copies|identity documents?)\b/i,'high','Sensitive credentials or identity data can be misused.'],
    ['messaging-only',/\b(whatsapp|telegram)[^.!?]{0,45}(only|apply|application)|(?:only)[^.!?]{0,30}\b(whatsapp|telegram)\b/i,'medium','A messaging-only process is harder to verify independently.'],
    ['pressure',/\b(guaranteed selection|selected guaranteed|act now|urgent|limited time|immediate selection)\b/i,'medium','Pressure language can discourage careful review.']
  ];
  for(const [id,re,sev,why] of tests){const m=evidence.match(re);if(m)checks.push(check(id,'C',sev==='high'?'Warning':'Warning',sev,m[0],why));}
  for(const m of evidence.matchAll(/[\w.+-]+@(?:gmail|yahoo|outlook|hotmail)\.com/gi)) checks.push(check('free-mail-contact','A','Warning','high',m[0],'Free-mail contact addresses are not proof of an organisation affiliation.'));
  if(pdfUnreadable) checks.push(check('pdf-text','A','Unknown','low','Uploaded PDF','The PDF could not be read as text; it is not treated as safe.'));
  if(!links.length) checks.push(check('source-link','A','Unknown','low','No link supplied','A source link is needed for a domain comparison.'));
  const high=checks.some(c=>c.severity==='high'&&['Warning','Mismatch'].includes(c.result));
  const medium=checks.some(c=>c.severity==='medium'&&c.result==='Warning');
  const status=high?'Potential Warning Signs':org&&links.some(l=>matchesDomain(l.host,org.officialDomains))&&!medium?'Verified Match':'Needs More Checking';
  const grouped={A:checks.filter(c=>c.area==='A'),B:checks.filter(c=>c.area==='B'),C:checks.filter(c=>c.area==='C'),D:[check('safe-next-steps','D','Match','info','Open the official site yourself; confirm with your college placement cell; pause before paying; never share OTPs.','Independent confirmation helps you make a safer decision.')]};
  const companyCheck=buildCompanyCheck(evidence,orgName,org,links,companySearch);grouped.B.push(check('company-identification','B',companyCheck.status,companyCheck.status==='Match'?'info':'low',companyCheck.name||'No organiser name supplied',companyCheck.why));
  const missing=[]; if(!org)missing.push('A recognised organisation name'); if(!links.length)missing.push('An accessible source link'); if(!evidence)missing.push('Offer text or readable PDF text');
  return {status,caveat:status==='Verified Match'?'Still review the source before acting.':'This report is informational and cannot confirm an opportunity.',riskSummary:checks.filter(c=>['high','medium'].includes(c.severity)&&['Warning','Mismatch'].includes(c.result)).map(c=>c.why),checks:grouped,matches:checks.filter(c=>c.result==='Match'),mismatches:checks.filter(c=>c.result==='Mismatch'),missingInformation:missing,evidenceLinks:linkResults,referenceEvidence:org?[{name:org.name,sourceUrl:org.sourceUrl,lastChecked:org.lastChecked}]:[],safeNextSteps:['Open the official site yourself.','Confirm with your college placement cell.','Pause before paying.','Never share OTPs.'],companyCheck,webSearch:webSearch||companyCheck.search,limitation:'The prototype can only compare information it can access; new organisations, unavailable pages and incomplete posts need manual confirmation.'};
}
module.exports={buildReport,safeUrl,fetchPage,checkDomainAge,inspectCertificate,searchEvidence,findOrg,companySearchLinks,buildCompanyCheck,resetCompanySearchCache,registrableDomain};
