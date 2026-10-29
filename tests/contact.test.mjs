import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createContactHandler} from '../api/contact.mjs';

function setup(options={}){
 const requests=[];
 const handler=createContactHandler({env:{NODE_ENV:'production',RESEND_API_KEY:'fake-test-key'},fetchImpl:async(url,init)=>{requests.push({url,init});return {ok:true,status:200,json:async()=>({id:'accepted-test-id'})}},...options});
 const ip=randomUUID();
 return {requests,async send(overrides={}){
  const req={method:'POST',headers:{origin:'https://portfolio-seven-snowy-acz9tytsam.vercel.app','content-type':'application/json','x-forwarded-for':ip},body:{name:'Visiteur de test',email:'visitor@example.com',message:'Un message de test suffisamment long.',website:'',submissionId:randomUUID()},...overrides};
  const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(v){this.body=v;return this}};
  await handler(req,res);return res;
 }};
}

test('missing server key returns 503 without contacting a provider',async()=>{
 let contacted=false;const app=setup({env:{NODE_ENV:'production'},fetchImpl:async()=>{contacted=true}});
 const res=await app.send();assert.equal(res.statusCode,503);assert.equal(res.body.ok,false);assert.equal(contacted,false);
});
test('local preview is explicitly allowed without opening production to localhost',async()=>{
 const headers={origin:'http://127.0.0.1:5175','content-type':'application/json'};
 assert.equal((await setup().send({headers})).statusCode,403);
 assert.equal((await setup({env:{NODE_ENV:'production',LOCAL_CONTACT_PREVIEW:'1'}}).send({headers})).statusCode,503);
});
test('cross-origin requests and non-POST methods are rejected',async()=>{
 const app=setup();assert.equal((await app.send({headers:{origin:'https://other.example'}})).statusCode,403);
 const res=await app.send({method:'GET'});assert.equal(res.statusCode,405);assert.equal(res.headers.Allow,'POST');assert.equal(app.requests.length,0);
});
test('invalid data and honeypot are rejected before mail delivery',async()=>{
 const app=setup();
 for(const body of [{},{name:'X',email:'not-an-email',message:'short'},{website:'bot'}])assert.equal((await app.send({body})).statusCode,400);
 assert.equal(app.requests.length,0);
});
test('invalid JSON and oversized bodies are rejected',async()=>{
 const app=setup();assert.equal((await app.send({body:'{'})).statusCode,400);
 assert.equal((await app.send({headers:{origin:'https://portfolio-seven-snowy-acz9tytsam.vercel.app','content-type':'application/json','content-length':'50000'}})).statusCode,413);
});
test('successful provider acceptance sends only to the owner, with reply-to and idempotency',async()=>{
 const app=setup();const res=await app.send();assert.equal(res.statusCode,200);assert.deepEqual(res.body,{ok:true});
 const request=app.requests[0],payload=JSON.parse(request.init.body);
 assert.equal(request.url,'https://api.resend.com/emails');assert.deepEqual(payload.to,['y.faraj@esisa.ac.ma']);assert.equal(payload.reply_to,'visitor@example.com');
 assert.equal(request.init.headers.Authorization,'Bearer fake-test-key');assert.match(request.init.headers['Idempotency-Key'],/^portfolio-contact-/);
 assert.equal(JSON.stringify(res.body).includes('fake-test-key'),false);
});
test('provider authentication and malformed success never become user success',async()=>{
 for(const response of [{ok:false,status:403},{ok:true,status:200,json:async()=>({success:true})}]){
  const app=setup({fetchImpl:async()=>response});const res=await app.send();assert.equal(res.statusCode,502);assert.equal(res.body.ok,false);
 }
});
test('network failure and timeout return actionable failures',async()=>{
 for(const error of [new TypeError('Network error'),new DOMException('Timed out','AbortError')]){
  const app=setup({fetchImpl:async()=>{throw error}});const res=await app.send();assert.equal(res.statusCode,error.name==='AbortError'?504:502);assert.equal(res.body.ok,false);
 }
});
test('six attempts per minute per instance then rate limited',async()=>{
 const app=setup();for(let i=0;i<6;i++)assert.equal((await app.send()).statusCode,200);
 const res=await app.send();assert.equal(res.statusCode,429);assert.equal(res.headers['Retry-After'],'60');assert.equal(app.requests.length,6);
});
