'use client';

import { useEffect, useState } from 'react';
import { Header, Card, CardHeader, CardTitle, CardContent, ProgressBar, Badge } from '@/components/common';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { DashboardStats as DashboardStatsType } from '@/types';

interface DashboardData {
  stats: DashboardStatsType;
  recentStudents: Array<{
    id: string;
    name: string;
    phone: string;
    status: string;
    progress?: number;
  }>;
  recentSubmissions: Array<{
    id: string;
    student: { name: string };
    worksheet: { title: string };
    status: string;
    submitted_at: string;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="대시보드" />
        <div className="p-6 flex items-center justify-center">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="대시보드" />
        <div className="p-6">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <p className="text-sm text-gray-500 mt-2">
                Supabase 연결을 확인해주세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0,
    pendingSubmissions: 0,
  };

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
              {data?.recentStudents && data.recentStudents.length > 0 ? (
                <div className="space-y-4">
                  {data.recentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.phone}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge status={student.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">등록된 학습자가 없습니다.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 제출</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recentSubmissions && data.recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {data.recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {submission.student?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {submission.worksheet?.title}
                        </p>
                      </div>
                      <Badge status={submission.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">제출된 답안이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
