import test from 'node:test';import assert from 'node:assert/strict';import handler from '../api/index.js';
for(const k of ['GOOGLE_SHEET_ID','GOOGLE_CLIENT_EMAIL','GOOGLE_PRIVATE_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','APP_PASSWORD'])process.env[k]='test-placeholder';
process.env.SESSION_SECRET='test-secret-that-is-at-least-32-characters';
async function request(body,headers={}){const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=JSON.parse(v);}};await handler({method:'POST',headers:{host:'example.com',...headers},body},res);return res;}
test('unauthenticated mutations do not reach sheet storage',async()=>{const r=await request({action:'addWork',args:['x']});assert.equal(r.statusCode,401);});
test('cross-origin mutations are rejected before authentication',async()=>{const r=await request({action:'frontendAction',args:['start']},{origin:'https://evil.example'});assert.equal(r.statusCode,403);});
test('forged session cookies are not accepted',async()=>{const r=await request({action:'session'},{cookie:`daywork=${Date.now()+60000}.nonce.forged`});assert.equal(r.body.authenticated,false);});
