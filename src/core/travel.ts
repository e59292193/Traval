export interface Place {id:string;name:string;region:string;regionName:string;coord:[number,number]}
export interface Stop {id:string;place:Place;date:string;note:string;photoSlot:string;photoId?:string}
export interface Trip {id:string;name:string;note:string;stops:Stop[]}
export interface Journal {version:1;coordinateSystem:'datav-native';visitedRegions:string[];trips:Trip[];activeTrip:string;showRoutes:boolean;mapEnabled:boolean}
export function createJournal():Journal{return{version:1,coordinateSystem:'datav-native',visitedRegions:[],trips:[],activeTrip:'all',showRoutes:true,mapEnabled:false}}
export const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)
export function validDate(s:string){if(s==='')return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s}
export function validateJournal(value:unknown):Journal{
 const j=value as Journal
 if(!j||j.version!==1||j.coordinateSystem!=='datav-native'||!Array.isArray(j.trips)||j.trips.length>100||!Array.isArray(j.visitedRegions)||j.visitedRegions.length>34||!j.visitedRegions.every(x=>/^\d{6}$/.test(x))||typeof j.mapEnabled!=='boolean'||typeof j.showRoutes!=='boolean')throw new Error('草稿旅行数据版本或内容无效，未覆盖当前作品')
 const ids=new Set<string>();let total=0
 for(const t of j.trips){if(!t||typeof t.id!=='string'||ids.has(t.id)||typeof t.name!=='string'||!t.name.trim()||t.name.length>80||typeof t.note!=='string'||t.note.length>500||!Array.isArray(t.stops))throw new Error('旅行记录无效');ids.add(t.id)
  for(const s of t.stops){const p=s?.place;if(++total>500||!s||typeof s.id!=='string'||ids.has(s.id)||!validDate(s.date)||typeof s.note!=='string'||s.note.length>500||!['','p1','p2','p3','p4'].includes(s.photoSlot)||(s.photoId!==undefined&&(typeof s.photoId!=='string'||s.photoId.length>120))||!p||typeof p.id!=='string'||p.id.length>120||typeof p.name!=='string'||!p.name.trim()||p.name.length>60||typeof p.regionName!=='string'||p.regionName.length>40||!/^\d{6}$/.test(p.region)||!Array.isArray(p.coord)||p.coord.length!==2||!p.coord.every(Number.isFinite)||p.coord[0]<73||p.coord[0]>136||p.coord[1]<3||p.coord[1]>54)throw new Error('旅行地点、日期或坐标无效');ids.add(s.id)}
 }
 if(typeof j.activeTrip!=='string'||j.activeTrip!=='all'&&!j.trips.some(t=>t.id===j.activeTrip))throw new Error('草稿所选旅行不存在')
 return JSON.parse(JSON.stringify(j))
}
export function visibleTrips(j:Journal){return j.activeTrip==='all'?j.trips:j.trips.filter(t=>t.id===j.activeTrip)}
export function travelStats(j:Journal){const stops=j.trips.flatMap(t=>t.stops),regions=new Set([...j.visitedRegions,...stops.map(s=>s.place.region)]),cities=new Set(stops.map(s=>s.place.id));return{trips:j.trips.length,cities:cities.size,regions:regions.size,stops:stops.length}}
export function routeSegments(j:Journal){return visibleTrips(j).flatMap(t=>t.stops.slice(1).map((s,i)=>({tripId:t.id,coords:[t.stops[i].place.coord,s.place.coord]})))}
export function moveStop(trip:Trip,index:number,delta:number){const next=index+delta;if(next<0||next>=trip.stops.length)return;[trip.stops[index],trip.stops[next]]=[trip.stops[next],trip.stops[index]]}
