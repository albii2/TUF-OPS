export enum TrainingRole {
  TAE = 'TAE',
  REP = 'REP',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
}

export enum TrainingPhase {
  LEVEL_1_OPERATOR = 'LEVEL_1_OPERATOR',
  LEVEL_2_PRODUCT = 'LEVEL_2_PRODUCT',
  LEVEL_3_TERRITORY = 'LEVEL_3_TERRITORY',
  LEVEL_4_SALES = 'LEVEL_4_SALES',
  LEVEL_5_EXPANSION = 'LEVEL_5_EXPANSION',
  SPECIALIZED_TRACKS = 'SPECIALIZED_TRACKS',
  LEVEL_7_DIRECTOR = 'LEVEL_7_DIRECTOR',
  MARKET_MASTERY = 'MARKET_MASTERY',
}

export const LEGACY_PHASE_MAP: Record<string, TrainingPhase> = {
  DAY_1: TrainingPhase.LEVEL_1_OPERATOR,
  DAY_1_2: TrainingPhase.LEVEL_2_PRODUCT,
  WEEK_1_2: TrainingPhase.LEVEL_4_SALES,
  MONTH_1: TrainingPhase.LEVEL_5_EXPANSION,
};

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
  quiz_json?: Array<{ question: string; options: string[]; correctAnswer: string }>;
  passing_score?: number;
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
