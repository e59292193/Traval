<template>
 <view class="app-shell">
  <view class="topbar"><view class="brand"><view class="brand-mark">↗</view><view><text class="brand-name">沿途</text><text class="brand-en">TRAVEL JOURNAL</text></view></view><text class="top-note">让每次出发，都有迹可循。</text><text class="prototype">{{ platform.name==='H5' ? 'H5 原型' : '小程序验证版' }} · v0.1</text></view>
  <view class="intro"><view><text class="eyebrow">MAKE ROOM FOR MEMORIES</text><view class="intro-title">把旅行，做成一页珍藏。</view><text class="intro-sub">四张照片，一段故事。你的沿途，值得被好好收藏。</text></view><text class="privacy">◉ 照片仅在当前设备内处理</text></view>
  <view class="workspace">
   <view class="preview-panel">
    <view class="preview-toolbar"><text class="section-label">作品预览</text><text class="preview-tag">单次旅行纪念 · 01</text></view>
    <view class="poster-wrap"><view id="preview-host" class="poster-host" :class="{'is-cropping':cropOpen}">
     <!-- #ifdef MP-WEIXIN -->
     <canvas id="poster-preview" canvas-id="poster-preview" type="2d" class="mp-preview" :style="{width:mpPreviewWidth+'px',height:(mpPreviewWidth*1.4)+'px'}" :disable-scroll="cropOpen" @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd" @touchcancel="touchEnd" />
     <!-- #endif -->
    </view><view v-if="!ready" class="preview-loading">{{ initializing ? '正在准备画布…' : '画布未就绪，请重试' }}</view></view>
    <view class="preview-footer"><text>{{ cropOpen ? '拖动画布可调整选中照片；也可使用位置滑杆' : '实时预览 · 导出时不包含编辑控件' }}</text><text>5 : 7</text></view>
    <button v-if="!ready && !initializing" class="secondary" @click="initialize">重新准备画布</button>
   </view>
   <view class="editor-panel">
    <view class="panel-heading"><text class="section-label">编辑这段旅程</text><button class="text-button" :disabled="busy" @click="reset">重置</button></view>
    <view class="editor-section"><view class="step-title"><text class="step-number">01</text><text>写下故事</text></view>
     <view v-for="field in fields" :key="field.key" class="field"><view class="field-heading"><text>{{ field.label }}</text><text class="counter">{{ graphemes(work.text[field.key]).length }} / {{ limits[field.key] }}</text></view><input :aria-label="field.label" :value="inputValues[field.key]" :placeholder="field.placeholder" :maxlength="-1" :disabled="busy" @input="editText(field.key,$event)" /></view>
    </view>
    <view class="editor-section"><view class="step-title"><text class="step-number">02</text><text>放入风景</text><text class="step-detail">{{ photoCount }} / 4</text></view><text class="helper">JPEG / PNG / WebP · 每张不超过 15 MB</text>
     <view class="photo-grid"><view v-for="(slot,i) in slots" :key="slot.binding" class="photo-card" :class="{'selected':selected===slot.binding && cropOpen}">
      <button class="photo-picker" :aria-label="`${i+1}号照片：${work.photos[slot.binding] ? '替换' : '选择'}`" :disabled="busy || !ready" @click="choose(slot.binding)"><image v-if="photoFor(slot.binding)" :src="photoFor(slot.binding)!.thumbnail" mode="aspectFill" class="photo-thumb"/><view v-else class="photo-empty"><text class="photo-plus">＋</text><text>添加照片</text></view><text class="photo-index">{{ String(i+1).padStart(2,'0') }}</text></button>
      <view v-if="work.photos[slot.binding]" class="photo-actions"><button :disabled="busy" @click="openCrop(slot.binding)">裁剪</button><button :disabled="busy" @click="remove(slot.binding)">移除</button></view>
     </view></view>
     <view v-if="cropOpen && selectedPhoto" class="crop-panel"><view class="crop-heading"><text>调整照片 {{ selected.slice(1) }}</text><button class="text-button" @click="cropOpen=false">完成</button></view><text class="helper">拖动预览平移照片，或使用下方滑杆</text>
      <RangeControl label="缩放" :model-value="Math.round(currentCrop.zoom*100)" :min="100" :max="300" :display="`${currentCrop.zoom.toFixed(2)}×`" @update:model-value="updateCrop('zoom',$event/100)"/>
      <RangeControl label="水平位置" :model-value="Math.round(currentCrop.x*100)" :min="0" :max="100" :display="`${Math.round(currentCrop.x*100)}%`" @update:model-value="updateCrop('x',$event/100)"/>
      <RangeControl label="垂直位置" :model-value="Math.round(currentCrop.y*100)" :min="0" :max="100" :display="`${Math.round(currentCrop.y*100)}%`" @update:model-value="updateCrop('y',$event/100)"/>
      <button class="text-button" @click="centerCrop">恢复居中</button>
     </view>
    </view>
    <view class="editor-section"><view class="step-title"><text class="step-number">03</text><text>挑一种心情</text></view><view class="palettes"><button v-for="p in journey.palettes" :key="p.id" :class="['palette',{'active':work.paletteId===p.id}]" :aria-label="`配色：${p.name}`" :aria-pressed="work.paletteId===p.id" :disabled="busy" @click="work.paletteId=p.id"><view class="swatches"><view :style="{background:p.ink}"/><view :style="{background:p.soft}"/><view :style="{background:p.tape}"/></view><text>{{ p.name }}</text><text v-if="work.paletteId===p.id" class="palette-check">✓</text></button></view></view>
    <view class="export-section"><view class="export-heading"><text>图片清晰度</text><text>JPEG</text></view><view class="resolution"><button :class="{'active':resolution===1500}" :disabled="busy" @click="resolution=1500">高清 · 1500 × 2100</button><button :class="{'active':resolution===1000}" :disabled="busy" @click="resolution=1000">轻量 · 1000 × 1400</button></view><button class="primary export-button" :disabled="busy || !ready" @click="exportWork">{{ exporting ? '正在生成图片…' : loading ? '正在处理照片…' : '导出我的旅行手账 ↗' }}</button><text class="export-hint">{{ !ready ? '画布准备好后即可导出' : '不上传照片 · 不需要登录 · 本次作品仅存内存' }}</text></view>
   </view>
  </view>
  <view v-if="message" class="notice" :class="{'error':isError}" role="status"><text>{{ message }}</text><button v-if="!busy" class="text-button" @click="message=''">关闭</button></view>
  <view class="footer"><text>沿途 / 为每一个值得记住的片刻</text><text>刷新或离开页面后，当前作品不会保留。</text></view>
  <view v-if="result" class="modal-mask" @click.self="closeResult"><view class="result-modal" role="dialog" aria-modal="true" aria-label="导出图片"><view class="result-heading"><view><text class="section-label">一页旅程，已生成。</text><view class="helper">{{ result.width }} × {{ result.height }} · JPEG</view></view><button class="text-button" :disabled="saving" @click="closeResult">关闭</button></view><view class="result-scroll"><image class="result-image" :src="result.url" mode="widthFix" :show-menu-by-longpress="true" /></view><text class="save-hint">{{ saveHint }}</text><button class="primary" :disabled="saving" @click="save">{{ saving ? '正在保存…' : '保存图片' }}</button></view></view>
  <!-- #ifdef MP-WEIXIN -->
  <canvas id="poster-export" canvas-id="poster-export" type="2d" class="export-canvas" />
  <!-- #endif -->
 </view>
