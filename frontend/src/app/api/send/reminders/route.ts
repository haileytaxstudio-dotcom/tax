import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 미제출 리마인더 대상자 조회
export async function GET() {
  const supabase = createServerSupabaseClient();
  // 한국 시간 기준 현재 날짜
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const targets: Array<{ student: any; worksheet: any }> = [];

  try {
    const { data: pendingSubmissions } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students(*),
        worksheet:worksheets(*)
      `)
      .eq('status', 'pending');

    if (!pendingSubmissions) {
      return NextResponse.json({ targets: [] });
    }

    // 오늘 이미 리마인더 보낸 전화번호 조회 (phone 기준 중복 방지)
    const { data: todayReminders } = await supabase
      .from('kakao_logs')
      .select('student:students(phone)')
      .eq('message_type', 'reminder')
      .gte('created_at', today);

    const alreadySentPhones = new Set(
      todayReminders?.map((log: any) => log.student?.phone).filter(Boolean) || []
    );

    const processedPhones = new Set<string>();

    for (const submission of pendingSubmissions) {
      const student = submission.student;
      const worksheet = submission.worksheet;

      if (!student || !worksheet || student.status !== 'active') continue;

      // 같은 전화번호에 이미 발송했거나 이번 루프에서 처리했으면 스킵
      if (alreadySentPhones.has(student.phone) || processedPhones.has(student.phone)) continue;

      processedPhones.add(student.phone);
      targets.push({ student, worksheet });
    }

    return NextResponse.json({ targets });
  } catch (error) {
    console.error('대상자 조회 오류:', error);
    return NextResponse.json({ targets: [], error: '조회 중 오류 발생' });
  }
}

// 미제출 리마인더 수동 발송
export async function POST() {
  const supabase = createServerSupabaseClient();
  // 한국 시간 기준 현재 날짜
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  let sentCount = 0;

  try {
    const { data: pendingSubmissions } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students(*),
        worksheet:worksheets(*)
      `)
      .eq('status', 'pending');

    if (!pendingSubmissions || pendingSubmissions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: '미제출 학습자가 없습니다.' });
    }

    const templateNo = process.env.KAKAO_TEMPLATE_REMINDER;
    if (!templateNo) {
      return NextResponse.json({ success: false, error: '리마인더 템플릿이 설정되지 않았습니다.' }, { status: 500 });
    }

    // 오늘 이미 리마인더 보낸 전화번호 조회 (phone 기준 중복 방지)
    const { data: todayReminderLogs } = await supabase
      .from('kakao_logs')
      .select('student:students(phone)')
      .eq('message_type', 'reminder')
      .gte('created_at', today);

    const alreadySentPhones = new Set(
      todayReminderLogs?.map((log: any) => log.student?.phone).filter(Boolean) || []
    );

    const processedPhones = new Set<string>();

    for (const submission of pendingSubmissions) {
      const student = submission.student;
      const worksheet = submission.worksheet;

      if (!student || !worksheet || student.status !== 'active') continue;

      // 같은 전화번호에 이미 발송했거나 이번 루프에서 처리했으면 스킵
      if (alreadySentPhones.has(student.phone) || processedPhones.has(student.phone)) continue;

      processedPhones.add(student.phone);

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

      await supabase.from('kakao_logs').insert({
        student_id: student.id,
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
