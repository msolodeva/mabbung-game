async page => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.reload();await page.waitForFunction(()=>!!window.game);
  const roster=['RYU','CHUN_LI','CAMMY','ZANGIEF','DHALSIM','BLANKA'];
  const stages=['SUZAKU','NEO_TOKYO','NEO_TOKYO','SOUTH_TOWN','SUZAKU','SOUTH_TOWN'];
  for(let index=0;index<roster.length;index++) {
    await page.getByRole('button',{name:'CPU 대전',exact:true}).click();
    for(let i=0;i<6;i++) {
      const previous=await page.evaluate(()=>window.game.menu.p2SelectedCharIndex);
      if(previous===index)break;
      await page.keyboard.press('ArrowRight');await page.waitForFunction(n=>window.game.menu.p2SelectedCharIndex!==n,previous);
    }
    await page.keyboard.press('f');await page.waitForFunction(()=>window.game.scene==='FIGHTING');
    const state=await page.evaluate(()=>({character:window.game.p2.character,stage:window.game.audio.musicStage,difficulty:window.game.ai.getDifficulty()}));
    if(state.character!==roster[index]||state.stage!==stages[index]||state.difficulty!=='NORMAL')throw new Error(JSON.stringify(state));
    await page.waitForFunction(()=>window.game.p1.hp<1000,{},{timeout:20000});
    await page.keyboard.press('Escape');
    await page.screenshot({path:`output/playwright/cpu-${roster[index].toLowerCase()}.png`,fullPage:true});
  }
  await page.getByRole('button',{name:'CPU 대전',exact:true}).click();
  await page.keyboard.press('h');await page.waitForFunction(()=>window.game.menu.cpuDifficultyIndex===2);
  await page.keyboard.press('F3');await page.waitForFunction(()=>!window.game.menu.stageAutomatic&&window.game.menu.selectedStageIndex===0);
  await page.keyboard.press('f');await page.waitForFunction(()=>window.game.scene==='FIGHTING');
  if(!await page.evaluate(()=>window.game.ai.getDifficulty()==='HARD'&&window.game.audio.musicStage==='SUZAKU'))throw new Error('Manual settings not applied');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.game.audio.backgroundPaused===true);
  const levels=await page.evaluate(async()=>{
    const a=window.game.audio,analyser=a.ctx.createAnalyser();analyser.fftSize=2048;a.bgmGain.connect(analyser);
    const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const sample=()=>{const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((n,v)=>n+v*v,0)/data.length);};
    const result={};
    for(const stage of ['SUZAKU','NEO_TOKYO','SOUTH_TOWN']){a.setStage(stage);await pause(220);let peak=0;for(let i=0;i<8;i++){await pause(45);peak=Math.max(peak,sample());}result[stage]=peak;}
    a.toggleMusic();await pause(400);result.muted=sample();a.toggleMusic();
    a.bgmGain.disconnect(analyser);analyser.disconnect();return result;
  });
  for(const [stage,level] of Object.entries(levels))if(stage==='muted'?level>0.00001:level<0.0001)throw new Error(`BGM ${stage}: ${level}`);
  // Restore the selected stage after testing the sound bus.
  await page.evaluate(()=>{window.game.audio.setStage('SUZAKU');});
  if(errors.length)throw new Error(errors.join('\n'));
  return {characters:roster.length,levels};
}
