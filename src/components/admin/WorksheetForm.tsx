'use client';

import { useState } from 'react';
import { Button, Card, CardContent } from '@/components/common';
import { Worksheet } from '@/types';

interface WorksheetFormProps {
  worksheet?: Worksheet;
  onClose: () => void;
}

export function WorksheetForm({ worksheet, onClose }: WorksheetFormProps) {
  const [formData, setFormData] = useState({
    title: worksheet?.title || '',
    description: worksheet?.description || '',
    dayOffset: worksheet?.dayOffset || 0,
    reminderHours: worksheet?.reminderHours || 48,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {worksheet ? '학습지 수정' : '새 학습지 등록'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학습지명 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 1주차: 세무 기초 개념"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="학습지에 대한 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              파일 업로드 *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                클릭하거나 파일을 드래그하여 업로드
              </p>
              <p className="mt-1 text-xs text-gray-500">PDF, 이미지 파일 지원</p>
              <input type="file" className="hidden" accept=".pdf,image/*" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                발송 기준일 *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">학습 시작일 +</span>
                <input
                  type="number"
                  min="0"
                  value={formData.dayOffset}
                  onChange={(e) =>
                    setFormData({ ...formData, dayOffset: parseInt(e.target.value) || 0 })
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-600">일</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                미제출 알림 *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={formData.reminderHours}
                  onChange={(e) =>
                    setFormData({ ...formData, reminderHours: parseInt(e.target.value) || 24 })
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-600">시간 후 알림</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">{worksheet ? '저장' : '등록'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface WorksheetCardProps {
  worksheet: Worksheet;
  onEdit: (worksheet: Worksheet) => void;
}

export function WorksheetCard({ worksheet, onEdit }: WorksheetCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{worksheet.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{worksheet.description}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                D+{worksheet.dayOffset} 발송
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                {worksheet.reminderHours}시간 후 알림
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(worksheet)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
