import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 커뮤니티 데이터 조회
export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    // 3개 쿼리를 병렬로 실행
    const [studentsResult, worksheetsResult, submissionsResult] = await Promise.all([
      // 1. 전체 학습자 조회
      supabase
        .from('students')
        .select('id, name, curriculum_id')
        .eq('status', 'active')
        .order('name', { ascending: true }),
      // 2. 전체 학습지 조회 (curriculum별 개수 계산용)
      supabase
        .from('worksheets')
        .select('curriculum_id'),
      // 3. 제출된 답안 조회 (학습자별 개수 계산용)
      supabase
        .from('submissions')
        .select('student_id')
        .in('status', ['submitted', 'confirmed']),
    ]);

    const students = studentsResult.data || [];
    const worksheets = worksheetsResult.data || [];
    const submissions = submissionsResult.data || [];

    // curriculum별 학습지 개수 계산
    const worksheetCountMap = new Map<string, number>();
    for (const ws of worksheets) {
      if (ws.curriculum_id) {
        worksheetCountMap.set(ws.curriculum_id, (worksheetCountMap.get(ws.curriculum_id) || 0) + 1);
      }
    }

    // 학습자별 제출 개수 계산
    const submissionCountMap = new Map<string, number>();
    for (const sub of submissions) {
      if (sub.student_id) {
        submissionCountMap.set(sub.student_id, (submissionCountMap.get(sub.student_id) || 0) + 1);
      }
    }

    // 학습자별 진행률 계산
    const studentsWithProgress = students.map((student) => {
      const total = student.curriculum_id ? (worksheetCountMap.get(student.curriculum_id) || 0) : 0;
      const completed = submissionCountMap.get(student.id) || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: student.id,
        name: student.name,
        progress,
        completedCount: completed,
        totalCount: total,
      };
    });

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
