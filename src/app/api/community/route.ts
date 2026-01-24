import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 커뮤니티 데이터 조회
export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    // 전체 학습자 조회
    const { data: students } = await supabase
      .from('students')
      .select('id, name, curriculum_id')
      .eq('status', 'active')
      .order('name', { ascending: true });

    // 각 학습자별 진행률 계산
    const studentsWithProgress: Array<{
      id: string;
      name: string;
      progress: number;
      completedCount: number;
      totalCount: number;
    }> = [];

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

        const total = worksheetCount || 0;
        const completed = submissionCount || 0;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        studentsWithProgress.push({
          id: student.id,
          name: student.name,
          progress,
          completedCount: completed,
          totalCount: total,
        });
      }
    }

    const progressList = studentsWithProgress.map(s => s.progress);
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

    return NextResponse.json({
      totalStudents: students?.length || 0,
      averageProgress,
      progressDistribution,
      students: studentsWithProgress,
    });
  } catch (error) {
    console.error('커뮤니티 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
