import type {DrawContext,Magnet,Photo} from '../types'
import {cropRect} from '../core/crop'
function shape(c:DrawContext,x:number,y:number,size:number,round:boolean){
 c.beginPath()
 if(round)c.arc(x+size/2,y+size/2,size/2,0,Math.PI*2)
 else{const r=size*.18;c.moveTo(x+r,y);c.lineTo(x+size-r,y);c.quadraticCurveTo(x+size,y,x+size,y+r);c.lineTo(x+size,y+size-r);c.quadraticCurveTo(x+size,y+size,x+size-r,y+size);c.lineTo(x+r,y+size);c.quadraticCurveTo(x,y+size,x,y+size-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y)}
 c.closePath()
}
/** Shared Canvas renderer for preview and exported poster; image pixels stay local. */
export function drawMagnet(c:DrawContext,m:Magnet,p:Photo,x:number,y:number,size:number,rotation=0){
 if(m.style==='cutout'){const scale=Math.min(size/p.width,size/p.height),w=p.width*scale,h=p.height*scale;c.save();c.translate(x+size/2,y+size/2);c.rotate(rotation*Math.PI/180);c.drawImage(p.source,-w/2,-h/2,w,h);c.restore();return}
 c.save();c.translate(x+size/2,y+size/2);c.rotate(rotation*Math.PI/180);c.translate(-size/2,-size/2)
 const round=m.style==='round',rim=size*.085,inner=size-2*rim
 shape(c,2,size*.065,size,round);c.fillStyle='#443b3033';c.fill()
 shape(c,0,size*.028,size,round);c.fillStyle='#b8ad98';c.fill()
 shape(c,0,0,size,round);c.fillStyle='#fffdf4';c.fill();c.strokeStyle='#e9dfc9';c.lineWidth=size*.012;c.stroke()
 c.save();shape(c,rim,rim,inner,round);c.clip();c.fillStyle='#f7f1e3';c.fillRect(rim,rim,inner,inner)
 const b=cropRect(p.width,p.height,inner,inner,m.crop);c.drawImage(p.source,b.sx,b.sy,b.sw,b.sh,rim,rim,inner,inner)
 // A restrained resin-like highlight, not a destructive filter on the source.
 c.fillStyle='#ffffff1c';c.beginPath();c.moveTo(rim,rim);c.lineTo(size-rim,rim);c.lineTo(rim,size*.57);c.closePath();c.fill();c.restore()
 c.restore()
}
