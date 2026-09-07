import {build} from 'esbuild';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'fighter-ai-'));
try {
 const out=join(dir,'simulation.mjs');await build({entryPoints:['tests/cpu-simulation.ts'],outfile:out,bundle:true,platform:'node',format:'esm'});
 const {roster,simulate}=await import(pathToFileURL(out).href);
 const matches=[];
 for(const difficulty of ['EASY','NORMAL','HARD'])for(let a=0;a<6;a++)for(let b=0;b<6;b++)matches.push(simulate(roster[a],roster[b],difficulty,100+a*37+b*19));
 await mkdir('output',{recursive:true});await writeFile('output/cpu-audit.json',JSON.stringify(matches,null,2));
 for(const character of roster) {
  const rows=matches.filter(m=>m.a===character&&m.difficulty==='NORMAL');
  console.log(character,JSON.stringify({damageDealt:Math.round(rows.reduce((n,m)=>n+1000-m.hp[1],0)/rows.length),damageTaken:Math.round(rows.reduce((n,m)=>n+1000-m.hp[0],0)/rows.length),attacks:rows.reduce((n,m)=>n+Object.values(m.attacks[0]).reduce((a,b)=>a+b,0),0)}));
 }
 const inactive=matches.filter(m=>m.hp[0]===1000&&m.hp[1]===1000);
 console.log(`${matches.length} matches (6×6×3 difficulties), ${inactive.length} inactive matches. Full data: output/cpu-audit.json`);
 if(inactive.length)process.exitCode=1;
}finally{await rm(dir,{recursive:true,force:true});}
