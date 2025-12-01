export enum QuestionStatus {
  NOT_STARTED = 'NOT_STARTED',
  ACTIVE = 'ACTIVE', // Gray, but running
  PAUSED = 'PAUSED', // Gray, but paused
  SKIPPED = 'SKIPPED', // Blue
  COMPLETED = 'COMPLETED', // Green or Orange depending on history
}

export type Subject = 'Maths' | 'Physics' | 'Chemistry' | null;

export interface AppConfig {
  // Section A: Time Distribution Ranges (in minutes)
  range1Limit: number; // Default 2 (< X)
  range2Lower: number; // Default 2 (X to Y)
  range2Upper: number; // Default 3 (X to Y)
  range3Limit: number; // Default 3 (> Z) - Usually same as range2Upper

  // Section B: Hard Question Threshold
  longQuestionThresholdMin: number; // Default 3.5

  // Section C: Ideal Time
  idealTimePerQuestionMin: number; // Default 2.4

  // Subject
  subject: Subject;
}

export const DEFAULT_CONFIG: AppConfig = {
  range1Limit: 2,
  range2Lower: 2,
  range2Upper: 3,
  range3Limit: 3,
  longQuestionThresholdMin: 3.5,
  idealTimePerQuestionMin: 2.4,
  subject: null,
};

export interface Question {
  id: number;
  status: QuestionStatus;
  timeSpentMs: number; // Stored in milliseconds for precision
  wasSkipped: boolean; // Tracks if it was ever skipped to determine Orange state
}

export interface TimeDistribution {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface StatusDistribution {
  statusLabel: string;
  count: number;
  percentage: number;
  color: string;
}