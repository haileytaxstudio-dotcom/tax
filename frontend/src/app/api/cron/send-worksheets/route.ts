import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Vercel Cron에서 호출되는 학습지 자동 발송 API
// 매일 KST 08:00에 실행 (vercel.json: "0 23 * * *")
export async function GET(request: NextRequest) {
  // Cron 시크릿 검증 (선택적)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 개발 환경에서는 통과
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServerSupabaseClient();
  const now = new Date();
  // 한국 시간 기준 현재 날짜 (YYYY-MM-DD 형식)
  const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const results: Array<{ studentId: string; worksheetId: string; success: boolean; error?: string }> = [];

  try {
    // 1. 오늘 학습 시작인 학습자들에게 시작 알림 발송 (17번 템플릿)
    const { data: startingStudents } = await supabase
      .from('students')
      .select('*')
      .eq('start_date', today)
      .eq('status', 'active');

    if (startingStudents && startingStudents.length > 0) {
      const sentPhones = new Set<string>();
      for (const student of startingStudents) {
        if (sentPhones.has(student.phone)) continue;
        sentPhones.add(student.phone);
        await sendKakaoNotification(student, 'start', null);
      }
    }

    // 2. 활성 학습자들에게 오늘 발송 예정인 학습지 pending 생성 (알림톡 발송 없음)
    const { data: activeStudents } = await supabase
      .from('students')
      .select(`
        *,
        curriculum:curriculums(*)
      `)
      .eq('status', 'active')
      .lte('start_date', today);

    if (activeStudents) {
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
            // 이미 발송했는지 확인 (kakao_logs 테이블)
            const { data: existingLog } = await supabase
              .from('kakao_logs')
              .select('id')
              .eq('student_id', student.id)
              .eq('message_type', 'worksheet')
              .gte('created_at', today)
              .single();

            if (!existingLog) {
              // 제출물 레코드 생성 (pending 상태) - 미제출자 관리용
              // ignoreDuplicates: 이미 존재하는 레코드(submitted/confirmed)를 덮어쓰지 않음
              await supabase
                .from('submissions')
                .upsert({
                  student_id: student.id,
                  worksheet_id: worksheet.id,
                  status: 'pending',
                }, { onConflict: 'student_id,worksheet_id', ignoreDuplicates: true });

              // 5번 알림톡 발송 제거됨 - 제출 완료 시 20번 템플릿에서 다음 학습지 안내
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '학습지 발송 작업이 완료되었습니다.',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron 작업 오류:', error);
    return NextResponse.json(
      { error: '학습지 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 카카오 알림톡 발송 함수
async function sendKakaoNotification(
  student: any,
  messageType: 'start' | 'worksheet' | 'reminder',
  worksheet: any | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  // 템플릿 번호 설정 (환경변수에서 가져옴)
  const templateNo = getTemplateNo(messageType);

  if (!templateNo) {
    return { success: false, error: '템플릿 번호가 설정되지 않았습니다.' };
  }

  try {
    // note1: 버튼 URL 경로 (제출 페이지)
    // note2: 학습지 제목
    // note3: 학습자 이름
    const submitPath = worksheet ? `student/submit/${worksheet.id}` : '';

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/kakao/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateNo,
        receivers: [
          {
            name: student.name,
            mobile: student.phone,
            note1: submitPath,
            note2: worksheet?.title || '',
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

    return { success: result.success, error: result.message };
  } catch (error) {
    console.error('알림톡 발송 오류:', error);
    return { success: false, error: String(error) };
  }
}

function getTemplateNo(messageType: string): string | null {
  switch (messageType) {
    case 'start':
      return process.env.KAKAO_TEMPLATE_START || null;
    case 'worksheet':
      return process.env.KAKAO_TEMPLATE_WORKSHEET || null;
    case 'reminder':
      return process.env.KAKAO_TEMPLATE_REMINDER || null;
    default:
      return null;
  }
}
