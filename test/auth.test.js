import test from 'node:test';import assert from 'node:assert/strict';import handler from '../api/index.js';
async function request(body,headers={}){const res={setHeader(){},end(v){this.body=JSON.parse(v);}};await handler({method:'POST',headers:{host:'example.com',...headers},body},res);return res;}
test('direct API requires no user login',async()=>{delete process.env.APPS_SCRIPT_URL;delete process.env.APPS_SCRIPT_KEY;const r=await request({action:'getDashboard'});assert.equal(r.statusCode,503);assert.match(r.body.error,/connection/);});
test('cross-origin mutations are rejected',async()=>{const r=await request({action:'frontendAction',args:['start']},{origin:'https://evil.example'});assert.equal(r.statusCode,403);});
test('unknown operations are rejected',async()=>{const r=await request({action:'login'});assert.equal(r.statusCode,400);});
