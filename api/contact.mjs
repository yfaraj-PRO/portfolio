import { createHash } from 'node:crypto';

const RECIPIENT='y.faraj@esisa.ac.ma';
const PRODUCTION_ORIGIN='https://portfolio-seven-snowy-acz9tytsam.vercel.app';
const windows=new Map();

export function createContactHandler({env=process.env,fetchImpl=globalThis.fetch,now=Date.now}={}){
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  const respond=(status,body)=>res.status(status).json(body);
  if(req.method!=='POST'){res.setHeader('Allow','POST');return respond(405,{ok:false,code:'method_not_allowed'})}
  const allowed=new Set([PRODUCTION_ORIGIN]);
  if(env.VERCEL_URL)allowed.add(`https://${env.VERCEL_URL}`);
  if(env.NODE_ENV!=='production'||env.LOCAL_CONTACT_PREVIEW==='1'){allowed.add('http://127.0.0.1:5175');allowed.add('http://127.0.0.1:5177');allowed.add('http://localhost:5175');allowed.add('http://localhost:5177')}
  if(!allowed.has(req.headers.origin))return respond(403,{ok:false,code:'origin_rejected'});
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return respond(415,{ok:false,code:'invalid_content_type'});
  if(Number(req.headers['content-length']||0)>16000)return respond(413,{ok:false,code:'payload_too_large'});
  let body;
  try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return respond(400,{ok:false,code:'invalid_json'})}
  if(!body||typeof body!=='object'||Array.isArray(body))return respond(400,{ok:false,code:'invalid_payload'});
  if(body.website)return respond(400,{ok:false,code:'submission_rejected'});
  if(typeof body.name!=='string'||typeof body.email!=='string'||typeof body.message!=='string')return respond(400,{ok:false,code:'invalid_fields'});
  const name=body.name.trim(),email=body.email.trim(),message=body.message.trim();
  if(name.length<2||name.length>100||/[\r\n]/.test(name))return respond(400,{ok:false,code:'invalid_name'});
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return respond(400,{ok:false,code:'invalid_email'});
  if(message.length<10||message.length>5000)return respond(400,{ok:false,code:'invalid_message'});
  if(typeof body.submissionId!=='string'||!/^[a-f0-9-]{36}$/i.test(body.submissionId))return respond(400,{ok:false,code:'invalid_submission_id'});
  if(!env.RESEND_API_KEY?.trim())return respond(503,{ok:false,code:'contact_not_configured'});
  // Best-effort per-instance rate limiting; Vercel Firewall can add a global limit.
  const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0].trim();
  const timestamp=now();
  for(const [key,bucket] of windows)if(bucket.until<=timestamp)windows.delete(key);
  const ipHash=createHash('sha256').update(ip).digest('hex');
  const bucket=windows.get(ipHash)||{count:0,until:timestamp+60000};
  if(bucket.count>=6){res.setHeader('Retry-After','60');return respond(429,{ok:false,code:'rate_limited'})}
  if(windows.size>=2000&&!windows.has(ipHash))return respond(429,{ok:false,code:'rate_limited'});
  bucket.count++;windows.set(ipHash,bucket);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetchImpl('https://api.resend.com/emails',{
    method:'POST',signal:controller.signal,
    headers:{Authorization:`Bearer ${env.RESEND_API_KEY.trim()}`,'Content-Type':'application/json','Idempotency-Key':`portfolio-contact-${body.submissionId}`},
    body:JSON.stringify({from:env.CONTACT_FROM?.trim()||'Portfolio Yassine Faraj <onboarding@resend.dev>',to:[RECIPIENT],reply_to:email,subject:`Portfolio — Message de ${name}`,text:`Nom : ${name}\nE-mail : ${email}\n\n${message}`}),
   });
   if(!response.ok)return respond(response.status===429?429:502,{ok:false,code:response.status===429?'rate_limited':'email_provider_error'});
   const data=await response.json();
   if(typeof data?.id!=='string'||!data.id)return respond(502,{ok:false,code:'email_not_confirmed'});
   return respond(200,{ok:true});
  }catch(error){return respond(error?.name==='AbortError'?504:502,{ok:false,code:error?.name==='AbortError'?'email_timeout':'email_provider_unreachable'})}
  finally{clearTimeout(timeout)}
 };
}

export default createContactHandler();
