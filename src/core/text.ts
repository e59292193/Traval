export const limits={title:24,subtitle:40,date:30,name:12,wish:24,note:60} as const
export function graphemes(text:string):string[]{
 if(typeof Intl!=='undefined'&&'Segmenter' in Intl) return Array.from(new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(text),s=>s.segment)
 // Older runtimes: preserve combining marks, variation selectors, emoji modifiers and ZWJ sequences.
 const out:string[]=[]; let join=false
 for(const ch of Array.from(text)){if(out.length&&(join||/\p{Mark}|[\uFE0E\uFE0F\u200D]|[\u{1F3FB}-\u{1F3FF}]/u.test(ch)))out[out.length-1]+=ch;else out.push(ch);join=ch==='\u200D'}
 return out
}
export const limitText=(text:string,max:number)=>graphemes(text).slice(0,max).join('')
export function wrapText(text:string,maxWidth:number,maxLines:number,measure:(s:string)=>number):string[]{
 const lines:string[]=[];let line='',truncated=false
 for(const char of graphemes(text)){
  if(char==='\n'||(line&&measure(line+char)>maxWidth)){
   lines.push(line); line=''
   if(lines.length===maxLines){truncated=true;break}
   if(char==='\n')continue
  }
  line+=char
 }
 if(lines.length<maxLines)lines.push(line)
 if(truncated){let last=lines[maxLines-1];while(last&&measure(last+'…')>maxWidth)last=graphemes(last).slice(0,-1).join('');lines[maxLines-1]=last+'…'}
 return lines
}
export function fitText(text:string,width:number,maxLines:number,size:number,min:number,measure:(s:string,size:number)=>number){
 let fontSize=size,lines=wrapText(text,width,999,s=>measure(s,fontSize))
 while(fontSize>min&&lines.length>maxLines){fontSize=Math.max(min,fontSize-2);lines=wrapText(text,width,999,s=>measure(s,fontSize))}
 return {fontSize,lines:wrapText(text,width,maxLines,s=>measure(s,fontSize))}
}
