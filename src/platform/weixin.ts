import type {Platform,Target,Photo} from '../types'
import {MAX_FILE_BYTES,MAX_IMAGE_PIXELS} from '../core/image-header'
// Only referenced in MP-WEIXIN conditional imports. Real-device validation is still required.
declare const wx:any
export function createWeixinPlatform():Platform {
 const resources=new Set<()=>void>()
 const cleanupFile=(path:string)=>{try{wx.getFileSystemManager().unlink({filePath:path,fail:()=>{}})}catch{ /* temporary path may already be released */ }}
 const track=(fn:()=>void)=>{resources.add(fn);return ()=>{if(resources.delete(fn))fn()}}
 return {
  name:'微信小程序（待真机验证）',
  createTarget(id,width,height,_preview,scope){return new Promise((resolve,reject)=>{
   const query=uni.createSelectorQuery().in(scope as any)
   query.select(`#${id}`).fields({node:true,size:true},()=>{}).exec((results:any)=>{
    const node=results[0]?.node;if(!node){reject(new Error('Canvas 2D 节点未就绪，请检查基础库版本'));return}
    node.width=width;node.height=height;const ctx=node.getContext('2d')
    if(!ctx){reject(new Error('Canvas 2D 不可用'));return}
    resolve({ctx,width,height,native:node,destroy(){node.width=1;node.height=1}})
   })
  })},
  async loadAsset(target,id,source){
   const parts=source.match(/^data:image\/(png|jpeg);base64,(.+)$/)
   if(!parts)throw new Error('模板素材格式无效')
   const path=`${wx.env.USER_DATA_PATH}/traval-${id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${parts[1]==='png'?'png':'jpg'}`
   await new Promise<void>((resolve,reject)=>wx.getFileSystemManager().writeFile({filePath:path,data:parts[2],encoding:'base64',success:()=>resolve(),fail:()=>reject(new Error('模板素材写入失败，请检查设备空间'))}))
   try{
    const img=(target.native as any).createImage()
    await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('模板素材加载失败，请重试'));img.src=path})
    return {id,source:img,width:img.width,height:img.height,thumbnail:path,dispose:track(()=>{img.src='';cleanupFile(path)})}
   }catch(e){cleanupFile(path);throw e}
  },
  async choosePhoto(target){
   const picked:any=await new Promise((resolve,reject)=>uni.chooseImage({count:1,sizeType:['original'],sourceType:['album','camera'],success:resolve,fail:(e:any)=>/cancel/.test(e.errMsg)?resolve(null):reject(new Error('选图失败，请重试'))}))
   if(!picked)return null
   const file=picked.tempFiles[0],path=picked.tempFilePaths[0]
   try{
    if(file.size>MAX_FILE_BYTES)throw new Error('单张照片不能超过 15 MB')
    const info:any=await new Promise((resolve,reject)=>uni.getImageInfo({src:path,success:resolve,fail:()=>reject(new Error('图片解码失败，请选择 JPEG/PNG'))}))
    if(!['jpeg','jpg','png','webp'].includes(info.type))throw new Error('此格式暂不支持，请转换为 JPEG/PNG')
    if(info.width*info.height>MAX_IMAGE_PIXELS||Math.max(info.width,info.height)>16000)throw new Error('图片像素过大，请缩小后重试')
    // Reject oversized decoded sources until a tested device-specific downsampling path exists.
    if(Math.max(info.width,info.height)>4096)throw new Error('小程序验证版暂限单边 4096 像素，请缩小照片后重试')
    const image=(target.native as any).createImage()
    await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('照片加载失败，请重试'));image.src=info.path})
    const dispose=track(()=>{image.src='';cleanupFile(path)})
    return {id:`wx-${Date.now()}-${Math.random()}`,source:image,width:image.width,height:image.height,thumbnail:path,dispose} satisfies Photo
   }catch(e){cleanupFile(path);throw e}
  },
  async prepareFonts(){return null}, // System font only; glyph coverage/orientation must be checked on device.
  exportJPEG(target){return new Promise((resolve,reject)=>uni.canvasToTempFilePath({canvas:target.native as any,fileType:'jpg',quality:.94,destWidth:target.width,destHeight:target.height,success:(r:any)=>resolve({url:r.tempFilePath,width:target.width,height:target.height,dispose:track(()=>cleanupFile(r.tempFilePath))}),fail:()=>reject(new Error('导出失败，请尝试较低分辨率'))} as any))},
  async save(result){
   await new Promise<void>((resolve,reject)=>uni.saveImageToPhotosAlbum({filePath:result.url,success:()=>resolve(),fail:(e:any)=>reject(new Error(/cancel/.test(e.errMsg)?'已取消保存，作品仍保留':/auth|deny/.test(e.errMsg)?'相册权限未开启，可在小程序设置中允许后重试':'保存失败，请重试'))}))
   return '已保存到相册'
  },
  bindDrag(){return ()=>{}},
  schedule(fn){const timer=setTimeout(fn,32);return ()=>clearTimeout(timer)},
  dispose(){for(const fn of [...resources]){resources.delete(fn);fn()}}
 }
}
export function setCropMode(_target:Target,_active:boolean){}