</template>
<script setup lang="ts">
import {ref,reactive,computed,watch,onMounted,onBeforeUnmount,getCurrentInstance,markRaw,nextTick} from 'vue'
import type {Photo,Work,Field,Crop,Target,ExportResult} from '../../types'
import {journey} from '../../templates/journey'
import {createWork,validateTemplate} from '../../core/work'
import {limits,limitText,graphemes} from '../../core/text'
import {panCrop,normalizeCrop} from '../../core/crop'
import {drawPoster} from '../../render/poster'
import {createPlatform,setCropMode} from '../../platform'
import RangeControl from '../../components/RangeControl.vue'
const platform=createPlatform(),scope=getCurrentInstance()?.proxy
const mpPreviewWidth=Math.min(420,Math.max(120,uni.getSystemInfoSync().windowWidth-64))
const work=reactive<Work>(createWork(journey)),photos=new Map<string,Photo>()
const inputValues=reactive({...work.text})
const ready=ref(false),initializing=ref(false),loading=ref(false),exporting=ref(false),saving=ref(false),message=ref(''),isError=ref(false),cropOpen=ref(false),selected=ref('p1'),resolution=ref(1500),result=ref<ExportResult|null>(null),saveHint=ref('桌面端可下载；手机或微信内可长按图片保存。')
const busy=computed(()=>loading.value||exporting.value||saving.value)
const slots=journey.layers.filter((l):l is Extract<typeof l,{type:'photo'}>=>l.type==='photo')
const fields:{key:Field;label:string;placeholder:string}[]=[{key:'title',label:'主标题',placeholder:'我的旅行手账'},{key:'subtitle',label:'目的地 / 副标题',placeholder:'记录沿途的美好'},{key:'date',label:'旅行日期（选填）',placeholder:'例如：2026.10.01 — 10.07'}]
const photoCount=computed(()=>Object.values(work.photos).filter(Boolean).length)
const selectedPhoto=computed(()=>{const b=work.photos[selected.value];return b?photos.get(b.assetId):undefined})
const currentCrop=computed(()=>work.photos[selected.value]?.crop||{zoom:1,x:.5,y:.5})
let target:Target|undefined,unbind=()=>{},cancelFrame=()=>{},pending=false,alive=true,requestVersion=0
function notify(text:string,error=false){message.value=text;isError.value=error}
function fail(e:unknown){notify(e instanceof Error?e.message:'操作失败，请重试；当前作品仍然保留',true)}
function photoFor(slot:string){const p=work.photos[slot];return p?photos.get(p.assetId):undefined}
function draw(){if(!target||!ready.value)return;try{drawPoster(target.ctx,journey,work,photos,target.width)}catch(e){fail(e)}}
function schedule(){if(pending)return;pending=true;cancelFrame=platform.schedule(()=>{pending=false;if(alive)draw()})}
watch(work,schedule,{deep:true})
watch(cropOpen,active=>{if(target)setCropMode(target,active)})
async function initialize(){if(initializing.value)return;initializing.value=true;try{validateTemplate(journey);const warning=await platform.prepareFonts();if(!alive)return;if(warning)notify(warning);target=await platform.createTarget(platform.name==='H5'?'preview-host':'poster-preview',600,840,true,scope);if(!alive){target.destroy();return}unbind=platform.bindDrag(target,drag);ready.value=true;draw()}catch(e){fail(e)}finally{initializing.value=false}}
async function editText(field:Field,event:any){
 const raw=String(event.detail.value),limited=limitText(raw,limits[field])
 work.text[field]=limited;inputValues[field]=raw
 if(raw!==limited){
  // First acknowledge the native value, then sync the grapheme-safe limit.
  // A same-tick assignment can leave uni-input's internal native value stale.
  await nextTick();inputValues[field]=work.text[field]
  notify(`${fields.find(f=>f.key===field)!.label}最多 ${limits[field]} 个字符，已保留限制内文字`)
 }
}
async function choose(slot:string){if(!target||busy.value)return;loading.value=true;const version=++requestVersion;try{const photo=await platform.choosePhoto(target);if(!photo)return;if(!alive||version!==requestVersion){photo.dispose();return}const old=work.photos[slot];photos.set(photo.id,markRaw(photo));work.photos[slot]={assetId:photo.id,crop:{zoom:1,x:.5,y:.5}};if(old){photos.get(old.assetId)?.dispose();photos.delete(old.assetId)}selected.value=slot;notify('照片已放入。点击“裁剪”可调整构图。')}catch(e){fail(e)}finally{loading.value=false}}
function remove(slot:string){if(busy.value)return;const old=work.photos[slot];work.photos[slot]=null;if(old){photos.get(old.assetId)?.dispose();photos.delete(old.assetId)}if(selected.value===slot)cropOpen.value=false}
function openCrop(slot:string){selected.value=slot;cropOpen.value=true;if(target)setCropMode(target,true)}
function updateCrop(key:keyof Crop,value:number){const p=work.photos[selected.value];if(p&&!busy.value)p.crop=normalizeCrop({...p.crop,[key]:value})}
function centerCrop(){const p=work.photos[selected.value];if(p)p.crop={zoom:1,x:.5,y:.5}}
function drag(dx:number,dy:number){if(!cropOpen.value||busy.value)return;const photo=selectedPhoto.value,binding=work.photos[selected.value],slot=slots.find(s=>s.binding===selected.value);if(!photo||!binding||!slot)return;const rad=-slot.rotation*Math.PI/180;binding.crop=panCrop(binding.crop,photo.width,photo.height,slot.width-32,slot.height-75,dx*Math.cos(rad)-dy*Math.sin(rad),dx*Math.sin(rad)+dy*Math.cos(rad))}
let lastTouch:{x:number;y:number}|null=null
function touchStart(e:any){if(cropOpen.value){const p=e.touches?.[0];if(p)lastTouch={x:p.x??p.clientX,y:p.y??p.clientY}}}
function touchMove(e:any){const p=e.touches?.[0];if(!p||!lastTouch)return;const x=p.x??p.clientX,y=p.y??p.clientY;const width=mpPreviewWidth;drag((x-lastTouch.x)*1000/width,(y-lastTouch.y)*1000/width);lastTouch={x,y}}
function touchEnd(){lastTouch=null}
const confirm=(title:string,content:string)=>new Promise<boolean>(resolve=>uni.showModal({title,content,confirmText:'确认',cancelText:'取消',success:r=>resolve(r.confirm),fail:()=>resolve(false)}))
async function reset(){if(busy.value||!await confirm('重置当前作品？','将清空四张照片并恢复默认文字和配色，此操作不可撤销。'))return;for(const p of photos.values())p.dispose();photos.clear();Object.assign(work,createWork(journey));Object.assign(inputValues,work.text);cropOpen.value=false;notify('已重置，可以开始新的旅程。')}
async function exportWork(){
 if(busy.value||!ready.value)return
 exporting.value=true;let output:Target|undefined
 try{
  if(photoCount.value<4&&!await confirm('有照片槽位尚未填满',`当前有 ${4-photoCount.value} 个空槽位，将保留占位样式。是否继续导出？`))return
  cropOpen.value=false;const warning=await platform.prepareFonts();if(warning)notify(warning)
  output=await platform.createTarget('poster-export',resolution.value,Math.round(resolution.value*1.4),false,scope)
  drawPoster(output.ctx,journey,work,photos,output.width)
  const generated=await platform.exportJPEG(output)
  if(!alive){generated.dispose();return}
  result.value?.dispose();result.value=markRaw(generated);saveHint.value=warning ? warning+'；桌面端可下载，手机可长按保存。' : '桌面端可下载；手机或微信内可长按图片保存。';notify(warning ? '图片已生成。'+warning : '图片已生成，请检查后保存。')
 }catch(e){fail(e)}finally{output?.destroy();exporting.value=false}
}
async function save(){if(!result.value||saving.value)return;saving.value=true;try{saveHint.value=await platform.save(result.value)}catch(e){fail(e);saveHint.value=e instanceof Error?e.message:'保存失败，可重试'}finally{saving.value=false}}
function closeResult(){if(saving.value)return;result.value?.dispose();result.value=null}
onMounted(initialize)
onBeforeUnmount(()=>{alive=false;requestVersion++;cancelFrame();unbind();target?.destroy();result.value?.dispose();for(const photo of photos.values())photo.dispose();photos.clear();platform.dispose()})
</script>
<style scoped>
.app-shell{max-width:1440px;margin:0 auto;padding:0 48px}.topbar{height:96px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dedfd4}.brand{display:flex;align-items:center;gap:12px}.brand-mark{width:42px;height:42px;background:#e4e9db;border-radius:50%;font-size:30px;text-align:center;color:#526c58;line-height:40px}.brand-name{font-size:26px;letter-spacing:5px;font-weight:650}.brand-en{display:block;font-size:10px;letter-spacing:2px;color:#64715f}.top-note{font-size:14px;color:#6e7568}.prototype{font-size:12px;border:1px solid #d5d9ce;border-radius:4px;padding:5px 10px;color:#64715f}.intro{display:flex;justify-content:space-between;align-items:flex-end;padding:40px 0 32px;gap:24px}.eyebrow{font-size:11px;letter-spacing:2.2px;color:#707b64}.intro-title{font-size:32px;letter-spacing:1px;font-weight:600;margin:8px 0 10px}.intro-sub{font-size:15px;color:#6e7568}.privacy{font-size:12px;color:#526c58;white-space:nowrap;padding-bottom:4px}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 392px;gap:28px;align-items:start}.preview-panel{background:#e9eae0;border:1px solid #dfe2d4;border-radius:12px;padding:20px 24px 16px;position:sticky;top:20px}.preview-toolbar,.preview-footer{display:flex;align-items:center;justify-content:space-between;gap:10px}.section-label{font-size:16px;font-weight:600}.preview-tag{font-size:12px;color:#59644f}.poster-wrap{max-width:490px;margin:24px auto;position:relative}.poster-host{width:100%;aspect-ratio:5/7;box-shadow:0 4px 8px #3d4a3712,0 16px 38px #3d4a3720;background:#f8f3e6}.poster-host.is-cropping{outline:3px solid #788d62;outline-offset:5px}.mp-preview{width:100%;height:100%}.preview-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#f8f3e6}.preview-footer{font-size:12px;color:#5c6655;min-height:24px}.editor-panel{background:#fffefa;border:1px solid #e1e1d7;border-radius:12px;padding:16px 24px 24px}.panel-heading{display:flex;justify-content:space-between;align-items:center;padding-bottom:8px}.text-button{background:transparent;color:#526c58;font-size:14px;padding:8px;line-height:28px;min-height:44px;min-width:44px}.editor-section{padding:20px 0;border-top:1px solid #ecece3}.step-title{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;margin-bottom:14px}.step-number{font-size:11px;width:23px;height:23px;line-height:23px;text-align:center;border:1px solid #d6ddcf;color:#62735d;border-radius:50%;font-weight:500}.step-detail{margin-left:auto;font-size:12px;color:#6b7463;font-weight:400}.field{margin-top:14px}.field-heading{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;color:#58624f}.counter{font-size:11px;color:#6e7568}.field input{background:#f8f8f1;border:1px solid #e2e4d7;border-radius:6px;padding:10px 12px;height:44px;color:#343c36;font-size:14px;width:100%}.helper{font-size:12px;color:#68705f;display:block;line-height:1.6}.photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.photo-card{border-radius:6px;border:1px solid #e1e4d7;overflow:hidden}.photo-card.selected{border:2px solid #526c58}.photo-picker{border-radius:0;height:104px;width:100%;padding:0;position:relative;background:#f3f4eb;display:block}.photo-thumb{width:100%;height:104px}.photo-empty{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#5e7055;font-size:12px;gap:2px}.photo-plus{font-size:25px;font-weight:300}.photo-index{position:absolute;top:6px;left:7px;background:#fffdf2e6;border-radius:3px;color:#56634b;font-size:10px;padding:1px 5px;line-height:18px}.photo-actions{display:flex;border-top:1px solid #e1e4d7}.photo-actions button{flex:1;font-size:12px;line-height:44px;min-height:44px;border-radius:0;background:#fffdf7;color:#50604a;padding:0 6px}.photo-actions button+button{border-left:1px solid #e1e4d7}.crop-panel{margin-top:14px;padding:12px;background:#f2f4eb;border-radius:8px;border:1px solid #dfe4d5}.crop-heading{display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:600}.palettes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.palette{position:relative;border:1px solid #e1e4d7;background:#fffefa;min-height:76px;padding:12px 6px 8px;font-size:11px;line-height:20px;color:#56614e}.palette.active{border:2px solid #617858;background:#f3f5ed;padding:11px 5px 7px}.swatches{display:flex;justify-content:center;margin-bottom:5px}.swatches view{width:18px;height:18px;border-radius:50%;margin-left:-3px;border:1px solid #ffffffa6}.palette-check{position:absolute;right:4px;top:0;font-size:11px}.export-section{border-top:1px solid #e5e5d9;padding-top:20px}.export-heading{display:flex;justify-content:space-between;font-size:12px;color:#67715e;margin-bottom:10px}.resolution{display:flex;gap:8px;margin-bottom:14px}.resolution button{font-size:11px;padding:6px;min-height:44px;line-height:18px;flex:1;background:#f7f7f0;color:#5f6856;border:1px solid #e3e4d9}.resolution button.active{border-color:#819371;color:#435b3d;background:#edf1e6}.primary{background:#3f5a45;color:#fffef8;border:1px solid #3f5a45;padding:12px 16px;font-size:15px;min-height:48px;line-height:24px}.primary:hover{background:#334d38}.export-button{width:100%;font-weight:500;letter-spacing:.4px}.export-hint{display:block;text-align:center;font-size:10px;color:#65705d;margin-top:10px}.secondary{background:#fffefa;color:#3f5a45;font-size:14px;padding:10px}.notice{position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;background:#eef4e8;border:1px solid #b8c6ac;box-shadow:0 4px 24px #29382516;border-radius:10px;padding:8px 12px 8px 20px;max-width:calc(100vw - 32px);width:max-content;font-size:14px}.notice.error{background:#fff0e7;border-color:#d9ab91;color:#733f27}.notice text{max-width:640px}.footer{display:flex;justify-content:space-between;padding:32px 0;font-size:12px;color:#66705d;gap:16px}.modal-mask{position:fixed;inset:0;background:#293528a6;z-index:100;display:flex;align-items:center;justify-content:center;padding:24px}.result-modal{width:470px;max-width:100%;max-height:94vh;border-radius:12px;background:#fffdf8;padding:20px;display:flex;flex-direction:column;gap:12px}.result-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.result-scroll{overflow:auto;min-height:0;flex:1;background:#e8eadd;padding:12px;text-align:center}.result-image{width:100%;display:block}.save-hint{font-size:13px;color:#5d6b56}.export-canvas{position:fixed;left:-10000px;top:0;width:1000px;height:1400px;pointer-events:none}
@media(min-width:1400px){.poster-wrap{max-width:520px}}
@media(max-width:1000px){.app-shell{padding:0 24px}.workspace{grid-template-columns:minmax(0,1fr) 350px;gap:20px}.intro-title{font-size:27px}.privacy{display:none}.editor-panel{padding:16px 18px 20px}.preview-panel{padding:16px}.preview-tag{display:none}.preview-footer{font-size:11px}}
@media(max-width:740px){.app-shell{padding:0 16px}.topbar{height:76px}.top-note{display:none}.brand-name{font-size:23px}.intro{padding:24px 0}.intro-title{font-size:25px;letter-spacing:0}.intro-sub{font-size:13px}.eyebrow{font-size:10px}.workspace{grid-template-columns:1fr;gap:20px}.preview-panel{position:static;padding:14px 16px}.poster-wrap{margin:18px auto;max-width:420px}.preview-tag{display:block;font-size:10px}.preview-footer{font-size:10px}.editor-panel{padding:16px 20px 20px}.photo-picker,.photo-thumb{height:116px}.field-heading{font-size:14px}.field input{font-size:16px}.palette{font-size:12px}.helper{font-size:13px}.export-hint{font-size:11px}.footer{flex-direction:column;font-size:11px;padding:24px 0;gap:6px}.notice{bottom:12px;width:calc(100% - 24px);font-size:13px;padding:8px 10px 8px 14px;gap:8px}.modal-mask{padding:12px}.result-modal{max-height:92vh;padding:16px}.resolution button{font-size:12px}}
</style>
