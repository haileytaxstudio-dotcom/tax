import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 오늘 학습지 수동 발송
export async function POST() {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  let sentCount = 0;

  try {
    // 활성 학습자들 조회
    const { data: activeStudents, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', today);

    if (studentsError) {
      return NextResponse.json({ success: false, error: studentsError.message }, { status: 500 });
    }

    if (!activeStudents || activeStudents.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: '발송 대상이 없습니다.' });
    }

    for (const student of activeStudents) {
      // 학습 시작일로부터 경과한 일수 계산
      const startDate = new Date(student.start_date);
      const todayDate = new Date(today);
      const daysSinceStart = Math.floor(
        (todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 오늘 발송해야 할 학습지 조회
      const { data: worksheets } = await supabase
        .from('worksheets')
        .select('*')
        .eq('curriculum_id', student.curriculum_id)
        .eq('day_offset', daysSinceStart);

      if (worksheets && worksheets.length > 0) {
        for (const worksheet of worksheets) {
          // 이미 발송했는지 확인
          const { data: existingLog } = await supabase
            .from('kakao_logs')
            .select('id')
            .eq('student_id', student.id)
            .eq('message_type', 'worksheet')
            .gte('created_at', today)
            .single();

          if (!existingLog) {
            // 제출물 레코드 생성
            await supabase
              .from('submissions')
              .upsert({
                student_id: student.id,
                worksheet_id: worksheet.id,
                status: 'pending',
              }, { onConflict: 'student_id,worksheet_id' });

            // 알림톡 발송
            const templateNo = process.env.KAKAO_TEMPLATE_WORKSHEET;
            if (templateNo) {
              const submitPath = `student/submit/${worksheet.id}`;

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
                student_id: student.id,
                template_no: templateNo,
                message_type: 'worksheet',
                status: result.success ? 'success' : 'failed',
                response: result,
              });

              if (result.success) sentCount++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      message: `${sentCount}건의 학습지를 발송했습니다.`,
    });
  } catch (error) {
    console.error('학습지 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: '학습지 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
