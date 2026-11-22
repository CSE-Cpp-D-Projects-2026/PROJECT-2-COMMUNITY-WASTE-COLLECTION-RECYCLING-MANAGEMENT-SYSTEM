const curated=require('../data/curated-opportunities.json');
const sources=[require('./sources/remotive'),require('./sources/arbeitnow')];
const {validWebUrl}=require('./sources/helpers');
const community=require('./community');
const category=t=>{const s=String(t||'').toLowerCase();return s.includes('hack')?'Hackathon':s.includes('scholar')?'Scholarship':'Internship'};
const deadlineTime=value=>{const s=String(value||'');const t=/^\d{4}-\d{2}-\d{2}$/.test(s)?Date.parse(`${s}T23:59:59`):Date.parse(s);return Number.isFinite(t)?t:NaN};
function curatedItems(){return curated.filter(x=>x.verifiedBy!=='SAMPLE - replace'&&validWebUrl(x.url)).map(x=>({...x,source:'Curated',fetchedAt:null,postedAt:null,sourceLink:x.url,sourceAttribution:'Curated',notice:'Curated'}))}
const notUsedSources=[
  {name:'Hackalist',status:'Not used',reason:'Monthly endpoints returned 404; its site says the feed is no longer actively updated.',lastFetchedAt:null},
  {name:'Open Hackathons API',status:'Not used',reason:'No event start date within 60 days; reuse of its Devpost-sourced data is unclear.',lastFetchedAt:null}
];
const isRemote=x=>/remote|online|anywhere/i.test(String(x.location||''));
const isIndia=x=>/\bindia\b|bengaluru|bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata|gurugram|noida/i.test(String(x.location||''));
const isWorldwide=x=>/worldwide|global|anywhere|all countries|world-wide/i.test(String(x.location||''));
const rank=x=>isIndia(x)?0:isRemote(x)?1:isWorldwide(x)?2:3;
async function getCatalog(){
  const settled=await Promise.all(sources.map(async s=>{try{return {name:s.name,...await s.load()}}catch(e){return {name:s.name,items:[],error:e.message||'unavailable',fetchedAt:new Date().toISOString()}}}));
  const items=[...settled.flatMap(x=>x.items||[]),...curatedItems(),...community.listings()].filter(x=>validWebUrl(x.url)).map(x=>{const origin=x.origin||(x.source==='Curated'?'Curated':'Feed');const id=x.id||community.listingId(x);const report=community.reportSummary(id);return {...x,id,origin,reportedCount:report.count,reportReasons:report.reasonCounts,reportNotes:report.notes,reportedHidden:report.hidden,type:category(x.type)}}).filter(x=>!x.reportedHidden);
  const sourceStatuses=[...settled.map(x=>({name:x.name,status:x.error?'Unavailable':'Live',reason:x.error||'Public feed responded successfully.',lastFetchedAt:x.fetchedAt||null})),{name:'Community submissions',status:'Live',reason:`${community.listings().length} approved listings.`,lastFetchedAt:new Date().toISOString()},...notUsedSources];
  return {items,settled,sourceStatuses};
}
function sortItems(items,sort='recommended'){
  const copy=[...items];
  if(sort==='newest')return copy.sort((a,b)=>Date.parse(b.postedAt||b.fetchedAt||0)-Date.parse(a.postedAt||a.fetchedAt||0));
  if(sort==='deadline')return copy.sort((a,b)=>(Date.parse(a.deadline)||Infinity)-(Date.parse(b.deadline)||Infinity));
  return copy.sort((a,b)=>rank(a)-rank(b)||(Date.parse(a.deadline)||Infinity)-(Date.parse(b.deadline)||Infinity)||Date.parse(b.postedAt||b.fetchedAt||0)-Date.parse(a.postedAt||a.fetchedAt||0));
}
async function discover(params={}){
  const {items:all,settled}=await getCatalog(),now=Date.now();let items=all.filter(x=>!x.deadline||deadlineTime(x.deadline)>=now);
  const q=String(params.q||'').trim().toLowerCase(),type=String(params.type||'').toLowerCase(),loc=String(params.location||'').trim().toLowerCase(),remote=String(params.remote||'').toLowerCase()==='true',region=String(params.region||'').toLowerCase();
  const within=Number(params.deadlineWithin||params.deadlineWithinDays||0),source=String(params.source||'').trim().toLowerCase();
  if(q)items=items.filter(x=>[x.title,x.organiser,x.type,x.location,x.source].join(' ').toLowerCase().includes(q));
  if(type&&type!=='all')items=items.filter(x=>x.type.toLowerCase()===type||type==='hackathons'&&x.type==='Hackathon'||type==='internships'&&x.type==='Internship'||type==='scholarships'&&x.type==='Scholarship');
  if(loc)items=items.filter(x=>String(x.location||'').toLowerCase().includes(loc));
  if(remote)items=items.filter(isRemote);
  if(region==='india')items=items.filter(isIndia);
  if(region==='remote')items=items.filter(isRemote);
  if(region==='worldwide')items=items.filter(isWorldwide);
  if(within>0)items=items.filter(x=>x.deadline&&deadlineTime(x.deadline)<=now+within*86400000);
  if(source)items=items.filter(x=>x.source.toLowerCase()===source);
  items=sortItems(items,params.sort||'recommended');
  return {items,results:items.length,unavailable:settled.filter(x=>x.error).map(x=>({source:x.name,reason:x.error})),fetchedAt:new Date().toISOString()};
}
async function dashboard(){
  const {items:all,sourceStatuses}=await getCatalog(),now=Date.now(),today=new Date();today.setUTCHours(0,0,0,0);
  const items=all.filter(x=>!x.deadline||deadlineTime(x.deadline)>=now),closingSoon=sortItems(items.filter(x=>x.deadline&&deadlineTime(x.deadline)<=now+7*86400000),'deadline').slice(0,7);
  return {stats:{listingsAvailable:items.length,closingIn7Days:items.filter(x=>x.deadline&&deadlineTime(x.deadline)<=now+7*86400000).length,hackathonsListed:items.filter(x=>x.type==='Hackathon').length,sourcesLiveToday:sourceStatuses.filter(x=>x.status==='Live'&&x.lastFetchedAt&&Date.parse(x.lastFetchedAt)>=today.getTime()).length},closingSoon,sourceStatuses,fetchedAt:new Date().toISOString()};
}
module.exports={discover,dashboard,curatedItems,category,sources,sortItems,isIndia,isRemote,isWorldwide,deadlineTime};
