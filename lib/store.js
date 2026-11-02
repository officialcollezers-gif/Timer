import {randomUUID} from 'node:crypto';
import {read,write,append,google} from './google.js';
import {dayAt,dayBoundary,transition,view} from './timer.js';
const zone=()=>process.env.TIME_ZONE||'America/Los_Angeles';
const tab='Sheet1',log='Web Sessions';
export async function initialize(){
 const meta=await google('?fields=sheets.properties');const names=meta.sheets.map(s=>s.properties.title);
 if(!names.includes(tab))throw new Error('The Sheet1 work tab is missing.');
 if(!names.includes(log))await google(':batchUpdate',{requests:[{addSheet:{properties:{title:log}}}]});
 await write(`'${log}'!A1:H1`,[['Session date','First start (ms)','Ended at (ms)','Elapsed (ms)','State','Last resumed (ms)','Duration','Updated at']]);
 const header=await read(`'${tab}'!E1`);if(header[0]?.[0]&&header[0][0]!=='Work ID')throw new Error('Column E is occupied. Move it before connecting Daywork.');
 await write(`'${tab}'!E1`,[['Work ID']]);
}
async function load(now){
 const rows=await read(`'${log}'!A2:H10000`),today=dayAt(now,zone());
 for(let i=0;i<rows.length;i++){const r=rows[i];if(r[0]&&r[0]<today&&r[4]!=='Ended'){const s=decode(r);const end=dayBoundary(s.day,zone());const closed=transition(s,'end',end);await save(closed,i+2);rows[i]=encode(closed);}}
 const index=rows.findIndex(r=>r[0]===today),s=index<0?{day:today,state:'Ready',ms:0,since:0,first:0,end:0}:decode(rows[index]);
 return {rows,s,row:index<0?0:index+2};
}
function decode(r){return {day:r[0],first:Number(r[1])||0,end:Number(r[2])||0,ms:Number(r[3])||0,state:r[4],since:Number(r[5])||0};}
function duration(ms){let n=Math.floor(ms/1000);return `${Math.floor(n/3600)}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
function encode(s){return [s.day,s.first,s.end,s.ms,s.state,s.since,duration(s.ms),new Date().toISOString()];}
async function save(s,row){if(row)await write(`'${log}'!A${row}:H${row}`,[encode(s)]);else await append(`'${log}'!A:H`,[encode(s)]);}
export async function dashboard(){const now=Date.now(),{s,rows}=await load(now),raw=await read(`'${tab}'!A2:E10000`),tasks=[];
 for(let i=0;i<raw.length;i++){const r=raw[i];if(!String(r[1]||'').trim())continue;if(!r[4]){r[4]=randomUUID();await write(`'${tab}'!E${i+2}`,[[r[4]]]);}tasks.push({date:String(r[0]||''),name:String(r[1]),status:r[2]||'Pending',notes:String(r[3]||''),id:r[4]});}
 return {timer:view(s,now),tasks,history:rows.filter(r=>r[0]).slice(-7).reverse().map(r=>({date:r[0],state:r[4],duration:duration(Number(r[3])||0)})),timezone:zone()};
}
export async function act(action,args){const now=Date.now();
 if(action==='frontendAction'){const {s,row}=await load(now);await save(transition(s,args[0],now),row);}
 else if(action==='addWork'){const {s}=await load(now);if(s.state==='Ended')throw new Error('Today is closed. Add new work tomorrow.');const name=String(args[0]||'').trim(),notes=String(args[1]||'').trim();if(!name||name.length>500||notes.length>2000)throw new Error('Enter a title under 500 characters and notes under 2000.');await append(`'${tab}'!A:E`,[[s.day,name,'Pending',notes,randomUUID()]]);}
 else if(action==='updateWork'){if(!['Pending','Running','Done'].includes(args[1]))throw new Error('Invalid status.');const rows=await read(`'${tab}'!A2:E10000`),i=rows.findIndex(r=>r[4]===args[0]&&r[1]);if(i<0)throw new Error('This task was removed. Refresh the page.');await write(`'${tab}'!C${i+2}`,[[args[1]]]);}
 else throw new Error('Unknown action.');
}
