import {test,expect,viewports,expectNoOverflow} from './public-fixtures';

for(const {name,viewport} of [...viewports,{name:'320px',viewport:{width:320,height:740}}])test.describe(name,()=>{
 test.use({viewport});
 test('all public help answers, keyboard, anchors and page links work without mutations',async({page},info)=>{
  const mutations:string[]=[],consoleErrors:string[]=[];
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text()+" "+message.location().url);});
  await page.route('**/api/**',route=>{
   if(!['GET','HEAD'].includes(route.request().method())){mutations.push(route.request().url());return route.abort();}
   return route.continue();
  });
  await page.goto('/#ayuda');
  const help=page.locator('#ayuda');await expect(help.getByRole('heading',{name:'Ayuda',exact:true})).toBeVisible();
  const buttons=help.locator('article>button');await expect(buttons).toHaveCount(8);
  const destinations=new Set<string>();
  for(let i=0;i<8;i++){
   const button=buttons.nth(i),id=await button.getAttribute('aria-controls');
   await button.scrollIntoViewIfNeeded();await button.focus();await page.keyboard.press('Enter');
   await expect(button).toHaveAttribute('aria-expanded','true');const answer=page.locator('#'+id);await expect(answer).toBeVisible();
   expect(await answer.innerText()).not.toMatch(/<<|>>|«|»|Stripe|Reenviar código/);
   for(const link of await answer.getByRole('link').all()){
    const href=await link.getAttribute('href');expect(href).toBeTruthy();expect(href).not.toBe('#');destinations.add(href!);
    if(href!.startsWith('#')){
     await expect(page.locator(href!)).toHaveCount(1);await link.click();await expect(page).toHaveURL(new RegExp(href!+'$'));
    }
   }
   await expectNoOverflow(page);await button.click();await expect(answer).toBeHidden();
  }
  expect([...destinations].sort()).toEqual(['#buscar','#contacto','#inicio','#servicios','/catalogo','/login','/privacidad','/terminos','mailto:hotelvillaserena.gt@gmail.com'].sort());
  for(const href of [...destinations].filter(h=>h.startsWith('/'))){
   await page.goto('/#ayuda');const link=help.locator(`a[href="${href}"]`).first();
   await link.locator('xpath=ancestor::article').locator(':scope>button').click();
   await link.click();await expect(page).toHaveURL(new RegExp(href+'$'));await expect(page.locator('h1')).toBeVisible();
   await page.goBack();await expect(help).toBeVisible();
  }
  await page.goto('/#ayuda');await help.locator('#help-question-payment').click();await expect(help.locator('#help-answer-payment')).toContainText('Consultar estado');
  await help.screenshot({path:info.outputPath('ayuda.png')});
  expect(mutations).toEqual([]);
  // Keep resource/unauthenticated-session diagnostics visible in local evidence.
  await info.attach('console-errors.json',{body:JSON.stringify(consoleErrors,null,2),contentType:'application/json'});
  expect(consoleErrors.filter(message=>!message.includes('401')&&!message.includes('ERR_')&&!message.includes('fonts.googleapis.com'))).toEqual([]);
 });
});
