import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 학생 인증 (전화번호로 조회 - 여러 과정 지원)
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

    // 전화번호로 학습자 조회 (여러 과정 가능)
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        *,
        curriculum:curriculums(id, name)
      `)
      .eq('phone', phone)
      .eq('status', 'active');

    if (error) {
      console.error('학생 조회 오류:', error);
      return NextResponse.json(
        { error: '조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: '등록되지 않은 전화번호입니다.' },
        { status: 404 }
      );
    }

    // 여러 과정 수강 시 모든 등록 정보 반환
    return NextResponse.json({
      enrollments: students,
      currentEnrollment: students[0],
    });
  } catch (error) {
    console.error('학생 인증 오류:', error);
    return NextResponse.json(
      { error: '인증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
