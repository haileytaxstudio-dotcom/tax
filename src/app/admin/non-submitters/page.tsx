'use client';

import { useState, useEffect } from 'react';
import { Header, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/common';

interface NonSubmitter {
  student: {
    id: string;
    name: string;
    phone: string;
    start_date: string;
  };
  worksheet: {
    id: string;
    title: string;
  };
  daysSinceWorksheet: number;
  lastWorksheetDate: string;
}

export default function NonSubmittersPage() {
  const [nonSubmitters, setNonSubmitters] = useState<NonSubmitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [minDays, setMinDays] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNonSubmitters();
  }, [minDays]);

  const fetchNonSubmitters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/non-submitters?min_days=${minDays}`);
      if (response.ok) {
        const data = await response.json();
        setNonSubmitters(data.nonSubmitters || []);
      }
    } catch (error) {
      console.error('미제출자 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (studentId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === nonSubmitters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(nonSubmitters.map(n => n.student.id)));
    }
  };

  const handleSendReminders = async () => {
    if (selectedIds.size === 0) {
      alert('발송 대상을 선택해주세요.');
      return;
    }

    if (!confirm(`${selectedIds.size}명에게 리마인더를 발송하시겠습니까?`)) return;

    setSending(true);
    setSendResult(null);

    try {
      const selectedNonSubmitters = nonSubmitters.filter(n => selectedIds.has(n.student.id));

      const response = await fetch('/api/admin/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: selectedNonSubmitters.map(n => ({
            studentId: n.student.id,
            worksheetId: n.worksheet.id,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSendResult(`리마인더 발송 완료: ${result.sent}건`);
        setSelectedIds(new Set());
        fetchNonSubmitters();
      } else {
        setSendResult(`발송 실패: ${result.error}`);
      }
    } catch (error) {
      setSendResult('발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Header title="미제출자 관리" />
      <div className="p-6 space-y-6">
        {/* 필터 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                마지막 학습지 발송 후
              </label>
              <input
                type="number"
                value={minDays}
                onChange={(e) => setMinDays(parseInt(e.target.value) || 1)}
                min={1}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">일 이상 미제출</span>
              <Button variant="outline" onClick={fetchNonSubmitters}>
                조회
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 결과 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>미제출자 목록 ({nonSubmitters.length}명)</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={nonSubmitters.length === 0}
                >
                  {selectedIds.size === nonSubmitters.length ? '전체 해제' : '전체 선택'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendReminders}
                  disabled={sending || selectedIds.size === 0}
                >
                  {sending ? '발송 중...' : `선택 발송 (${selectedIds.size}명)`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sendResult && (
              <div className={`mb-4 p-3 rounded-lg ${sendResult.includes('실패') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {sendResult}
              </div>
            )}

            {loading ? (
              <p className="text-center text-gray-500 py-8">로딩 중...</p>
            ) : nonSubmitters.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {minDays}일 이상 미제출자가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === nonSubmitters.length}
                          onChange={selectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">이름</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">전화번호</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">미제출 학습지</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">경과일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonSubmitters.map((item) => (
                      <tr key={item.student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.student.id)}
                            onChange={() => toggleSelect(item.student.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.student.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.student.phone}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.worksheet.title}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.daysSinceWorksheet >= 7
                              ? 'bg-red-100 text-red-700'
                              : item.daysSinceWorksheet >= 3
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.daysSinceWorksheet}일
                          </span>
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
    </div>
  );
}
