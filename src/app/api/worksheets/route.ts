import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 학습지 목록 조회
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const curriculumId = searchParams.get('curriculum_id');

  let query = supabase
    .from('worksheets')
    .select('*')
    .order('order_num', { ascending: true });

  if (curriculumId) {
    query = query.eq('curriculum_id', curriculumId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 학습지 등록
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { curriculum_id, title, description, file_url, day_offset, reminder_hours, order_num } = body;

  if (!curriculum_id || !title || day_offset === undefined) {
    return NextResponse.json(
      { error: '필수 항목을 모두 입력해주세요.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('worksheets')
    .insert({
      curriculum_id,
      title,
      description: description || '',
      file_url: file_url || '',
      day_offset,
      reminder_hours: reminder_hours || 48,
      order_num: order_num || 1,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
