import {chromium} from 'playwright'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const out='artifacts/v042';await mkdir(out,{recursive:true})
const samples=[...(await readFile('src/assets/samples.ts','utf8')).matchAll(/"source": "([^"]+)"/g)].map(m=>m[1])
const paths=[];for(let i=0;i<2;i++){const p=`${out}/sample-${i}.jpg`;await writeFile(p,Buffer.from(samples[i].split(',')[1],'base64'));paths.push(p)}
const browser=await chromium.launch({executablePath:'/usr/local/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(30000)
const errors=[],checks=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({method:r.method(),url:r.url().slice(0,180)}))
const check=n=>{checks.push(n);console.log('PASS',n)}
const quiet=async()=>{const n=page.locator('.notice .text-button');if(await n.count())await n.click()}
const text=async(t)=>{await quiet();await (t==='取消'?page.locator('.magnet-maker').getByText(t,{exact:true}):page.getByText(t,{exact:true})).click()}
const canvas=()=>page.locator('#preview-host canvas').first()
const readDraft=()=>page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('traval-local-v1',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('draft').objectStore('draft').get('current');q.onsuccess=()=>{const d=q.result;db.close();resolve({work:d.work,photoCount:d.photos.length,types:d.photos.map(p=>p.blob.type)})};q.onerror=reject}}))
const saveDraft=async()=>{await text('保存本地草稿');await page.waitForFunction(()=>document.querySelector('.notice')?.textContent.includes('已保存到本机'));return readDraft()}
const upload=async(path=paths[0])=>{await quiet();const chooser=page.waitForEvent('filechooser');await page.locator('.magnet-upload').click();await(await chooser).setFiles(path);await page.waitForFunction(()=>!document.querySelector('.export-button').hasAttribute('disabled'))}
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4180');await canvas().waitFor();await page.waitForFunction(()=>!document.querySelector('.magnet-upload').hasAttribute('disabled'));await page.waitForTimeout(300)
 assert.equal(await page.locator('.magnet-item').count(),0);check('empty collection preserves decorative board');await page.locator('.magnet-jump').click();await page.waitForTimeout(400);assert.ok((await page.locator('.magnet-studio').boundingBox()).y<100);check('preview shortcut scrolls directly to magnet maker')
 const before=await canvas().evaluate(c=>c.toDataURL());await upload();await page.locator('.magnet-maker').waitFor();assert.equal(await page.locator('.magnet-item').count(),0);assert.equal(await canvas().evaluate(c=>c.toDataURL()),before);check('upload creates local staged preview without modifying poster')
 await text('圆形徽章');assert.equal(await page.locator('.magnet-display .round').count(),1)
 const track=page.locator('.magnet-maker uni-slider').first().locator('.uni-slider-tap-area'),box=await track.boundingBox();await track.click({position:{x:box.width*.4,y:box.height/2}});await page.waitForTimeout(150)
 assert.match(await page.locator('.magnet-maker .range-label').first().innerText(),/1\.[6-9]/)
 let d=await saveDraft();assert.equal(d.work.magnets.length,0);assert.equal(d.photoCount,0);check('pending preview is excluded from saved draft')
 await text('取消');assert.equal(await page.locator('.magnet-maker').count(),0);check('cancel disposes staged upload and preserves poster')
 await upload();await text('加入冰箱贴区域');assert.equal(await page.locator('.magnet-item').count(),1);await page.waitForTimeout(150);assert.ok(await canvas().evaluate(c=>c.toDataURL())!==before);check('commit draws photo magnet in scrapbook board')
 await quiet();await page.getByLabel('调整冰箱贴1',{exact:true}).click();await text('圆形徽章');await text('取消');assert.equal(await page.locator('.magnet-mini .round').count(),0);check('cancel edit leaves committed style unchanged')
 await quiet();await page.getByLabel('调整冰箱贴1',{exact:true}).click();await text('圆形徽章');await text('保存冰箱贴调整');assert.equal(await page.locator('.magnet-mini .round').count(),1);check('save edit applies round badge style')
 await upload(paths[1]);await text('加入冰箱贴区域');d=await saveDraft();const ids=d.work.magnets.map(m=>m.assetId)
 await quiet();await page.getByLabel('前移冰箱贴2',{exact:true}).click();d=await saveDraft();assert.deepEqual(d.work.magnets.map(m=>m.assetId),ids.toReversed());check('reorder updates rendered board and persisted order')
 await page.reload();await canvas().waitFor();await text('恢复草稿');await page.locator('.uni-modal__btn_primary').click();await page.waitForFunction(()=>document.querySelector('.notice')?.textContent.includes('已恢复草稿'));assert.equal(await page.locator('.magnet-item').count(),2);assert.equal(await page.locator('.magnet-mini .round').count(),1);assert.equal(await page.locator('.photo-thumb').count(),0);check('IndexedDB reload restores magnet-only source images and styles')
 // Photo slot operations do not discard magnets.
 await quiet();let fc=page.waitForEvent('filechooser');await page.locator('.photo-picker').first().click();await(await fc).setFiles(paths[0]);await page.waitForFunction(()=>!document.querySelector('.export-button').hasAttribute('disabled'));await text('清空照片');await page.locator('.uni-modal__btn_primary').click();assert.equal(await page.locator('.magnet-item').count(),2);assert.equal(await page.locator('.photo-thumb').count(),0);check('clearing travel photo slots preserves magnets')
 // Reject a corrupt upload while retaining existing collection.
 await upload({name:'not-image.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await page.locator('.notice.error').waitFor();assert.equal(await page.locator('.magnet-item').count(),2);assert.equal(await page.locator('.magnet-maker').count(),0);check('invalid image upload leaves committed magnets intact')
 for(let i=2;i<8;i++){await upload(paths[i%2]);if(i%2)await text('圆形徽章');await text('加入冰箱贴区域')}
 assert.equal(await page.locator('.magnet-item').count(),8);assert.ok(await page.locator('.magnet-upload').getAttribute('disabled')!==null);d=await saveDraft();assert.equal(d.photoCount,8);check('eight-magnet limit prevents overflow and retains exactly eight sources')
 // Capture both styles in the draft editor at desktop and 390px.
 await quiet();await page.getByLabel('调整冰箱贴1',{exact:true}).click();await page.locator('.magnet-studio').screenshot({path:out+'/maker-desktop.png'});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.locator('.magnet-studio').screenshot({path:out+'/maker-mobile.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));check('390px maker and eight-item collection have no page overflow');await text('取消')
 await page.setViewportSize({width:1440,height:1000});await quiet();await page.evaluate(()=>window.scrollTo(0,0));await canvas().screenshot({path:out+'/poster-preview.png'})
 await text('导出我的旅行手账 ↗');await page.locator('.uni-modal__btn_primary').click();await page.locator('.result-modal').waitFor();const img=page.locator('.result-image img');await img.evaluate(i=>i.decode());assert.equal(await img.evaluate(i=>i.naturalWidth),1500);const bytes=await img.evaluate(async i=>Array.from(new Uint8Array(await(await fetch(i.src)).arrayBuffer())));await writeFile(out+'/magnets-1500x2010.jpg',Buffer.from(bytes));check('poster JPEG includes eight custom photo magnets at 1500x2010')
 await page.locator('.result-heading .text-button').click();await quiet();await page.locator('.resolution').getByText('轻量 · 1000 × 1340',{exact:true}).click();await text('导出我的旅行手账 ↗');await page.locator('.uni-modal__btn_primary').click();await page.locator('.result-modal').waitFor();await img.evaluate(i=>i.decode());assert.equal(await img.evaluate(i=>i.naturalWidth),1000);const light=await img.evaluate(async i=>Array.from(new Uint8Array(await(await fetch(i.src)).arrayBuffer())));await writeFile(out+'/magnets-1000x1340.jpg',Buffer.from(light));check('lightweight JPEG exports magnets at 1000x1340');await page.locator('.result-heading .text-button').click();await quiet();await page.getByLabel('移除冰箱贴1',{exact:true}).click();assert.equal(await page.locator('.magnet-item').count(),7);d=await saveDraft();assert.equal(d.photoCount,7);assert.ok(await page.locator('.magnet-upload').getAttribute('disabled')===null);check('remove frees source image and reopens upload slot')
 await page.context().setOffline(true);await quiet();await page.getByLabel('调整冰箱贴1',{exact:true}).click();await text('奶油方贴');await text('保存冰箱贴调整');await saveDraft();await page.context().setOffline(false);check('loaded app can edit magnets and save local draft offline')
 // Reset current work must clear sources without deleting persisted draft.
 await text('重置');await page.locator('.uni-modal__btn_primary').click();assert.equal(await page.locator('.magnet-item').count(),0);assert.equal((await readDraft()).work.magnets.length,7);check('reset clears current magnets but keeps saved draft')
 assert.deepEqual(errors,[]);assert.equal(requests.filter(r=>r.method!=='GET').length,0);check('no uncaught errors or image-upload network requests')
 await writeFile(out+'/results.json',JSON.stringify({checks,errors,requestMethods:[...new Set(requests.map(r=>r.method))]},null,2))
}finally{await browser.close()}
