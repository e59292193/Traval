import {test} from 'node:test'
import assert from 'node:assert/strict'
import {cropRect,normalizeCrop,panCrop} from '../src/core/crop'
import {graphemes,limitText,wrapText,fitText} from '../src/core/text'
import {createWork,validateTemplate} from '../src/core/work'
import {readImageHeader} from '../src/core/image-header'
import {journey} from '../src/templates/journey'
test('cover preserves aspect and fills landscape / portrait / square / panoramic',()=>{
 for(const [iw,ih] of [[1600,900],[900,1600],[1000,1000],[4000,500]])for(const zoom of [1,1.5,3])for(const x of [0,.5,1]){
  const r=cropRect(iw,ih,346,262,{zoom,x,y:1-x})
  assert.ok(r.sx>=0&&r.sy>=0&&r.sx+r.sw<=iw+.001&&r.sy+r.sh<=ih+.001)
  assert.ok(Math.abs(r.sw/r.sh-346/262)<1e-8)
 }
})
test('normalized source crop is independent of render scale',()=>{
 const c={zoom:2,x:.3,y:.9};const a=cropRect(2400,1800,346,262,c),b=cropRect(2400,1800,519,393,c)
 for(const key of ['sx','sy','sw','sh'] as const)assert.ok(Math.abs(a[key]-b[key])<1e-8)
})
test('large drags cannot expose blank edges',()=>{for(const delta of [-10000,0,10000]){const c=panCrop({zoom:2,x:.5,y:.5},1000,1200,346,262,delta,delta);assert.ok(c.x>=0&&c.x<=1&&c.y>=0&&c.y<=1)}})
test('pan axis without overflow stays stable',()=>assert.equal(panCrop({zoom:1,x:.5,y:.5},346,262,346,262,99,99).x,.5))
test('invalid values are clamped',()=>assert.deepEqual(normalizeCrop({zoom:NaN,x:9,y:-1}),{zoom:1,x:1,y:0}))
test('invalid image sizes fail explicitly',()=>assert.throws(()=>cropRect(0,100,100,100,{zoom:1,x:0,y:0})))
test('grapheme limits preserve family emoji and accents',()=>{assert.equal(graphemes('中👩‍👩‍👧‍👦e\u0301').length,3);assert.equal(limitText('中👩‍👩‍👧‍👦a',2),'中👩‍👩‍👧‍👦')})
test('Chinese and long English wrap without whitespace',()=>{for(const text of ['你好世界旅行','VeryLongEnglishWithoutSpaces'])assert.ok(wrapText(text,30,10,s=>s.length*10).every(s=>s.length<=3))})
test('explicit newlines are preserved',()=>assert.deepEqual(wrapText('a\nb',100,3,s=>s.length),['a','b']))
test('overflow adds ellipsis at minimum font size',()=>{const r=fitText('很长的标题'.repeat(20),100,2,50,24,(s,size)=>s.length*size);assert.equal(r.fontSize,24);assert.equal(r.lines.length,2);assert.ok(r.lines[1].endsWith('…'))})
test('valid serializable template / separate work',()=>{validateTemplate(journey);assert.deepEqual(JSON.parse(JSON.stringify(journey)),journey);const a=createWork(journey),b=createWork(journey);a.text.title='new';assert.notEqual(a.text.title,b.text.title);assert.equal(a.text.date,'');assert.equal(Object.keys(a.photos).length,4)})
test('duplicate IDs / bindings / palette fail validation',()=>{for(const mutate of [(t:any)=>t.layers[1].id=t.layers[0].id,(t:any)=>t.defaultPalette='bad',(t:any)=>t.layers.find((l:any)=>l.type==='photo').width=-1]){const t=structuredClone(journey);mutate(t);assert.throws(()=>validateTemplate(t))}})
test('PNG dimensions detected before decoding',()=>{const b=new Uint8Array(24),d=new DataView(b.buffer);b.set([137,80,78,71]);b.set([73,72,68,82],12);d.setUint32(16,1600);d.setUint32(20,900);assert.deepEqual(readImageHeader(b),{width:1600,height:900,format:'png',orientation:1})})
test('huge PNG rejected before decoding',()=>{const b=new Uint8Array(24),d=new DataView(b.buffer);b.set([137,80,78,71]);b.set([73,72,68,82],12);d.setUint32(16,16000);d.setUint32(20,16000);assert.throws(()=>readImageHeader(b),/像素过大/)})
test('JPEG and WebP header parsing',()=>{const jpg=new Uint8Array([255,216,255,192,0,11,8,3,132,6,64,1,1,17,0,255,217]);assert.equal(readImageHeader(jpg).width,1600);const webp=new Uint8Array(30);for(const [s,i]of [['RIFF',0],['WEBP',8],['VP8X',12]] as const)webp.set(Array.from(s,c=>c.charCodeAt(0)),i);webp[24]=255;webp[27]=127;assert.equal(readImageHeader(webp).width,256)})
test('HEIC and truncated files rejected',()=>{assert.throws(()=>readImageHeader(new Uint8Array(32)),/HEIC/);assert.throws(()=>readImageHeader(new Uint8Array(2)),/不完整/)})
