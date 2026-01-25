import { Submission } from '@/types';

export const mockSubmissions: Submission[] = [
  // 김민준 (student-1) - 75% 진행
  {
    id: 'sub-1',
    studentId: 'student-1',
    worksheetId: 'ws-1',
    fileUrl: '/submissions/student1-ws1.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-11T10:30:00',
    confirmedAt: '2026-01-11T14:00:00',
  },
  {
    id: 'sub-2',
    studentId: 'student-1',
    worksheetId: 'ws-2',
    fileUrl: '/submissions/student1-ws2.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-18T09:15:00',
    confirmedAt: '2026-01-18T11:30:00',
  },
  {
    id: 'sub-3',
    studentId: 'student-1',
    worksheetId: 'ws-3',
    fileUrl: '/submissions/student1-ws3.pdf',
    status: 'submitted',
    submittedAt: '2026-01-25T14:20:00',
  },

  // 이서연 (student-2) - 100% 완료
  {
    id: 'sub-4',
    studentId: 'student-2',
    worksheetId: 'ws-1',
    fileUrl: '/submissions/student2-ws1.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-09T08:00:00',
    confirmedAt: '2026-01-09T10:00:00',
  },
  {
    id: 'sub-5',
    studentId: 'student-2',
    worksheetId: 'ws-2',
    fileUrl: '/submissions/student2-ws2.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-16T11:30:00',
    confirmedAt: '2026-01-16T15:00:00',
  },
  {
    id: 'sub-6',
    studentId: 'student-2',
    worksheetId: 'ws-3',
    fileUrl: '/submissions/student2-ws3.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-23T09:45:00',
    confirmedAt: '2026-01-23T12:00:00',
  },
  {
    id: 'sub-7',
    studentId: 'student-2',
    worksheetId: 'ws-4',
    fileUrl: '/submissions/student2-ws4.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-30T16:00:00',
    confirmedAt: '2026-01-30T18:00:00',
  },

  // 박지호 (student-3) - 50% 진행
  {
    id: 'sub-8',
    studentId: 'student-3',
    worksheetId: 'ws-1',
    fileUrl: '/submissions/student3-ws1.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-13T13:00:00',
    confirmedAt: '2026-01-13T16:00:00',
  },
  {
    id: 'sub-9',
    studentId: 'student-3',
    worksheetId: 'ws-2',
    fileUrl: '/submissions/student3-ws2.pdf',
    status: 'submitted',
    submittedAt: '2026-01-20T10:00:00',
  },

  // 최수아 (student-4) - 25% 진행
  {
    id: 'sub-10',
    studentId: 'student-4',
    worksheetId: 'ws-1',
    fileUrl: '/submissions/student4-ws1.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-16T11:00:00',
    confirmedAt: '2026-01-16T14:00:00',
  },

  // 강하은 (student-6) - 60% 진행 (paused)
  {
    id: 'sub-11',
    studentId: 'student-6',
    worksheetId: 'ws-1',
    fileUrl: '/submissions/student6-ws1.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-07T09:00:00',
    confirmedAt: '2026-01-07T11:00:00',
  },
  {
    id: 'sub-12',
    studentId: 'student-6',
    worksheetId: 'ws-2',
    fileUrl: '/submissions/student6-ws2.pdf',
    status: 'confirmed',
    submittedAt: '2026-01-14T10:30:00',
    confirmedAt: '2026-01-14T13:00:00',
  },
];
