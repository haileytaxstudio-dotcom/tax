import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 제출물 목록 조회
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const worksheetId = searchParams.get('worksheet_id');
  const status = searchParams.get('status');

  let query = supabase
    .from('submissions')
    .select(`
      *,
      student:students(name, phone),
      worksheet:worksheets(title)
    `)
    .order('created_at', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }
  if (worksheetId) {
    query = query.eq('worksheet_id', worksheetId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// 제출물 등록 (학습자가 답안 제출)
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await request.json();

  const { student_id, worksheet_id, file_url } = body;

  if (!student_id || !worksheet_id) {
    return NextResponse.json(
      { error: '학습자와 학습지 정보는 필수입니다.' },
      { status: 400 }
    );
  }

  // 이미 제출했는지 확인
  const { data: existing } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('student_id', student_id)
    .eq('worksheet_id', worksheet_id)
    .single();

  if (existing) {
    // 이미 존재하면 업데이트
    const { data, error } = await supabase
      .from('submissions')
      .update({
        file_url,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // 새로 생성
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      student_id,
      worksheet_id,
      file_url,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
