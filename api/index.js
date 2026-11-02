// Public panel by request. The server bridge key never reaches the browser.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
 try{
  if(req.method!=='POST')return send(405,{error:'Use POST.'});
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Invalid request origin.'});
  let body=req.body;if(typeof body==='string')body=JSON.parse(body);
  const {action,args=[],requestId}=body||{};
  if(!['getDashboard','frontendAction','addWork','updateWork'].includes(action)||!Array.isArray(args)||args.length>3)return send(400,{error:'Invalid request.'});
  if(JSON.stringify(body).length>16000)return send(413,{error:'Request too large.'});
  if(!process.env.APPS_SCRIPT_URL||!process.env.APPS_SCRIPT_KEY)return send(503,{error:'Sheet connection is being configured. Please refresh shortly.'});
  const url=new URL(process.env.APPS_SCRIPT_URL);
  if(url.origin!=='https://script.google.com'||!url.pathname.endsWith('/exec'))throw Error('Invalid endpoint');
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,args,requestId,key:process.env.APPS_SCRIPT_KEY}),signal:AbortSignal.timeout(55000)});
  const result=await response.json();if(!response.ok||result.error)return send(502,{error:result.error||'Could not connect to your sheet.'});return send(200,result);
 }catch(e){return send(502,{error:'Unable to reach the sheet connection. Please refresh before retrying.'});}
}
