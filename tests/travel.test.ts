import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createJournal,validateJournal,travelStats,routeSegments,moveStop,validDate} from '../src/core/travel'
const place=(id='a',region='110000')=>({id,name:id,region,regionName:'北京市',coord:[116,39] as [number,number]})
const stop=(id:string,p=place())=>({id,place:p,date:'2026-10-23',note:'',photoSlot:''})
test('empty travel has no invented city/trip/region counts',()=>assert.deepEqual(travelStats(createJournal()),{trips:0,cities:0,regions:0,stops:0}))
test('stats deduplicate cities and merge manually visited regions',()=>{const j=createJournal();j.visitedRegions=['310000'];j.trips=[{id:'t1',name:'旅行',note:'',stops:[stop('s1'),stop('s2')]}];assert.deepEqual(travelStats(j),{trips:1,cities:1,regions:2,stops:2})})
test('routes never connect different trips and follow list order',()=>{const j=createJournal();j.trips=[{id:'t1',name:'旅行1',note:'',stops:[stop('s1'),stop('s2',place('b'))]},{id:'t2',name:'旅行2',note:'',stops:[stop('s3')]}];assert.equal(routeSegments(j).length,1);j.activeTrip='t2';assert.equal(routeSegments(j).length,0);moveStop(j.trips[0],1,-1);assert.equal(j.trips[0].stops[0].id,'s2')})
test('valid calendar date checks include leap years',()=>{assert.ok(validDate(''));assert.ok(validDate('2024-02-29'));for(const d of ['2026-02-29','2026-13-01','2026-1-1','2026-04-31'])assert.equal(validDate(d),false)})
test('travel schema roundtrips, rejects unknown coordinates, duplicate ids and bad dates',()=>{const j=createJournal();j.trips=[{id:'t',name:'旅行',note:'',stops:[stop('s')]}];assert.deepEqual(validateJournal(j),j);for(const mutate of [(v:any)=>v.version=7,(v:any)=>v.coordinateSystem='WGS84',(v:any)=>v.trips[0].stops[0].place.coord=[181,39],(v:any)=>v.trips[0].stops[0].date='2026-02-30',(v:any)=>v.trips[0].stops.push(v.trips[0].stops[0]),(v:any)=>v.activeTrip='deleted']){const copy=JSON.parse(JSON.stringify(j));mutate(copy);assert.throws(()=>validateJournal(copy))}})
