/** Pure local pixel processing. No models, network calls or semantic subject recognition. */
export interface Point {x:number;y:number}
export interface BrushStroke {mode:'erase'|'restore';radius:number;points:Point[]}
export interface CutoutRecipe {version:1;mode:'auto'|'polygon'|'original';tolerance:number;cartoon:number;outline:number;polygon:Point[];background:Point[];strokes:BrushStroke[]}
export const defaultRecipe=():CutoutRecipe=>({version:1,mode:'auto',tolerance:22,cartoon:65,outline:4,polygon:[],background:[],strokes:[]})
export function validateRecipe(r:unknown):r is CutoutRecipe{
 const a=r as CutoutRecipe,finite=(v:number,lo:number,hi:number)=>Number.isFinite(v)&&v>=lo&&v<=hi,point=(p:Point)=>!!p&&finite(p.x,0,1)&&finite(p.y,0,1)
 return !!a&&a.version===1&&['auto','polygon','original'].includes(a.mode)&&finite(a.tolerance,0,100)&&finite(a.cartoon,0,100)&&finite(a.outline,1,10)&&Array.isArray(a.polygon)&&a.polygon.length<=128&&a.polygon.every(point)&&(a.mode!=='polygon'||a.polygon.length>=3)&&Array.isArray(a.background)&&a.background.length<=32&&a.background.every(point)&&Array.isArray(a.strokes)&&a.strokes.length<=100&&a.strokes.reduce((n,s)=>n+(s?.points?.length||0),0)<=16000&&a.strokes.every(s=>s&&['erase','restore'].includes(s.mode)&&finite(s.radius,.002,.2)&&Array.isArray(s.points)&&s.points.length>0&&s.points.length<=2048&&s.points.every(point))
}
export interface Pixels {data:Uint8ClampedArray;width:number;height:number}
const clamp=(x:number,lo=0,hi=255)=>Math.max(lo,Math.min(hi,x))
function checkImage(p:Pixels){if(!Number.isInteger(p.width)||!Number.isInteger(p.height)||p.width<1||p.height<1||p.width*p.height>768*768||p.data.length!==p.width*p.height*4)throw new Error('处理图片尺寸无效或超过 768 像素工作画布')}
function polygonMask(w:number,h:number,points:Point[]){const mask=new Uint8ClampedArray(w*h);for(let y=0;y<h;y++){const scan=(y+.5)/h,xs:number[]=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[j],b=points[i];if((a.y>scan)!==(b.y>scan))xs.push((a.x+(scan-a.y)*(b.x-a.x)/(b.y-a.y))*w)}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2){const from=Math.max(0,Math.ceil(xs[k]-.5)),to=Math.min(w,Math.ceil(xs[k+1]-.5));mask.fill(255,y*w+from,y*w+to)}}return mask}
function flood(p:Pixels,mask:Uint8ClampedArray,seeds:number[],colors:number[][],tolerance:number){
 const {width:w,height:h,data:d}=p,n=w*h,seen=new Uint8Array(n),q=new Int32Array(n),limit=(tolerance*2.2+5)**2;let head=0,tail=0
 const match=(i:number)=>{const j=i*4;if(d[j+3]<16)return true;return colors.some(c=>(d[j]-c[0])**2+(d[j+1]-c[1])**2+(d[j+2]-c[2])**2<=limit)}
 const push=(i:number)=>{if(!seen[i]){seen[i]=1;if(match(i)){q[tail++]=i;mask[i]=0}}}
 for(const i of seeds)push(i)
 while(head<tail){const i=q[head++],x=i%w;if(x)push(i-1);if(x<w-1)push(i+1);if(i>=w)push(i-w);if(i<n-w)push(i+w)}
}
export function createMask(p:Pixels,r:CutoutRecipe):Uint8ClampedArray{
 checkImage(p);if(!validateRecipe(r))throw new Error('抠图编辑参数无效')
 const {width:w,height:h,data:d}=p,n=w*h,mask=r.mode==='polygon'?polygonMask(w,h,r.polygon):new Uint8ClampedArray(n).fill(255)
 if(r.mode==='auto'){
  // Only edge-connected pixels close to corner colours are removed; never claim subject detection.
  const corners=[0,w-1,(h-1)*w,n-1],colors=corners.filter(i=>d[i*4+3]>16).map(i=>[d[i*4],d[i*4+1],d[i*4+2]]),seeds:number[]=[]
  for(let x=0;x<w;x++)seeds.push(x,(h-1)*w+x);for(let y=1;y<h-1;y++)seeds.push(y*w,y*w+w-1)
  flood(p,mask,seeds,colors,r.tolerance)
 }
 for(const point of r.background){const i=Math.min(h-1,Math.floor(point.y*h))*w+Math.min(w-1,Math.floor(point.x*w));flood(p,mask,[i],[[d[i*4],d[i*4+1],d[i*4+2]]],r.tolerance)}
 const disc=(x:number,y:number,radius:number,value:number)=>{const rr=radius*radius;for(let yy=Math.max(0,Math.floor(y-radius));yy<=Math.min(h-1,Math.ceil(y+radius));yy++)for(let xx=Math.max(0,Math.floor(x-radius));xx<=Math.min(w-1,Math.ceil(x+radius));xx++)if((xx-x)**2+(yy-y)**2<=rr)mask[yy*w+xx]=value}
 for(const s of r.strokes){const radius=s.radius*Math.min(w,h);for(let i=0;i<s.points.length;i++){const a=s.points[Math.max(0,i-1)],b=s.points[i],ax=a.x*(w-1),ay=a.y*(h-1),bx=b.x*(w-1),by=b.y*(h-1),steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/Math.max(1,radius*.4)));for(let k=0;k<=steps;k++)disc(ax+(bx-ax)*k/steps,ay+(by-ay)*k/steps,radius,s.mode==='erase'?0:255)}}
 for(let i=0;i<n;i++)mask[i]=Math.round(mask[i]*d[i*4+3]/255)
 return mask
}
export function maskBounds(mask:Uint8ClampedArray,w:number,h:number){let x0=w,y0=h,x1=-1,y1=-1,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);count++}return {x0,y0,x1,y1,count,coverage:count/(w*h)}}
/** Edge-preserving smoothing + colour quantisation + restrained edge ink. Not AI repainting. */
export function cartoonPixels(p:Pixels,strength:number){
 checkImage(p);const {width:w,height:h,data}=p,s=clamp(strength,0,100)/100;if(!s)return data.slice()
 let smooth=data.slice()
 for(let pass=0;pass<2;pass++){const next=smooth.slice();for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;let a=0,b=0,c=0,weight=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=((y+dy)*w+x+dx)*4;if(smooth[j+3]<16)continue;const distance=(smooth[j]-smooth[i])**2+(smooth[j+1]-smooth[i+1])**2+(smooth[j+2]-smooth[i+2])**2,v=1/(1+distance/(1800+2600*s));a+=smooth[j]*v;b+=smooth[j+1]*v;c+=smooth[j+2]*v;weight+=v}if(weight){next[i]=a/weight;next[i+1]=b/weight;next[i+2]=c/weight}}smooth=next}
 const result=smooth.slice(),step=14+26*s,luma=(i:number)=>.299*smooth[i]+.587*smooth[i+1]+.114*smooth[i+2]
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,mean=(smooth[i]+smooth[i+1]+smooth[i+2])/3;let ink=0;if(x>0&&y>0&&x<w-1&&y<h-1){const gx=luma(i+4)-luma(i-4),gy=luma(i+w*4)-luma(i-w*4);ink=clamp((Math.hypot(gx,gy)-24)/160,0,.32)*s}for(let k=0;k<3;k++){const color=mean+(smooth[i+k]-mean)*(1+.12*s),q=Math.round(color/step)*step;result[i+k]=clamp((color*(1-.72*s)+q*.72*s)*(1-ink))}result[i+3]=data[i+3]}
 return result
}
export function composeSticker(p:Pixels,r:CutoutRecipe,mask=createMask(p,r)):Pixels{
 const {width:w,height:h}=p,b=maskBounds(mask,w,h);if(b.count<16)throw new Error('没有足够的主体像素，请补回主体或重新圈选')
 if(b.coverage>.985)throw new Error('背景尚未分离，请先圈选主体或擦除背景，不能直接生成整张相框')
 const border=Math.max(2,Math.round(Math.max(b.x1-b.x0+1,b.y1-b.y0+1)*r.outline/100)),pad=border+8,ow=b.x1-b.x0+1+pad*2,oh=b.y1-b.y0+1+pad*2,n=ow*oh,dist=new Float32Array(n).fill(1e6),alpha=new Uint8ClampedArray(n),out=new Uint8ClampedArray(n*4),colors=cartoonPixels(p,r.cartoon)
 for(let y=b.y0;y<=b.y1;y++)for(let x=b.x0;x<=b.x1;x++){const j=(y-b.y0+pad)*ow+x-b.x0+pad,src=y*w+x;alpha[j]=mask[src];if(mask[src]>32)dist[j]=0}
 for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){const i=y*ow+x;let d=dist[i];if(x)d=Math.min(d,dist[i-1]+1);if(y){d=Math.min(d,dist[i-ow]+1);if(x)d=Math.min(d,dist[i-ow-1]+1.4142);if(x<ow-1)d=Math.min(d,dist[i-ow+1]+1.4142)}dist[i]=d}
 for(let y=oh-1;y>=0;y--)for(let x=ow-1;x>=0;x--){const i=y*ow+x;let d=dist[i];if(x<ow-1)d=Math.min(d,dist[i+1]+1);if(y<oh-1){d=Math.min(d,dist[i+ow]+1);if(x)d=Math.min(d,dist[i+ow-1]+1.4142);if(x<ow-1)d=Math.min(d,dist[i+ow+1]+1.4142)}dist[i]=d}
 for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){const i=y*ow+x,a=clamp(border+.5-dist[i],0,1),j=i*4;out[j]=255;out[j+1]=253;out[j+2]=245;out[j+3]=Math.round(a*255);if(alpha[i]){const sx=x-pad+b.x0,sy=y-pad+b.y0,src=(sy*w+sx)*4,v=alpha[i]/255;for(let k=0;k<3;k++)out[j+k]=Math.round(colors[src+k]*v+out[j+k]*(1-v));out[j+3]=Math.max(out[j+3],alpha[i])}}
 return {data:out,width:ow,height:oh}
}
