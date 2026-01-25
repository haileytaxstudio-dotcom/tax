import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Vercel Cron에서 호출되는 학습지 자동 발송 API
// 매 시간 정각에 실행: cron: "0 * * * *"
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
  const today = now.toISOString().split('T')[0];
  // 한국 시간 기준 현재 시각 (HH:00 형식)
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const currentHour = koreaTime.getHours().toString().padStart(2, '0') + ':00';
  const results: Array<{ studentId: string; worksheetId: string; success: boolean; error?: string }> = [];

  try {
    // 1. 오늘 학습 시작인 학습자들에게 시작 알림 발송
    const { data: startingStudents } = await supabase
      .from('students')
      .select('*')
      .eq('start_date', today)
      .eq('status', 'active');

    if (startingStudents && startingStudents.length > 0) {
      for (const student of startingStudents) {
        await sendKakaoNotification(student, 'start', null);
      }
    }

    // 2. 활성 학습자들에게 오늘 발송 예정인 학습지 발송
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

        // 오늘 발송해야 할 학습지 조회 (발송 시간 체크)
        const { data: worksheets } = await supabase
          .from('worksheets')
          .select('*')
          .eq('curriculum_id', student.curriculum_id)
          .eq('day_offset', daysSinceStart);

        // 발송 시간이 현재 시간과 일치하는 학습지만 필터링
        const worksheetsToSend = worksheets?.filter(w => {
          const sendTime = w.send_time || '09:00';
          // HH:00 형식으로 변환하여 비교
          const sendHour = sendTime.substring(0, 2) + ':00';
          return sendHour === currentHour;
        }) || [];

        if (worksheetsToSend.length > 0) {
          for (const worksheet of worksheetsToSend) {
            // 이미 발송했는지 확인 (kakao_logs 테이블)
            const { data: existingLog } = await supabase
              .from('kakao_logs')
              .select('id')
              .eq('student_id', student.id)
              .eq('message_type', 'worksheet')
              .gte('created_at', today)
              .single();

            if (!existingLog) {
              // 제출물 레코드 생성 (pending 상태)
              await supabase
                .from('submissions')
                .upsert({
                  student_id: student.id,
                  worksheet_id: worksheet.id,
                  status: 'pending',
                }, { onConflict: 'student_id,worksheet_id' });

              // 알림톡 발송
              const result = await sendKakaoNotification(student, 'worksheet', worksheet);
              results.push({
                studentId: student.id,
                worksheetId: worksheet.id,
                success: result.success,
                error: result.error,
              });
            }
          }
        }
      }
    }

    // 3. 미제출 알림 발송 (reminder_hours 경과한 경우)
    const { data: pendingSubmissions } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students(*),
        worksheet:worksheets(*)
      `)
      .eq('status', 'pending');

    if (pendingSubmissions) {
      for (const submission of pendingSubmissions) {
        const worksheet = submission.worksheet;
        const student = submission.student;

        if (!worksheet || !student || student.status !== 'active') continue;

        const createdAt = new Date(submission.created_at);
        const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceCreated >= worksheet.reminder_hours) {
          // 오늘 이미 리마인더 보냈는지 확인
          const { data: existingReminder } = await supabase
            .from('kakao_logs')
            .select('id')
            .eq('student_id', student.id)
            .eq('message_type', 'reminder')
            .gte('created_at', today)
            .single();

          if (!existingReminder) {
            await sendKakaoNotification(student, 'reminder', worksheet);
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
