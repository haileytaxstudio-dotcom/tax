import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 커리큘럼 목록 조회
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const searchParams = request.nextUrl.searchParams;
  const includeCounts = searchParams.get('include_counts') === 'true';

  const { data, error } = await supabase
    .from('curriculums')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (includeCounts && data) {
    const curriculumsWithCounts = await Promise.all(
      data.map(async (curriculum) => {
        const { count: worksheetCount } = await supabase
          .from('worksheets')
          .select('*', { count: 'exact', head: true })
          .eq('curriculum_id', curriculum.id);

        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('curriculum_id', curriculum.id);

        return {
          ...curriculum,
          worksheetCount: worksheetCount || 0,
          studentCount: studentCount || 0,
        };
      })
    );
    return NextResponse.json(curriculumsWithCounts);
  }

  return NextResponse.json(data);
}

// 커리큘럼 등록
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { name, description, total_worksheets } = body;

  if (!name) {
    return NextResponse.json(
      { error: '커리큘럼 이름은 필수입니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('curriculums')
    .insert({ name, description: description || '', total_worksheets: total_worksheets || 0 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
