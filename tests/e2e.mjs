import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import assert from 'node:assert/strict'
const out='artifacts';await mkdir(out,{recursive:true})
const executablePath=process.env.CHROMIUM_PATH||(existsSync('/usr/local/bin/chromium')?'/usr/local/bin/chromium':undefined)
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--enable-precise-memory-info']})
const page=await browser.newPage({viewport:{width:1440,height:1100}})
const errors=[],network=[],checks=[]
page.on('pageerror',e=>errors.push(e.message))
page.on('request',r=>network.push({url:r.url().startsWith('data:')?r.url().slice(0,35)+'[embedded asset]':r.url(),method:r.method(),type:r.resourceType()}))
const check=(name,details={})=>{checks.push({name,status:'passed',...details});console.log('PASS',name)}
const closeNotice=async()=>{const n=page.locator('.notice .text-button');if(await n.count())await n.click()}
const choose=async(index,path)=>{await closeNotice();const event=page.waitForEvent('filechooser');await page.locator('.photo-picker').nth(index).click();await(await event).setFiles(path);await page.waitForFunction(()=>!document.querySelector('.export-button').hasAttribute('disabled'));await page.waitForTimeout(120)}
const exportImage=async()=>{await closeNotice();await page.locator('.export-button').click();await page.locator('.result-modal').waitFor();await page.waitForTimeout(180)}
const closeResult=async()=>{await page.locator('.result-heading .text-button').click();await page.locator('.result-modal').waitFor({state:'hidden'})}
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4180');await page.locator('canvas').waitFor();await page.waitForTimeout(400)
 check('initial render with 4 empty slots and empty date');assert.equal(await page.locator('.photo-picker').count(),4)
 assert.equal(await page.locator('.field input').nth(2).inputValue(),'')
 await page.screenshot({path:`${out}/desktop-empty.png`,fullPage:true})
 const fixtures=await page.evaluate(()=>{
  return [[1600,900,'image/jpeg'],[900,1600,'image/png'],[1000,1000,'image/webp'],[2200,600,'image/jpeg']].map(([w,h,type],i)=>{
   const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,['#73a0a3','#c1b3a1','#a3b4a0','#d1a07d'][i]);g.addColorStop(1,['#e8d9ae','#627e8b','#e6ce96','#71939a'][i]);x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='#ffffff70';x.fillRect(w*.1,0,w*.1,h);x.fillStyle='#3b534b80';x.fillRect(w*.75,0,w*.2,h);x.fillStyle='#fff';x.font=`${Math.round(Math.min(w,h)*.15)}px sans-serif`;x.fillText(`QA ${i+1}`,w*.35,h*.55);return c.toDataURL(type,.9)
  })
 })
 const paths=[]
 for(let i=0;i<4;i++){const ext=['jpg','png','webp','jpg'][i],path=`${out}/fixture-${i}.${ext}`;await writeFile(path,Buffer.from(fixtures[i].split(',')[1],'base64'));paths.push(path);await choose(i,path);assert.equal(await page.locator('.photo-thumb').count(),i+1)}
 check('4 different aspect ratios, JPEG PNG and WebP decode')
 await page.locator('.field input').nth(0).fill('山海之间，沿途有你')
 await page.locator('.field input').nth(1).fill('把平凡的日子，过成值得珍藏的风景')
 await page.locator('.field input').nth(2).fill('2026.10.01 — 10.07')
 await page.locator('.photo-actions').nth(0).locator('uni-button').first().click()
 await page.locator('.crop-panel').waitFor()
 const sliders=page.locator('.crop-panel uni-slider')
 // Use the actual slider tap area, not synthetic component events.
 const zoomTrack=sliders.nth(0).locator('.uni-slider-tap-area'),zoomBox=await zoomTrack.boundingBox()
 await zoomTrack.click({position:{x:zoomBox.width*.4,y:zoomBox.height/2}})
 await page.waitForFunction(()=>{const t=document.querySelector('.range-row .range-label').textContent;return /1\.[6-9][0-9]×/.test(t)})
 const xTrack=sliders.nth(1).locator('.uni-slider-tap-area'),xBox=await xTrack.boundingBox()
 await xTrack.click({position:{x:xBox.width*.2,y:xBox.height/2}})

 const canvas=page.locator('canvas');await canvas.scrollIntoViewIfNeeded();let box=await canvas.boundingBox()
 const before=await canvas.evaluate(c=>c.toDataURL())
 await page.mouse.move(box.x+box.width*.3,box.y+box.height*.45);await page.mouse.down();await page.mouse.move(box.x+box.width*.4,box.y+box.height*.48,{steps:5});await page.mouse.up();await page.waitForTimeout(150)
 assert.notEqual(await canvas.evaluate(c=>c.toDataURL()),before)
 check('independent zoom / pan sliders and pointer drag')
 await page.locator('.crop-heading .text-button').click()
 for(let i=1;i<4;i++){
  await page.locator('.photo-actions').nth(i).locator('uni-button').first().click()
  const track=page.locator('.crop-panel uni-slider').first().locator('.uni-slider-tap-area'),r=await track.boundingBox()
  await track.click({position:{x:r.width*.25,y:r.height/2}})
  await page.waitForFunction(()=>/1\.[45][0-9]×/.test(document.querySelector('.range-row .range-label').textContent))
  await page.locator('.crop-heading .text-button').click()
 }
 check('all 4 photo slots can be independently cropped')
 for(const name of ['落日陶土','海盐蓝','鼠尾草']){await page.locator('.palette').filter({hasText:name}).click();assert.equal(await page.locator('.photo-thumb').count(),4);assert.equal(await page.locator('.field input').first().inputValue(),'山海之间，沿途有你')}
 check('3 palettes preserve photo and text data')
 await closeNotice();await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(100);await page.screenshot({path:`${out}/desktop-edited.png`,fullPage:true})
 await exportImage()
 const image=page.locator('.result-image img');await image.waitFor()
 const src=await image.getAttribute('src')
 const data=await page.evaluate(async url=>Array.from(new Uint8Array(await(await fetch(url)).arrayBuffer())),src)
 await writeFile(`${out}/poster-1500x2010.jpg`,Buffer.from(data))
 const comparison=await page.evaluate(async()=>{
  const original=document.querySelector('#preview-host canvas'),img=document.querySelector('.result-image img');await img.decode();const c=document.createElement('canvas');c.width=original.width;c.height=original.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);const a=ctx.getImageData(0,0,c.width,c.height).data,b=original.getContext('2d').getImageData(0,0,c.width,c.height).data;let sum=0;for(let i=0;i<a.length;i+=4)for(let j=0;j<3;j++)sum+=Math.abs(a[i+j]-b[i+j]);return{width:img.naturalWidth,height:img.naturalHeight,meanAbsoluteRGBError:sum/(c.width*c.height*3)}
 })
 assert.equal(comparison.width,1500);assert.equal(comparison.height,2010);assert.ok(comparison.meanAbsoluteRGBError<8)
 check('1500 × 2010 JPEG and preview/export consistency',comparison)
 const download=page.waitForEvent('download');await page.locator('.result-modal .primary').click();await(await download).saveAs(`${out}/downloaded-poster.jpg`);check('desktop download')
 await closeResult()
 await page.locator('.resolution uni-button').nth(1).click();await exportImage();assert.match(await page.locator('.result-heading').innerText(),/1000 × 1340/);await closeResult();check('lower-resolution 1000 × 1340 export')
 const title=page.locator('.field input').first();await title.fill('山'.repeat(26)+'👩‍👩‍👧‍👦');await page.waitForFunction(()=>document.querySelector('.field input').value.length===24);assert.equal(Array.from(await title.inputValue()).length,24);await title.fill('VeryLongEnglishTitleText');await exportImage();await closeResult();await title.fill('沿途有你👩‍👩‍👧‍👦');check('Chinese, long English, emoji, and text length boundaries')
 await closeNotice();await page.locator('.photo-actions').nth(1).locator('uni-button').nth(1).click();assert.equal(await page.locator('.photo-thumb').count(),3);await choose(1,paths[1]);await choose(0,paths[3]);await choose(0,paths[0]);assert.equal(await page.locator('.photo-thumb').count(),4);check('remove, reselect, sequential rapid replacement do not clear other slots')
 await writeFile(`${out}/invalid.heic`,Buffer.alloc(30));await choose(0,`${out}/invalid.heic`);assert.match(await page.locator('.notice').innerText(),/HEIC/);assert.equal(await page.locator('.photo-thumb').count(),4)
 await writeFile(`${out}/too-large.jpg`,Buffer.alloc(15*1024*1024+1));await choose(0,`${out}/too-large.jpg`);assert.match(await page.locator('.notice').innerText(),/15 MB/)
 const huge=Buffer.alloc(24);huge.set([137,80,78,71]);huge.set([73,72,68,82],12);huge.writeUInt32BE(16000,16);huge.writeUInt32BE(16000,20);await writeFile(`${out}/too-many-pixels.png`,huge);await choose(0,`${out}/too-many-pixels.png`);assert.match(await page.locator('.notice').innerText(),/像素过大/)
 // Valid PNG header with no image body passes header checks, then fails actual decode.
 const broken=Buffer.from(huge);broken.writeUInt32BE(100,16);broken.writeUInt32BE(100,20);await writeFile(`${out}/broken.png`,broken);await choose(0,`${out}/broken.png`);assert.match(await page.locator('.notice').innerText(),/解码失败/)
 await choose(0,paths[0]);check('unsupported format / file-size / pixel limit / decode failure preserve work and recover')
 // Cancel a real file chooser via Playwright by setting an empty selection.
 await closeNotice();const cancelChooser=page.waitForEvent('filechooser');await page.locator('.photo-picker').first().click();await(await cancelChooser).setFiles([]);await page.waitForTimeout(200);assert.equal(await page.locator('.photo-thumb').count(),4);check('cancel file selection keeps current photos')
 // EXIF orientation 6: insert minimal valid TIFF metadata into JPEG.
 const raw=Buffer.from(fixtures[0].split(',')[1],'base64'),exif=Buffer.from('45786966000049492a0008000000010012010300010000000600000000000000','hex'),marker=Buffer.alloc(4);marker[0]=255;marker[1]=225;marker.writeUInt16BE(exif.length+2,2);await writeFile(`${out}/orientation-6.jpg`,Buffer.concat([raw.subarray(0,2),marker,exif,raw.subarray(2)]));await choose(0,`${out}/orientation-6.jpg`)
 const orientation=await page.locator('.photo-thumb img').first().evaluate(async img=>{await img.decode();return{width:img.naturalWidth,height:img.naturalHeight}});assert.ok(orientation.height>orientation.width);check('EXIF orientation 6 applied once in Chromium',orientation);await choose(0,paths[0])
 await page.evaluate(()=>{window.__toBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback){callback(null)}})
 await closeNotice();await page.locator('.export-button').click();await page.locator('.notice.error').waitFor();assert.match(await page.locator('.notice').innerText(),/失败/);await page.evaluate(()=>{HTMLCanvasElement.prototype.toBlob=window.__toBlob;delete window.__toBlob});await exportImage();await closeResult();check('forced export failure recovers and retains work')
 await page.evaluate(()=>Object.defineProperty(document.fonts,'ready',{configurable:true,get:()=>Promise.reject(new Error('forced-font-failure'))}))
 await exportImage();assert.match(await page.locator('.save-hint').innerText(),/字体准备失败或超时/);await closeResult();await page.evaluate(()=>delete document.fonts.ready);check('forced font readiness failure uses system fallback with visible warning')
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable')
 const metrics=async()=>{await cdp.send('HeapProfiler.collectGarbage');const r=await cdp.send('Performance.getMetrics'),d=await cdp.send('Memory.getDOMCounters');return {jsHeapUsed:r.metrics.find(m=>m.name==='JSHeapUsedSize').value,...d}}
 await page.locator('.resolution uni-button').first().click();const baseline=await metrics()
 for(let i=0;i<10;i++){await choose(i%4,paths[i%4]);await exportImage();await closeResult()}
 const after=await metrics();check('10 photo-replace/export/close cycles completed; sampled Chromium metrics',{baseline,after,limitation:'JS heap/DOM sample only; not a mobile native bitmap-memory or long-running leak proof'})
 await page.setViewportSize({width:390,height:844});await closeNotice();await page.locator('.photo-actions').first().locator('uni-button').first().click();await page.locator('.crop-panel').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=390),true);await page.screenshot({path:`${out}/mobile-crop.png`,fullPage:true});await page.locator('.crop-heading .text-button').click();await exportImage();await page.screenshot({path:`${out}/mobile-export.png`,fullPage:true});await page.screenshot({path:`${out}/mobile-export-viewport.png`});await closeResult();check('390px narrow-screen crop and export without horizontal overflow')
 // Confirm reset, then empty-slot export cancellation and explicit approval.
 await closeNotice();await page.locator('.panel-heading .text-button').click();await page.getByText('取消',{exact:true}).last().click();assert.equal(await page.locator('.photo-thumb').count(),4)
 await page.locator('.panel-heading .text-button').click();await page.getByText('确认',{exact:true}).last().click();assert.equal(await page.locator('.photo-thumb').count(),0);await page.waitForFunction(()=>document.querySelector('.field input').value==='My Travel Map');assert.equal(await page.locator('.field input').first().inputValue(),'My Travel Map');await closeNotice()
 await page.locator('.export-button').click();await page.getByText('取消',{exact:true}).last().click();assert.equal(await page.locator('.result-modal').count(),0)
 await page.locator('.export-button').click();await page.getByText('确认',{exact:true}).last().click();await page.locator('.result-modal').waitFor();await closeResult();check('reset confirmation and empty-slot export cancel / confirm')
 await page.locator('.load-example').click();await page.waitForFunction(()=>document.querySelectorAll('.photo-thumb').length===4);assert.match(await page.locator('.example-notice').innerText(),/4 张 AI 示例/);for(const img of await page.locator('.photo-thumb img').all())assert.ok(await img.evaluate(async e=>{await e.decode();return e.naturalWidth>0}));check('explicit demo loading labels all sample photos')
 await closeNotice();await page.locator('.export-button').click();await page.getByText('取消',{exact:true}).last().click();assert.equal(await page.locator('.result-modal').count(),0);check('demo export requires explicit confirmation')
 await choose(0,paths[0]);assert.match(await page.locator('.example-notice').innerText(),/3 张 AI 示例/);await page.locator('.caption-edit input').first().fill('我的照片');await page.locator('.palette').filter({hasText:'海盐蓝'}).click();assert.equal(await page.locator('.caption-edit input').first().inputValue(),'我的照片');check('replacing demo photo removes only its example flag and captions persist')
 await closeNotice();await page.locator('.clear-photos').click();await page.getByText('确认',{exact:true}).last().click();await page.waitForFunction(()=>document.querySelectorAll('.photo-thumb').length===0)
 await page.locator('.details-toggle').click();await page.locator('.field input').nth(3).fill('Jayden');await page.locator('.field input').nth(4).fill('我的旅途札记');await page.locator('.field input').nth(5).fill('下一站去看海');assert.equal(await page.locator('.field input').nth(3).inputValue(),'Jayden');check('nickname, notes and wish fields are editable')
 await closeNotice();await page.locator('.load-example').click();await page.waitForFunction(()=>document.querySelectorAll('.photo-thumb').length===4);await closeNotice();await page.locator('.clear-photos').click();await page.waitForFunction(()=>document.querySelectorAll('.photo-thumb').length===0);assert.equal(await page.locator('.field input').nth(3).inputValue(),'Jayden');check('one-click clear of all-demo photos retains edited text and map assets')
 // Force a template image decode failure on a fresh page; then retry with the original asset source.
 const assetFailure=await browser.newPage()
 await assetFailure.addInitScript(()=>{window.__failAsset=true;const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,get:d.get,set(value){if(window.__failAsset&&String(value).startsWith('data:image/')){window.__failAsset=false;d.set.call(this,'data:image/png;base64,broken')}else d.set.call(this,value)}})})
 await assetFailure.goto(process.env.BASE_URL||'http://127.0.0.1:4180');await assetFailure.getByText('重新准备画布',{exact:true}).waitFor();await assetFailure.getByText('重新准备画布',{exact:true}).click();await assetFailure.waitForFunction(()=>!document.querySelector('.load-example').hasAttribute('disabled'));assert.equal(await assetFailure.locator('canvas').count(),1);await assetFailure.close();check('template image failure shows retry and recovers with a single preview canvas')
 const external=network.filter(r=>/^https?:/.test(r.url)&&!r.url.startsWith('http://127.0.0.1:4180')&&!r.url.startsWith(process.env.BASE_URL||'http://127.0.0.1:4180'))
 const postRequests=network.filter(r=>r.method!=='GET');assert.deepEqual(external,[]);assert.deepEqual(postRequests,[]);assert.deepEqual(errors,[]);check('no external requests, photo uploads, or runtime page errors in this test',{external,postRequests,requestCount:network.length})
 await writeFile(`${out}/e2e-results.json`,JSON.stringify({browser:await browser.version(),checks,network,errors},null,2));console.log(`ALL ${checks.length} CHECKS PASSED`)
}catch(error){await page.screenshot({path:`${out}/failure.png`,fullPage:true});await writeFile(`${out}/e2e-results.json`,JSON.stringify({checks,error:String(error),errors,network},null,2));console.error(error);process.exitCode=1}finally{await browser.close()}
