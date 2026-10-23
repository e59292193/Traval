/// <reference lib="webworker" />
import {createMask,composeSticker,maskBounds,type Pixels,type CutoutRecipe} from '../core/sticker'
let source:Pixels|undefined
self.onmessage=(event:MessageEvent<{type:string;id:number;source?:Pixels;recipe:CutoutRecipe}>)=>{
 const {type,id,recipe}=event.data
 try{if(type==='init'){source=event.data.source;self.postMessage({type:'ready',id});return}if(!source)throw new Error('原图尚未准备好');const mask=createMask(source,recipe),bounds=maskBounds(mask,source.width,source.height)
 if(type==='generate'){const result=composeSticker(source,recipe,mask);self.postMessage({type,id,result,bounds},[result.data.buffer])}
 else self.postMessage({type:'mask',id,mask,bounds},[mask.buffer])
 }catch(e){self.postMessage({type:'error',id,message:e instanceof Error?e.message:'本地处理失败'})}
}
