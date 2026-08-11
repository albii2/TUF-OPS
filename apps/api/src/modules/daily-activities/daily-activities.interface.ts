export interface DailyActivity {
  id: number;
  user_id: number;
  activity_date: string;
  calls: number;
  emails: number;
  texts: number;
  linkedin_msgs: number;
  conversations: number;
  meetings: number;
  quotes: number;
  follow_ups: number;
  new_opps: number;
  next_actions: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyActivityInput {
  calls?: number;
  emails?: number;
  texts?: number;
  linkedin_msgs?: number;
  conversations?: number;
  meetings?: number;
  quotes?: number;
  follow_ups?: number;
  new_opps?: number;
  next_actions?: string;
}
