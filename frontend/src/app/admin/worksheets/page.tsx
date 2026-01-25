'use client';

import { useState, useEffect } from 'react';
import { Header, Button, Card, CardContent, FileUpload } from '@/components/common';

interface Worksheet {
  id: string;
  title: string;
  description: string;
  file_url: string;
  exam_url: string;
  day_offset: number;
  send_time: string;
  reminder_hours: number;
  curriculum_id: string;
}

interface Curriculum {
  id: string;
  name: string;
  description: string;
}

export default function WorksheetsPage() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorksheet, setEditingWorksheet] = useState<Worksheet | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    exam_url: '',
    day_offset: 1,
    send_time: '09:00',
    reminder_hours: 24,
    curriculum_id: '',
  });

  useEffect(() => {
    fetchCurriculums();
  }, []);

  useEffect(() => {
    if (selectedCurriculum) {
      fetchWorksheets(selectedCurriculum);
    }
  }, [selectedCurriculum]);

  const fetchCurriculums = async () => {
    try {
      const response = await fetch('/api/curriculums');
      if (response.ok) {
        const data = await response.json();
        setCurriculums(data);
        if (data.length > 0) {
          setSelectedCurriculum(data[0].id);
          setFormData(prev => ({ ...prev, curriculum_id: data[0].id }));
        }
      }
    } catch (error) {
      console.error('커리큘럼 로딩 오류:', error);
    }
  };

  const fetchWorksheets = async (curriculumId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/worksheets?curriculum_id=${curriculumId}`);
      if (response.ok) {
        const data = await response.json();
        setWorksheets(data);
      }
    } catch (error) {
      console.error('학습지 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingWorksheet ? `/api/worksheets/${editingWorksheet.id}` : '/api/worksheets';
      const method = editingWorksheet ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, curriculum_id: selectedCurriculum }),
      });

      if (response.ok) {
        await fetchWorksheets(selectedCurriculum);
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
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/worksheets/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchWorksheets(selectedCurriculum);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
    }
  };

  const openEditModal = (worksheet: Worksheet) => {
    setEditingWorksheet(worksheet);
    setFormData({
      title: worksheet.title,
      description: worksheet.description || '',
      file_url: worksheet.file_url || '',
      exam_url: worksheet.exam_url || '',
      day_offset: worksheet.day_offset,
      send_time: worksheet.send_time || '09:00',
      reminder_hours: worksheet.reminder_hours,
      curriculum_id: worksheet.curriculum_id,
    });
    setIsFormOpen(true);
  };

  const closeModal = () => {
    setIsFormOpen(false);
    setEditingWorksheet(null);
    setFormData({
      title: '',
      description: '',
      file_url: '',
      exam_url: '',
      day_offset: worksheets.length + 1,
      send_time: '09:00',
      reminder_hours: 24,
      curriculum_id: selectedCurriculum,
    });
  };

  const handleAdd = () => {
    setEditingWorksheet(null);
    setFormData({
      title: '',
      description: '',
      file_url: '',
      exam_url: '',
      day_offset: worksheets.length + 1,
      send_time: '09:00',
      reminder_hours: 24,
      curriculum_id: selectedCurriculum,
    });
    setIsFormOpen(true);
  };

  const currentCurriculum = curriculums.find(c => c.id === selectedCurriculum);

  if (loading && curriculums.length === 0) {
    return (
      <div>
        <Header title="학습지 관리" />
        <div className="p-6 text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <Header title="학습지 관리" />
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              {curriculums.length > 1 && (
                <select
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {curriculums.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <h2 className="text-xl font-bold text-gray-900">{currentCurriculum?.name || '커리큘럼 없음'}</h2>
              <p className="text-gray-500">{currentCurriculum?.description}</p>
            </div>
            <Button onClick={handleAdd}>학습지 추가</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : worksheets.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            {worksheets
              .sort((a, b) => a.day_offset - b.day_offset)
              .map((worksheet, index) => (
                <div key={worksheet.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{worksheet.title}</h3>
                            {worksheet.description && (
                              <p className="text-sm text-gray-500 mt-1">{worksheet.description}</p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {worksheet.file_url ? (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                  암기노트 O
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                                  암기노트 X
                                </span>
                              )}
                              {worksheet.exam_url ? (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                  시험지 O
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                                  시험지 X
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditModal(worksheet)}>
                              수정
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(worksheet.id)}>
                              삭제
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingWorksheet ? '학습지 수정' : '새 학습지 등록'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="1일차 - 세무 기초 개념"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="학습지에 대한 간략한 설명"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">암기노트 파일</label>
                <FileUpload
                  folder="worksheets"
                  accept=".pdf,.doc,.docx,.hwp,.ppt,.pptx"
                  currentUrl={formData.file_url}
                  label="암기노트 선택"
                  onUpload={(url) => setFormData({ ...formData, file_url: url })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시험지 파일</label>
                <FileUpload
                  folder="worksheets"
                  accept=".pdf,.doc,.docx,.hwp,.ppt,.pptx"
                  currentUrl={formData.exam_url}
                  label="시험지 선택"
                  onUpload={(url) => setFormData({ ...formData, exam_url: url })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  취소
                </Button>
                <Button type="submit">
                  {editingWorksheet ? '저장' : '등록'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
