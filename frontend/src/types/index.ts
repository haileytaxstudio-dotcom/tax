// 학습자 (Student)
export interface Student {
  id: string;
  name: string;
  phone: string;
  startDate: string;
  curriculumId: string;
  progress: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

// 커리큘럼 (Curriculum)
export interface Curriculum {
  id: string;
  name: string;
  description: string;
  worksheetIds: string[];
}

// 학습지 (Worksheet)
export interface Worksheet {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  dayOffset: number; // 학습 시작일 기준 N일차
  reminderHours: number; // 미제출 알림 기준 시간
  curriculumId: string;
  order: number;
}

// 제출 (Submission)
export interface Submission {
  id: string;
  studentId: string;
  worksheetId: string;
  fileUrl: string;
  status: 'pending' | 'submitted' | 'confirmed';
  submittedAt?: string;
  confirmedAt?: string;
}

// 대시보드 통계
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  pendingSubmissions: number;
}

// 학습자별 학습지 상태
export interface StudentWorksheetStatus {
  worksheetId: string;
  worksheetTitle: string;
  status: 'locked' | 'available' | 'submitted' | 'confirmed';
  dueDate?: string;
  submittedAt?: string;
}
