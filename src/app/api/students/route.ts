import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 학습자 목록 조회
export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      curriculum:curriculums(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 각 학습자의 진행률 계산
  const studentsWithProgress = await Promise.all(
    data.map(async (student) => {
      const { data: worksheets } = await supabase
        .from('worksheets')
        .select('id')
        .eq('curriculum_id', student.curriculum_id);

      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('student_id', student.id)
        .in('status', ['submitted', 'confirmed']);

      const totalWorksheets = worksheets?.length || 0;
      const completedSubmissions = submissions?.length || 0;
      const progress = totalWorksheets > 0
        ? Math.round((completedSubmissions / totalWorksheets) * 100)
        : 0;

      return { ...student, progress };
    })
  );

  return NextResponse.json(studentsWithProgress);
}

// 학습자 등록
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { name, phone, start_date, curriculum_id } = body;

  if (!name || !phone || !start_date || !curriculum_id) {
    return NextResponse.json(
      { error: '필수 항목을 모두 입력해주세요.' },
      { status: 400 }
    );
  }

  // 전화번호 중복 체크
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('phone', phone.replace(/-/g, ''))
    .single();

  if (existing) {
    return NextResponse.json(
      { error: '이미 등록된 전화번호입니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('students')
    .insert({
      name,
      phone: phone.replace(/-/g, ''),
      start_date,
      curriculum_id,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 시작일이 오늘인 경우에만 알림톡 발송
  const today = new Date().toISOString().split('T')[0];
  if (start_date === today) {
    await sendWelcomeNotification(supabase, data);
  }

  return NextResponse.json(data, { status: 201 });
}

// 환영 알림톡 발송
async function sendWelcomeNotification(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  student: { id: string; name: string; phone: string }
) {
  const templateNo = process.env.KAKAO_TEMPLATE_START;

  if (!templateNo) {
    console.log('KAKAO_TEMPLATE_START 환경변수가 설정되지 않았습니다.');
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
          },
        ],
      }),
    });

    const result = await response.json();

    // 발송 로그 저장
    await supabase.from('kakao_logs').insert({
      student_id: student.id,
      template_no: templateNo,
      message_type: 'start',
      status: result.success ? 'success' : 'failed',
      response: result,
    });

    console.log('환영 알림톡 발송 결과:', result);
  } catch (error) {
    console.error('환영 알림톡 발송 오류:', error);
  }
}
