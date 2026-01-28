'use client';

import { useState, useEffect } from 'react';
import { Header, Button, Card, CardContent } from '@/components/common';

interface Submission {
  id: string;
  student_id: string;
  worksheet_id: string;
  file_url: string;
  status: 'submitted' | 'confirmed';
  submitted_at: string;
  students: {
    id: string;
    name: string;
    phone: string;
    curriculum_id: string;
  };
  worksheets: {
    id: string;
    title: string;
  };
}

interface Curriculum {
  id: string;
  name: string;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurriculums();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [selectedCurriculum, statusFilter]);

  const fetchCurriculums = async () => {
    try {
      const response = await fetch('/api/curriculums');
      if (response.ok) {
        const data = await response.json();
        setCurriculums(data);
      }
    } catch (error) {
      console.error('커리큘럼 로딩 오류:', error);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/submissions?status=${statusFilter}`;
      if (selectedCurriculum) {
        url += `&curriculum_id=${selectedCurriculum}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('답안 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (response.ok) {
        await fetchSubmissions();
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
    }
  };

  const handleDelete = async (submissionId: string, studentName: string) => {
    if (!confirm(`${studentName}님의 답안을 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('답안이 삭제되었습니다.');
        await fetchSubmissions();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <Header title="답안 관리" />
      <div className="p-6">
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">과정</label>
            <select
              value={selectedCurriculum}
              onChange={(e) => setSelectedCurriculum(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 과정</option>
              {curriculums.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="submitted">제출완료</option>
              <option value="confirmed">확인완료</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">제출된 답안이 없습니다</h3>
              <p className="text-gray-500">학생들이 답안을 제출하면 여기에 표시됩니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {submission.students?.name || '알 수 없음'}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          submission.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {submission.status === 'confirmed' ? '확인완료' : '제출완료'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {submission.worksheets?.title || '학습지 정보 없음'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        제출일: {new Date(submission.submitted_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.file_url && (
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          답안 보기
                        </a>
                      )}
                      {submission.status === 'submitted' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(submission.id)}
                        >
                          확인 완료
                        </Button>
                      )}
                      <button
                        onClick={() => handleDelete(submission.id, submission.students?.name || '알 수 없음')}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
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
