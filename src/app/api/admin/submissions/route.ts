import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 제출된 답안 목록 조회
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'all';
  const curriculumId = searchParams.get('curriculum_id');

  try {
    let query = supabase
      .from('submissions')
      .select(`
        *,
        students:student_id (id, name, phone, curriculum_id),
        worksheets:worksheet_id (id, title)
      `)
      .in('status', ['submitted', 'confirmed'])
      .order('submitted_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 커리큘럼 필터링 (학생의 curriculum_id로)
    let filtered = submissions || [];
    if (curriculumId) {
      filtered = filtered.filter((s: any) => s.students?.curriculum_id === curriculumId);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('답안 조회 오류:', error);
    return NextResponse.json(
      { error: '답안을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
