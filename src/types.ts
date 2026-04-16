export type Gender = '\u7537' | '\u5973';

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  grade: string;
  age: number;
  phone: string;
  address: string;
  enrollmentDate: string;
}

export type SortKey = 'id' | 'name' | 'grade' | 'age' | 'enrollmentDate';

export type StudentFormErrors = Partial<Record<keyof Student, string>>;

export interface LoginResponse {
  accessToken: string;
  username: string;
  expiresAt: string;
}

export interface AuthSession extends LoginResponse {
  storage: 'local' | 'session';
}

export interface HealthResponse {
  status: string;
  database: string;
  version: string;
}

export interface ImportResponse {
  requested: number;
  imported: number;
  skipped: number;
  skippedIds: string[];
}

export interface GradeDistributionItem {
  name: string;
  count: number;
}

export interface StudentStats {
  total: number;
  male: number;
  female: number;
  averageAge: number;
  genderDistribution: Array<{ name: string; value: number }>;
  gradeDistribution: GradeDistributionItem[];
}
