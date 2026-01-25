import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 답안 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { status } = body;

  if (!status || !['submitted', 'confirmed'].includes(status)) {
    return NextResponse.json(
      { error: '유효하지 않은 상태입니다.' },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { status };

  if (status === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('submissions')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      students:student_id(*),
      worksheets:worksheet_id(*)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 확인 완료 시 처리 (알림톡 발송 제거됨)
  if (status === 'confirmed' && data.students && data.worksheets) {
    const student = data.students;

    // 전체 과정 완료 여부 확인
    const isCompleted = await checkCourseCompletion(supabase, student.id, student.curriculum_id);
    if (isCompleted) {
      // 학생 상태를 완료로 변경
      await supabase
        .from('students')
        .update({ status: 'completed' })
        .eq('id', student.id);
    }
  }

  return NextResponse.json(data);
}

// 전체 과정 완료 여부 확인
async function checkCourseCompletion(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  studentId: string,
  curriculumId: string
): Promise<boolean> {
  // 커리큘럼 정보 조회 (total_worksheets 필드)
  const { data: curriculum } = await supabase
    .from('curriculums')
    .select('total_worksheets')
    .eq('id', curriculumId)
    .single();

  // total_worksheets가 설정되어 있으면 그 값 사용, 아니면 실제 학습지 수 사용
  let totalCount: number;

  if (curriculum?.total_worksheets && curriculum.total_worksheets > 0) {
    totalCount = curriculum.total_worksheets;
  } else {
    const { count } = await supabase
      .from('worksheets')
      .select('*', { count: 'exact', head: true })
      .eq('curriculum_id', curriculumId);
    totalCount = count || 0;
  }

  // 학생이 확인 완료한 제출물 수
  const { count: confirmedCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('status', 'confirmed');

  return totalCount > 0 && (confirmedCount || 0) >= totalCount;
}

// 카카오 알림톡 발송 함수
async function sendKakaoNotification(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  student: { id: string; name: string; phone: string },
  messageType: 'confirm' | 'complete',
  worksheet: { title: string }
): Promise<void> {
  const templateNo = messageType === 'confirm'
    ? process.env.KAKAO_TEMPLATE_CONFIRM
    : process.env.KAKAO_TEMPLATE_COMPLETE;

  if (!templateNo) {
    console.log(`${messageType} 템플릿이 설정되지 않음`);
    return;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/kakao/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateNo,
        receivers: [
          {
            name: student.name,
            mobile: student.phone,
            note1: 'student',
            note2: worksheet.title,
            note3: student.name,
          },
        ],
      }),
    });

    const result = await response.json();

    // 발송 로그 저장
    await supabase.from('kakao_logs').insert({
      student_id: student.id,
      template_no: templateNo,
      message_type: messageType,
      status: result.success ? 'success' : 'failed',
      response: result,
    });

    console.log(`${messageType} 알림톡 발송:`, result.success ? '성공' : '실패');
  } catch (error) {
    console.error('알림톡 발송 오류:', error);
  }
}
