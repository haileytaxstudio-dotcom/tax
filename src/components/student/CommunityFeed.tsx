'use client';

import { useState } from 'react';
import { Card, CardContent, Badge, ProgressBar } from '@/components/common';
import { formatDateTime } from '@/lib/utils';

interface CommunitySubmission {
  id: string;
  studentName: string;
  worksheetTitle: string;
  submittedAt: string;
  progress: number;
}

interface CommunityFeedProps {
  submissions: CommunitySubmission[];
}

export function CommunityFeed({ submissions }: CommunityFeedProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<CommunitySubmission | null>(null);

  return (
    <>
      <div className="space-y-4">
        {submissions.map((submission) => (
          <Card
            key={submission.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedSubmission(submission)}
          >
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {submission.studentName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{submission.studentName}</p>
                    <p className="text-sm text-gray-500">{submission.worksheetTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {formatDateTime(submission.submittedAt)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">진행률</span>
                    <div className="w-16">
                      <ProgressBar progress={submission.progress} showLabel={false} size="sm" />
                    </div>
                    <span className="text-xs text-gray-600">{submission.progress}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedSubmission.studentName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedSubmission.studentName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedSubmission.worksheetTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg
                    className="mx-auto h-16 w-16 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p>답안지 미리보기</p>
                  <p className="text-sm mt-1">(목업 데이터)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
