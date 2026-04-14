export type OpportunityStage = 
  | 'lead' 
  | 'contacted' 
  | 'mockup' 
  | 'sample' 
  | 'invoice' 
  | 'closed_won' 
  | 'closed_lost' 

export interface Opportunity { 
  id: string 
  name: string 
  organizationId: string 
  ownerId?: string | null 
  stage: OpportunityStage 
  estimatedValue: number // Changed from expectedValue to match schema
  closeDate?: Date | null 
  createdAt: Date 
  updatedAt: Date 
} 
