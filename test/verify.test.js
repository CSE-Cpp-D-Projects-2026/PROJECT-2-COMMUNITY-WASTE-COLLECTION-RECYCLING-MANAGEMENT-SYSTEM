const request=require('supertest');const app=require('../server');const verifier=require('../lib/verify');
const realSafeUrl=verifier.safeUrl;
jest.spyOn(verifier,'safeUrl').mockImplementation(async raw=>new URL(raw));
jest.spyOn(verifier,'fetchPage').mockImplementation(async url=>({url,host:new URL(url).hostname,text:'',title:'',description:'',fetchedAt:'2026-11-21T00:00:00.000Z'}));
jest.spyOn(verifier,'checkDomainAge').mockResolvedValue({result:'Unknown',severity:'low',reason:'mocked'});
jest.spyOn(verifier,'inspectCertificate').mockResolvedValue({result:'Unknown',severity:'low',reason:'mocked'});
jest.spyOn(verifier,'searchEvidence').mockResolvedValue({enabled:false,note:'Add a search key to enable web search',results:[]});
describe('verification API',()=>{
test('legitimate match',async()=>{const r=await request(app).post('/api/verify').field('orgName','NASA').field('text','NASA student opportunity').field('links','https://nasa.gov/opportunities');expect(r.body.status).toBe('Verified Match')});
test('warning signs',async()=>{const r=await request(app).post('/api/verify').field('orgName','NASA').field('text','Pay registration fee via WhatsApp. Email contact@gmail.com. Send your OTP.').field('links','https://jobs.example/apply');expect(r.body.status).toBe('Potential Warning Signs')});
test('inconclusive',async()=>{const r=await request(app).post('/api/verify').field('orgName','Unknown Org').field('text','Student opportunity available').field('links','https://jobs.example/post');expect(r.body.status).toBe('Needs More Checking')});
test.each(['http://127.0.0.1','http://localhost','http://169.254.169.254'])('blocks SSRF %s',async url=>{await expect(realSafeUrl(url)).rejects.toThrow(/blocked/)});
test('empty submission returns 400',async()=>{expect((await request(app).post('/api/verify')).status).toBe(400)});
test('image rejected',async()=>{const r=await request(app).post('/api/verify').attach('pdf',Buffer.from([137,80,78,71,13,10,26,10]),{filename:'shot.png',contentType:'image/png'});expect(r.status).toBe(400);expect(r.body.error).toMatch(/Screenshot reading/)});
test('text-less PDF is unreadable',async()=>{const r=await request(app).post('/api/verify').field('text','Opportunity').attach('pdf',Buffer.from('%PDF-1.4\n%%EOF'),{filename:'empty.pdf',contentType:'application/pdf'});expect(r.status).toBe(200);expect(r.body.checks.A.some(c=>c.id==='pdf-text'&&c.result==='Unknown')).toBe(true)});
test('unreachable link stays Unknown',async()=>{verifier.fetchPage.mockRejectedValueOnce(Error('Link could not be reached'));const r=await request(app).post('/api/verify').field('text','Opportunity').field('links','https://unknown.example/post');expect(r.status).toBe(200);expect(r.body.checks.A.some(c=>c.id==='page-fetch'&&c.result==='Unknown')).toBe(true);expect(r.body.status).toBe('Needs More Checking')});
});
