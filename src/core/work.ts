import type {Template,Work,Layer} from '../types'
export function validateTemplate(t:Template){
 if(!t.id||!Number.isInteger(t.version)||t.version<1||t.width<=0||t.height<=0)throw new Error('模板尺寸或版本无效')
 if(!t.palettes.some(p=>p.id===t.defaultPalette))throw new Error('默认配色不存在')
 const ids=new Set<string>(),bindings=new Set<string>()
 for(const l of t.layers){
  if(ids.has(l.id)||![l.x,l.y,l.width,l.height,l.rotation,l.opacity].every(Number.isFinite)||l.width<=0||l.height<=0||l.opacity<0||l.opacity>1)throw new Error('图层配置无效')
  ids.add(l.id)
  if(l.type==='photo'){if(bindings.has(l.binding))throw new Error('照片槽位重复');bindings.add(l.binding)}
  if(l.type==='text'&&(l.maxLines<1||l.minFontSize<1||l.fontSize<l.minFontSize))throw new Error('文字配置无效')
 }
 if(bindings.size!==4)throw new Error('首版模板需要四个照片槽位')
}
export function createWork(t:Template):Work {return {dataVersion:1,templateId:t.id,templateVersion:t.version,paletteId:t.defaultPalette,text:{title:'我的旅行手账',subtitle:'记录沿途的美好',date:''},photos:Object.fromEntries(t.layers.filter(l=>l.type==='photo').map(l=>[(l as Extract<Layer,{type:'photo'}>).binding,null]))}}
