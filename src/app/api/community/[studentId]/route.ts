import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 특정 학생의 제출물 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const supabase = createServerSupabaseClient();

  try {
    // 학생 정보 조회
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, curriculum_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 학생의 제출물 조회 (회차 정보 포함)
    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        id,
        file_url,
        status,
        submitted_at,
        worksheets:worksheet_id (id, title, day_offset)
      `)
      .eq('student_id', studentId)
      .in('status', ['submitted', 'confirmed'])
      .order('submitted_at', { ascending: true });

    // 회차별로 정렬
    const sortedSubmissions = (submissions || [])
      .filter((s: any) => s.worksheets)
      .sort((a: any, b: any) => a.worksheets.day_offset - b.worksheets.day_offset)
      .map((s: any) => ({
        id: s.id,
        worksheetId: s.worksheets.id,
        worksheetTitle: s.worksheets.title,
        dayOffset: s.worksheets.day_offset,
        fileUrl: s.file_url,
        status: s.status,
        submittedAt: s.submitted_at,
      }));

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
      },
      submissions: sortedSubmissions,
    });
  } catch (error) {
    console.error('제출물 조회 오류:', error);
    return NextResponse.json(
      { error: '제출물을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
