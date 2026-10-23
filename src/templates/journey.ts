import type {Template,BaseLayer,Layer} from '../types'
const base=(id:string,x:number,y:number,width:number,height:number,rotation=0):BaseLayer=>({id,x,y,width,height,rotation,opacity:1})
export const journey:Template={
 id:'china-scrapbook',version:2,name:'中国旅行手账 · 地图拼贴',width:1000,height:1340,preview:{width:900,height:1206},defaultPalette:'sage',
 palettes:[
  {id:'sage',name:'鼠尾草',paper:'#faf0df',ink:'#473c30',accent:'#637c65',soft:'#e4ebda',tape:'#e5b66d'},
  {id:'clay',name:'落日陶土',paper:'#faf0df',ink:'#624235',accent:'#ad654a',soft:'#f2d6c4',tape:'#dfaf86'},
  {id:'sea',name:'海盐蓝',paper:'#faf0df',ink:'#354d57',accent:'#507b87',soft:'#d8e7e5',tape:'#d5be88'}
 ],layers:[
  {...base('paper',0,0,1000,1340),type:'background'},
  {...base('title',28,20,540,96),type:'text',binding:'title',fontSize:78,minFontSize:28,weight:'700',align:'left',lineHeight:1.05,maxLines:1,overflow:'ellipsis',color:'ink'},
  {...base('china-map',240,126,715,539.825),type:'image',assetId:'china-static-gs20162923'},
  {...base('scrapbook-panels',0,0,1000,1340),type:'shape',shape:'scrapbook'},
  // Decorative photo locations only, NOT geocoded positions. Keep outer borders/Taiwan/inset unobscured.
  {...base('photo-1',330,310,112,138,-7),type:'photo',binding:'p1',radius:2,caption:'出发',padding:7,captionHeight:43,captionSize:15},
  {...base('photo-2',490,380,112,138,5),type:'photo',binding:'p2',radius:2,caption:'沿途',padding:7,captionHeight:43,captionSize:15},
  {...base('photo-3',610,443,112,138,-4),type:'photo',binding:'p3',radius:2,caption:'片刻',padding:7,captionHeight:43,captionSize:15},
  {...base('photo-4',834,320,112,138,6),type:'photo',binding:'p4',radius:2,caption:'收藏',padding:7,captionHeight:43,captionSize:15}
 ] as Layer[]
}
