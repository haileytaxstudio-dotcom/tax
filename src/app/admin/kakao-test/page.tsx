'use client';

import { useState, useEffect } from 'react';
import { Header, Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';

interface Template {
  user_template_no: string;
  user_template_subject: string;
  user_template_content: string;
  template_status: string;
  template_insp_code: string;
  kakao_plus_name?: string;
}

interface Receiver {
  name: string;
  mobile: string;
  note1: string;
  note2: string;
  note3: string;
  note4: string;
  note5: string;
}

export default function KakaoTestPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const [receiver, setReceiver] = useState<Receiver>({
    name: '',
    mobile: '',
    note1: '',
    note2: '',
    note3: '',
    note4: '',
    note5: '',
  });

  // 템플릿 목록 조회
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kakao/templates');
      const data = await response.json();

      if (data.result === 1 && data.data?.list) {
        // 승인된 템플릿만 필터링
        const approvedTemplates = data.data.list.filter(
          (t: Template) => t.template_insp_code === 'APR'
        );
        setTemplates(approvedTemplates);
      } else {
        console.error('템플릿 조회 실패:', data);
        setResult({ success: false, message: data.message || data.error || '템플릿 조회 실패' });
      }
    } catch (error) {
      console.error('템플릿 조회 오류:', error);
      setResult({ success: false, message: '템플릿 목록을 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // 알림톡 발송
  const sendKakao = async () => {
    if (!selectedTemplate) {
      setResult({ success: false, message: '템플릿을 선택해주세요.' });
      return;
    }

    if (!receiver.mobile) {
      setResult({ success: false, message: '수신자 전화번호를 입력해주세요.' });
      return;
    }

    // 전화번호 형식 정리 (하이픈 제거)
    const cleanMobile = receiver.mobile.replace(/-/g, '');

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/kakao/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateNo: selectedTemplate.user_template_no,
          receivers: [
            {
              name: receiver.name || '테스트',
              mobile: cleanMobile,
              note1: receiver.note1,
              note2: receiver.note2,
              note3: receiver.note3,
              note4: receiver.note4,
              note5: receiver.note5,
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: '알림톡이 발송되었습니다!' });
      } else {
        setResult({
          success: false,
          message: data.message || data.error || '발송에 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('발송 오류:', error);
      setResult({ success: false, message: '발송 중 오류가 발생했습니다.' });
    } finally {
      setSending(false);
    }
  };

  // 템플릿 내용에서 치환 변수 추출
  const extractVariables = (content: string): string[] => {
    const regex = /\#\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.push(match[1]);
    }
    return variables;
  };

  return (
    <div>
      <Header title="카카오 알림톡 테스트" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 템플릿 선택 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>템플릿 선택</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={loading}>
                  {loading ? '로딩...' : '새로고침'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">템플릿 로딩 중...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>등록된 템플릿이 없습니다.</p>
                  <p className="text-sm mt-2">
                    .env.local 파일에 API 설정을 확인해주세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {templates.map((template) => (
                    <div
                      key={template.user_template_no}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate?.user_template_no === template.user_template_no
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {template.user_template_subject}
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          승인됨
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {template.user_template_content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 발송 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>발송 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 수신자 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수신자 전화번호 *
                </label>
                <input
                  type="text"
                  value={receiver.mobile}
                  onChange={(e) => setReceiver({ ...receiver, mobile: e.target.value })}
                  placeholder="01012345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수신자 이름
                </label>
                <input
                  type="text"
                  value={receiver.name}
                  onChange={(e) => setReceiver({ ...receiver, name: e.target.value })}
                  placeholder="홍길동"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 치환 변수 입력 */}
              {selectedTemplate && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    치환 변수 (템플릿에서 사용되는 경우)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {['note1', 'note2', 'note3', 'note4', 'note5'].map((note, index) => (
                      <div key={note}>
                        <label className="block text-xs text-gray-500 mb-1">
                          변수 {index + 1} (NOTE{index + 1})
                        </label>
                        <input
                          type="text"
                          value={receiver[note as keyof Receiver]}
                          onChange={(e) =>
                            setReceiver({ ...receiver, [note]: e.target.value })
                          }
                          placeholder={`변수 ${index + 1}`}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 선택된 템플릿 미리보기 */}
              {selectedTemplate && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">템플릿 미리보기</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">
                      {selectedTemplate.user_template_subject}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedTemplate.user_template_content}
                    </p>
                  </div>
                </div>
              )}

              {/* 결과 메시지 */}
              {result && (
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {result.message}
                </div>
              )}

              {/* 발송 버튼 */}
              <Button
                className="w-full"
                onClick={sendKakao}
                disabled={sending || !selectedTemplate || !receiver.mobile}
              >
                {sending ? '발송 중...' : '알림톡 발송'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 안내 사항 */}
        <Card className="mt-6">
          <CardContent>
            <h3 className="font-medium text-gray-900 mb-2">사용 안내</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. 왼쪽에서 발송할 템플릿을 선택합니다.</li>
              <li>2. 수신자 전화번호를 입력합니다 (하이픈 없이 숫자만).</li>
              <li>3. 템플릿에 치환 변수가 있는 경우 해당 값을 입력합니다.</li>
              <li>4. 발송 버튼을 클릭합니다.</li>
            </ul>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                * 템플릿이 표시되지 않으면 <code className="bg-gray-200 px-1 rounded">.env.local</code> 파일에 API 설정을 확인해주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
