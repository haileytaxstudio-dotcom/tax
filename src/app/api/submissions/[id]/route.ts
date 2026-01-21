import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 제출물 상태 변경 (관리자가 확인 완료 처리)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { status } = body;

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
      student:students(*),
      worksheet:worksheets(*)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 확인 완료 시 알림톡 발송
  if (status === 'confirmed' && data.student && data.worksheet) {
    const student = data.student;
    const worksheet = data.worksheet;

    // "오늘자 시험지 정상" 알림 발송
    await sendKakaoNotification(student, 'confirm', worksheet);

    // 전체 과정 완료 여부 확인
    const isCompleted = await checkCourseCompletion(supabase, student.id, student.curriculum_id);
    if (isCompleted) {
      // "최종회차 멘트" 알림 발송
      await sendKakaoNotification(student, 'complete', worksheet);

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
  // 커리큘럼의 전체 학습지 수
  const { count: totalWorksheets } = await supabase
    .from('worksheets')
    .select('*', { count: 'exact', head: true })
    .eq('curriculum_id', curriculumId);

  // 학생이 확인 완료한 제출물 수
  const { count: confirmedSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('status', 'confirmed');

  return totalWorksheets !== null &&
         confirmedSubmissions !== null &&
         totalWorksheets > 0 &&
         confirmedSubmissions >= totalWorksheets;
}

// 카카오 알림톡 발송 함수
async function sendKakaoNotification(
  student: { id: string; name: string; phone: string },
  messageType: 'confirm' | 'complete',
  worksheet: { title: string; description?: string }
): Promise<void> {
  const templateNo = messageType === 'confirm'
    ? process.env.KAKAO_TEMPLATE_CONFIRM
    : process.env.KAKAO_TEMPLATE_COMPLETE;

  if (!templateNo) return;

  const supabase = createServerSupabaseClient();

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
            note1: worksheet.title,
            note2: worksheet.description || '',
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
  } catch (error) {
    console.error('알림톡 발송 오류:', error);
  }
}
