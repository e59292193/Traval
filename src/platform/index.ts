import type {Platform,Target} from '../types'
// #ifdef H5
import {createH5Platform,setCropMode as h5Crop} from './h5'
// #endif
// #ifdef MP-WEIXIN
import {createWeixinPlatform,setCropMode as wxCrop} from './weixin'
// #endif
export function createPlatform():Platform {
 // #ifdef H5
 return createH5Platform()
 // #endif
 // #ifdef MP-WEIXIN
 return createWeixinPlatform()
 // #endif
}
export function setCropMode(target:Target,active:boolean){
 // #ifdef H5
 h5Crop(target,active)
 // #endif
 // #ifdef MP-WEIXIN
 wxCrop(target,active)
 // #endif
}
