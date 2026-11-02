import { createSign } from 'node:crypto';
let token, expires=0;
export async function google(path, body, method=body?'POST':'GET') {
  if(!token||Date.now()>expires){
    const now=Math.floor(Date.now()/1000), encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
    const message=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:process.env.GOOGLE_CLIENT_EMAIL,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
    const key=process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g,'\n');
    const assertion=message+'.'+createSign('RSA-SHA256').update(message).sign(key,'base64url');
    const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(15000)});
    const j=await r.json();if(!r.ok)throw new Error('Google authentication failed. Check the service account credentials.');token=j.access_token;expires=Date.now()+3300000;
  }
  const r=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(process.env.GOOGLE_SHEET_ID)+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  const j=await r.json();if(!r.ok)throw new Error('Google Sheets request failed. Confirm the API is enabled and the Sheet is shared with the service account.');return j;
}
export async function read(range){return (await google('/values/'+encodeURIComponent(range))).values||[];}
export async function write(range,values){return google('/values/'+encodeURIComponent(range)+'?valueInputOption=RAW',{range,majorDimension:'ROWS',values},'PUT');}
export async function append(range,values){return google('/values/'+encodeURIComponent(range)+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',{values});}
