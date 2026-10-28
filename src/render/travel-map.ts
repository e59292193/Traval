import {posterMapSelection,mapProjector,posterMapColors,mixColor} from '../core/poster-map'
import {routeSegments,type Journal} from '../core/travel'
import type {Palette} from '../types'

/** Local transparent Canvas 2D map: no tiles, rectangular sea, labels from other countries or network dependency. */
export function drawTravelMap(j:Journal,p:Palette,width=1430,height=1080):HTMLCanvasElement{
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
 const c=canvas.getContext('2d');if(!c)throw new Error('地图画布创建失败，请降低导出清晰度后重试')
 const selection=posterMapSelection(j),colors=posterMapColors(p),ratio=width/715
 c.scale(ratio,ratio);const w=width/ratio,h=height/ratio
 const project=mapProjector(selection.bounds,w,h,48)
 const path=(feature:typeof selection.features[number])=>{
  c.beginPath()
  for(const polygon of feature.geometry.coordinates)for(const ring of polygon){ring.forEach((coord,i)=>{const [x,y]=project(coord);if(i)c.lineTo(x,y);else c.moveTo(x,y)});c.closePath()}
 }
 // An ivory paper keyline follows the actual boundary; the corners remain fully transparent.
 c.lineJoin='round';c.strokeStyle='#fff9eb';c.lineWidth=8
 for(const f of selection.features){path(f);c.stroke()}
 for(const [i,f] of selection.features.entries()){
  path(f)
  const land=selection.visited.has(f.properties.regionId)?colors.visited:mixColor(colors.land,colors.paper,[.08,.28,.45,.18][i%4])
  const wash=c.createLinearGradient(0,0,w,h);wash.addColorStop(0,mixColor(land,colors.paper,.2));wash.addColorStop(1,land)
  c.fillStyle=wash;c.fill('evenodd');c.strokeStyle=colors.outline;c.lineWidth=selection.kind==='province'?1.8:.8;c.stroke()
 }
 // Subtle paper grain is clipped to land, so there can never be a rectangular overlay.
 c.save();c.beginPath()
 for(const f of selection.features)for(const poly of f.geometry.coordinates)for(const ring of poly){ring.forEach((v,i)=>{const [x,y]=project(v);if(i)c.lineTo(x,y);else c.moveTo(x,y)});c.closePath()}
 c.clip('evenodd');c.fillStyle=colors.paper;c.globalAlpha=.28
 for(let y=5;y<h;y+=9)for(let x=5;x<w;x+=9){c.beginPath();c.arc(x+(Math.sin(y*7)*2),y,.55,0,Math.PI*2);c.fill()}
 c.restore()
 const occupied:{x:number;y:number;w:number;h:number}[]=[]
 const overlaps=(b:typeof occupied[number])=>occupied.some(a=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)
 const font='"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'
 const points=[...new Map(selection.stops.map(s=>[s.place.id,s])).values()]
 // Place markers are drawn before labels; markers may never be hidden by a label.
 for(const s of points){const [x,y]=project(s.place.coord);occupied.push({x:x-10,y:y-20,w:20,h:30})}
 c.lineCap='round';c.lineJoin='round'
 if(j.showRoutes)for(const r of routeSegments(j)){
  c.beginPath();r.coords.forEach((v,i)=>{const [x,y]=project(v);if(i)c.lineTo(x,y);else c.moveTo(x,y)})
  c.strokeStyle='#fff9ed';c.lineWidth=5;c.stroke();c.strokeStyle=colors.pin;c.lineWidth=2;c.setLineDash([4,5]);c.stroke();c.setLineDash([])
 }
 for(const s of points){
  const [x,y]=project(s.place.coord)
  c.save();c.translate(x,y);c.beginPath();c.moveTo(0,4);c.bezierCurveTo(-3,-1,-8,-7,-8,-11);c.arc(0,-11,8,Math.PI,0);c.bezierCurveTo(8,-7,3,-1,0,4);c.fillStyle=colors.pin;c.fill();c.strokeStyle='#fff9ed';c.lineWidth=2;c.stroke();c.beginPath();c.arc(0,-11,2.5,0,Math.PI*2);c.fillStyle='#fff9ed';c.fill();c.restore()
  c.font=`600 14px ${font}`;const text=s.place.name,tw=c.measureText(text).width
  const candidates=[[x+13,y-18],[x-tw-13,y-18],[x-tw/2,y+12],[x-tw/2,y-43]]
  for(const [tx,ty] of candidates){const box={x:tx-4,y:ty-3,w:tw+8,h:22};if(box.x<8||box.y<8||box.x+box.w>w-8||box.y+box.h>h-8||overlaps(box))continue
   occupied.push(box);c.fillStyle='#fff9edf0';c.fillRect(box.x,box.y,box.w,box.h);c.textBaseline='top';c.fillStyle=colors.ink;c.fillText(text,tx,ty);break
  }
 }
 // Province captions are deliberately sparse. Dense city labels belong in the interactive editor, not the poster.
 if(selection.kind==='china')for(const f of selection.features){
  const rings=f.geometry.coordinates.flatMap(poly=>poly[0]);const xs=rings.map(v=>v[0]),ys=rings.map(v=>v[1]);const [x,y]=project([(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2])
  const text=f.properties.name;c.font=`11px ${font}`;const tw=c.measureText(text).width,box={x:x-tw/2-2,y:y-8,w:tw+4,h:16}
  if(overlaps(box))continue;occupied.push(box);c.textAlign='center';c.textBaseline='middle';c.strokeStyle='#fff9ed';c.lineWidth=3;c.strokeText(text,x,y);c.fillStyle=colors.ink;c.fillText(text,x,y)
 }
 return canvas
}
