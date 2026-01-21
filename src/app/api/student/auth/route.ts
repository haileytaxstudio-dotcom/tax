import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 학생 인증 (전화번호로 조회)
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 전화번호로 학습자 조회
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        curriculum:curriculums(id, name)
      `)
      .eq('phone', phone)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: '등록되지 않은 전화번호입니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('학생 인증 오류:', error);
    return NextResponse.json(
      { error: '인증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
