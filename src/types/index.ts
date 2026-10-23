export interface Crop { zoom:number; x:number; y:number }
export type Field = 'title'|'subtitle'|'date'
export interface Photo { id:string; source:unknown; width:number; height:number; thumbnail:string; dispose:()=>void }
export interface Work { dataVersion:1; templateId:string; templateVersion:number; paletteId:string; text:Record<Field,string>; photos:Record<string,{assetId:string;crop:Crop}|null> }
export interface Palette {id:string; name:string; paper:string; ink:string; accent:string; soft:string; tape:string}
export interface BaseLayer {id:string; x:number;y:number;width:number;height:number;rotation:number;opacity:number}
export type Layer = BaseLayer & (
 {type:'background'} | {type:'shape';shape:'route'|'leaf'|'stamp'|'line'} |
 {type:'image';assetId:string} |
 {type:'photo';binding:string;radius:number;caption:string} |
 {type:'text';binding:Field;fontSize:number;minFontSize:number;weight:string;align:'left'|'center'|'right';lineHeight:number;maxLines:number;overflow:'ellipsis';color:'ink'|'accent'} )
export interface Template {id:string;version:number;name:string;width:number;height:number;preview:{width:number;height:number};defaultPalette:string;palettes:Palette[];layers:Layer[]}
// Structural subset shared by browser Canvas 2D and WeChat Canvas node; no DOM dependency.
export interface DrawContext {
 fillStyle:any;strokeStyle:any;globalAlpha:number;lineWidth:number;font:string;textAlign:any;textBaseline:any;
 save():void;restore():void;scale(x:number,y:number):void;translate(x:number,y:number):void;rotate(r:number):void;
 fillRect(x:number,y:number,w:number,h:number):void;strokeRect(x:number,y:number,w:number,h:number):void;
 clearRect(x:number,y:number,w:number,h:number):void;beginPath():void;moveTo(x:number,y:number):void;lineTo(x:number,y:number):void;
 bezierCurveTo(a:number,b:number,c:number,d:number,e:number,f:number):void;quadraticCurveTo(a:number,b:number,c:number,d:number):void;
 arc(x:number,y:number,r:number,s:number,e:number):void;closePath():void;fill():void;stroke():void;clip():void;
 setLineDash(v:number[]):void;measureText(s:string):{width:number};fillText(s:string,x:number,y:number):void;
 drawImage(image:any,...args:number[]):void;
}
export interface Target {ctx:DrawContext; width:number;height:number;native:unknown;destroy():void}
export interface ExportResult {url:string; width:number;height:number;dispose():void}
export interface Platform {
 name:string;createTarget(id:string,width:number,height:number,preview:boolean,scope?:unknown):Promise<Target>;
 choosePhoto(target:Target):Promise<Photo|null>; prepareFonts():Promise<string|null>;
 exportJPEG(target:Target):Promise<ExportResult>;save(result:ExportResult):Promise<string>;
 bindDrag(target:Target,fn:(dx:number,dy:number)=>void):()=>void;
 schedule(fn:()=>void):()=>void; dispose():void;
}
