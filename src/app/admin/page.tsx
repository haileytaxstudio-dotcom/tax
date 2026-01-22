'use client';

import { useEffect, useState } from 'react';
import { Header, Card, CardHeader, CardTitle, CardContent, ProgressBar, Badge, Button } from '@/components/common';
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
  const [sending, setSending] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSendWorksheets = async () => {
    if (!confirm('오늘 발송 예정인 학습지를 모든 학습자에게 발송하시겠습니까?')) return;

    setSending('worksheets');
    setSendResult(null);
    try {
      const response = await fetch('/api/send/worksheets', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        setSendResult(`학습지 발송 완료: ${result.sent || 0}건`);
      } else {
        setSendResult(`발송 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      setSendResult('발송 중 오류가 발생했습니다.');
    } finally {
      setSending(null);
    }
  };

  const handleSendReminders = async () => {
    if (!confirm('미제출 학습자들에게 리마인더를 발송하시겠습니까?')) return;

    setSending('reminders');
    setSendResult(null);
    try {
      const response = await fetch('/api/send/reminders', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        setSendResult(`리마인더 발송 완료: ${result.sent || 0}건`);
      } else {
        setSendResult(`발송 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      setSendResult('발송 중 오류가 발생했습니다.');
    } finally {
      setSending(null);
    }
  };

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

        {/* 알림톡 발송 버튼 */}
        <Card>
          <CardHeader>
            <CardTitle>알림톡 발송</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleSendWorksheets}
                disabled={sending !== null}
              >
                {sending === 'worksheets' ? '발송 중...' : '오늘 학습지 발송'}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendReminders}
                disabled={sending !== null}
              >
                {sending === 'reminders' ? '발송 중...' : '미제출 리마인더 발송'}
              </Button>
            </div>
            {sendResult && (
              <p className={`mt-3 text-sm ${sendResult.includes('실패') || sendResult.includes('오류') ? 'text-red-500' : 'text-green-600'}`}>
                {sendResult}
              </p>
            )}
          </CardContent>
        </Card>

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
