import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 커뮤니티 데이터 조회
export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    // 전체 학습자 통계
    const { data: students } = await supabase
      .from('students')
      .select('id, curriculum_id');

    // 각 학습자별 진행률 계산
    const progressList: number[] = [];

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
          const progress = Math.round(((submissionCount || 0) / worksheetCount) * 100);
          progressList.push(progress);
        } else {
          progressList.push(0);
        }
      }
    }

    const averageProgress = progressList.length > 0
      ? Math.round(progressList.reduce((a, b) => a + b, 0) / progressList.length)
      : 0;

    // 진행률 분포 계산
    const progressDistribution = [
      { range: '100%', count: progressList.filter(p => p === 100).length },
      { range: '75-99%', count: progressList.filter(p => p >= 75 && p < 100).length },
      { range: '50-74%', count: progressList.filter(p => p >= 50 && p < 75).length },
      { range: '25-49%', count: progressList.filter(p => p >= 25 && p < 50).length },
      { range: '0-24%', count: progressList.filter(p => p < 25).length },
    ];

    // 최근 제출물 (확인된 것만)
    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select(`
        id,
        submitted_at,
        student:students(name),
        worksheet:worksheets(title)
      `)
      .eq('status', 'confirmed')
      .order('submitted_at', { ascending: false })
      .limit(10);

    const submissions = (recentSubmissions || []).map((s: any) => ({
      id: s.id,
      studentName: s.student?.name || '익명',
      worksheetTitle: s.worksheet?.title || '학습지',
      submittedAt: s.submitted_at,
    }));

    return NextResponse.json({
      totalStudents: students?.length || 0,
      averageProgress,
      progressDistribution,
      recentSubmissions: submissions,
    });
  } catch (error) {
    console.error('커뮤니티 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
