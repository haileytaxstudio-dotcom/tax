'use client';

import { useState, useEffect } from 'react';
import { Header, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/common';

interface Curriculum {
  id: string;
  name: string;
  description: string;
  created_at: string;
  worksheetCount?: number;
  studentCount?: number;
}

export default function CurriculumsPage() {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCurriculums();
  }, []);

  const fetchCurriculums = async () => {
    try {
      const response = await fetch('/api/curriculums?include_counts=true');
      if (response.ok) {
        const data = await response.json();
        setCurriculums(data);
      }
    } catch (error) {
      console.error('커리큘럼 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCurriculum
        ? `/api/curriculums/${editingCurriculum.id}`
        : '/api/curriculums';
      const method = editingCurriculum ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCurriculums();
        closeModal();
      } else {
        const error = await response.json();
        alert(error.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    const curriculum = curriculums.find(c => c.id === id);
    if (curriculum?.studentCount && curriculum.studentCount > 0) {
      alert('학습자가 등록된 과정은 삭제할 수 없습니다.');
      return;
    }

    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/curriculums/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchCurriculums();
      } else {
        const error = await response.json();
        alert(error.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
    }
  };

  const openEditModal = (curriculum: Curriculum) => {
    setEditingCurriculum(curriculum);
    setFormData({
      name: curriculum.name,
      description: curriculum.description || '',
    });
    setIsFormOpen(true);
  };

  const closeModal = () => {
    setIsFormOpen(false);
    setEditingCurriculum(null);
    setFormData({ name: '', description: '' });
  };

  const handleAdd = () => {
    setEditingCurriculum(null);
    setFormData({ name: '', description: '' });
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <div>
        <Header title="과정 관리" />
        <div className="p-6 text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <Header title="과정 관리" />
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-500">학습 과정을 관리합니다.</p>
          <Button onClick={handleAdd}>새 과정 추가</Button>
        </div>

        {curriculums.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 과정이 없습니다</h3>
              <p className="text-gray-500 mb-4">새 과정을 추가해주세요.</p>
              <Button onClick={handleAdd}>과정 추가</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {curriculums.map((curriculum) => (
              <Card key={curriculum.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{curriculum.name}</h3>
                      {curriculum.description && (
                        <p className="text-sm text-gray-500 mt-1">{curriculum.description}</p>
                      )}
                      <div className="flex gap-4 mt-3 text-sm text-gray-400">
                        <span>학습지: {curriculum.worksheetCount || 0}개</span>
                        <span>학습자: {curriculum.studentCount || 0}명</span>
                        <span>생성일: {new Date(curriculum.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(curriculum)}>
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(curriculum.id)}
                        disabled={(curriculum.studentCount ?? 0) > 0}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 모달 */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCurriculum ? '과정 수정' : '새 과정 추가'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">과정명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 세무 기초 과정"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="과정에 대한 설명"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  취소
                </Button>
                <Button type="submit">
                  {editingCurriculum ? '저장' : '추가'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
