import {validateRecipe} from './sticker'
import type {Crop,Magnet} from '../types'
export const MAX_MAGNETS=8
export const magnetStyles=[{id:'ceramic' as const,name:'奶油方贴'},{id:'round' as const,name:'圆形徽章'}]
export function validMagnetCrop(c:Crop){return !!c&&Number.isFinite(c.zoom)&&c.zoom>=1&&c.zoom<=3&&Number.isFinite(c.x)&&c.x>=0&&c.x<=1&&Number.isFinite(c.y)&&c.y>=0&&c.y<=1}
export function validateMagnets(raw:unknown,photoIds:Set<string>):Magnet[]{
 // v0.4.1 and earlier drafts did not contain magnets.
 if(raw===undefined)return []
 if(!Array.isArray(raw)||raw.length>MAX_MAGNETS)throw new Error('草稿冰箱贴数量无效')
 const ids=new Set<string>()
 for(const m of raw){if(!m||typeof m.id!=='string'||!m.id||m.id.length>120||ids.has(m.id)||typeof m.assetId!=='string'||!photoIds.has(m.assetId)||!['ceramic','round','cutout'].includes(m.style)||!validMagnetCrop(m.crop))throw new Error('草稿冰箱贴图片、样式或裁剪无效');if(m.style==='cutout'&&(typeof m.sourceAssetId!=='string'||!photoIds.has(m.sourceAssetId)||m.sourceAssetId===m.assetId||!validateRecipe(m.cutout)))throw new Error('草稿异形冰箱贴原图或编辑参数缺失');ids.add(m.id)}
 return raw
}

export const magnetAssetIds=(m:Magnet)=>[m.assetId,...(m.sourceAssetId&&m.sourceAssetId!==m.assetId?[m.sourceAssetId]:[])]
