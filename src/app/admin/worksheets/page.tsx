'use client';

import { useState } from 'react';
import { Header, Button } from '@/components/common';
import { WorksheetForm, WorksheetCard } from '@/components/admin/WorksheetForm';
import { mockWorksheets, mockCurriculums } from '@/data/mockWorksheets';
import { Worksheet } from '@/types';

export default function WorksheetsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWorksheet, setSelectedWorksheet] = useState<Worksheet | undefined>();

  const handleEdit = (worksheet: Worksheet) => {
    setSelectedWorksheet(worksheet);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setSelectedWorksheet(undefined);
    setIsFormOpen(false);
  };

  const handleAdd = () => {
    setSelectedWorksheet(undefined);
    setIsFormOpen(true);
  };

  const curriculum = mockCurriculums[0];

  return (
    <div>
      <Header title="학습지 관리" />
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{curriculum.name}</h2>
              <p className="text-gray-500">{curriculum.description}</p>
            </div>
            <Button onClick={handleAdd}>학습지 추가</Button>
          </div>
        </div>

        <div className="space-y-4">
          {mockWorksheets
            .sort((a, b) => a.order - b.order)
            .map((worksheet, index) => (
              <div key={worksheet.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <WorksheetCard worksheet={worksheet} onEdit={handleEdit} />
                </div>
              </div>
            ))}
        </div>

        {mockWorksheets.length === 0 && (
          <div className="text-center py-12">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">학습지 없음</h3>
            <p className="mt-1 text-sm text-gray-500">새 학습지를 추가해주세요.</p>
            <div className="mt-6">
              <Button onClick={handleAdd}>학습지 추가</Button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && <WorksheetForm worksheet={selectedWorksheet} onClose={handleClose} />}
    </div>
  );
}
