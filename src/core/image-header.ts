export const MAX_FILE_BYTES=15*1024*1024
export const MAX_IMAGE_PIXELS=40_000_000
export interface ImageHeader {width:number;height:number;format:'jpeg'|'png'|'webp';orientation:number}
export function readImageHeader(bytes:Uint8Array):ImageHeader {
 const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength)
 const str=(i:number,n:number)=>String.fromCharCode(...bytes.slice(i,i+n))
 let width=0,height=0,format:ImageHeader['format']='jpeg',orientation=1
 if(bytes.length<12)throw new Error('图片文件不完整，请重新选择')
 if(bytes[0]===137&&str(1,3)==='PNG'){
  if(bytes.length<24||str(12,4)!=='IHDR')throw new Error('PNG 文件损坏')
  width=d.getUint32(16);height=d.getUint32(20);format='png'
 }else if(str(0,4)==='RIFF'&&str(8,4)==='WEBP'){
  format='webp';const kind=str(12,4)
  if(kind==='VP8X'&&bytes.length>=30){width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16)}
  else if(kind==='VP8 '&&bytes.length>=30){width=d.getUint16(26,true)&0x3fff;height=d.getUint16(28,true)&0x3fff}
  else if(kind==='VP8L'&&bytes.length>=25){const bits=d.getUint32(21,true);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1}
  else throw new Error('暂不支持此 WebP 编码，请转换为 JPEG 或 PNG')
 }else if(bytes[0]===255&&bytes[1]===216){
  let i=2
  while(i+3<bytes.length){
   if(bytes[i]!==255){i++;continue}
   const marker=bytes[i+1];if(marker===255){i++;continue}if(marker===217||marker===218)break
   if(marker===1||(marker>=208&&marker<=215)){i+=2;continue}
   const len=d.getUint16(i+2);if(len<2)break
   const end=i+2+len
   if(end>bytes.length)break
   if(marker===225&&str(i+4,6)==='Exif\0\0'){
    try{const off=i+10,little=str(off,2)==='II',ifd=off+d.getUint32(off+4,little),count=d.getUint16(ifd,little)
     for(let j=0;j<count;j++){const p=ifd+2+j*12;if(p+12>end)break;if(d.getUint16(p,little)===274)orientation=d.getUint16(p+8,little)}
    }catch{orientation=1}
   }
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){height=d.getUint16(i+5);width=d.getUint16(i+7)}
   i=end
  }
 }else throw new Error('仅支持 JPEG、PNG、WebP；HEIC/HEIF 请先转换格式')
 if(!width||!height)throw new Error('无法读取图片尺寸，请换一张 JPEG 或 PNG')
 if(width*height>MAX_IMAGE_PIXELS||Math.max(width,height)>16000)throw new Error('图片像素过大（上限 4000 万像素、单边 16000），请缩小后重试')
 return {width,height,format,orientation}
}
