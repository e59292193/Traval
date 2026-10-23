"""Build overview-only WGS84 highlights from a local Natural Earth admin-1 file.
Usage: python3 scripts/build-region-overlay.py /path/to/ne_10m_admin_1_states_provinces.geojson
Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_1_states_provinces.geojson
Public domain; simplified cartographic overlay, NOT surveyed/publishing-approved boundaries.
"""
import json,sys,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
raw=Path(sys.argv[1]).read_bytes();data=json.loads(raw)
regions=json.loads((root/'src/data/regions.json').read_text());names={r['name']:r['id'] for r in regions};polys={r['id']:[] for r in regions}
def simplify(points,tol=.008):
    pts=[p[:2] for p in points]
    if len(pts)<5:return pts
    keep={0,len(pts)-1};stack=[(0,len(pts)-1)]
    while stack:
        a,b=stack.pop();x,y=pts[a];dx=pts[b][0]-x;dy=pts[b][1]-y;l=dx*dx+dy*dy
        largest=tol*tol;best=None
        for i in range(a+1,b):
            px,py=pts[i];t=max(0,min(1,((px-x)*dx+(py-y)*dy)/l)) if l else 0
            d=(px-x-t*dx)**2+(py-y-t*dy)**2
            if d>largest:largest=d;best=i
        if best is not None:keep.add(best);stack.extend([(a,best),(best,b)])
    out=[pts[i] for i in sorted(keep)]
    return out if len(out)>=4 else pts
used=[]
for f in data['features']:
    p=f['properties'];a=p.get('adm0_a3');rid={'TWN':'710000','HKG':'810000','MAC':'820000'}.get(a)
    if a=='CHN':rid=names.get(p.get('name_zh'));rid='460000' if p.get('name')=='Paracel Islands' else rid
    if not rid:continue
    g=f['geometry'];parts=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    polys[rid].extend([[[round(x,4),round(y,4)] for x,y in simplify(ring)] for ring in poly] for poly in parts)
    used.append(p.get('adm1_code'))
assert all(polys.values()),[k for k,v in polys.items() if not v]
out={'type':'FeatureCollection','features':[{'type':'Feature','id':r['id'],'properties':{'regionId':r['id'],'name':r['name']},'geometry':{'type':'MultiPolygon','coordinates':polys[r['id']]}} for r in regions]}
(root/'src/data/region-overlay-wgs84.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({'regions':len(out['features']),'sourceFeatures':len(used),'sourceSha256':hashlib.sha256(raw).hexdigest(),'simplificationDegrees':.008,'outputBytes':len(json.dumps(out,ensure_ascii=False).encode())}))
