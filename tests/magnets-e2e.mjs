// Legacy v0.4.2 frame compatibility; new uploads are covered by cutout-e2e.mjs.
import {chromium} from 'playwright'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const out='artifacts/v043';await mkdir(out,{recursive:true})
const sample=(await readFile('src/assets/samples.ts','utf8')).match(/"source": "([^"]+)"/)[1]
const browser=await chromium.launch({executablePath:'/usr/local/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(40000);const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));const check=n=>{checks.push(n);console.log('PASS',n)}
const quiet=async()=>{const n=page.locator('.notice .text-button');if(await n.count())await n.click()}
const click=async(t)=>{await quiet();await page.getByText(t,{exact:true}).click()}
const save=async()=>{await click('保存本地草稿');await page.waitForFunction(()=>document.querySelector('.notice')?.textContent.includes('已保存到本机'))}
const restore=async()=>{await click('恢复草稿');await page.locator('.uni-modal__btn_primary').click();await page.waitForFunction(()=>document.querySelector('.notice')?.textContent.includes('已恢复草稿'))}
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4180');await page.locator('#preview-host canvas').waitFor();await page.waitForFunction(()=>!document.querySelector('.magnet-upload').hasAttribute('disabled'));await save()
 await page.evaluate(async data=>{const blob=await(await fetch(data)).blob();await new Promise((resolve,reject)=>{const r=indexedDB.open('traval-local-v1',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('draft','readwrite'),s=tx.objectStore('draft'),q=s.get('current');q.onsuccess=()=>{const d=q.result;d.work.magnets=[{id:'old-square',assetId:'old-photo',style:'ceramic',crop:{zoom:1,x:.5,y:.5}},{id:'old-round',assetId:'old-photo',style:'round',crop:{zoom:1,x:.5,y:.5}}];d.photos=[{id:'old-photo',blob}];s.put(d,'current')};tx.oncomplete=()=>{db.close();resolve()};tx.onerror=reject}})},sample)
 await restore();assert.equal(await page.locator('.magnet-item').count(),2);assert.equal(await page.locator('.magnet-mini .round').count(),1);check('v0.4.2 square and round stickers restore without migration loss')
 await quiet();await page.getByLabel('调整冰箱贴1',{exact:true}).click();assert.equal(await page.locator('.legacy-editor').count(),1);await click('圆形徽章');await page.locator('.magnet-maker').getByText('取消',{exact:true}).click();assert.equal(await page.locator('.magnet-mini .round').count(),1);check('cancelling a legacy edit preserves the original style')
 await quiet();await page.getByLabel('调整冰箱贴1',{exact:true}).click();await click('圆形徽章');await click('保存冰箱贴调整');assert.equal(await page.locator('.magnet-mini .round').count(),2);check('existing legacy style and crop controls remain editable')
 await quiet();await page.getByLabel('调整冰箱贴1',{exact:true}).click();await click('用原图重新制作异形');await page.locator('.local-cutout').waitFor();assert.ok(await page.locator('.magnet-add').getAttribute('disabled')!==null);await page.locator('.magnet-maker').getByText('取消',{exact:true}).click();assert.equal(await page.locator('.magnet-mini .round').count(),2);check('old source can enter local silhouette workflow, and cancellation is non-destructive')
 await quiet();await page.getByLabel('前移冰箱贴2',{exact:true}).click();await save();check('legacy sticker reorder still saves')
 await quiet();await page.getByLabel('移除冰箱贴1',{exact:true}).click();await save();await page.reload();await page.locator('#preview-host canvas').waitFor();await restore();assert.equal(await page.locator('.magnet-item').count(),1);assert.equal(await page.locator('.magnet-mini img').count(),1);check('shared legacy source is not released while another sticker references it')
 await click('导出我的旅行手账 ↗');await page.locator('.uni-modal__btn_primary').click();await page.locator('.result-modal').waitFor();await page.locator('.result-image img').evaluate(i=>i.decode());assert.equal(await page.locator('.result-image img').evaluate(i=>i.naturalWidth),1500);await page.locator('.result-heading .text-button').click();check('legacy sticker exports through unchanged shared poster renderer')
 assert.deepEqual(errors,[]);check('legacy compatibility has no uncaught runtime errors');await writeFile(out+'/legacy-magnets-results.json',JSON.stringify({checks,errors},null,2))
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
