import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import handler from './api/index.js';
import {dayAt,transition,view} from './lib/timer.js';
const demo=process.argv.includes('--demo');let s=null,tasks=[];
createServer(async(req,res)=>{
 try{
 if(req.url.split('?')[0]==='/api'){
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16000){res.writeHead(413);return res.end();}}req.body=JSON.parse(raw||'{}');
  if(!demo)return handler(req,res);
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');const {action,args=[]}=req.body,now=Date.now(),day=dayAt(now,'America/Los_Angeles');
  if(!s||s.day!==day)s={day,state:'Ready',first:0,end:0,ms:0,since:0};
  if(action==='session'||action==='login')return res.end(JSON.stringify({authenticated:true,demo:true}));
  if(action==='frontendAction')s=transition(s,args[0],now);
  if(action==='addWork'&&s.state!=='Ended')tasks.push({id:crypto.randomUUID(),date:day,name:args[0],notes:args[1],status:'Pending'});
  if(action==='updateWork'){const t=tasks.find(t=>t.id===args[0]);if(t)t.status=args[1];}
  return res.end(JSON.stringify({timer:view(s,now),tasks,history:s.first?[{date:day,duration:'0:00:00',state:s.state}]:[],timezone:'America/Los_Angeles',demo:true}));
 }
 const path=req.url.split('?')[0];if(path!=='/'&&path!=='/index.html'){res.writeHead(404);return res.end('Not found');}
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile(new URL('./public/index.html',import.meta.url)));
 }catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}
}).listen(3000,'127.0.0.1',()=>console.log('Daywork: http://127.0.0.1:3000'+(demo?' (DEMO — no Google Sheet connection)':'')));
