import { Header, Card, CardHeader, CardTitle, CardContent, ProgressBar, Badge } from '@/components/common';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { mockStudents } from '@/data/mockStudents';
import { mockSubmissions } from '@/data/mockSubmissions';
import { DashboardStats as DashboardStatsType } from '@/types';

function calculateStats(): DashboardStatsType {
  const totalStudents = mockStudents.length;
  const activeStudents = mockStudents.filter((s) => s.status === 'active').length;
  const averageProgress = Math.round(
    mockStudents.reduce((sum, s) => sum + s.progress, 0) / totalStudents
  );
  const pendingSubmissions = mockSubmissions.filter((s) => s.status === 'pending').length;

  return {
    totalStudents,
    activeStudents,
    averageProgress,
    pendingSubmissions,
  };
}

export default function AdminDashboard() {
  const stats = calculateStats();
  const recentStudents = mockStudents.slice(0, 5);

  return (
    <div>
      <Header title="대시보드" />
      <div className="p-6 space-y-6">
        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>최근 학습자</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.phone}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <ProgressBar progress={student.progress} showLabel={false} size="sm" />
                      </div>
                      <Badge status={student.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>진행률 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: '100% 완료', count: mockStudents.filter((s) => s.progress === 100).length, color: 'bg-green-500' },
                  { label: '75% 이상', count: mockStudents.filter((s) => s.progress >= 75 && s.progress < 100).length, color: 'bg-blue-500' },
                  { label: '50% 이상', count: mockStudents.filter((s) => s.progress >= 50 && s.progress < 75).length, color: 'bg-yellow-500' },
                  { label: '25% 이상', count: mockStudents.filter((s) => s.progress >= 25 && s.progress < 50).length, color: 'bg-orange-500' },
                  { label: '25% 미만', count: mockStudents.filter((s) => s.progress < 25).length, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.count}명</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
