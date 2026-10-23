import type {Template,Work,Layer} from '../types'
import {photoBox} from './photo-box'
export function validateTemplate(t:Template){
 if(!t.id||!Number.isInteger(t.version)||t.version<1||t.width<=0||t.height<=0)throw new Error('模板尺寸或版本无效')
 if(!t.palettes.some(p=>p.id===t.defaultPalette))throw new Error('默认配色不存在')
 const ids=new Set<string>(),bindings=new Set<string>()
 for(const l of t.layers){
  if(ids.has(l.id)||![l.x,l.y,l.width,l.height,l.rotation,l.opacity].every(Number.isFinite)||l.width<=0||l.height<=0||l.opacity<0||l.opacity>1)throw new Error('图层配置无效')
  ids.add(l.id)
  if(l.type==='photo'){const box=photoBox(l);if(!Number.isFinite(box.width)||!Number.isFinite(box.height)||box.width<=0||box.height<=0)throw new Error('照片区域无效');if(bindings.has(l.binding))throw new Error('照片槽位重复');bindings.add(l.binding)}
  if(l.type==='text'&&(l.maxLines<1||l.minFontSize<1||l.fontSize<l.minFontSize))throw new Error('文字配置无效')
 }
 if(bindings.size!==4)throw new Error('首版模板需要四个照片槽位')
}
export function createWork(t:Template):Work {return {dataVersion:2,templateId:t.id,templateVersion:t.version,paletteId:t.defaultPalette,text:{title:'My Travel Map',subtitle:'去更远的地方，收藏世界的美好。',date:'',name:'Traveler',wish:'下一站，继续出发',note:'慢慢走，认真看。把喜欢的风景，收进这一页回忆。'},captions:Object.fromEntries(['出发','沿途','片刻','收藏'].map((label,i)=>['p'+(i+1),{label,date:''}])),photos:Object.fromEntries(t.layers.filter(l=>l.type==='photo').map(l=>[(l as Extract<Layer,{type:'photo'}>).binding,null]))}}
