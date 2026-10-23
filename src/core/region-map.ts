import boundary from '../data/region-overlay-wgs84.json'
import {visibleTrips,type Journal} from './travel'
import type {FeatureCollection,MultiPolygon} from 'geojson'
export const regionBoundary=boundary as FeatureCollection<MultiPolygon,{regionId:string;name:string}>
// Manual marks are global. Trip-derived highlights follow the visible trip filter.
export function visibleRegionIds(j:Journal){return [...new Set([...j.visitedRegions,...visibleTrips(j).flatMap(t=>t.stops.map(s=>s.place.region))])].sort()}
export function regionFeatures(j:Journal){const ids=new Set(visibleRegionIds(j));return {type:'FeatureCollection' as const,features:regionBoundary.features.map(f=>({...f,properties:{...f.properties,visited:ids.has(f.properties.regionId)}}))}}
export function hasRecordedRegion(j:Journal,id:string){return visibleTrips(j).some(t=>t.stops.some(s=>s.place.region===id))}
export function toggleManualRegion(j:Journal,id:string):'added'|'removed'|'recorded'{const at=j.visitedRegions.indexOf(id);if(at>=0){j.visitedRegions.splice(at,1);return 'removed'}if(hasRecordedRegion(j,id))return 'recorded';j.visitedRegions.push(id);return 'added'}
