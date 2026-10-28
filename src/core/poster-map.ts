import {regionBoundary,visibleRegionIds} from './region-map'
import {visibleTrips,isWGS84,type Journal} from './travel'
import type {Palette} from '../types'

/** The poster is an administrative cutout, never a viewport of the interactive map. */
export function posterMapSelection(j:Journal){
 const stops=visibleTrips(j).flatMap(t=>t.stops).filter(s=>isWGS84(s.place))
 const ids=[...new Set(stops.map(s=>s.place.region))]
 const province=j.exportScope!=='china'&&ids.length===1?regionBoundary.features.find(f=>f.properties.regionId===ids[0]):undefined
 const features=province?[province]:regionBoundary.features
 const coords=features.flatMap(f=>f.geometry.coordinates.flatMap(poly=>poly.flat()))
 const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1])
 return{kind:province?'province' as const:'china' as const,name:province?.properties.name||'中国',features,stops,visited:new Set(visibleRegionIds(j)),bounds:[[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]] as [[number,number],[number,number]]}
}
export function mapProjector(bounds:[[number,number],[number,number]],width:number,height:number,padding=48){
 const mercator=(lat:number)=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*180/Math.PI
 const [[west,south],[east,north]]=bounds,top=mercator(north),bottom=mercator(south)
 const scale=Math.min((width-padding*2)/Math.max(east-west,.001),(height-padding*2)/Math.max(top-bottom,.001))
 const left=(width-(east-west)*scale)/2,y=(height-(top-bottom)*scale)/2
 return(coord:number[]):[number,number]=>[left+(coord[0]-west)*scale,y+(top-mercator(coord[1]))*scale]
}
export function mixColor(a:string,b:string,ratio:number){
 const rgb=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16))
 return '#'+rgb(a).map((v,i)=>Math.round(v*(1-ratio)+rgb(b)[i]*ratio).toString(16).padStart(2,'0')).join('')
}
export function posterMapColors(p:Palette){return{paper:p.paper,ink:p.ink,outline:mixColor(p.accent,p.paper,.18),land:p.soft,visited:mixColor(p.accent,p.soft,.55),pin:p.accent}}
