import type {Template,BaseLayer,Layer} from '../types'
const base=(id:string,x:number,y:number,width:number,height:number,rotation=0):BaseLayer=>({id,x,y,width,height,rotation,opacity:1})
export const journey:Template={
 id:'one-journey',version:1,name:'沿途 · 单次旅行纪念',width:1000,height:1400,preview:{width:600,height:840},defaultPalette:'sage',
 palettes:[
  {id:'sage',name:'鼠尾草',paper:'#f8f3e6',ink:'#384c43',accent:'#64785c',soft:'#e3e7d7',tape:'#d4bd8b'},
  {id:'clay',name:'落日陶土',paper:'#faf0e6',ink:'#614338',accent:'#a75e43',soft:'#f0d9c9',tape:'#d4ae8c'},
  {id:'sea',name:'海盐蓝',paper:'#f0f3ef',ink:'#324e59',accent:'#507b87',soft:'#d6e5e5',tape:'#c6c6a1'}
 ],layers:[
  {...base('paper',0,0,1000,1400),type:'background'},
  {...base('header-rule',76,108,848,4),type:'shape',shape:'line'},
  {...base('title',80,146,840,170),type:'text',binding:'title',fontSize:72,minFontSize:46,weight:'600',align:'center',lineHeight:1.22,maxLines:2,overflow:'ellipsis',color:'ink'},
  {...base('subtitle',110,327,780,64),type:'text',binding:'subtitle',fontSize:29,minFontSize:23,weight:'400',align:'center',lineHeight:1.35,maxLines:2,overflow:'ellipsis',color:'accent'},
  {...base('route',130,400,740,700),type:'shape',shape:'route'},
  {...base('photo-1',96,427,378,337,-5),type:'photo',binding:'p1',radius:3,caption:'01 / 出发的心情'},
  {...base('photo-2',531,458,378,337,5),type:'photo',binding:'p2',radius:3,caption:'02 / 遇见的风景'},
  {...base('photo-3',98,842,378,337,3),type:'photo',binding:'p3',radius:3,caption:'03 / 留住的片刻'},
  {...base('photo-4',526,865,378,337,-4),type:'photo',binding:'p4',radius:3,caption:'04 / 下次再见'},
  {...base('leaf',800,1160,130,130,-15),type:'shape',shape:'leaf'},
  {...base('stamp',66,1220,130,100,-10),type:'shape',shape:'stamp'},
  {...base('date',240,1250,520,65),type:'text',binding:'date',fontSize:26,minFontSize:22,weight:'400',align:'center',lineHeight:1.3,maxLines:2,overflow:'ellipsis',color:'accent'}
 ] as Layer[]
}
