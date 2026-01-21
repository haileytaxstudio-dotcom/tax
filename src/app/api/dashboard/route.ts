import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 대시보드 통계 조회
export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    // 전체 학습자 수
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    // 활성 학습자 수
    const { count: activeStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // 미제출 건수
    const { count: pendingSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 평균 진행률 계산
    const { data: students } = await supabase
      .from('students')
      .select('id, curriculum_id');

    let totalProgress = 0;
    if (students && students.length > 0) {
      for (const student of students) {
        const { count: worksheetCount } = await supabase
          .from('worksheets')
          .select('*', { count: 'exact', head: true })
          .eq('curriculum_id', student.curriculum_id);

        const { count: submissionCount } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', student.id)
          .in('status', ['submitted', 'confirmed']);

        if (worksheetCount && worksheetCount > 0) {
          totalProgress += ((submissionCount || 0) / worksheetCount) * 100;
        }
      }
    }

    const averageProgress = students && students.length > 0
      ? Math.round(totalProgress / students.length)
      : 0;

    // 최근 제출물
    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students(name),
        worksheet:worksheets(title)
      `)
      .in('status', ['submitted', 'confirmed'])
      .order('submitted_at', { ascending: false })
      .limit(5);

    // 최근 학습자
    const { data: recentStudents } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        averageProgress,
        pendingSubmissions: pendingSubmissions || 0,
      },
      recentSubmissions: recentSubmissions || [],
      recentStudents: recentStudents || [],
    });
  } catch (error) {
    console.error('대시보드 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '대시보드 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
