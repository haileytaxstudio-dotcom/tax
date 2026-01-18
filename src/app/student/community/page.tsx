import { Card, CardContent, ProgressBar } from '@/components/common';
import { CommunityFeed } from '@/components/student/CommunityFeed';
import { mockStudents } from '@/data/mockStudents';
import { mockSubmissions } from '@/data/mockSubmissions';
import { mockWorksheets } from '@/data/mockWorksheets';

// 다른 학습자들의 제출 목록 생성 (현재 학습자 제외)
const currentStudentId = 'student-1';

const communitySubmissions = mockSubmissions
  .filter((s) => s.studentId !== currentStudentId && s.status !== 'pending')
  .map((submission) => {
    const student = mockStudents.find((s) => s.id === submission.studentId);
    const worksheet = mockWorksheets.find((w) => w.id === submission.worksheetId);
    return {
      id: submission.id,
      studentName: student?.name || '익명',
      worksheetTitle: worksheet?.title || '학습지',
      submittedAt: submission.submittedAt || '',
      progress: student?.progress || 0,
    };
  })
  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

// 진행률 분포 계산
const progressDistribution = [
  { range: '100%', count: mockStudents.filter((s) => s.progress === 100).length },
  { range: '75-99%', count: mockStudents.filter((s) => s.progress >= 75 && s.progress < 100).length },
  { range: '50-74%', count: mockStudents.filter((s) => s.progress >= 50 && s.progress < 75).length },
  { range: '25-49%', count: mockStudents.filter((s) => s.progress >= 25 && s.progress < 50).length },
  { range: '0-24%', count: mockStudents.filter((s) => s.progress < 25).length },
];

export default function CommunityPage() {
  const averageProgress = Math.round(
    mockStudents.reduce((sum, s) => sum + s.progress, 0) / mockStudents.length
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">커뮤니티</h1>
        <p className="text-gray-500">다른 학습자들의 진행 상황과 제출물을 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">전체 진행률</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">전체 평균</span>
                  <span className="font-semibold">{averageProgress}%</span>
                </div>
                <ProgressBar progress={averageProgress} showLabel={false} size="lg" />
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  총 {mockStudents.length}명의 학습자가 참여 중입니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">진행률 분포</h2>
            <div className="space-y-3">
              {progressDistribution.map((item) => (
                <div key={item.range} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(item.count / mockStudents.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{item.count}명</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 제출</h2>
        {communitySubmissions.length > 0 ? (
          <CommunityFeed submissions={communitySubmissions} />
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">아직 다른 학습자의 제출물이 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
