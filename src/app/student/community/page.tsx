'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, ProgressBar } from '@/components/common';
import { useStudent } from '@/context/StudentContext';

interface CommunityData {
  totalStudents: number;
  averageProgress: number;
  progressDistribution: Array<{ range: string; count: number }>;
  recentSubmissions: Array<{
    id: string;
    studentName: string;
    worksheetTitle: string;
    submittedAt: string;
  }>;
}

export default function CommunityPage() {
  const { student } = useStudent();
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      const response = await fetch('/api/community');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('커뮤니티 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">로딩 중...</div>
    );
  }

  const totalStudents = data?.totalStudents || 0;
  const averageProgress = data?.averageProgress || 0;
  const progressDistribution = data?.progressDistribution || [];
  const recentSubmissions = data?.recentSubmissions || [];

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
                  총 {totalStudents}명의 학습자가 참여 중입니다.
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
                          width: totalStudents > 0 ? `${(item.count / totalStudents) * 100}%` : '0%',
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
        {recentSubmissions.length > 0 ? (
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{submission.studentName}</p>
                      <p className="text-sm text-gray-500">{submission.worksheetTitle}</p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(submission.submittedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
