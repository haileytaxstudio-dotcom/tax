import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 선택한 미제출자에게 리마인더 발송
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const { targets } = await request.json();

    if (!targets || targets.length === 0) {
      return NextResponse.json(
        { success: false, error: '발송 대상이 없습니다.' },
        { status: 400 }
      );
    }

    const templateNo = process.env.KAKAO_TEMPLATE_REMINDER;
    if (!templateNo) {
      return NextResponse.json(
        { success: false, error: '리마인더 템플릿이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    let sentCount = 0;
    const sentPhones = new Set<string>();

    for (const target of targets) {
      const { studentId, worksheetId } = target;

      // 학생 정보 조회
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      // 학습지 정보 조회
      const { data: worksheet } = await supabase
        .from('worksheets')
        .select('*')
        .eq('id', worksheetId)
        .single();

      if (!student || !worksheet) continue;

      // 같은 전화번호에 이미 발송했으면 스킵
      if (sentPhones.has(student.phone)) continue;
      sentPhones.add(student.phone);

      const submitPath = `student/submit/${worksheetId}`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/kakao/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateNo,
          receivers: [{
            name: student.name,
            mobile: student.phone,
            note1: submitPath,
            note2: worksheet.title,
            note3: student.name,
          }],
        }),
      });

      const result = await response.json();

      // 발송 로그 저장
      await supabase.from('kakao_logs').insert({
        student_id: studentId,
        template_no: templateNo,
        message_type: 'reminder',
        status: result.success ? 'success' : 'failed',
        response: result,
      });

      if (result.success) sentCount++;
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      message: `${sentCount}건의 리마인더를 발송했습니다.`,
    });
  } catch (error) {
    console.error('리마인더 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: '리마인더 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
