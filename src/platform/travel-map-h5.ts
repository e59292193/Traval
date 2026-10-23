import * as echarts from 'echarts/core'
import {GeoComponent,TooltipComponent} from 'echarts/components'
import {ScatterChart,LinesChart} from 'echarts/charts'
import {CanvasRenderer} from 'echarts/renderers'
import {LabelLayout} from 'echarts/features'
import china from '../data/china.geo.json'
import type {Journal,Stop} from '../core/travel'
import {visibleTrips,routeSegments} from '../core/travel'
import type {Palette} from '../types'
echarts.use([GeoComponent,TooltipComponent,ScatterChart,LinesChart,CanvasRenderer,LabelLayout])
// Preserve all supplied geometries, including the unnamed maritime feature. No synthesized borders/insets.
echarts.registerMap('traval-china-v1',china as any)
export const regions=china.features.filter(f=>f.properties.name).map(f=>({id:String(f.properties.adcode),name:f.properties.name}))
export function mapOption(j:Journal,p:Palette,interactive:boolean,scale=1):any{
 const stops=visibleTrips(j).flatMap(t=>t.stops),markers=[...new Map(stops.map(s=>[s.place.id,s])).values()],visited=new Set([...j.visitedRegions,...stops.map(s=>s.place.region)])
 return{animation:false,backgroundColor:'transparent',tooltip:{show:interactive,trigger:'item',renderMode:'richText',formatter:(v:any)=>v.seriesType==='scatter'?String(v.name):String(v.name||'中国地图')},
 geo:{map:'traval-china-v1',roam:interactive,scaleLimit:{min:1,max:6},layoutCenter:['50%','50%'],layoutSize:'95%',aspectScale:.85,silent:!interactive,label:{show:false},itemStyle:{areaColor:'#f4ebd5',borderColor:'#85998c',borderWidth:.7*scale},emphasis:{disabled:!interactive,label:{show:interactive},itemStyle:{areaColor:'#efca91'}},regions:regions.map(r=>({name:r.name,itemStyle:{areaColor:visited.has(r.id)?p.accent:'#f4ebd5'}}))},
 series:[{type:'lines',coordinateSystem:'geo',silent:true,z:3,symbol:['none','arrow'],symbolSize:6*scale,lineStyle:{color:'#bd7050',width:2*scale,opacity:.85,curveness:.12,type:'dashed'},data:j.showRoutes?routeSegments(j):[]},
 {type:'scatter',coordinateSystem:'geo',z:5,symbol:'pin',symbolSize:22*scale,itemStyle:{color:'#c35c43',borderColor:'#fff9ee',borderWidth:1},label:{show:true,position:'bottom',color:'#473c30',fontSize:13*scale,formatter:'{b}'},labelLayout:{hideOverlap:true,moveOverlap:'shiftY'},data:markers.map(s=>({name:s.place.name,value:s.place.coord,stopId:s.id,label:{show:markers.every(other=>other.id===s.id||Math.abs(other.place.coord[0]-s.place.coord[0])>8||Math.abs(other.place.coord[1]-s.place.coord[1])>5)}}))}]}
}
export function createTravelMap(host:HTMLElement,onRegion:(id:string)=>void,onStop:(id:string)=>void){
 const chart=echarts.init(host,undefined,{renderer:'canvas'});let disposed=false
 chart.on('click',(p:any)=>{if(p.seriesType==='scatter'){onStop(p.data.stopId);return}const r=regions.find(r=>r.name===p.name);if(r)onRegion(r.id)})
 const observer=new ResizeObserver(()=>{if(!disposed)chart.resize()});observer.observe(host)
 return{update(j:Journal,p:Palette){chart.setOption(mapOption(j,p,true),{notMerge:true})},reset(){chart.dispatchAction({type:'restore'});chart.setOption({geo:{zoom:1,center:null}})},dispose(){disposed=true;observer.disconnect();chart.dispose()}}
}
export function renderTravelMap(j:Journal,p:Palette,width=1430,height=1080):HTMLCanvasElement{
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
 const chart=echarts.init(canvas,undefined,{renderer:'canvas',width,height,devicePixelRatio:1})
 try{chart.setOption(mapOption(j,p,false,width/715));const rendered=chart.getRenderedCanvas({pixelRatio:1,backgroundColor:'transparent'});const out=document.createElement('canvas');out.width=width;out.height=height;out.getContext('2d')!.drawImage(rendered,0,0);return out}finally{chart.dispose();canvas.width=canvas.height=1}
}
