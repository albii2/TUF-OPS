export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  NOTE = 'NOTE',
  TASK = 'TASK',
}

export interface Activity {
  id: number;
  type: ActivityType;
  organization_id: number;
  opportunity_id?: number;
  description: string;
  created_by: number;
  created_at: Date;
  due_date?: Date;
  completed: boolean;
}
