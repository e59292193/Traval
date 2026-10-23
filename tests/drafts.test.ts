import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateDraft} from '../src/platform/drafts-h5'
import {createWork} from '../src/core/work'
import {journey} from '../src/templates/journey'
import {createJournal} from '../src/core/travel'
function draft(){return{version:1,savedAt:new Date().toISOString(),work:createWork(journey),journal:createJournal(),photos:[] as any[]}}
test('draft validates complete empty work and current schema',()=>assert.equal(validateDraft(draft()).version,1))
test('draft requires every binding to have an actual supported image Blob',()=>{const d=draft();d.work.photos.p1={assetId:'a',crop:{zoom:1,x:.5,y:.5}};assert.throws(()=>validateDraft(d));d.photos.push({id:'a',blob:new Blob(['image'],{type:'image/jpeg'})});assert.equal(validateDraft(d).photos.length,1);d.work.photos.p1.crop.x=2;assert.throws(()=>validateDraft(d))})
test('invalid work version and overlength text cannot overwrite current edit',()=>{const d=draft();d.work.text.title='长'.repeat(25);assert.throws(()=>validateDraft(d));d.work.text.title='标题';(d.work as any).dataVersion=999;assert.throws(()=>validateDraft(d))})

test('archived trip photo survives without a current handout binding, and missing archive is rejected',()=>{const d=draft();d.journal.trips=[{id:'t',name:'旅行',note:'',stops:[{id:'s',place:{id:'a',name:'北京',region:'110000',regionName:'北京市',coord:[116,39]},date:'',note:'',photoSlot:'p1',photoId:'archive'}]}];assert.throws(()=>validateDraft(d));d.photos.push({id:'archive',blob:new Blob(['image'],{type:'image/jpeg'})});assert.equal(validateDraft(d).photos.length,1)})
