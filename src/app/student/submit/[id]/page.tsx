import Link from 'next/link';
import { SubmitForm } from '@/components/student/SubmitForm';
import { mockWorksheets } from '@/data/mockWorksheets';

interface SubmitPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SubmitPage({ params }: SubmitPageProps) {
  const { id } = await params;
  const worksheet = mockWorksheets.find((w) => w.id === id);

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

      <SubmitForm worksheetId={worksheet.id} worksheetTitle={worksheet.title} />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">학습지 정보</h3>
        <p className="text-sm text-blue-700">{worksheet.description}</p>
        <div className="mt-3">
          <a
            href={worksheet.fileUrl}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            학습지 다운로드
          </a>
        </div>
      </div>
    </div>
  );
}
