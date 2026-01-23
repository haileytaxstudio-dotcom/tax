import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 답안 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { status } = body;

  if (!status || !['submitted', 'confirmed'].includes(status)) {
    return NextResponse.json(
      { error: '유효하지 않은 상태입니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('submissions')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
