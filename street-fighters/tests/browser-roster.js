async page => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.reload();
  await page.waitForFunction(()=>!!window.game);
  const assets=await page.evaluate(async()=>{
    const {sprites}=await import('/src/render/Sprites.ts');
    const {CHARACTERS}=await import('/src/ui/Menu.ts');
    if(!sprites.loaded)throw new Error('Roster assets did not load');
    const canvas=document.createElement('canvas');canvas.width=500;canvas.height=300;
    const ctx=canvas.getContext('2d');
    for(const c of CHARACTERS)for(let pose=0;pose<16;pose++) {
      ctx.clearRect(0,0,500,300);
      if(!sprites.drawPose(ctx,c.type,pose,250,290,222))throw new Error(`Missing ${c.type} pose ${pose}`);
      const data=ctx.getImageData(0,0,500,300).data;
      if(!data.some((v,i)=>i%4===3&&v>100))throw new Error(`Empty ${c.type} pose ${pose}`);
    }
    return CHARACTERS.map(c=>c.type);
  });
  if(assets.join(',')!=='RYU,CHUN_LI,CAMMY,ZANGIEF,DHALSIM,BLANKA')throw new Error('Incorrect roster');
  for(let index=2;index<6;index++) {
    await page.getByRole('button',{name:'트레이닝',exact:true}).click();
    const canvas=page.locator('#game-canvas');
    const box=await canvas.boundingBox();
    await page.mouse.click(box.x+(170+index*158+74)*box.width/1280,box.y+540*box.height/720);
    await page.waitForFunction(i=>window.game.menu.p1SelectedCharIndex===i,index);
    const opponent=index===5?2:index+1;
    for(let i=0;i<6;i++) {
      if(await page.evaluate(n=>window.game.menu.p2SelectedCharIndex===n,opponent))break;
      const previous=await page.evaluate(()=>window.game.menu.p2SelectedCharIndex);
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(n=>window.game.menu.p2SelectedCharIndex!==n,previous);
    }
    await page.keyboard.press('f');
    await page.waitForFunction(()=>window.game.scene==='FIGHTING');
    const actual=await page.evaluate(()=>window.game.p1.character);
    if(actual!==assets[index])throw new Error('Selected fighter did not spawn');
    if(await page.evaluate(()=>window.game.p2.character)!==assets[opponent])throw new Error('Selected opponent did not spawn');
    await page.keyboard.press('F4');
    await page.evaluate(()=>{const g=window.game;g.p1.x=700;g.p2.x=800;});
    await page.keyboard.press('h');
    await page.waitForFunction(()=>window.game.p2.lastDamage>0);
    await page.keyboard.press('F4');
    await page.keyboard.press('r');
    await page.waitForFunction(()=>window.game.particles.superFreeze);
    await page.screenshot({path:`output/playwright/roster-${assets[index].toLowerCase()}-super.png`,fullPage:true});
  }
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('All 96 roster poses rendered; all four new fighters selected, hit with a special, and activated a super.');
}
