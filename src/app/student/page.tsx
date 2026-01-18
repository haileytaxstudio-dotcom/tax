import { ProgressCard } from '@/components/student/ProgressCard';
import { WorksheetList } from '@/components/student/WorksheetList';
import { mockStudents } from '@/data/mockStudents';
import { mockWorksheets } from '@/data/mockWorksheets';
import { mockSubmissions } from '@/data/mockSubmissions';
import { StudentWorksheetStatus } from '@/types';

// 현재 로그인한 학습자 (목업)
const currentStudent = mockStudents[0]; // 김민준

function getWorksheetStatuses(): StudentWorksheetStatus[] {
  const studentSubmissions = mockSubmissions.filter(
    (s) => s.studentId === currentStudent.id
  );

  return mockWorksheets.map((worksheet) => {
    const submission = studentSubmissions.find((s) => s.worksheetId === worksheet.id);

    let status: StudentWorksheetStatus['status'];
    if (submission) {
      status = submission.status === 'confirmed' ? 'confirmed' : 'submitted';
    } else {
      // 간단한 로직: 이전 학습지가 모두 제출되었으면 available
      const worksheetIndex = mockWorksheets.findIndex((w) => w.id === worksheet.id);
      const previousWorksheets = mockWorksheets.slice(0, worksheetIndex);
      const allPreviousSubmitted = previousWorksheets.every((pw) =>
        studentSubmissions.some((s) => s.worksheetId === pw.id)
      );
      status = allPreviousSubmitted ? 'available' : 'locked';
    }

    return {
      worksheetId: worksheet.id,
      worksheetTitle: worksheet.title,
      status,
      submittedAt: submission?.submittedAt
        ? new Date(submission.submittedAt).toLocaleDateString('ko-KR')
        : undefined,
    };
  });
}

export default function StudentDashboard() {
  const worksheetStatuses = getWorksheetStatuses();
  const completedCount = worksheetStatuses.filter(
    (w) => w.status === 'submitted' || w.status === 'confirmed'
  ).length;
  const averageProgress = Math.round(
    mockStudents.reduce((sum, s) => sum + s.progress, 0) / mockStudents.length
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          안녕하세요, {currentStudent.name}님
        </h1>
        <p className="text-gray-500">세무 기초 과정을 학습 중입니다.</p>
      </div>

      <ProgressCard
        myProgress={currentStudent.progress}
        averageProgress={averageProgress}
        completedCount={completedCount}
        totalCount={mockWorksheets.length}
      />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">학습지 목록</h2>
        <WorksheetList worksheets={worksheetStatuses} />
      </div>
    </div>
  );
}
