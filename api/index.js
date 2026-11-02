import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {redis,locked} from '../lib/redis.js';
import {initialize,dashboard,act} from '../lib/store.js';
const required=['GOOGLE_SHEET_ID','GOOGLE_CLIENT_EMAIL','GOOGLE_PRIVATE_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','APP_PASSWORD','SESSION_SECRET'];
function same(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function sign(v){return createHmac('sha256',process.env.SESSION_SECRET).update(v).digest('base64url');}
function authorized(req){const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('daywork='))?.slice(8);if(!raw)return false;const [exp,nonce,sig]=raw.split('.');return Number(exp)>Date.now()&&!!nonce&&!!sig&&same(sign(exp+'.'+nonce),sig);}
function cookie(value,seconds,secure){return `daywork=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${seconds}${secure?'; Secure':''}`;}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
 try{
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'Use POST.'});}
  const origin=req.headers.origin,host=req.headers.host;
  if(origin&&new URL(origin).host!==host)return send(403,{error:'Invalid request origin.'});
  const missing=required.filter(k=>!process.env[k]);if(missing.length)return send(503,{error:'Deployment setup required. Add these server environment variables: '+missing.join(', '),setupRequired:true});
  if(process.env.SESSION_SECRET.length<32)throw new Error('SESSION_SECRET must contain at least 32 characters.');
  let body=req.body;if(typeof body==='string')body=JSON.parse(body);const {action,args=[],requestId}=body||{};
  if(action==='session')return send(200,{authenticated:authorized(req)});
  if(action==='login'){
   const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];const bucket='daywork:login:'+createHmac('sha256',process.env.SESSION_SECRET).update(ip).digest('hex');
   const count=await redis('EVAL',"local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],900) end;return n",1,bucket);
   if(count>10)return send(429,{error:'Too many login attempts. Try again in 15 minutes.'});
   if(typeof args[0]!=='string'||!same(args[0],process.env.APP_PASSWORD))return send(401,{error:'That password is incorrect.'});
   await redis('DEL',bucket);const value=String(Date.now()+7*86400000)+'.'+randomUUID();res.setHeader('Set-Cookie',cookie(value+'.'+sign(value),604800,!!process.env.VERCEL||req.headers['x-forwarded-proto']==='https'));return send(200,{authenticated:true});
  }
  if(!authorized(req))return send(401,{error:'Please sign in to continue.'});
  if(action==='logout'){res.setHeader('Set-Cookie',cookie('',0,!!process.env.VERCEL));return send(200,{authenticated:false});}
  if(!['getDashboard','frontendAction','addWork','updateWork'].includes(action))return send(400,{error:'Unknown action.'});
  if(!Array.isArray(args)||args.length>3)return send(400,{error:'Invalid request arguments.'});
  const result=await locked(async()=>{
   const marker='daywork:initialized:'+process.env.GOOGLE_SHEET_ID;
   if(!await redis('GET',marker)){await initialize();await redis('SET',marker,'1','EX',3600);}
   if(action!=='getDashboard'){
    if(typeof requestId!=='string'||!/^[a-f0-9-]{36}$/.test(requestId))throw new Error('Missing request ID. Refresh and try again.');
    const key='daywork:request:'+process.env.GOOGLE_SHEET_ID+':'+requestId;
    if(!await redis('GET',key)){await act(action,args);await redis('SET',key,'saved','EX',86400);}
   }
   return dashboard();
  });return send(200,result);
 }catch(e){return send(e.status||400,{error:e.message||'Could not save your changes.'});}
}
