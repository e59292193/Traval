import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateMagnets,MAX_MAGNETS} from '../src/core/magnets'
import {validateDraft} from '../src/platform/drafts-h5'
import {createWork} from '../src/core/work'
import {createJournal} from '../src/core/travel'
import {journey} from '../src/templates/journey'
import {drawMagnet} from '../src/render/magnet'
import type {Magnet,DrawContext} from '../src/types'
const magnet=():Magnet=>({id:'m1',assetId:'image',style:'ceramic',crop:{zoom:1,x:.5,y:.5}})
const draft=()=>({version:1,savedAt:new Date().toISOString(),work:createWork(journey),journal:createJournal(),photos:[{id:'image',blob:new Blob(['image'],{type:'image/jpeg'})}]})
test('new work has independent empty magnet collection',()=>{const a=createWork(journey),b=createWork(journey);a.magnets.push(magnet());assert.equal(b.magnets.length,0);assert.equal(MAX_MAGNETS,8)})
test('old drafts migrate without losing text and photo bindings',()=>{const d=draft();delete (d.work as any).magnets;d.work.text.title='旧版手账';const restored=validateDraft(d);assert.deepEqual(restored.work.magnets,[]);assert.equal(restored.work.text.title,'旧版手账')})
test('magnet-only image reference survives validated draft',()=>{const d=draft();d.work.magnets.push(magnet());assert.equal(validateDraft(d).work.magnets[0].assetId,'image');d.photos=[];assert.throws(()=>validateDraft(d),/冰箱贴/)})
test('reject invalid styles, duplicate IDs and more than eight',()=>{const ids=new Set(['image']);assert.throws(()=>validateMagnets([{...magnet(),style:'unknown'}],ids));assert.throws(()=>validateMagnets([magnet(),magnet()],ids));assert.throws(()=>validateMagnets(Array.from({length:9},(_,i)=>({...magnet(),id:'m'+i})),ids));assert.equal(validateMagnets(Array.from({length:8},(_,i)=>({...magnet(),id:'m'+i})),ids).length,8)})
test('reject NaN, out-of-range and missing crops',()=>{for(const crop of [undefined,{zoom:NaN,x:.5,y:.5},{zoom:4,x:0,y:0},{zoom:1,x:-1,y:1},{zoom:1,x:0,y:2}])assert.throws(()=>validateMagnets([{...magnet(),crop}],new Set(['image'])))})
test('round and ceramic use original source, square crop and bounded rim',()=>{for(const style of ['round','ceramic'] as const){const calls:any[]=[],ctx=new Proxy({},{get:(_,key)=> (...args:any[])=>{calls.push([key,...args])}}) as DrawContext;const m={...magnet(),style,crop:{zoom:2,x:.2,y:.8}},p={id:'image',source:'original',width:1600,height:900,thumbnail:'thumb',dispose(){}};drawMagnet(ctx,m,p,0,0,64);const call=calls.find(c=>c[0]==='drawImage');assert.equal(call[1],'original');assert.equal(call[4],call[5]);assert.equal(call[8],call[9]);assert.ok(call[2]>=0&&call[3]>=0);assert.ok(call[2]+call[4]<=p.width);assert.ok(call[3]+call[5]<=p.height);assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);assert.deepEqual(m.crop,{zoom:2,x:.2,y:.8})}})
