'use client';

import { useState, useEffect } from 'react';
import { Header, Card, CardContent, Button, Badge, ProgressBar } from '@/components/common';
import { formatDate } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  phone: string;
  start_date: string;
  curriculum_id: string;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  curriculum?: { name: string };
}

interface Curriculum {
  id: string;
  name: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    start_date: string;
    curriculum_id: string;
    status: 'active' | 'paused' | 'completed';
  }>({
    name: '',
    phone: '',
    start_date: '',
    curriculum_id: '',
    status: 'active',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, curriculumsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/curriculums'),
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      if (curriculumsRes.ok) {
        const curriculumsData = await curriculumsRes.json();
        setCurriculums(curriculumsData);
        if (curriculumsData.length > 0 && !formData.curriculum_id) {
          setFormData(prev => ({ ...prev, curriculum_id: curriculumsData[0].id }));
        }
      }
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
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
      const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('삭제 오류:', error);
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      phone: student.phone,
      start_date: student.start_date,
      curriculum_id: student.curriculum_id,
      status: student.status,
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      phone: '',
      start_date: '',
      curriculum_id: curriculums[0]?.id || '',
      status: 'active',
    });
  };

  if (loading) {
    return (
      <div>
        <Header title="학습자 관리" />
        <div className="p-6 text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <Header title="학습자 관리" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">총 {students.length}명의 학습자</p>
          <Button onClick={() => setIsAddModalOpen(true)}>학습자 추가</Button>
        </div>

        <Card>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-center text-gray-500 py-8">등록된 학습자가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">과정</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">학습 시작일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진행률</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-600 font-medium">{student.curriculum?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(student.start_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-32">
                            <ProgressBar progress={student.progress || 0} showLabel={false} size="sm" />
                            <span className="text-xs text-gray-500">{student.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge status={student.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditModal(student)}>
                              수정
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(student.id)}>
                              삭제
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingStudent ? '학습자 정보 수정' : '새 학습자 등록'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="홍길동"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01012345678"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학습 시작일 *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학습 과정</label>
                <select
                  value={formData.curriculum_id}
                  onChange={(e) => setFormData({ ...formData, curriculum_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {curriculums.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {editingStudent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">학습중</option>
                    <option value="paused">일시정지</option>
                    <option value="completed">완료</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  취소
                </Button>
                <Button type="submit">
                  {editingStudent ? '저장' : '등록'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
