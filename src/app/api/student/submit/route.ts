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

// 다음 학습지 알림톡 발송
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

    // 커리큘럼 정보 조회 (총 학습지 개수 확인)
    const { data: curriculum } = await supabase
      .from('curriculums')
      .select('total_worksheets')
      .eq('id', student.curriculum_id)
      .single();

    // 현재까지 제출한 학습지 수 확인
    const { count: submittedCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .in('status', ['submitted', 'confirmed']);

    // 총 학습지 개수 결정 (설정값 or 실제 등록된 학습지 수)
    let totalWorksheets: number;
    if (curriculum?.total_worksheets && curriculum.total_worksheets > 0) {
      totalWorksheets = curriculum.total_worksheets;
    } else {
      const { count } = await supabase
        .from('worksheets')
        .select('*', { count: 'exact', head: true })
        .eq('curriculum_id', student.curriculum_id);
      totalWorksheets = count || 0;
    }

    // 다음 학습지 조회 (day_offset 기준)
    const { data: nextWorksheet } = await supabase
      .from('worksheets')
      .select('*')
      .eq('curriculum_id', student.curriculum_id)
      .gt('day_offset', currentWorksheet.day_offset)
      .order('day_offset', { ascending: true })
      .limit(1)
      .single();

    // 마지막 학습지인지 확인 (총 개수에 도달했거나 다음 학습지가 없는 경우)
    const isLastWorksheet = (submittedCount || 0) >= totalWorksheets || !nextWorksheet;

    if (isLastWorksheet) {
      // 마지막 학습지인 경우 - 과정 완료 알림
      const completeTemplateNo = process.env.KAKAO_TEMPLATE_COMPLETE;
      if (completeTemplateNo) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/kakao/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateNo: completeTemplateNo,
            receivers: [{
              name: student.name,
              mobile: student.phone,
              note1: 'student',
              note2: currentWorksheet.title,
              note3: student.name,
            }],
          }),
        });

        await supabase.from('kakao_logs').insert({
          student_id: studentId,
          template_no: completeTemplateNo,
          message_type: 'complete',
          status: 'success',
          response: { message: '과정 완료 알림 발송' },
        });

        // 학생 상태 완료로 변경
        await supabase
          .from('students')
          .update({ status: 'completed' })
          .eq('id', studentId);
      }
      return;
    }

    // 다음 학습지 제출물 레코드 생성
    await supabase
      .from('submissions')
      .upsert({
        student_id: studentId,
        worksheet_id: nextWorksheet.id,
        status: 'pending',
      }, { onConflict: 'student_id,worksheet_id' });

    // 다음 학습지 알림톡 발송
    const templateNo = process.env.KAKAO_TEMPLATE_WORKSHEET;
    if (!templateNo) return;

    const submitPath = `student/submit/${nextWorksheet.id}`;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/kakao/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateNo,
        receivers: [{
          name: student.name,
          mobile: student.phone,
          note1: submitPath,
          note2: nextWorksheet.title,
          note3: student.name,
        }],
      }),
    });

    const result = await response.json();

    // 발송 로그 저장
    await supabase.from('kakao_logs').insert({
      student_id: studentId,
      template_no: templateNo,
      message_type: 'worksheet',
      status: result.success ? 'success' : 'failed',
      response: result,
    });

    console.log('다음 학습지 발송:', nextWorksheet.title, result.success ? '성공' : '실패');
  } catch (error) {
    console.error('다음 학습지 발송 오류:', error);
  }
}
