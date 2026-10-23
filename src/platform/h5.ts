import type {Platform,Target,Photo,ExportResult} from '../types'
import {MAX_FILE_BYTES,readImageHeader} from '../core/image-header'
import {caveatFont} from '../assets/caveat'
const bitmapLimit=2400
export function createH5Platform():Platform {
 const cleanup=new Set<()=>void>()
 let handFontReady=false
 function track(fn:()=>void){cleanup.add(fn);return ()=>{if(cleanup.delete(fn))fn()}}
 const blobURL=(blob:Blob)=>{const url=URL.createObjectURL(blob);return {url,dispose:track(()=>URL.revokeObjectURL(url))}}
 async function blob(canvas:HTMLCanvasElement):Promise<Blob>{return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片生成失败，请降低分辨率后重试')),'image/jpeg',.94))}
 async function image(url:string){const img=new Image();img.src=url;await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('图片解码失败，请换一张照片'))});return img}
 function pick():Promise<File|null>{return new Promise(resolve=>{
  const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.style.display='none';document.body.appendChild(input)
  let settled=false,timer:ReturnType<typeof setTimeout>|undefined
  const finish=(file:File|null)=>{if(settled)return;settled=true;clearTimeout(timer);window.removeEventListener('focus',focus);input.remove();resolve(file)}
  const focus=()=>{timer=setTimeout(()=>finish(input.files?.[0]||null),1000)}
  input.onchange=()=>finish(input.files?.[0]||null);input.addEventListener('cancel',()=>finish(null));window.addEventListener('focus',focus);input.click()
 })}
 return {
  name:'H5',
  async createTarget(id,width,height,preview){
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('当前浏览器无法创建 Canvas，请尝试更新浏览器')
   if(preview){const host=document.getElementById(id);if(!host)throw new Error('预览容器未准备好');host.appendChild(canvas);canvas.style.cssText='display:block;width:100%;height:auto;touch-action:pan-y';canvas.setAttribute('aria-label','旅行海报实时预览；选定照片后可拖动裁剪')}
   return {ctx,width,height,native:canvas,destroy(){canvas.remove();canvas.width=1;canvas.height=1}}
  },
  async loadAsset(_target,id,source){
   let decoded:HTMLImageElement
   try{decoded=await image(source)}catch{throw new Error('模板或示例素材加载失败，请重试；必要时重新准备画布。')}
   return {id,source:decoded,width:decoded.naturalWidth,height:decoded.naturalHeight,thumbnail:source,dispose:track(()=>{decoded.src=''})}
  },
  async choosePhoto(){
   const file=await pick();if(!file)return null
   if(file.size>MAX_FILE_BYTES)throw new Error('单张照片不能超过 15 MB，请压缩后重试')
   const header=readImageHeader(new Uint8Array(await file.slice(0,1024*1024).arrayBuffer()))
   let source:ImageBitmap|HTMLImageElement,release=()=>{}
   if(typeof createImageBitmap==='function'){
    const orientedWidth=header.orientation>=5&&header.orientation<=8?header.height:header.width
    const ratio=Math.min(1,bitmapLimit/Math.max(header.width,header.height))
    try{const bmp=await createImageBitmap(file,{imageOrientation:'from-image',resizeWidth:Math.max(1,Math.round(orientedWidth*ratio)),resizeQuality:'high'});source=bmp;release=()=>bmp.close()}
    catch{throw new Error('图片解码失败或内存不足，请换一张较小的 JPEG/PNG')}
   }else{
    const raw=blobURL(file)
    try{
     const decoded=await image(raw.url);const ratio=Math.min(1,bitmapLimit/Math.max(decoded.naturalWidth,decoded.naturalHeight));const small=document.createElement('canvas')
     small.width=Math.max(1,Math.round(decoded.naturalWidth*ratio));small.height=Math.max(1,Math.round(decoded.naturalHeight*ratio));const ctx=small.getContext('2d');if(!ctx)throw new Error('图片解码内存不足');ctx.drawImage(decoded,0,0,small.width,small.height)
     const resized=blobURL(await blob(small));small.width=small.height=1
     try{source=await image(resized.url);release=resized.dispose}catch(e){resized.dispose();throw e}
    }finally{raw.dispose()}
   }
   const width=source instanceof HTMLImageElement?source.naturalWidth:source.width,height=source instanceof HTMLImageElement?source.naturalHeight:source.height
   const thumb=document.createElement('canvas');thumb.width=180;thumb.height=Math.max(1,Math.round(height/width*180));const tc=thumb.getContext('2d')
   if(!tc){release();throw new Error('缩略图生成失败，请释放设备内存后重试')}
   let mini:ReturnType<typeof blobURL>
   try{tc.fillStyle='#fff';tc.fillRect(0,0,thumb.width,thumb.height);tc.drawImage(source,0,0,thumb.width,thumb.height);mini=blobURL(await blob(thumb))}catch(e){release();throw e}finally{thumb.width=thumb.height=1}
   const dispose=track(()=>{release();mini.dispose()})
   return {id:`photo-${Date.now()}-${Math.random().toString(36).slice(2)}`,source,width,height,thumbnail:mini.url,dispose} satisfies Photo
  },
  async prepareFonts(){
   let fontWarning:string|null=null
   if(document.fonts&&!handFontReady){
    try{const face=new FontFace('TravalCaveat',`url(${caveatFont})`,{weight:'400 700'});await face.load();(document.fonts as unknown as {add:(font:FontFace)=>void}).add(face);handFontReady=true}
    catch{fontWarning='手写字体加载失败，已回退系统字体；请检查预览'}
   }
   if(!document.fonts)return '浏览器不支持字体准备检测，使用系统字体；请检查导出文字'
   let timer:ReturnType<typeof setTimeout>|undefined
   try{await Promise.race([document.fonts.ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('字体准备超时')),4000)})]);return fontWarning}catch{return '字体准备失败或超时，已回退系统字体；请检查预览'}finally{clearTimeout(timer)}
  },
  async exportJPEG(target){const result=blobURL(await blob(target.native as HTMLCanvasElement));return {...result,width:target.width,height:target.height}},
  async save(result){
   if(/MicroMessenger|Android|iPhone|iPad/i.test(navigator.userAgent))return '请在预览图片上长按保存；若被浏览器限制，请使用系统分享或外部浏览器。'
   const a=document.createElement('a');a.href=result.url;a.download=`沿途旅行手账-${result.width}x${result.height}.jpg`;a.click();return '已发起下载，请在浏览器下载列表中确认。'
  },
  bindDrag(target,fn){
   const canvas=target.native as HTMLCanvasElement;let last:{x:number;y:number}|null=null
   const down=(e:PointerEvent)=>{if(!canvas.classList.contains('crop-active'))return;canvas.setPointerCapture(e.pointerId);last={x:e.clientX,y:e.clientY}}
   const move=(e:PointerEvent)=>{if(!last)return;const rect=canvas.getBoundingClientRect();fn((e.clientX-last.x)*1000/rect.width,(e.clientY-last.y)*(target.height/target.width*1000)/rect.height);last={x:e.clientX,y:e.clientY}}
   const up=()=>{last=null}
   canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up)
   // Class reflects edit mode without touching DOM outside this adapter.
   return track(()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up)})
  },
  schedule(fn){const id=requestAnimationFrame(fn);return ()=>cancelAnimationFrame(id)},
  dispose(){for(const fn of [...cleanup]){cleanup.delete(fn);fn()}}
 }
}
export function setCropMode(target:Target,active:boolean){const canvas=target.native as HTMLCanvasElement;canvas.classList.toggle('crop-active',active);canvas.style.touchAction=active?'none':'pan-y';canvas.style.cursor=active?'grab':'default'}
