import type {DrawContext,Template,Work,Photo,Palette} from '../types'
import {cropRect} from '../core/crop'
import {fitText} from '../core/text'
import {photoBox,type PhotoLayer} from '../core/photo-box'
import {assetIds} from '../assets'
export const FONT='"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'
const HAND='"TravalCaveat", "Comic Sans MS", "STKaiti", "KaiTi", cursive'
function rounded(c:DrawContext,x:number,y:number,w:number,h:number,r:number){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath()}
function label(c:DrawContext,text:string,x:number,y:number,size=20,color='#4c4034',font=FONT,weight='400',align='left'){c.fillStyle=color;c.font=`${weight} ${size}px ${font}`;c.textAlign=align;c.fillText(text,x,y)}
function paragraph(c:DrawContext,text:string,x:number,y:number,w:number,size:number,min:number,lines:number,color='#4c4034',font=FONT,lineHeight=1.45){
 const fit=fitText(text,w,lines,size,min,(s,n)=>{c.font=`400 ${n}px ${font}`;return c.measureText(s).width})
 fit.lines.forEach((s,i)=>label(c,s,x,y+i*fit.fontSize*lineHeight,fit.fontSize,color,font))
}
function source(assets:Map<string,Photo>,id:string){const asset=assets.get(id);if(!asset)throw new Error('地图或水彩素材未准备好，请重新准备画布');return asset}
function pin(c:DrawContext,x:number,y:number,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#ce5444';c.beginPath();c.arc(0,0,9,Math.PI,0);c.quadraticCurveTo(10,8,0,18);c.quadraticCurveTo(-10,8,-9,0);c.fill();c.fillStyle='#fff8e8';c.beginPath();c.arc(0,0,3,0,Math.PI*2);c.fill();c.restore()}
function sticker(c:DrawContext,assets:Map<string,Photo>,index:number,x:number,y:number,size:number){const a=source(assets,assetIds.stickers),cw=a.width/4,ch=a.height/2,margin=8;c.drawImage(a.source,(index%4)*cw+margin,Math.floor(index/4)*ch+margin,cw-2*margin,ch-2*margin,x,y,size,size)}
function photo(c:DrawContext,l:PhotoLayer,work:Work,photos:Map<string,Photo>,palette:Palette,small=false){
 const w=l.width,h=l.height,b=photoBox(l),binding=work.photos[l.binding],p=binding&&photos.get(binding.assetId),caption=work.captions[l.binding]
 c.save();c.translate(l.x+w/2,l.y+h/2);c.rotate(l.rotation*Math.PI/180);c.translate(-w/2,-h/2)
 c.fillStyle='#7b67442b';c.fillRect(3,5,w,h);c.fillStyle='#fffdf4';c.fillRect(0,0,w,h)
 c.save();rounded(c,b.x,b.y,b.width,b.height,l.radius);c.clip()
 if(p&&binding){const crop=cropRect(p.width,p.height,b.width,b.height,binding.crop);c.drawImage(p.source,crop.sx,crop.sy,crop.sw,crop.sh,b.x,b.y,b.width,b.height)}
 else {c.fillStyle=palette.soft;c.fillRect(b.x,b.y,b.width,b.height);label(c,'留一段风景',w/2,b.y+b.height/2-6,small?10:12,palette.accent,FONT,'400','center')}
 c.restore()
 const captionSize=l.captionSize??15
 const captionY=b.y+b.height+5
 paragraph(c,caption?.label||l.caption,8,captionY,w-16,captionSize,11,1,palette.ink,HAND)
 if(caption?.date)paragraph(c,caption.date,8,captionY+captionSize+2,w-16,10,8,1,palette.accent)
 c.save();c.globalAlpha=.78;c.translate(w/2,0);c.rotate(-.08);c.fillStyle=palette.tape;c.fillRect(-w*.23,-7,w*.46,14);c.restore()
 c.restore()
 if(!small)pin(c,l.x+l.width*.43,l.y-10,.83)
}
function scene(c:DrawContext,t:Template,work:Work,photos:Map<string,Photo>,assets:Map<string,Photo>,p:Palette){
 // These are printed scrapbook motifs, not nonfunctional app controls.
 c.fillStyle='#fffdf3e6';rounded(c,580,39,260,52,26);c.fill();c.strokeStyle='#d6c8ac';c.lineWidth=1.5;c.stroke()
 c.strokeStyle=p.ink;c.lineWidth=2;c.beginPath();c.arc(604,63,8,0,Math.PI*2);c.moveTo(610,69);c.lineTo(617,76);c.stroke()
 paragraph(c,work.text.date||'收藏沿途的美好…',627,56,197,16,12,1,'#7c715d')
 for(let i=0;i<3;i++){
  const x=872+i*48;c.fillStyle='#fff9ebdb';c.beginPath();c.arc(x,66,21,0,Math.PI*2);c.fill()
  if(i===0){label(c,'☆',x,47,31,'#c9963d',FONT,'400','center');continue}
  c.save();c.translate(x,66);c.strokeStyle=p.ink;c.lineWidth=1.6;c.beginPath()
  if(i===1){c.moveTo(-10,7);c.quadraticCurveTo(-19,7,-17,-3);c.quadraticCurveTo(-15,-11,-7,-8);c.quadraticCurveTo(-2,-21,7,-10);c.quadraticCurveTo(19,-12,18,1);c.quadraticCurveTo(20,8,10,8);c.moveTo(0,12);c.lineTo(0,-3);c.moveTo(-5,2);c.lineTo(0,-3);c.lineTo(5,2)}
  else {c.moveTo(-12,9);c.quadraticCurveTo(-9,4,-9,-4);c.quadraticCurveTo(-9,-14,0,-14);c.quadraticCurveTo(9,-14,9,-4);c.quadraticCurveTo(9,4,12,9);c.closePath();c.moveTo(-4,13);c.quadraticCurveTo(0,18,4,13)}
  c.stroke();c.restore()
 }
 // Avatar reuses the user's first photo, never an unlabelled stock portrait.
 const avatar=work.photos.p1,avatarPhoto=avatar&&photos.get(avatar.assetId)
 c.save();c.beginPath();c.arc(110,215,47,0,Math.PI*2);c.clip()
 if(avatar&&avatarPhoto){const b=cropRect(avatarPhoto.width,avatarPhoto.height,94,94,{zoom:1,x:.5,y:.5});c.drawImage(avatarPhoto.source,b.sx,b.sy,b.sw,b.sh,63,168,94,94)}
 else {c.fillStyle='#d4e2d6';c.fillRect(63,168,94,94);label(c,'旅',110,190,36,p.accent,HAND,'400','center')}
 c.restore()
 paragraph(c,'Hi, '+work.text.name,34,286,183,31,19,1,p.ink,HAND)
 paragraph(c,work.text.subtitle,41,336,152,20,16,3,p.ink,HAND,1.4)
 const menu=[['◎','地图'],['○','足迹'],['▧','照片'],['◇','冰箱贴'],['▤','票根'],['☆','纪念品'],['□','行程'],['♡','心愿清单'],['▥','本页记录'],['⚙','设置']]
 menu.forEach(([icon,text],i)=>{const y=444+i*39;label(c,icon,51,y,21,p.ink);label(c,text,89,y,20,p.ink,HAND)})
 // Actual page content, not invented trip/country statistics.
 const count=Object.values(work.photos).filter(Boolean).length
 label(c,'我的足迹',244,701,24,p.ink,HAND,'600')
 label(c,String(count).padStart(2,'0'),266,753,66,p.ink,HAND,'400')
 label(c,'张照片 · 本页珍藏',248,831,17,p.ink)
 label(c,'3',250,867,27,p.ink,HAND);label(c,'套配色',275,877,13,p.ink)
 label(c,'1',340,867,27,p.ink,HAND);label(c,'页回忆',366,877,13,p.ink)
 sticker(c,assets,2,343,756,63)
 label(c,'最近回忆',455,724,25,p.ink,HAND,'600');label(c,'♡',591,716,31,'#c58d55',HAND)
 for(let i=0;i<4;i++)photo(c,{id:'memory-'+i,type:'photo',binding:'p'+(i+1),caption:'片刻',x:457+i*122,y:777+(i%2)*5,width:109,height:129,rotation:[-5,4,-3,6][i],opacity:1,radius:2,padding:6,captionHeight:39,captionSize:12},work,photos,p,true)
 label(c,'我的冰箱贴',48,949,25,p.ink,HAND,'600');label(c,'旅行灵感',330,955,13,p.accent)
 for(let i=0;i<8;i++)sticker(c,assets,i,47+(i%4)*96,994+Math.floor(i/4)*78,78)
 label(c,'旅行札记',470,951,24,p.ink,HAND,'600')
 paragraph(c,work.text.note,470,998,229,21,16,5,p.ink,HAND,1.5)
 c.strokeStyle=p.accent;c.lineWidth=1.3;c.setLineDash([4,5]);c.beginPath();c.moveTo(474,1140);c.bezierCurveTo(530,1110,620,1160,700,1126);c.stroke();c.setLineDash([])
 label(c,'下一站心愿',767,951,23,p.ink,HAND,'600')
 sticker(c,assets,3,760,1001,94)
 paragraph(c,work.text.wish,858,1008,112,20,15,4,p.ink,HAND)
 label(c,'沿途 · 未完待续',54,1202,27,p.ink,HAND,'600')
 paragraph(c,work.text.date||'去更远的地方，遇见更好的自己',58,1248,274,17,13,2,p.ink,HAND)
 for(const [i,word] of ['出发','遇见','收藏','再出发'].entries()){pin(c,426+i*133,1231,.7);label(c,word,426+i*133,1274,14,p.ink,FONT,'400','center')}
 const examples=Object.values(work.photos).filter(b=>b?.example).length
 if(examples)label(c,`示例照片 ${examples}/4 · AI生成场景，不是真实旅行记录`,461,667,11,'#91613a')
 label(c,'静态底图 GS(2016)2923号 · 照片为手账拼贴，不作地理定位',461,684,11,'#6a6758')
}
export function drawPoster(ctx:DrawContext,t:Template,work:Work,photos:Map<string,Photo>,width:number,assets:Map<string,Photo>=new Map()){
 const ratio=width/t.width,p=t.palettes.find(p=>p.id===work.paletteId)||t.palettes[0]
 ctx.save();ctx.scale(ratio,ratio);ctx.textBaseline='top'
 for(const l of t.layers){
  if(l.type==='photo'){photo(ctx,l,work,photos,p);continue}
  ctx.save();ctx.globalAlpha=l.opacity;ctx.translate(l.x+l.width/2,l.y+l.height/2);ctx.rotate(l.rotation*Math.PI/180);ctx.translate(-l.width/2,-l.height/2)
  if(l.type==='background'){ctx.fillStyle=p.paper;ctx.fillRect(0,0,t.width,t.height);ctx.drawImage(source(assets,assetIds.background).source,0,0,t.width,t.height)}
  else if(l.type==='image'){ctx.drawImage(source(assets,l.assetId).source,0,0,l.width,l.height)}
  else if(l.type==='text'){
   const isTitle=l.binding==='title';const font=isTitle?HAND:FONT
   ctx.fillStyle=p[l.color];ctx.textAlign=l.align
   const fit=fitText(work.text[l.binding],l.width,l.maxLines,l.fontSize,l.minFontSize,(s,size)=>{ctx.font=`${l.weight} ${size}px ${font}`;return ctx.measureText(s).width})
   ctx.font=`${l.weight} ${fit.fontSize}px ${font}`;const top=Math.max(0,(l.height-fit.lines.length*fit.fontSize*l.lineHeight)/2)
   fit.lines.forEach((s,i)=>ctx.fillText(s,l.align==='center'?l.width/2:l.align==='right'?l.width:0,top+i*fit.fontSize*l.lineHeight))
  }else if(l.type==='shape'&&l.shape==='scrapbook')scene(ctx,t,work,photos,assets,p)
  ctx.restore()
 }
 ctx.restore()
}
