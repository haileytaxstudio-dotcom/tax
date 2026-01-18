'use client';

import { useState } from 'react';
import { Header, Card, CardContent, Button } from '@/components/common';
import { StudentTable } from '@/components/admin/StudentTable';
import { mockStudents } from '@/data/mockStudents';

export default function StudentsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div>
      <Header title="학습자 관리" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">총 {mockStudents.length}명의 학습자</p>
          <Button onClick={() => setIsAddModalOpen(true)}>학습자 추가</Button>
        </div>

        <Card>
          <CardContent>
            <StudentTable students={mockStudents} />
          </CardContent>
        </Card>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">새 학습자 등록</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                <input
                  type="text"
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학습 시작일 *</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학습 과정</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="curriculum-1">세무 기초 과정</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  취소
                </Button>
                <Button type="button" onClick={() => setIsAddModalOpen(false)}>
                  등록
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
