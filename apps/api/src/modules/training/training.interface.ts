export enum TrainingRole {
  TAE = 'TAE',
  REP = 'REP',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
}

export enum TrainingPhase {
  DAY_1 = 'DAY_1',
  DAY_1_2 = 'DAY_1_2',
  WEEK_1_2 = 'WEEK_1_2',
  MONTH_1 = 'MONTH_1',
}

export enum TrainingModuleType {
  VIDEO = 'VIDEO',
  INTERACTIVE = 'INTERACTIVE',
  HANDS_ON = 'HANDS_ON',
  MODULE = 'MODULE',
}

export enum TrainingProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TrainingEnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  INACTIVE = 'INACTIVE',
}

export interface TrainingModule {
  id: number;
  title: string;
  description?: string;
  role: TrainingRole;
  phase: TrainingPhase;
  order_index: number;
  content_markdown: string;
  estimated_duration_minutes?: number;
  module_type: TrainingModuleType;
  created_at: Date;
  updated_at: Date;
}

export interface TrainingEnrollment {
  id: number;
  user_id: number;
  role: TrainingRole;
  status: TrainingEnrollmentStatus;
  current_phase: TrainingPhase;
  enrolled_at: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TrainingProgress {
  id: number;
  enrollment_id: number;
  module_id: number;
  status: TrainingProgressStatus;
  started_at?: Date;
  completed_at?: Date;
  time_spent_seconds: number;
  created_at: Date;
  updated_at: Date;
}

export interface TrainingAssessment {
  id: number;
  module_id: number;
  enrollment_id: number;
  score?: number;
  passed?: boolean;
  taken_at?: Date;
  created_at: Date;
}

export interface TrainingFrictionNote {
  id: number;
  enrollment_id: number;
  module_id?: number;
  friction_point_text: string;
  resolution_text?: string;
  created_at: Date;
}

export interface TrainingEnrollmentWithProgress {
  enrollment: TrainingEnrollment;
  modules: TrainingModule[];
  progress: TrainingProgress[];
  completionMetrics: {
    totalModules: number;
    completedModules: number;
    percentComplete: number;
    phaseCompletionStatus: Record<TrainingPhase, { completed: number; total: number; percentComplete: number }>;
  };
}
