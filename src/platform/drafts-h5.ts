import type {Work,Photo} from '../types'
import {validateJournal,type Journal} from '../core/travel'
import {journey} from '../templates/journey'
import {limits,graphemes} from '../core/text'
export interface DraftPhoto {id:string;blob:Blob}
export interface Draft {version:1;savedAt:string;work:Work;journal:Journal;photos:DraftPhoto[]}
const DB='traval-local-v1',STORE='draft',KEY='current'
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('当前浏览器不支持本地草稿，请更换现代浏览器；当前作品仍可导出。'));return}const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('无法打开本地草稿。请关闭隐私模式或检查浏览器存储权限。'));r.onblocked=()=>reject(new Error('草稿数据库被其他标签页占用，请关闭旧页面后重试。'))})}
async function operation<T>(mode:IDBTransactionMode,action:(s:IDBObjectStore)=>IDBRequest):Promise<T>{const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode);let request:IDBRequest;try{request=action(tx.objectStore(STORE))}catch{db.close();reject(new Error('本地草稿读写失败，请检查浏览器存储权限和剩余空间；当前编辑内容仍保留。'));return}tx.oncomplete=()=>{db.close();resolve(request.result)};tx.onerror=tx.onabort=()=>{db.close();reject(new Error('本地草稿存储失败，可能空间不足。当前编辑内容仍保留。'))}})}
export function validateDraft(raw:unknown):Draft{
 const d=raw as Draft,w=d?.work
 if(!d||d.version!==1||!validTimestamp(d.savedAt)||!w||w.dataVersion!==2||w.templateId!==journey.id||w.templateVersion!==journey.version||!journey.palettes.some(p=>p.id===w.paletteId)||!w.text||!w.photos||!w.captions||!Array.isArray(d.photos)||d.photos.length>32)throw new Error('草稿版本或模板不兼容，未覆盖当前作品')
 for(const key of Object.keys(limits) as (keyof typeof limits)[])if(typeof w.text[key]!=='string'||graphemes(w.text[key]).length>limits[key])throw new Error('草稿文字无效')
 const ids=new Set<string>();let bytes=0
 for(const p of d.photos){if(!p||typeof p.id!=='string'||ids.has(p.id)||!(p.blob instanceof Blob)||!['image/jpeg','image/png','image/webp'].includes(p.blob.type)||(bytes+=p.blob.size)>30*1024*1024)throw new Error('草稿照片无效或超过 30 MB 限制');ids.add(p.id)}
 for(const slot of ['p1','p2','p3','p4']){const b=w.photos[slot],c=w.captions[slot];if(!c||typeof c.label!=='string'||c.label.length>40||typeof c.date!=='string'||c.date.length>40||b!==null&&(!b||!ids.has(b.assetId)||!b.crop||!Number.isFinite(b.crop.zoom)||b.crop.zoom<1||b.crop.zoom>3||!Number.isFinite(b.crop.x)||b.crop.x<0||b.crop.x>1||!Number.isFinite(b.crop.y)||b.crop.y<0||b.crop.y>1))throw new Error('草稿照片绑定或裁剪无效')}
 d.journal=validateJournal(d.journal);for(const stop of d.journal.trips.flatMap(t=>t.stops))if(stop.photoId&&!ids.has(stop.photoId))throw new Error('草稿的旅行照片缺失，未覆盖当前编辑');return d
}
function validTimestamp(s:unknown){return typeof s==='string'&&Number.isFinite(Date.parse(s))}
export async function saveDraft(work:Work,journal:Journal,photos:Map<string,Photo>){
 const snapshot=JSON.parse(JSON.stringify({work,journal})),encoded:DraftPhoto[]=[]
 const referenced=new Set([...Object.values(work.photos).flatMap(b=>b?[b.assetId]:[]),...journal.trips.flatMap(t=>t.stops.flatMap(s=>s.photoId?[s.photoId]:[]))])
 for(const id of referenced){const p=photos.get(id);if(!p)throw new Error('照片尚未准备好，草稿未保存');const c=document.createElement('canvas');c.width=p.width;c.height=p.height;const ctx=c.getContext('2d');if(!ctx)throw new Error('保存草稿时内存不足');try{ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(p.source as CanvasImageSource,0,0);const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('草稿照片编码失败')),'image/jpeg',.92));encoded.push({id:p.id,blob})}finally{c.width=c.height=1}}
 const draft=validateDraft({version:1,savedAt:new Date().toISOString(),...snapshot,photos:encoded});await operation('readwrite',s=>s.put(draft,KEY));return draft.savedAt
}
export async function loadDraft(){const d=await operation<unknown>('readonly',s=>s.get(KEY));return d?validateDraft(d):null}
export async function draftDate(){const d=await operation<any>('readonly',s=>s.get(KEY));return d?.savedAt||''}
export async function deleteDraft(){await operation('readwrite',s=>s.delete(KEY))}
