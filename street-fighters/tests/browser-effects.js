async page => {
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.reload();await page.waitForFunction(()=>!!window.game);
  await page.getByRole('button',{name:'트레이닝',exact:true}).click();
  await page.keyboard.press('f');await page.waitForFunction(()=>window.game.scene==='FIGHTING');
  await page.keyboard.press('F4');
  await page.evaluate(()=>{const g=window.game;g.p1.x=700;g.p2.x=820;});
  await page.keyboard.press('g');await page.waitForFunction(()=>window.game.p2.lastDamage>0);
  await page.evaluate(()=>{window.game.trainingFrozen=true;});
  await page.screenshot({path:'output/playwright/effects-impact.png',fullPage:true});
  await page.keyboard.press('F7');await page.keyboard.press('F4');await page.keyboard.press('r');
  await page.waitForFunction(()=>window.game.particles.superFreeze?.life>=5);
  await page.evaluate(()=>{window.game.trainingFrozen=true;});
  await page.screenshot({path:'output/playwright/effects-super.png',fullPage:true});
  await page.getByRole('button',{name:'연출 강하게',exact:true}).click();
  if(!await page.evaluate(()=>window.game.particles.reducedMotion&&window.game.camera.reducedMotion))throw new Error('Gentle effects did not toggle');
  await page.getByRole('button',{name:'연출 부드럽게',exact:true}).click();

  // Measure actual Web Audio samples, independent of OS speaker volume.
  const audio=await page.evaluate(async()=>{
    const a=window.game.audio;a.musicEnabled=false;a.stopBGM();
    const analyser=a.ctx.createAnalyser();analyser.fftSize=2048;a.sfxGain.connect(analyser);
    const sample=()=>{const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);};
    const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    await pause(700);
    const levels={};
    for(const name of ['playHitLight','playHitHeavy','playBlock','playSuperActivate']) {
      a[name]();await pause(35);levels[name]=sample();await pause(750);
    }
    for(const character of ['RYU','CHUN_LI','CAMMY','ZANGIEF','DHALSIM','BLANKA']) {
      a.playSpecial(character,'fireball');await pause(35);levels[character]=sample();await pause(500);
    }
    a.toggleSound();await pause(150);a.playHitHeavy();await pause(60);levels.muted=sample();a.toggleSound();
    await pause(800);levels.voicesAfterDecay=a.voices;
    a.sfxGain.disconnect(analyser);analyser.disconnect();
    return levels;
  });
  for(const [name,level] of Object.entries(audio)) {
    if(name==='muted'&&level>0.00001)throw new Error('Muted effects still output audio');
    if(name==='voicesAfterDecay'&&level!==0)throw new Error('Audio voices were not cleaned up');
    if(!['muted','voicesAfterDecay'].includes(name)&&level<0.0001)throw new Error(`Silent sound: ${name}`);
  }
  console.log(JSON.stringify(audio));
  await page.keyboard.press('F7');await page.keyboard.press('F4');
  await page.evaluate(()=>{
    const g=window.game;g.initFighters('CAMMY','ZANGIEF');g.resetTraining();g.p1.x=580;g.p2.x=1100;
  });
  await page.keyboard.press('h');
  await page.waitForFunction(()=>window.game.p1.moveId==='fireball'&&window.game.p1.stateTimer>=18);
  await page.evaluate(()=>{window.game.trainingFrozen=true;});
  await page.screenshot({path:'output/playwright/effects-trail.png',fullPage:true});
  if(errors.length)throw new Error(errors.join('\n'));
}
