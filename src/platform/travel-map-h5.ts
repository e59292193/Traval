import {Map as LibreMap,NavigationControl,setWorkerUrl,type GeoJSONSource} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import {drawTravelMap} from '../render/travel-map'
import {travelBaseStyle} from '../core/map-style'
import {regionFeatures,visibleRegionIds} from '../core/region-map'
import regionData from '../data/regions.json'
import {mapFeatures,mapExtent,type Journal} from '../core/travel'
import type {Palette} from '../types'
setWorkerUrl(workerUrl)
export const regions=regionData
export const MAP_ATTRIBUTION='OpenFreeMap © OpenMapTiles © OpenStreetMap contributors · Style: CARTO / Positron'
export const MAP_SOURCE_DOMAINS=['tiles.openfreemap.org']
async function addTravelLayers(map:LibreMap,j:Journal,p:Palette){
 const data=mapFeatures(j),points=map.getSource('travel-points') as GeoJSONSource|undefined,routes=map.getSource('travel-routes') as GeoJSONSource|undefined
 const areas=regionFeatures(j),areaSource=map.getSource('travel-regions') as GeoJSONSource|undefined
 if(areaSource){await areaSource.setData(areas)}else{
  map.addSource('travel-regions',{type:'geojson',data:areas})
  const before=map.getStyle().layers.find(l=>l.type==='symbol')?.id
  map.addLayer({id:'travel-region-fill',type:'fill',source:'travel-regions',paint:{'fill-color':p.accent,'fill-opacity':['interpolate',['linear'],['zoom'],0,['case',['get','visited'],.25,.001],6,['case',['get','visited'],.22,.001],9,['case',['get','visited'],.04,.001],11,.001]}},before)
  map.addLayer({id:'travel-region-outline',type:'line',source:'travel-regions',filter:['==',['get','visited'],true],paint:{'line-color':p.accent,'line-width':1.2,'line-opacity':['interpolate',['linear'],['zoom'],5,.7,10,0]}},before)
 }
 if(points){await Promise.all([points.setData(data.points),routes!.setData(data.routes)]);for(const id of ['travel-stops','travel-clusters'])map.setPaintProperty(id,'circle-color',p.accent);map.setPaintProperty('travel-region-fill','fill-color',p.accent);map.setPaintProperty('travel-region-outline','line-color',p.accent);return}
 map.addSource('travel-points',{type:'geojson',data:data.points,cluster:true,clusterMaxZoom:13,clusterRadius:36})
 map.addSource('travel-routes',{type:'geojson',data:data.routes})
 map.addLayer({id:'travel-route-halo',type:'line',source:'travel-routes',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fffdf5','line-width':6,'line-opacity':.9}})
 map.addLayer({id:'travel-routes',type:'line',source:'travel-routes',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#bd6347','line-width':3,'line-dasharray':[2,1.4]}})
 map.addLayer({id:'travel-clusters',type:'circle',source:'travel-points',filter:['has','point_count'],paint:{'circle-color':p.accent,'circle-radius':18,'circle-stroke-color':'#fffdf4','circle-stroke-width':3}})
 map.addLayer({id:'travel-cluster-count',type:'symbol',source:'travel-points',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Regular'],'text-size':13},paint:{'text-color':'#fff'}})
 map.addLayer({id:'travel-stops',type:'circle',source:'travel-points',filter:['!', ['has','point_count']],paint:{'circle-color':p.accent,'circle-radius':8,'circle-stroke-color':'#fffdf4','circle-stroke-width':3}})
 map.addLayer({id:'travel-labels',type:'symbol',source:'travel-points',filter:['!', ['has','point_count']],layout:{'text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':14,'text-variable-anchor':['top','bottom','left','right'],'text-radial-offset':1.1,'text-allow-overlap':false},paint:{'text-color':'#3b4539','text-halo-color':'#fffdf5','text-halo-width':2}})
}
function fit(map:LibreMap,j:Journal,scope:'china'|'trip'){
 map.setPadding({top:0,bottom:0,left:0,right:0});const e=mapExtent(j,scope);if(e.single)map.jumpTo({center:e.bounds[0],zoom:11,pitch:0,bearing:0});else map.fitBounds(e.bounds,{padding:{top:80,bottom:100,left:65,right:65},maxZoom:11,duration:0,bearing:0,pitch:0})
}
function makeMap(container:HTMLElement,p:Palette,exporting=false){
 return new LibreMap({container,locale:{'NavigationControl.ZoomIn':'放大地图','NavigationControl.ZoomOut':'缩小地图'},style:travelBaseStyle(),center:[105,34],zoom:3,maxZoom:18,minZoom:1,renderWorldCopies:false,pitch:0,bearing:0,attributionControl:exporting?false:{compact:false,customAttribution:'Style: <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a> / <a href="https://github.com/openmaptiles/positron-gl-style" target="_blank" rel="noopener">Positron</a>'},interactive:!exporting,pixelRatio:exporting?2:Math.min(devicePixelRatio||1,2),canvasContextAttributes:{preserveDrawingBuffer:exporting},localIdeographFontFamily:'"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif'})
}
export interface MapCallbacks{onStop:(id:string)=>void;onPick:(coord:[number,number])=>void;onRegion:(id:string)=>void;onStatus:(message:string)=>void}
export function createTravelMap(host:HTMLElement,callbacks:MapCallbacks){
 let latest:Journal|undefined,palette:Palette|undefined,loaded=false,disposed=false,resourceFailed=false,picking=false,marking=true,updating=false,pendingUpdate=false,lastKey='',frameKey='',errorTimer:ReturnType<typeof setTimeout>
 const map=makeMap(host,{accent:'#526c58'} as Palette)
 map.addControl(new NavigationControl({showCompass:false}),'top-right')
 const observer=new ResizeObserver(()=>{if(!disposed){map.resize();if(loaded&&latest)fit(map,latest,'trip')}});observer.observe(host)
 errorTimer=setTimeout(()=>{if(!loaded)callbacks.onStatus('地图加载较慢或资源不可用，可重试；记录和静态手账仍可使用。')},16000)
 const update=async()=>{
  if(!loaded||!latest||!palette||disposed)return
  if(updating){pendingUpdate=true;return}
  updating=true
  try{do{
   pendingUpdate=false
   // MapLibre 6 sends GeoJSON to a Worker. Never send Vue proxies or mutable coordinate arrays.
   const snapshot=JSON.parse(JSON.stringify(latest)) as Journal,p=palette
   const features=mapFeatures(snapshot),key=JSON.stringify({features,regions:visibleRegionIds(snapshot),palette:p.id})
   if(key!==lastKey){await addTravelLayers(map,snapshot,p);if(disposed)return;lastKey=key}
   const next=JSON.stringify({id:snapshot.activeTrip,coords:features.points})
   if(frameKey!==next){fit(map,snapshot,'trip');frameKey=next}
  }while(pendingUpdate&&!disposed)}catch{if(!disposed)callbacks.onStatus('足迹图层更新失败，请重试地图；旅行记录仍保留。')}finally{updating=false}
 }
 map.on('load',()=>{loaded=true;clearTimeout(errorTimer);callbacks.onStatus(resourceFailed?'部分底图、字体或瓦片加载失败；请检查网络后重试。':'');update()})
 map.on('error',()=>{resourceFailed=true;callbacks.onStatus('部分底图、字体或瓦片加载失败；请检查网络后重试。照片不会上传。')})
 map.on('webglcontextlost',()=>callbacks.onStatus('WebGL 绘图上下文丢失，请重试地图；静态手账仍可导出。'))
 map.on('click',async e=>{
  if(!loaded||disposed)return
  if(picking){callbacks.onPick([Number(e.lngLat.lng.toFixed(6)),Number(e.lngLat.lat.toFixed(6))]);return}
  const f=map.queryRenderedFeatures(e.point,{layers:['travel-clusters','travel-stops'].filter(id=>!!map.getLayer(id))})[0]
  if(f?.properties?.cluster_id!==undefined){try{const source=map.getSource('travel-points') as GeoJSONSource;const zoom=await source.getClusterExpansionZoom(Number(f.properties.cluster_id));if(!disposed)map.easeTo({center:(f.geometry as any).coordinates,zoom,duration:250})}catch{if(!disposed)callbacks.onStatus('聚合点已更新，请重新点击。')}return}
  if(f?.properties?.stopId){callbacks.onStop(String(f.properties.stopId));return}
  if(marking&&map.getLayer('travel-region-fill')){const region=map.queryRenderedFeatures(e.point,{layers:['travel-region-fill']})[0];if(region?.properties?.regionId)callbacks.onRegion(String(region.properties.regionId))}
 })
 return{update(j:Journal,p:Palette){latest=j;palette=p;update()},reset(){if(latest&&loaded)fit(map,latest,'trip')},overview(){if(latest&&loaded)fit(map,latest,'china')},setPicking(value:boolean){picking=value;map.getCanvas().style.cursor=value?'crosshair':''},setMarking(value:boolean){marking=value},focus(coord:[number,number]){map.easeTo({center:coord,zoom:12,duration:250})},dispose(){disposed=true;clearTimeout(errorTimer);observer.disconnect();map.remove()}}
}
// Poster composition uses local administrative cutouts, not screenshots of the interactive map.
export async function renderTravelMap(j:Journal,p:Palette,width=1430,height=1080):Promise<HTMLCanvasElement>{
 return drawTravelMap(JSON.parse(JSON.stringify(j)),p,width,height)
}
export function disposeMapExport(){/* No WebGL export map or remote resources to retain. */}
