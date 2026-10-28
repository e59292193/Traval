import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const base=process.env.BASE_URL||'http://127.0.0.1:4180'
const out='artifacts/v044';await mkdir(out,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/local/bin/chromium',headless:true,args:['--no-sandbox']})
const page=await browser.newPage({viewport:{width:1000,height:1340}}),errors=[]
page.on('pageerror',e=>errors.push(e.message))
try{
 await page.goto(base+'/tests/poster-map-harness.html');await page.waitForFunction(()=>window.ready)
 const maps={};for(const [mode,theme] of [['empty','sage'],['gansu','sage'],['zhejiang','sage'],['china','sage'],['china','clay'],['china','sea']]){
  const r=await page.evaluate(([mode,theme])=>qa.render(mode,theme),[mode,theme]);assert.equal(r.selection,mode==='gansu'?'甘肃省':mode==='zhejiang'?'浙江省':'中国');assert.equal(r.corner[3],0,'map corner must be transparent')
  maps[mode+'-'+theme]=r.map;await writeFile(`${out}/${mode}-${theme}.png`,Buffer.from(r.poster.split(',')[1],'base64'));console.log('PASS',mode,theme,r.selection,'transparent corners')
 }
 assert.notEqual(maps['china-sage'],maps['china-clay']);assert.notEqual(maps['china-sea'],maps['china-clay'])
 // Local poster generation must work without any remote tiles, including after a theme change.
 await page.context().setOffline(true);const offline=await page.evaluate(()=>qa.render('gansu','clay'));assert.equal(offline.selection,'甘肃省');await page.context().setOffline(false)
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS offline poster generation, palette changes, no runtime errors')
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/');await page.locator('#preview-host canvas').waitFor();await page.waitForFunction(()=>!document.querySelector('.preview-loading'))
 assert.equal(await page.locator('.magnet-studio,.magnet-jump,.magnet-display').count(),0)
 await page.screenshot({path:`${out}/app-desktop.png`,fullPage:true})
 // Run the real UI path: add a trip and one place, then switch themes and export.
 await page.locator('.trip-name-input input').fill('天水之旅');await page.getByText('新建旅行',{exact:true}).click()
 await page.locator('.travel-field select').first().selectOption('620500');await page.getByText('添加地点',{exact:true}).click();await page.waitForTimeout(1000)
 assert.equal(await page.locator('.timeline-stop').count(),1);assert.equal(await page.locator('.map-state.map-error').count(),0)
 const sage=await page.locator('#preview-host canvas').evaluate(c=>c.toDataURL());await page.locator('.palette').filter({hasText:'海盐蓝'}).click();await page.waitForTimeout(1000);assert.notEqual(await page.locator('#preview-host canvas').evaluate(c=>c.toDataURL()),sage)
 await page.locator('.export-button').click();await page.locator('.uni-modal__btn_primary').click();await page.locator('.result-modal').waitFor();const img=page.locator('.result-image img');await img.evaluate(i=>i.decode());assert.equal(await img.evaluate(i=>i.naturalWidth),1500);assert.equal(await img.evaluate(i=>i.naturalHeight),2010);await page.locator('.result-heading .text-button').click()
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/app-mobile.png`,fullPage:true})
 await page.locator('#preview-host').screenshot({path:`${out}/app-province.png`});assert.equal(errors.length,0,errors.join('\n'));console.log('PASS real UI: magnet removal, Tianshui, theme switch, JPEG 1500×2010, mobile layout')
}finally{await browser.close()}
