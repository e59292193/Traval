import type {Layer} from '../types'
export type PhotoLayer=Extract<Layer,{type:'photo'}>
export function photoBox(layer:PhotoLayer){const padding=layer.padding??16;return {x:padding,y:padding,width:layer.width-2*padding,height:layer.height-(layer.captionHeight??75)}}
