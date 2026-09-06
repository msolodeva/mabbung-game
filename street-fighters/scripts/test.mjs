import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const dir=await mkdtemp(join(tmpdir(),'street-fighters-test-'));
try {
 const outfile=join(dir,'combat.test.mjs');
 await build({entryPoints:['tests/combat.test.ts'],outfile,bundle:true,platform:'node',format:'esm',target:'node22'});
 const result=spawnSync(process.execPath,['--test',outfile],{stdio:'inherit'});process.exitCode=result.status??1;
} finally {await rm(dir,{recursive:true,force:true});}
