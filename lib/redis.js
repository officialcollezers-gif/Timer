import { randomUUID } from 'node:crypto';
export async function redis(...command){const r=await fetch(process.env.UPSTASH_REDIS_REST_URL,{method:'POST',headers:{Authorization:'Bearer '+process.env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(10000)});const j=await r.json();if(!r.ok||j.error)throw new Error('Shared storage is unavailable. Please try again.');return j.result;}
export async function locked(fn){
  const key='daywork:lock:'+process.env.GOOGLE_SHEET_ID,id=randomUUID();
  if(await redis('SET',key,id,'NX','EX',120)!=='OK')throw Object.assign(new Error('Another change is being saved. Please try again.'),{status:409});
  try{return await fn();}finally{await redis('EVAL',"if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",1,key,id).catch(()=>{});}
}
