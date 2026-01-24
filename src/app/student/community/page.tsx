'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, ProgressBar } from '@/components/common';
import { useStudent } from '@/context/StudentContext';

interface StudentInfo {
  id: string;
  name: string;
  progress: number;
  completedCount: number;
  totalCount: number;
}

interface Submission {
  id: string;
  worksheetId: string;
  worksheetTitle: string;
  dayOffset: number;
  fileUrl: string;
  status: string;
  submittedAt: string;
}

interface CommunityData {
  totalStudents: number;
  averageProgress: number;
  progressDistribution: Array<{ range: string; count: number }>;
  students: StudentInfo[];
}

export default function CommunityPage() {
  const { student } = useStudent();
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

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

  const fetchStudentSubmissions = async (studentInfo: StudentInfo) => {
    setSelectedStudent(studentInfo);
    setLoadingSubmissions(true);

    try {
      const response = await fetch(`/api/community/${studentInfo.id}`);
      if (response.ok) {
        const result = await response.json();
        setSubmissions(result.submissions);
      }
    } catch (error) {
      console.error('제출물 로딩 오류:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setSubmissions([]);
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
  const students = data?.students || [];

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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">수강생 목록</h2>
        {students.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => fetchStudentSubmissions(s)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="text-sm font-semibold text-blue-600">{s.progress}%</span>
                  </div>
                  <ProgressBar progress={s.progress} showLabel={false} size="sm" />
                  <p className="text-xs text-gray-400 mt-2">
                    {s.completedCount}/{s.totalCount} 완료
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">아직 다른 학습자가 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 제출물 뷰어 모달 */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedStudent.name}님의 제출물
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {loadingSubmissions ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : submissions.length > 0 ? (
                <div className="space-y-4">
                  {submissions.map((submission, index) => (
                    <div key={submission.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                        <span className="font-medium text-gray-900">
                          {index + 1}회차 - {submission.worksheetTitle}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <div className="p-4">
                        {submission.fileUrl ? (
                          isImageFile(submission.fileUrl) ? (
                            <img
                              src={submission.fileUrl}
                              alt={`${index + 1}회차 답안`}
                              className="max-w-full h-auto rounded"
                            />
                          ) : isPdfFile(submission.fileUrl) ? (
                            <iframe
                              src={submission.fileUrl}
                              className="w-full h-96 border-0"
                              title={`${index + 1}회차 답안`}
                            />
                          ) : (
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 underline"
                            >
                              파일 보기
                            </a>
                          )
                        ) : (
                          <p className="text-gray-500 text-sm">파일 없음</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  아직 제출된 답안이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isImageFile(url: string): boolean {
  const ext = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
}

function isPdfFile(url: string): boolean {
  const ext = url.split('.').pop()?.toLowerCase();
  return ext === 'pdf';
}
