import { NextResponse, NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 학생의 학습지 목록 및 상태 조회
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const searchParams = request.nextUrl.searchParams;
  const studentId = searchParams.get('student_id');

  if (!studentId) {
    return NextResponse.json(
      { error: '학생 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    // 학생 정보 조회
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 해당 커리큘럼의 학습지 조회
    const { data: worksheets } = await supabase
      .from('worksheets')
      .select('*')
      .eq('curriculum_id', student.curriculum_id)
      .order('day_offset', { ascending: true });

    // 학생의 제출물 조회
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', studentId);

    // 학습 시작일로부터 경과일 계산
    const startDate = new Date(student.start_date);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // 학습지 상태 계산 (순차적 공개: 이전 학습지 제출해야 다음 공개)
    const sortedWorksheets = (worksheets || []).sort((a, b) => a.day_offset - b.day_offset);

    // 실제 제출된 것만 필터 (pending 제외)
    const actualSubmissions = (submissions || []).filter(
      s => s.status === 'submitted' || s.status === 'confirmed'
    );

    const worksheetStatuses = sortedWorksheets.map((worksheet, index) => {
      const submission = (submissions || []).find(s => s.worksheet_id === worksheet.id);

      let status: 'locked' | 'available' | 'submitted' | 'confirmed';

      if (submission && (submission.status === 'submitted' || submission.status === 'confirmed')) {
        // 실제 제출한 경우
        status = submission.status === 'confirmed' ? 'confirmed' : 'submitted';
      } else if (index === 0) {
        // 첫 번째 학습지는 항상 공개
        status = 'available';
      } else {
        // 이전 학습지가 실제 제출되었는지 확인 (pending 제외)
        const prevWorksheet = sortedWorksheets[index - 1];
        const prevSubmission = actualSubmissions.find(s => s.worksheet_id === prevWorksheet.id);
        status = prevSubmission ? 'available' : 'locked';
      }

      return {
        worksheetId: worksheet.id,
        worksheetTitle: worksheet.title,
        description: worksheet.description,
        fileUrl: worksheet.file_url,
        examUrl: worksheet.exam_url,
        dayOffset: worksheet.day_offset,
        status,
        submittedAt: submission?.submitted_at,
        submissionId: submission?.id,
      };
    });

    // 진행률 계산
    const completedCount = worksheetStatuses.filter(
      w => w.status === 'submitted' || w.status === 'confirmed'
    ).length;
    const totalCount = worksheetStatuses.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return NextResponse.json({
      worksheets: worksheetStatuses,
      progress,
      completedCount,
      totalCount,
      daysPassed,
    });
  } catch (error) {
    console.error('학습지 조회 오류:', error);
    return NextResponse.json(
      { error: '학습지를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
