const {getJson,cached,validWebUrl}=require('./helpers');
const NAME='Arbeitnow',URL='https://www.arbeitnow.com/api/job-board-api';
function parse(data,fetchedAt=new Date().toISOString()){return (data.data||[]).filter(j=>/\b(intern(?:ship)?|trainee|graduate)\b/i.test(j.title||'')).filter(j=>j.title&&validWebUrl(j.url)).map(j=>({title:j.title,organiser:j.company_name||'Not specified',type:'Internship',deadline:null,location:j.remote?'Remote':j.location||'Not specified',url:j.url,source:NAME,fetchedAt,postedAt:j.created_at?new Date(Number(j.created_at)*1000).toISOString():null,sourceLink:'https://www.arbeitnow.com/',sourceAttribution:NAME,notice:'Community-maintained feed, verify before applying'}))}
async function load(){return cached(NAME,async()=>{const data=await getJson(URL),items=parse(data);items.recordCount=(data.data||[]).length;return items})}
module.exports={name:NAME,url:URL,parse,load};
