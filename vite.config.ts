import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createContactHandler } from './api/contact.mjs';
export default defineConfig(({mode})=>{
 const values=loadEnv(mode,process.cwd(),'');
 const env={...values,...process.env,LOCAL_CONTACT_PREVIEW:'1'};
 const handler=createContactHandler({env});
 const middleware=async(req,res,next)=>{
  if(!req.url?.startsWith('/api/contact'))return next();
  res.status=(status)=>{res.statusCode=status;return res};
  res.json=(value)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));return res};
  let body='';
  try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16000){res.status(413).json({ok:false,code:'payload_too_large'});return}}req.body=body;await handler(req,res)}
  catch{if(!res.headersSent)res.status(500).json({ok:false,code:'internal_error'})}
 };
 return {plugins:[react(),{name:'local-contact-api',configureServer(server){server.middlewares.use(middleware)},configurePreviewServer(server){server.middlewares.use(middleware)}}]};
});
