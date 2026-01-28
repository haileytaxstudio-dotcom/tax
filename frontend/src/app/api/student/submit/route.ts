import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 답안 제출
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const { student_id, worksheet_id, file_url, notes } = await request.json();

    if (!student_id || !worksheet_id) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 기존 제출물 확인
    const { data: existing } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', student_id)
      .eq('worksheet_id', worksheet_id)
      .single();

    let submission;

    if (existing) {
      // 기존 제출물 업데이트
      const { data, error } = await supabase
        .from('submissions')
        .update({
          file_url,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      submission = data;
    } else {
      // 새 제출물 생성
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          student_id,
          worksheet_id,
          file_url,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      submission = data;
    }

    // 제출 완료 알림톡 발송
    await sendSubmitConfirmation(supabase, student_id, worksheet_id);

    // 다음 학습지 자동 발송
    await sendNextWorksheet(supabase, student_id, worksheet_id);

    return NextResponse.json(submission, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('제출 오류:', error);
    return NextResponse.json(
      { error: '제출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 제출 완료 알림톡 발송
async function sendSubmitConfirmation(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  studentId: string,
  worksheetId: string
) {
  try {
    // 학생 정보 조회
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (!student) return;

    // 학습지 정보 조회
    const { data: worksheet } = await supabase
      .from('worksheets')
      .select('*')
      .eq('id', worksheetId)
      .single();

    if (!worksheet) return;

    // 최종회차인지 확인
    const isFinalWorksheet = await checkIfFinalWorksheet(supabase, student.curriculum_id, worksheetId);

    // 최종회차면 29번, 아니면 20번 템플릿
    const templateNo = isFinalWorksheet
      ? process.env.KAKAO_TEMPLATE_SUBMIT_FINAL
      : process.env.KAKAO_TEMPLATE_SUBMIT;

    if (!templateNo) {
      console.log('제출 완료 템플릿 환경변수가 설정되지 않았습니다.');
      return;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/kakao/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateNo,
        receivers: [{
          name: student.name,
          mobile: student.phone,
          note1: 'student',
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
      message_type: isFinalWorksheet ? 'submit_final' : 'submit',
      status: result.success ? 'success' : 'failed',
      response: result,
    });

    console.log(`${isFinalWorksheet ? '최종회차' : ''} 제출 완료 알림톡 발송:`, result.success ? '성공' : '실패');
  } catch (error) {
    console.error('제출 완료 알림톡 발송 오류:', error);
  }
}

// 최종회차 학습지인지 확인
async function checkIfFinalWorksheet(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  curriculumId: string,
  worksheetId: string
): Promise<boolean> {
  // 커리큘럼의 총 학습지 개수 확인
  const { data: curriculum } = await supabase
    .from('curriculums')
    .select('total_worksheets')
    .eq('id', curriculumId)
    .single();

  // 현재 학습지의 day_offset 확인
  const { data: currentWorksheet } = await supabase
    .from('worksheets')
    .select('day_offset')
    .eq('id', worksheetId)
    .single();

  if (!currentWorksheet) return false;

  // 총 학습지 개수 결정
  let totalWorksheets: number;
  if (curriculum?.total_worksheets && curriculum.total_worksheets > 0) {
    totalWorksheets = curriculum.total_worksheets;
  } else {
    const { count } = await supabase
      .from('worksheets')
      .select('*', { count: 'exact', head: true })
      .eq('curriculum_id', curriculumId);
    totalWorksheets = count || 0;
  }

  // 다음 학습지가 있는지 확인
  const { data: nextWorksheet } = await supabase
    .from('worksheets')
    .select('id')
    .eq('curriculum_id', curriculumId)
    .gt('day_offset', currentWorksheet.day_offset)
    .limit(1)
    .single();

  // 다음 학습지가 없으면 최종회차
  return !nextWorksheet;
}

// 다음 학습지 준비 (알림톡 발송 없이 레코드만 생성)
async function sendNextWorksheet(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  studentId: string,
  currentWorksheetId: string
) {
  try {
    // 학생 정보 조회
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (!student || student.status !== 'active') return;

    // 현재 학습지 정보 조회
    const { data: currentWorksheet } = await supabase
      .from('worksheets')
      .select('*')
      .eq('id', currentWorksheetId)
      .single();

    if (!currentWorksheet) return;

    // 다음 학습지 조회 (day_offset 기준)
    const { data: nextWorksheet } = await supabase
      .from('worksheets')
      .select('*')
      .eq('curriculum_id', student.curriculum_id)
      .gt('day_offset', currentWorksheet.day_offset)
      .order('day_offset', { ascending: true })
      .limit(1)
      .single();

    // 마지막 학습지인 경우 학생 상태 완료로 변경
    if (!nextWorksheet) {
      await supabase
        .from('students')
        .update({ status: 'completed' })
        .eq('id', studentId);
      console.log('과정 완료:', student.name);
      return;
    }

    // 다음 학습지 제출물 레코드 생성 (pending 상태)
    await supabase
      .from('submissions')
      .upsert({
        student_id: studentId,
        worksheet_id: nextWorksheet.id,
        status: 'pending',
      }, { onConflict: 'student_id,worksheet_id' });

    console.log('다음 학습지 준비 완료:', nextWorksheet.title);
  } catch (error) {
    console.error('다음 학습지 준비 오류:', error);
  }
}
