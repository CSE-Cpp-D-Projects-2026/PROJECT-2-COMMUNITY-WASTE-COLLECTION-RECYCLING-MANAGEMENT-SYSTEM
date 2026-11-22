const {getJson,cached,validWebUrl}=require('./helpers');
const NAME='Remotive',URL='https://remotive.com/api/remote-jobs';
function parse(data,fetchedAt=new Date().toISOString()){return (data.jobs||[]).filter(j=>/\b(intern(?:ship)?|trainee|graduate)\b/i.test(j.title||'')).filter(j=>j.title&&validWebUrl(j.url)).map(j=>({title:j.title,organiser:j.company_name||'Not specified',type:'Internship',deadline:null,location:j.candidate_required_location||'Remote',url:j.url,source:NAME,fetchedAt,postedAt:j.publication_date||null,sourceLink:j.url,sourceAttribution:NAME,notice:'Community-maintained feed, verify before applying'}))}
async function load(){return cached(NAME,async()=>{const data=await getJson(URL),items=parse(data);items.recordCount=(data.jobs||[]).length;return items})}
module.exports={name:NAME,url:URL,parse,load};
