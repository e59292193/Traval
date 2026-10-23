<template><view class="magnet-preview" :class="{'round':magnet.style==='round'}"><view class="magnet-window"><image v-if="photo" :src="photo.thumbnail" :style="imageStyle" mode="scaleToFill" :aria-label="label||'自制照片冰箱贴'"/><view class="magnet-shine"/></view></view></template>
<script setup lang="ts">
import {computed} from 'vue'
import type {Magnet,Photo} from '../types'
import {cropRect} from '../core/crop'
const props=defineProps<{magnet:Magnet;photo?:Photo;label?:string}>()
const imageStyle=computed(()=>{const p=props.photo;if(!p)return {};const b=cropRect(p.width,p.height,100,100,props.magnet.crop);return {width:p.width/b.sw*100+'%',height:p.height/b.sh*100+'%',left:-b.sx/b.sw*100+'%',top:-b.sy/b.sh*100+'%'}})
</script>
<style scoped>
.magnet-preview{width:100%;aspect-ratio:1;border-radius:18%;padding:8.5%;background:#fffdf4;border:1px solid #e9dfc9;box-shadow:0 3px 0 #b8ad98,2px 7px 8px #443b3026;box-sizing:border-box}.magnet-window{position:relative;width:100%;height:100%;border-radius:18%;overflow:hidden;background:#f7f1e3}.magnet-window image{position:absolute;max-width:none}.magnet-preview.round,.round .magnet-window{border-radius:50%}.magnet-shine{position:absolute;inset:0;background:linear-gradient(145deg,#ffffff1c 0%,#ffffff1c 35%,transparent 35%);pointer-events:none}
</style>
