import type {StyleSpecification,ExpressionSpecification} from 'maplibre-gl'
import baseStyle from '../data/map-style.json'
// Change only this geographic label, not city names or substrings such as 台湾海峡.
export const chineseMapName:ExpressionSpecification=['case',['any',['in',['get','name:zh'],['literal',['台湾','臺灣','台灣','台湾省','臺灣省','台灣省']]],['in',['get','name'],['literal',['台湾','臺灣','台灣','Taiwan']]],['all',['==',['get','class'],'country'],['==',['get','iso_a2'],'TW']]],'台湾省',['coalesce',['get','name:zh'],['get','name'],['get','name:latin']]]
export function travelBaseStyle():StyleSpecification{
 const s=JSON.parse(JSON.stringify(baseStyle)) as StyleSpecification
 for(const l of s.layers){
  if(l.type==='background')l.paint={'background-color':'#f8f3e8'}
  if(l.type==='fill'&&l.id==='water')l.paint={...l.paint,'fill-color':'#cce1e2'}
  if(l.type==='symbol'&&l.layout?.['text-field']&&!/shield/.test(l.id))l.layout['text-field']=chineseMapName
 }
 return s
}
