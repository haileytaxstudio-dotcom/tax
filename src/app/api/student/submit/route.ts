import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 답안 제출
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const { student_id, worksheet_id, file_url, notes } = await request.json();

    if (!student_id || !worksheet_id) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 기존 제출물 확인
    const { data: existing } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', student_id)
      .eq('worksheet_id', worksheet_id)
      .single();

    if (existing) {
      // 기존 제출물 업데이트
      const { data, error } = await supabase
        .from('submissions')
        .update({
          file_url,
          notes,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // 새 제출물 생성
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          student_id,
          worksheet_id,
          file_url,
          notes,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error('제출 오류:', error);
    return NextResponse.json(
      { error: '제출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
