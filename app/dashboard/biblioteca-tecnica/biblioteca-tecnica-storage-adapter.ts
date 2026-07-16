"use client";
import { technicalDocuments } from "./biblioteca-tecnica-data";
import { technicalLibraryStateSchema } from "./biblioteca-tecnica-schema";
import type { TechnicalDocument, TechnicalLibraryState } from "./biblioteca-tecnica-types";
const KEY="proflow:biblioteca-tecnica:v1", BACKUP=`${KEY}:backup`;
const seed = (): TechnicalLibraryState => ({ version:1, revision:0, sequence:technicalDocuments.length, documents:technicalDocuments.map((item,index):TechnicalDocument=>({ id:item.id, sequence:index+1, code:item.code, title:item.title, description:item.description, category:item.category, contentType:item.contentType, status:"ACTIVE", manufacturer:item.manufacturer, version:item.version, revision:1, tags:item.tags, specialties:[], equipmentIds:[], serviceOrderIds:[], clientIds:[], equipmentSnapshots:item.equipmentCodes.map((label)=>({id:label,label,link:"/dashboard/equipamentos"})), serviceOrderSnapshots:item.serviceOrderReferences.map((label)=>({id:label,label,link:"/dashboard/ordens"})), clientSnapshots:[], favorite:item.isFavorite, accessCount:item.views, lastAccessedAt:item.isRecent?item.updatedAt:undefined, notes:"", createdAt:item.updatedAt, updatedAt:item.updatedAt, history:[] })) });
export const technicalLibraryStorage = {
  load(): TechnicalLibraryState { const raw=localStorage.getItem(KEY); if(!raw) return seed(); const parsed=technicalLibraryStateSchema.safeParse(JSON.parse(raw)); if(parsed.success) return parsed.data; const backup=localStorage.getItem(BACKUP); if(backup){ const recovered=technicalLibraryStateSchema.safeParse(JSON.parse(backup)); if(recovered.success) return recovered.data; } throw new Error("Os dados locais da Biblioteca estão inválidos."); },
  save(state:TechnicalLibraryState){ const current=localStorage.getItem(KEY); if(current) localStorage.setItem(BACKUP,current); localStorage.setItem(KEY,JSON.stringify(technicalLibraryStateSchema.parse(state))); }
};
