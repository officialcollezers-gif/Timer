import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
if(html.includes('google.script.run'))throw new Error('Apps Script dependency still exists.');
console.log('Standalone frontend JavaScript passed syntax checks.');
