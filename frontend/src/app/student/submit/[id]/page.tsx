'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStudent } from '@/context/StudentContext';
import { Card, CardContent, Button, FileUpload } from '@/components/common';

interface SubmitPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface WorksheetInfo {
  id: string;
  title: string;
  description: string;
  file_url: string;
}

export default function SubmitPage({ params }: SubmitPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { student } = useStudent();
  const [worksheet, setWorksheet] = useState<WorksheetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    file_url: '',
  });

  useEffect(() => {
    if (student) {
      fetchWorksheet();
    }
  }, [student, id]);

  const fetchWorksheet = async () => {
    try {
      // 학습지 정보 가져오기
      const response = await fetch(`/api/worksheets/${id}`);
      if (response.ok) {
        const data = await response.json();
        setWorksheet(data);
      }
    } catch (error) {
      console.error('학습지 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!student || !worksheet) return;

    if (!formData.file_url) {
      alert('답안 파일을 업로드해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          worksheet_id: worksheet.id,
          file_url: formData.file_url,
        }),
      });

      if (response.ok) {
        alert('제출이 완료되었습니다.');
        router.push('/student');
      } else {
        const error = await response.json();
        alert(error.error || '제출에 실패했습니다.');
      }
    } catch (error) {
      console.error('제출 오류:', error);
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
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

  if (!worksheet) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold text-gray-900 mb-2">학습지를 찾을 수 없습니다</h1>
        <Link href="/student" className="text-blue-600 hover:text-blue-700">
          학습 현황으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/student" className="hover:text-gray-700">
          내 학습
        </Link>
        <span>/</span>
        <span className="text-gray-900">답안 제출</span>
      </div>

      <Card>
        <CardContent className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">{worksheet.title}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                답안 파일 *
              </label>
              <FileUpload
                folder="submissions"
                accept=".pdf,.doc,.docx,.hwp,.jpg,.jpeg,.png,.gif"
                currentUrl={formData.file_url}
                label="답안 파일 선택"
                onUpload={(url) => setFormData({ ...formData, file_url: url })}
              />
              <p className="text-xs text-gray-500 mt-2">
                PDF, Word, 한글, 이미지 파일을 업로드할 수 있습니다.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/student">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={submitting || !formData.file_url}>
                {submitting ? '제출 중...' : '제출하기'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {(worksheet.description || worksheet.file_url) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">학습지 정보</h3>
          {worksheet.description && (
            <p className="text-sm text-blue-700">{worksheet.description}</p>
          )}
          {worksheet.file_url && (
            <div className="mt-3">
              <a
                href={`/api/download?url=${encodeURIComponent(worksheet.file_url)}&filename=${encodeURIComponent(worksheet.title + '_학습지')}`}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                학습지 다운로드
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
