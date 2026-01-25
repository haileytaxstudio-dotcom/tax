import { Worksheet, Curriculum } from '@/types';

export const mockCurriculums: Curriculum[] = [
  {
    id: 'curriculum-1',
    name: '세무 기초 과정',
    description: '세무의 기본 개념부터 실무까지 배우는 4주 과정',
    worksheetIds: ['ws-1', 'ws-2', 'ws-3', 'ws-4'],
  },
];

export const mockWorksheets: Worksheet[] = [
  {
    id: 'ws-1',
    title: '1주차: 세무 기초 개념',
    description: '세금의 종류와 기본 개념을 학습합니다.',
    fileUrl: '/worksheets/week1.pdf',
    dayOffset: 0,
    reminderHours: 48,
    curriculumId: 'curriculum-1',
    order: 1,
  },
  {
    id: 'ws-2',
    title: '2주차: 부가가치세 이해',
    description: '부가가치세의 계산 방법과 신고 절차를 학습합니다.',
    fileUrl: '/worksheets/week2.pdf',
    dayOffset: 7,
    reminderHours: 48,
    curriculumId: 'curriculum-1',
    order: 2,
  },
  {
    id: 'ws-3',
    title: '3주차: 소득세 기초',
    description: '소득세의 종류와 계산 방법을 학습합니다.',
    fileUrl: '/worksheets/week3.pdf',
    dayOffset: 14,
    reminderHours: 48,
    curriculumId: 'curriculum-1',
    order: 3,
  },
  {
    id: 'ws-4',
    title: '4주차: 종합 실습',
    description: '실제 사례를 통한 세무 실습을 진행합니다.',
    fileUrl: '/worksheets/week4.pdf',
    dayOffset: 21,
    reminderHours: 72,
    curriculumId: 'curriculum-1',
    order: 4,
  },
];
