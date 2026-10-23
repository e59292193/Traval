<template>
 <view class="magnet-studio">
  <view class="magnet-title"><view><text class="magnet-eyebrow">PHOTO SOUVENIRS</text><view class="magnet-heading">制作我的冰箱贴</view></view><text class="magnet-count">{{ magnets.length }} / {{ max }}</text></view>
  <text class="magnet-helper">把喜欢的照片变成小小纪念品。白边、圆角与立体质感，留在手账的“我的冰箱贴”区域。</text>
  <button class="magnet-upload" :disabled="busy||!ready||!!draft||magnets.length>=max" @click="$emit('upload')">＋ 上传图片制作冰箱贴</button>
  <text class="magnet-helper">JPEG / PNG / WebP · 单张不超过 15 MB · 本地处理，不上传。保留图片背景，不是 AI 抠图。</text>
  <view v-if="draft" class="magnet-maker">
   <view class="magnet-maker-title">{{ editing ? '调整冰箱贴' : '冰箱贴效果预览' }}</view>
   <view class="magnet-display"><MagnetPreview :magnet="draft" :photo="draftPhoto" /></view>
   <view class="magnet-styles"><button v-for="s in styles" :key="s.id" :aria-pressed="draft.style===s.id" :class="{active:draft.style===s.id}" :disabled="busy" @click="update({...draft,style:s.id})">{{ s.name }}</button></view>
   <RangeControl label="冰箱贴缩放" :model-value="Math.round(draft.crop.zoom*100)" :min="100" :max="300" :display="draft.crop.zoom.toFixed(2)+'×'" @update:model-value="crop('zoom',$event/100)"/>
   <RangeControl label="冰箱贴水平位置" :model-value="Math.round(draft.crop.x*100)" :min="0" :max="100" :display="Math.round(draft.crop.x*100)+'%'" @update:model-value="crop('x',$event/100)"/>
   <RangeControl label="冰箱贴垂直位置" :model-value="Math.round(draft.crop.y*100)" :min="0" :max="100" :display="Math.round(draft.crop.y*100)+'%'" @update:model-value="crop('y',$event/100)"/>
   <view class="magnet-maker-actions"><button :disabled="busy" @click="update({...draft,crop:{zoom:1,x:.5,y:.5}})">恢复居中</button><button :disabled="busy" @click="$emit('cancel')">取消</button></view>
   <button class="magnet-add" :disabled="busy" @click="$emit('commit')">{{ editing ? '保存冰箱贴调整' : '加入冰箱贴区域' }}</button>
   <text class="magnet-helper">{{ editing ? '保存后更新手账；取消保留原来的样式。' : '点击加入后才会放入手账，未加入的预览不会导出或保存到草稿。' }}</text>
  </view>
  <view v-if="magnets.length" class="magnet-collection">
   <view v-for="(m,i) in magnets" :key="m.id" class="magnet-item">
    <view class="magnet-mini"><MagnetPreview :magnet="m" :photo="photos.get(m.assetId)" :label="`冰箱贴${i+1}`"/></view><text class="magnet-item-label">冰箱贴 {{ String(i+1).padStart(2,'0') }}</text>
    <view class="magnet-item-actions"><button :disabled="busy||!!draft" :aria-label="`调整冰箱贴${i+1}`" @click="$emit('edit',m.id)">调整</button><button :disabled="busy||!!draft" :aria-label="`移除冰箱贴${i+1}`" @click="$emit('remove',m.id)">移除</button></view>
    <view class="magnet-item-actions"><button :disabled="busy||!!draft||i===0" :aria-label="`前移冰箱贴${i+1}`" @click="$emit('move',i,-1)">← 前移</button><button :disabled="busy||!!draft||i===magnets.length-1" :aria-label="`后移冰箱贴${i+1}`" @click="$emit('move',i,1)">后移 →</button></view>
   </view>
  </view>
  <text class="magnet-helper magnet-bottom">{{ magnets.length>=max?'已放满 8 枚，可调整或移除后重新制作。':'最多放入 8 枚，按顺序替换区域里的装饰贴；空位保留原装饰。' }} 已加入的冰箱贴随手账导出；H5 可通过“保存本地草稿”保留。</text>
 </view>
</template>
<script setup lang="ts">
import type {Magnet,Photo,Crop} from '../types'
import {MAX_MAGNETS as max,magnetStyles as styles} from '../core/magnets'
import RangeControl from './RangeControl.vue'
import MagnetPreview from './MagnetPreview.vue'
const props=defineProps<{magnets:Magnet[];photos:Map<string,Photo>;draft:Magnet|null;draftPhoto?:Photo;editing:boolean;busy:boolean;ready:boolean}>()
const emit=defineEmits<{(e:'upload'):void;(e:'update',m:Magnet):void;(e:'commit'):void;(e:'cancel'):void;(e:'edit',id:string):void;(e:'remove',id:string):void;(e:'move',index:number,direction:number):void}>()
function update(m:Magnet){emit('update',m)}
function crop(key:keyof Crop,value:number){if(props.draft)update({...props.draft,crop:{...props.draft.crop,[key]:value}})}
</script>
<style scoped>
.magnet-studio{padding:24px 0;border-top:1px solid #ecece3}.magnet-title{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:12px}.magnet-eyebrow{font-size:14px;letter-spacing:1px;color:#62735d}.magnet-heading{font-size:18px;font-weight:600;margin-top:4px}.magnet-count{font-size:14px;color:#526c58}.magnet-helper{display:block;font-size:14px;color:#626c5a;line-height:1.65}.magnet-upload{width:100%;min-height:48px;line-height:24px;font-size:14px;color:#3f5a45;background:#eef2e7;border:1px solid #a7b59b;padding:12px;margin:16px 0 10px}.magnet-maker{background:#f3f4eb;border:1px solid #d9dfce;border-radius:8px;margin-top:16px;padding:16px}.magnet-maker-title{font-size:15px;font-weight:600}.magnet-display{width:180px;margin:24px auto 28px}.magnet-styles{display:grid;grid-template-columns:1fr 1fr;gap:8px}.magnet-styles button,.magnet-maker-actions button,.magnet-item-actions button{min-height:44px;line-height:22px;padding:10px 4px;font-size:14px;color:#526c58;background:#fffdf7;border:1px solid #dce1d2}.magnet-styles .active{border:2px solid #617858;background:#e8eedf;padding:9px 3px}.magnet-maker-actions{display:flex;justify-content:space-between;gap:8px;margin-top:8px}.magnet-maker-actions button{flex:1}.magnet-add{margin:12px 0 10px;min-height:48px;line-height:24px;padding:12px 6px;background:#3f5a45;color:#fffdf7;font-size:14px}.magnet-collection{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:20px}.magnet-item{min-width:0;background:#faf8ef;border:1px solid #e1dfd0;border-radius:8px;padding:12px 8px 8px}.magnet-mini{width:88px;margin:2px auto 14px}.magnet-item-label{display:block;text-align:center;font-size:14px;margin-bottom:10px;color:#526051}.magnet-item-actions{display:flex;gap:4px;margin-top:4px}.magnet-item-actions button{flex:1;min-width:0;font-size:14px;padding:10px 0}.magnet-bottom{margin-top:16px}button[disabled]{opacity:.5}button:focus-visible{outline:3px solid #617858;outline-offset:2px}
</style>
