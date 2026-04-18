export enum CommissionStatus {
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
  PAID = 'PAID',
  VOIDED = 'VOIDED',
}

export interface Commission {
  id: number;
  opportunity_id: number;
  rep_user_id: number;
  director_user_id: number;
  gross_profit: number;
  rep_rate: number;
  rep_commission: number;
  director_rate: number;
  director_override: number;
  status: CommissionStatus;
  created_at: Date;
  updated_at: Date;
}
