import {Map as LibreMap,NavigationControl,setWorkerUrl,type GeoJSONSource,type StyleSpecification} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import baseStyle from '../data/map-style.json'
import regionData from '../data/regions.json'
import {mapFeatures,mapExtent,type Journal} from '../core/travel'
import type {Palette} from '../types'
setWorkerUrl(workerUrl)
export const regions=regionData
export const MAP_ATTRIBUTION='OpenFreeMap © OpenMapTiles © OpenStreetMap contributors · Style: CARTO / Positron'
export const MAP_SOURCE_DOMAINS=['tiles.openfreemap.org']
function style(p:Palette):StyleSpecification{
 const s=JSON.parse(JSON.stringify(baseStyle)) as StyleSpecification
 for(const l of s.layers){
  if(l.type==='background')l.paint={'background-color':'#f8f3e8'}
  if(l.type==='fill'&&l.id==='water')l.paint={...l.paint,'fill-color':'#cce1e2'}
  if(l.type==='symbol'&&l.layout?.['text-field']&& !/shield/.test(l.id))l.layout['text-field']=['coalesce',['get','name:zh'],['get','name'],['get','name:latin']]
 }
 return s
}
function addTravelLayers(map:LibreMap,j:Journal,p:Palette){
 const data=mapFeatures(j),points=map.getSource('travel-points') as GeoJSONSource|undefined,routes=map.getSource('travel-routes') as GeoJSONSource|undefined
 if(points){points.setData(data.points);routes!.setData(data.routes);map.setPaintProperty('travel-stops','circle-color',p.accent);return}
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
 return new LibreMap({container,locale:{'NavigationControl.ZoomIn':'放大地图','NavigationControl.ZoomOut':'缩小地图'},style:style(p),center:[105,34],zoom:3,maxZoom:18,minZoom:1,renderWorldCopies:false,pitch:0,bearing:0,attributionControl:exporting?false:{compact:false,customAttribution:'Style: <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a> / <a href="https://github.com/openmaptiles/positron-gl-style" target="_blank" rel="noopener">Positron</a>'},interactive:!exporting,pixelRatio:exporting?2:Math.min(devicePixelRatio||1,2),canvasContextAttributes:{preserveDrawingBuffer:exporting},localIdeographFontFamily:'"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif'})
}
export interface MapCallbacks{onStop:(id:string)=>void;onPick:(coord:[number,number])=>void;onStatus:(message:string)=>void}
export function createTravelMap(host:HTMLElement,callbacks:MapCallbacks){
 let latest:Journal|undefined,palette:Palette|undefined,loaded=false,disposed=false,resourceFailed=false,picking=false,lastKey='',frameKey='',errorTimer:ReturnType<typeof setTimeout>
 const map=makeMap(host,{accent:'#526c58'} as Palette)
 map.addControl(new NavigationControl({showCompass:false}),'top-right')
 const observer=new ResizeObserver(()=>{if(!disposed){map.resize();if(loaded&&latest)fit(map,latest,'trip')}});observer.observe(host)
 errorTimer=setTimeout(()=>{if(!loaded)callbacks.onStatus('地图加载较慢或资源不可用，可重试；记录和静态手账仍可使用。')},16000)
 const update=()=>{if(!loaded||!latest||!palette)return;const key=JSON.stringify({features:mapFeatures(latest),palette:palette.id});if(key!==lastKey){addTravelLayers(map,latest,palette);lastKey=key}const next=JSON.stringify({id:latest.activeTrip,coords:mapFeatures(latest).points});if(frameKey!==next){fit(map,latest,'trip');frameKey=next}}
 map.on('load',()=>{loaded=true;clearTimeout(errorTimer);callbacks.onStatus(resourceFailed?'部分底图、字体或瓦片加载失败；请检查网络后重试。':'');update()})
 map.on('error',()=>{resourceFailed=true;callbacks.onStatus('部分底图、字体或瓦片加载失败；请检查网络后重试。照片不会上传。')})
 map.on('webglcontextlost',()=>callbacks.onStatus('WebGL 绘图上下文丢失，请重试地图；静态手账仍可导出。'))
 map.on('click',async e=>{
  if(!loaded)return
  const f=map.queryRenderedFeatures(e.point,{layers:['travel-clusters','travel-stops'].filter(id=>!!map.getLayer(id))})[0]
  if(f?.properties?.cluster_id!==undefined){const source=map.getSource('travel-points') as GeoJSONSource;const zoom=await source.getClusterExpansionZoom(Number(f.properties.cluster_id));if(!disposed)map.easeTo({center:(f.geometry as any).coordinates,zoom,duration:250});return}
  if(f?.properties?.stopId){callbacks.onStop(String(f.properties.stopId));return}
  if(picking)callbacks.onPick([Number(e.lngLat.lng.toFixed(6)),Number(e.lngLat.lat.toFixed(6))])
 })
 return{update(j:Journal,p:Palette){latest=j;palette=p;update()},reset(){if(latest&&loaded)fit(map,latest,'trip')},overview(){if(latest&&loaded)fit(map,latest,'china')},setPicking(value:boolean){picking=value;map.getCanvas().style.cursor=value?'crosshair':''},focus(coord:[number,number]){map.easeTo({center:coord,zoom:12,duration:250})},dispose(){disposed=true;clearTimeout(errorTimer);observer.disconnect();map.remove()}}
}
let exportHost:HTMLDivElement|undefined,exportMap:LibreMap|undefined,exportKey='',queue:Promise<unknown>=Promise.resolve(),exportError=false,requestGeneration=0
function idle(map:LibreMap,timeout=22000):Promise<void>{return new Promise((resolve,reject)=>{let timer:ReturnType<typeof setTimeout>;const done=()=>{clearTimeout(timer);map.off('idle',check);map.off('remove',removed)};const check=()=>{if(map.loaded()&&map.areTilesLoaded()){done();resolve()}};const removed=()=>{done();reject(new Error('地图导出已取消'))};map.on('idle',check);map.on('remove',removed);timer=setTimeout(()=>{done();reject(new Error('精细地图资源加载超时，请检查网络或改用静态模式'))},timeout);map.triggerRepaint();check()})}
export function renderTravelMap(j:Journal,p:Palette,width=1430,height=1080):Promise<HTMLCanvasElement>{
 const snapshot=JSON.parse(JSON.stringify(j)) as Journal,generation=++requestGeneration
 const job=async()=>{
  if(generation!==requestGeneration)throw new Error('地图预览已更新')
  const key=JSON.stringify({features:mapFeatures(snapshot),scope:snapshot.exportScope,palette:p.id,width,height})
  if(!exportMap){exportHost=document.createElement('div');exportHost.style.cssText='position:fixed;left:-20000px;top:0;width:715px;height:540px;pointer-events:none';document.body.appendChild(exportHost);try{exportError=false;exportMap=makeMap(exportHost,p,true);exportMap.on('error',()=>{exportError=true})}catch(e){exportHost.remove();exportHost=undefined;throw new Error('当前设备不能创建 WebGL2 地图，请使用静态模式')}}
  const map=exportMap
  if(exportError)throw new Error('部分精细地图资源加载失败，请重试或关闭足迹地图合成')
  if(key!==exportKey){await idle(map);if(exportError)throw new Error('精细地图资源不可用，请重试或使用静态模式');addTravelLayers(map,snapshot,p);fit(map,snapshot,snapshot.exportScope||'trip');await idle(map);if(exportError)throw new Error('部分精细地图资源加载失败，请重试或关闭足迹地图合成');exportKey=key}
  const out=document.createElement('canvas');out.width=width;out.height=height;const c=out.getContext('2d');if(!c)throw new Error('地图导出内存不足')
  c.drawImage(map.getCanvas(),0,0,width,height)
  const ratio=width/715,bar=Math.ceil(31*ratio);c.fillStyle='#fffdf1ee';c.fillRect(0,height-bar,width,bar);c.fillStyle='#4e5e50';c.font=`${Math.round(11*ratio)}px sans-serif`;c.textBaseline='middle';c.fillText(MAP_ATTRIBUTION,12*ratio,height-bar/2)
  // Readback forces any origin-clean/CORS failure to surface before this layer is used by the poster.
  c.getImageData(0,0,1,1);return out
 }
 const result=queue.then(job,job);queue=result.catch(()=>{});return result
}
export function disposeMapExport(){requestGeneration++;exportMap?.remove();exportMap=undefined;exportHost?.remove();exportHost=undefined;exportKey=''}
