import { getStoredUser } from '../auth';

export type CreativeRequestType = 'MOCKUP'|'APPAREL_GRAPHIC'|'COLLECTION_DESIGN'|'SOCIAL_MEDIA_GRAPHIC'|'EVENT_LOGO'|'BRAND_DOCUMENT'|'SALES_FLYER'|'OTHER';
export type DesignTeam = 'APPAREL_MOCKUP'|'SOCIAL_BRAND';
export type CreativePriority = 'LOW'|'NORMAL'|'HIGH'|'URGENT';
export type CreativeStatus = 'DRAFT'|'SUBMITTED'|'NEEDS_CLARIFICATION'|'IN_PROGRESS'|'INTERNAL_REVIEW'|'AWAITING_SALES_APPROVAL'|'REVISION_REQUESTED'|'FINAL_APPROVED'|'DELIVERED'|'ARCHIVED';
export const neededItemOptions = ['Home Uniform','Away Uniform','Alternate Uniform','Hoodie','T-Shirt','Shorts','Team Store Graphic','Player Pack','Letterman Jacket','Social Post','Story Graphic','Event Logo','Flyer','PDF / Brand Document','Other'] as const;

export type CreativeRequest = { id:string; opportunityId:string; organizationId:string; createdBy:string; assignedDesigner?:string; requestType:CreativeRequestType; designTeam:DesignTeam; priority:CreativePriority; title:string; sport?:string; season?:string; neededItems:string[]; designNotes:string; inspirationNotes?:string; dueDate?:string; assetLinks?:string; internalNotes?:string; status:CreativeStatus; trelloCardUrl?:string; createdAt:string; updatedAt:string };

const key = 'tuf_creative_requests_v1';
function read(): CreativeRequest[] { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function write(rows: CreativeRequest[]) { localStorage.setItem(key, JSON.stringify(rows)); }

export function listCreativeRequestsByOpportunity(opportunityId:string){ return read().filter((r)=>r.opportunityId===opportunityId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }
export function createCreativeRequest(input: Omit<CreativeRequest,'id'|'createdAt'|'updatedAt'|'status'|'createdBy'> & { status?: CreativeStatus }){
  if (!input.title.trim() || !input.designNotes.trim()) throw new Error('Title and design notes are required');
  const user=getStoredUser();
  const now=new Date().toISOString();
  const row: CreativeRequest={...input,id:`cr-${Math.random().toString(36).slice(2,10)}`,createdBy:user?.name||'Unknown',status:input.status||'SUBMITTED',createdAt:now,updatedAt:now};
  const next=[row,...read()]; write(next); return row;
}
