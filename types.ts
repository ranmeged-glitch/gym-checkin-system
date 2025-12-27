export enum Role {
  ADMIN = 'ADMIN',
  TRAINER = 'TRAINER',
  VIEWER = 'VIEWER', // הנהלה - צפייה בלבד
}

export enum SubscriptionStatus {
  VALID = 'VALID',
  WARNING = 'WARNING', // < 45 days
  EXPIRED = 'EXPIRED',
}

export enum TrainingLimitation {
  NONE = 'NONE',
  SEATED_ONLY = 'SEATED_ONLY',
  PHYSIO_SUPERVISION = 'PHYSIO_SUPERVISION',
  OTHER = 'OTHER',
}

export interface User {
  id: string;
  username: string;
  role: Role;
  name: string;
}

// Interface used for storage (includes password)
export interface SystemUser extends User {
  password?: string;
  active: boolean;
}

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  medicalConditions?: string; // מיועד לטקסט חופשי במקרה של "אחר" או הערות נוספות
  trainingLimitation: TrainingLimitation;
  medicalCertificateStartDate: string; // ISO Date string (Date received)
  subscriptionExpiry: string; // ISO Date string (Date received + 1 year)
}

export interface Trainer {
  id: string;
  name: string;
  active: boolean;
}

export interface CheckInRecord {
  id: string;
  residentId: string;
  residentName: string;
  trainerId: string;
  trainerName: string;
  timestamp: string; // ISO Date string
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  trainerId?: string;
  residentName?: string;
}