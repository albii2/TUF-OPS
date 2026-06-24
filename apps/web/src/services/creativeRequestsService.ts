import { getStoredUser } from '../auth';

export type CreativeRequestType = 'MOCKUP'|'APPAREL_GRAPHIC'|'COLLECTION_DESIGN'|'SOCIAL_MEDIA_GRAPHIC'|'EVENT_LOGO'|'BRAND_DOCUMENT'|'SALES_FLYER'|'OTHER';
export type DesignTeam = 'APPAREL_MOCKUP'|'SOCIAL_BRAND';
export type CreativePriority = 'LOW'|'NORMAL'|'HIGH'|'URGENT';
export type CreativeStatus = 'DRAFT'|'SUBMITTED'|'NEEDS_CLARIFICATION'|'IN_PROGRESS'|'INTERNAL_REVIEW'|'AWAITING_SALES_APPROVAL'|'REVISION_REQUESTED'|'FINAL_APPROVED'|'DELIVERED'|'ARCHIVED';
export type TrelloDispatchStatus = 'NOT_CONFIGURED'|'PENDING'|'SENT'|'FAILED';
export const neededItemOptions = ['Home Uniform','Away Uniform','Alternate Uniform','Hoodie','T-Shirt','Shorts','Team Store Graphic','Player Pack','Letterman Jacket','Social Post','Story Graphic','Event Logo','Flyer','PDF / Brand Document','Other'] as const;

export type CreativeRequest = {
  id:string;
  opportunityId:string;
  organizationId:string;
  createdBy:string;
  assignedDesigner?:string;
  requestType:CreativeRequestType;
  designTeam:DesignTeam;
  priority:CreativePriority;
  title:string;
  sport?:string;
  season?:string;
  neededItems:string[];
  designNotes:string;
  inspirationNotes?:string;
  dueDate?:string;
  assetLinks?:string;
  internalNotes?:string;
  status:CreativeStatus;
  trelloCardUrl?:string;
  trelloCardId?:string;
  trelloDispatchStatus?:TrelloDispatchStatus;
  trelloDispatchError?:string;
  createdAt:string;
  updatedAt:string;
};

type TrelloCardResponse = { id: string; shortUrl?: string; url?: string };

const key = 'tuf_creative_requests_v1';
function read(): CreativeRequest[] { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function write(rows: CreativeRequest[]) { localStorage.setItem(key, JSON.stringify(rows)); }

function getTrelloConfig() {
  return {
    key: import.meta.env.VITE_TRELLO_KEY as string | undefined,
    token: import.meta.env.VITE_TRELLO_TOKEN as string | undefined,
    listId: import.meta.env.VITE_TRELLO_MOCKUP_LIST_ID as string | undefined,
    memberIds: import.meta.env.VITE_TRELLO_MOCKUP_MEMBER_IDS as string | undefined,
    labelIds: import.meta.env.VITE_TRELLO_MOCKUP_LABEL_IDS as string | undefined,
  };
}

export function isTrelloConfigured() {
  const config = getTrelloConfig();
  return Boolean(config.key && config.token && config.listId);
}

function buildTrelloDescription(request: CreativeRequest) {
  const assetLinks = request.assetLinks?.trim() || 'No asset links provided yet.';
  const inspiration = request.inspirationNotes?.trim() || 'No inspiration notes provided.';
  const internal = request.internalNotes?.trim() || 'No internal notes.';

  return [
    `TUF Ops creative request: ${request.requestType}`,
    '',
    `Priority: ${request.priority}`,
    `Design team: ${request.designTeam}`,
    `Submitted by: ${request.createdBy}`,
    `Opportunity ID: ${request.opportunityId}`,
    `Organization ID: ${request.organizationId}`,
    `Sport: ${request.sport || 'Not specified'}`,
    `Season: ${request.season || 'Not specified'}`,
    `Needed items: ${request.neededItems.length ? request.neededItems.join(', ') : 'Not specified'}`,
    `Due date: ${request.dueDate || 'Not specified'}`,
    '',
    'Design notes:',
    request.designNotes,
    '',
    'Inspiration / references:',
    inspiration,
    '',
    'Asset links:',
    assetLinks,
    '',
    'Internal notes:',
    internal,
    '',
    `TUF Ops request ID: ${request.id}`,
  ].join('\n');
}

function patchCreativeRequest(id: string, patch: Partial<CreativeRequest>) {
  const rows = read();
  const updatedRows = rows.map((row) => row.id === id ? { ...row, ...patch, updatedAt: new Date().toISOString() } : row);
  write(updatedRows);
  return updatedRows.find((row) => row.id === id);
}

async function dispatchToTrello(request: CreativeRequest) {
  const config = getTrelloConfig();
  if (!config.key || !config.token || !config.listId) {
    return patchCreativeRequest(request.id, { trelloDispatchStatus: 'NOT_CONFIGURED' }) ?? request;
  }

  patchCreativeRequest(request.id, { trelloDispatchStatus: 'PENDING' });

  const params = new URLSearchParams({ key: config.key, token: config.token });
  const body: Record<string, string> = {
    idList: config.listId,
    name: `[${request.priority}] ${request.title}`,
    desc: buildTrelloDescription(request),
    pos: 'top',
  };
  if (request.dueDate) body.due = request.dueDate;
  if (config.memberIds) body.idMembers = config.memberIds;
  if (config.labelIds) body.idLabels = config.labelIds;

  try {
    const response = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Trello card creation failed (${response.status})`);
    const card = await response.json() as TrelloCardResponse;
    return patchCreativeRequest(request.id, {
      trelloCardId: card.id,
      trelloCardUrl: card.shortUrl || card.url,
      trelloDispatchStatus: 'SENT',
      trelloDispatchError: '',
    }) ?? request;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create Trello card';
    return patchCreativeRequest(request.id, {
      trelloDispatchStatus: 'FAILED',
      trelloDispatchError: message,
    }) ?? request;
  }
}

export function listCreativeRequestsByOpportunity(opportunityId:string){ return read().filter((r)=>r.opportunityId===opportunityId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }
export async function createCreativeRequest(input: Omit<CreativeRequest,'id'|'createdAt'|'updatedAt'|'status'|'createdBy'> & { status?: CreativeStatus }){
  if (!input.title.trim() || !input.designNotes.trim()) throw new Error('Title and design notes are required');
  const user=getStoredUser();
  const now=new Date().toISOString();
  const row: CreativeRequest={...input,id:`cr-${Math.random().toString(36).slice(2,10)}`,createdBy:user?.name||'Unknown',status:input.status||'SUBMITTED',trelloDispatchStatus:isTrelloConfigured()?'PENDING':'NOT_CONFIGURED',createdAt:now,updatedAt:now};
  const next=[row,...read()]; write(next);
  return dispatchToTrello(row);
}
