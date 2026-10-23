<template><view class="range-row"><view class="range-label"><text>{{ label }}</text><text>{{ display ?? modelValue }}</text></view><slider :aria-label="label" :value="modelValue" :min="min" :max="max" :step="step ?? 1" activeColor="#526c58" backgroundColor="#e4e7de" block-color="#526c58" :block-size="20" @changing="change" @change="change" /></view></template>
<script setup lang="ts">
defineProps<{label:string;modelValue:number;min:number;max:number;step?:number;display?:string}>()
const emit=defineEmits<{(e:'update:modelValue',value:number):void}>()
function change(e:any){emit('update:modelValue',Number(e.detail.value))}
</script>
<style scoped>.range-label{display:flex;justify-content:space-between;font-size:14px;color:#526051}.range-row{margin-top:12px}slider{margin:12px 2px 8px;min-height:28px}</style>
