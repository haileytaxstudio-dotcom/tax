import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 커리큘럼 목록 조회
export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('curriculums')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 커리큘럼 등록
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { name, description } = body;

  if (!name) {
    return NextResponse.json(
      { error: '커리큘럼 이름은 필수입니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('curriculums')
    .insert({ name, description: description || '' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
