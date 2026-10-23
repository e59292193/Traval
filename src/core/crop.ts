import type {Crop} from '../types'
export const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:min))
export function normalizeCrop(c:Crop):Crop {return {zoom:clamp(c.zoom,1,3),x:clamp(c.x,0,1),y:clamp(c.y,0,1)}}
export function cropRect(iw:number,ih:number,sw:number,sh:number,crop:Crop){
 if([iw,ih,sw,sh].some(n=>!Number.isFinite(n)||n<=0))throw new Error('图片或槽位尺寸无效')
 const c=normalizeCrop(crop), scale=Math.max(sw/iw,sh/ih)*c.zoom
 const w=Math.min(iw,sw/scale),h=Math.min(ih,sh/scale)
 return {sx:(iw-w)*c.x,sy:(ih-h)*c.y,sw:w,sh:h}
}
export function panCrop(c:Crop,iw:number,ih:number,sw:number,sh:number,dx:number,dy:number):Crop {
 const scale=Math.max(sw/iw,sh/ih)*c.zoom,ox=iw*scale-sw,oy=ih*scale-sh
 return normalizeCrop({...c,x:c.x-(ox>0?dx/ox:0),y:c.y-(oy>0?dy/oy:0)})
}
