import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
import {existsSync} from 'node:fs'
const out='artifacts/v2';await mkdir(out,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/local/bin/chromium')?'/usr/local/bin/chromium':undefined),headless:true,args:['--no-sandbox']})
const page=await browser.newPage({viewport:{width:1560,height:1100}}),errors=[]
page.on('pageerror',e=>errors.push(e.message))
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4180');await page.waitForFunction(()=>{const e=document.querySelector('.load-example');return e&&!e.hasAttribute('disabled')})
 await page.screenshot({path:out+'/desktop-empty.png',fullPage:true})
 await page.locator('.load-example').click();await page.waitForFunction(()=>document.querySelectorAll('.photo-thumb').length===4);await page.waitForTimeout(300)
 await page.locator('.notice .text-button').click();await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(150)
 await page.screenshot({path:out+'/desktop-demo.png',fullPage:true})
 const png=await page.locator('canvas').evaluate(c=>c.toDataURL('image/png').split(',')[1]);await writeFile(out+'/poster-demo-preview.png',Buffer.from(png,'base64'))
 await page.locator('.export-button').click();await page.getByText('确认',{exact:true}).last().click();await page.locator('.result-modal').waitFor();await page.waitForTimeout(250)
 const img=page.locator('.result-image img'),src=await img.getAttribute('src');const bytes=await page.evaluate(async url=>Array.from(new Uint8Array(await(await fetch(url)).arrayBuffer())),src);await writeFile(out+'/poster-demo-1500x2010.jpg',Buffer.from(bytes))
 await page.locator('.result-heading .text-button').click();if(await page.locator('.notice .text-button').count())await page.locator('.notice .text-button').click();await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:out+'/mobile-demo.png',fullPage:true});console.log(JSON.stringify({errors,poster:out+'/poster-demo-1500x2010.jpg'}))
}finally{await browser.close()}
