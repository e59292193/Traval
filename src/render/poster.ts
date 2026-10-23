import type {DrawContext,Template,Work,Photo} from '../types'
import {cropRect} from '../core/crop'
import {fitText} from '../core/text'
export const FONT='"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'
export function drawPoster(ctx:DrawContext,t:Template,work:Work,photos:Map<string,Photo>,width:number){
 const ratio=width/t.width,p=t.palettes.find(p=>p.id===work.paletteId)||t.palettes[0]
 ctx.save();ctx.scale(ratio,ratio);ctx.textBaseline='top'
 for(const l of t.layers){
  ctx.save();ctx.globalAlpha=l.opacity;ctx.translate(l.x+l.width/2,l.y+l.height/2);ctx.rotate(l.rotation*Math.PI/180);ctx.translate(-l.width/2,-l.height/2)
  const w=l.width,h=l.height
  if(l.type==='background'){
   ctx.fillStyle=p.paper;ctx.fillRect(0,0,w,h)
   // Deterministic fine paper grain: no raster image, no remote asset.
   ctx.fillStyle=p.ink;ctx.globalAlpha=.035
   for(let i=0;i<1600;i++){const x=(i*173.31)%w,y=(i*71.79)%h;ctx.fillRect(x,y,1.2,1.2)}
   ctx.globalAlpha=1;ctx.strokeStyle=p.soft;ctx.lineWidth=2;ctx.strokeRect(32,32,w-64,h-64)
   ctx.font=`500 19px ${FONT}`;ctx.fillStyle=p.accent;ctx.textAlign='center';ctx.fillText('A LITTLE JOURNEY, A LASTING MEMORY',w/2,71)
   ctx.font=`400 17px ${FONT}`;ctx.fillText('把喜欢的日子，收进一页时光里',w/2,h-58)
  }else if(l.type==='photo'){
   ctx.fillStyle='#ded8cb';ctx.fillRect(5,9,w,h);ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,w,h)
   const px=16,py=16,pw=w-32,ph=h-75
   ctx.save();ctx.beginPath();ctx.moveTo(px+l.radius,py);ctx.lineTo(px+pw-l.radius,py);ctx.quadraticCurveTo(px+pw,py,px+pw,py+l.radius);ctx.lineTo(px+pw,py+ph-l.radius);ctx.quadraticCurveTo(px+pw,py+ph,px+pw-l.radius,py+ph);ctx.lineTo(px+l.radius,py+ph);ctx.quadraticCurveTo(px,py+ph,px,py+ph-l.radius);ctx.lineTo(px,py+l.radius);ctx.quadraticCurveTo(px,py,px+l.radius,py);ctx.clip()
   const binding=work.photos[l.binding],photo=binding&&photos.get(binding.assetId)
   if(photo&&binding){const c=cropRect(photo.width,photo.height,pw,ph,binding.crop);ctx.drawImage(photo.source,c.sx,c.sy,c.sw,c.sh,px,py,pw,ph)}
   else {
    ctx.fillStyle=p.soft;ctx.fillRect(px,py,pw,ph);ctx.globalAlpha=.5;ctx.strokeStyle=p.accent;ctx.lineWidth=2
    ctx.beginPath();ctx.moveTo(w/2-22,py+ph/2-15);ctx.lineTo(w/2+22,py+ph/2-15);ctx.stroke()
    ctx.globalAlpha=1;ctx.textAlign='center';ctx.fillStyle=p.ink;ctx.font=`400 20px ${FONT}`;ctx.fillText('留一段风景',w/2,py+ph/2+27)
   }
   ctx.restore();ctx.fillStyle=p.ink;ctx.font=`400 20px ${FONT}`;ctx.textAlign='left';ctx.fillText(l.caption,20,h-40)
   ctx.save();ctx.globalAlpha=.7;ctx.translate(w/2,0);ctx.rotate(-.06);ctx.fillStyle=p.tape;ctx.fillRect(-55,-13,110,29);ctx.restore()
  }else if(l.type==='text'){
   ctx.fillStyle=p[l.color];ctx.textAlign=l.align
   const fit=fitText(work.text[l.binding],w,l.maxLines,l.fontSize,l.minFontSize,(s,size)=>{ctx.font=`${l.weight} ${size}px ${FONT}`;return ctx.measureText(s).width})
   ctx.font=`${l.weight} ${fit.fontSize}px ${FONT}`
   const top=Math.max(0,(h-fit.lines.length*fit.fontSize*l.lineHeight)/2)
   fit.lines.forEach((s,i)=>ctx.fillText(s,l.align==='center'?w/2:l.align==='right'?w:0,top+i*fit.fontSize*l.lineHeight))
  }else if(l.type==='image'){const image=photos.get(l.assetId);if(!image)throw new Error('模板素材未准备好，请重试');ctx.drawImage(image.source,0,0,w,h)}
  else if(l.type==='shape'){
   ctx.strokeStyle=p.accent;ctx.fillStyle=p.accent;ctx.lineWidth=2
   if(l.shape==='line'){ctx.fillStyle=p.soft;ctx.fillRect(0,0,w,h)}
   if(l.shape==='route'){ctx.globalAlpha=.35;ctx.setLineDash([8,12]);ctx.beginPath();ctx.moveTo(30,30);ctx.bezierCurveTo(w,100,0,h*.65,w-10,h);ctx.stroke();ctx.setLineDash([])}
   if(l.shape==='stamp'){ctx.globalAlpha=.75;ctx.strokeRect(5,5,w-10,h-10);ctx.strokeRect(12,12,w-24,h-24);ctx.textAlign='center';ctx.font=`500 20px ${FONT}`;ctx.fillText('ON THE',w/2,25);ctx.fillText('ROAD',w/2,52)}
   if(l.shape==='leaf'){ctx.beginPath();ctx.moveTo(w/2,h);ctx.quadraticCurveTo(w/2-25,h/2,w/2+5,0);ctx.stroke();for(let i=1;i<5;i++){const y=h-i*24;ctx.beginPath();ctx.moveTo(w/2-3,y);ctx.quadraticCurveTo(5,y-35,24,y-41);ctx.quadraticCurveTo(w/2,y-35,w/2-3,y);ctx.fill();ctx.beginPath();ctx.moveTo(w/2-5,y-10);ctx.quadraticCurveTo(w-6,y-48,w-18,y-45);ctx.quadraticCurveTo(w/2+5,y-20,w/2-5,y-10);ctx.fill()}}
  }
  ctx.restore()
 }
 ctx.restore()
}
