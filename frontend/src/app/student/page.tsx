'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStudent } from '@/context/StudentContext';
import { ProgressCard } from '@/components/student/ProgressCard';
import { Card, CardContent, Badge } from '@/components/common';

interface WorksheetStatus {
  worksheetId: string;
  worksheetTitle: string;
  description: string;
  fileUrl: string;
  examUrl: string;
  dayOffset: number;
  status: 'locked' | 'available' | 'submitted' | 'confirmed';
  submittedAt?: string;
}

interface WorksheetData {
  worksheets: WorksheetStatus[];
  progress: number;
  completedCount: number;
  totalCount: number;
  daysPassed: number;
}

export default function StudentDashboard() {
  const { student } = useStudent();
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      setLoading(true);
      setData(null);
      fetchWorksheets();
    }
  }, [student?.id]);

  const fetchWorksheets = async () => {
    if (!student) return;

    try {
      const response = await fetch(`/api/student/worksheets?student_id=${student.id}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        console.error('학습지 로딩 오류:', result.error);
        setData({ worksheets: [], progress: 0, completedCount: 0, totalCount: 0, daysPassed: 0 });
      }
    } catch (error) {
      console.error('학습지 로딩 오류:', error);
      setData({ worksheets: [], progress: 0, completedCount: 0, totalCount: 0, daysPassed: 0 });
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

  const worksheets = data?.worksheets || [];
  const progress = data?.progress || 0;
  const completedCount = data?.completedCount || 0;
  const totalCount = data?.totalCount || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          안녕하세요, {student.name}님
        </h1>
        <p className="text-gray-500">
          {student.curriculum?.name || '세무사 헤일리의 암기노트'} 과정을 학습 중입니다.
        </p>
      </div>

      <ProgressCard
        myProgress={progress}
        averageProgress={0}
        completedCount={completedCount}
        totalCount={totalCount}
      />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">학습지 목록</h2>

        {worksheets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">등록된 학습지가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {worksheets.map((worksheet) => (
              <Card key={worksheet.worksheetId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {worksheet.worksheetTitle}
                        </h3>
                        <StatusBadge status={worksheet.status} />
                      </div>
                      {worksheet.description && (
                        <p className="text-sm text-gray-500">{worksheet.description}</p>
                      )}
                      {worksheet.submittedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          제출일: {new Date(worksheet.submittedAt).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {worksheet.status !== 'locked' && worksheet.fileUrl && (
                        <a
                          href={`/api/download?url=${encodeURIComponent(worksheet.fileUrl)}&filename=${encodeURIComponent(worksheet.worksheetTitle + '_암기노트')}`}
                          className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          암기노트
                        </a>
                      )}
                      {worksheet.status !== 'locked' && worksheet.examUrl && (
                        <a
                          href={`/api/download?url=${encodeURIComponent(worksheet.examUrl)}&filename=${encodeURIComponent(worksheet.worksheetTitle + '_시험지')}`}
                          className="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          시험지
                        </a>
                      )}
                      {worksheet.status === 'available' && (
                        <Link
                          href={`/student/submit/${worksheet.worksheetId}`}
                          className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          제출하기
                        </Link>
                      )}
                      {(worksheet.status === 'submitted' || worksheet.status === 'confirmed') && (
                        <Link
                          href={`/student/submit/${worksheet.worksheetId}`}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          수정하기
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { text: string; className: string }> = {
    locked: { text: '미공개', className: 'bg-gray-100 text-gray-600' },
    available: { text: '미제출', className: 'bg-yellow-100 text-yellow-700' },
    submitted: { text: '제출완료', className: 'bg-blue-100 text-blue-700' },
    confirmed: { text: '확인완료', className: 'bg-green-100 text-green-700' },
  };

  const config = statusConfig[status] || statusConfig.locked;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.className}`}>
      {config.text}
    </span>
  );
}
