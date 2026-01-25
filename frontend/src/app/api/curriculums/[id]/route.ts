import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 커리큘럼 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { name, description, total_worksheets } = body;

  if (!name) {
    return NextResponse.json(
      { error: '과정명은 필수입니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('curriculums')
    .update({ name, description: description || '', total_worksheets: total_worksheets || 0 })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 커리큘럼 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  // 학습자가 있는지 확인
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('curriculum_id', id);

  if (studentCount && studentCount > 0) {
    return NextResponse.json(
      { error: '학습자가 등록된 과정은 삭제할 수 없습니다.' },
      { status: 400 }
    );
  }

  // 학습지 먼저 삭제
  await supabase
    .from('worksheets')
    .delete()
    .eq('curriculum_id', id);

  // 커리큘럼 삭제
  const { error } = await supabase
    .from('curriculums')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
