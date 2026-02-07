import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 미제출자 목록 조회
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const searchParams = request.nextUrl.searchParams;
  const minDays = parseInt(searchParams.get('min_days') || '1');

  try {
    // pending 상태인 제출물 조회
    const { data: pendingSubmissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        student:students(*),
        worksheet:worksheets(*)
      `)
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const today = new Date();
    const nonSubmitters = [];

    for (const submission of pendingSubmissions || []) {
      const student = submission.student;
      const worksheet = submission.worksheet;

      if (!student || !worksheet || student.status !== 'active') continue;

      // 제출물 생성일로부터 경과일 계산
      const createdAt = new Date(submission.created_at);
      const daysSinceWorksheet = Math.floor(
        (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceWorksheet >= minDays) {
        nonSubmitters.push({
          student: {
            id: student.id,
            name: student.name,
            phone: student.phone,
            start_date: student.start_date,
          },
          worksheet: {
            id: worksheet.id,
            title: worksheet.title,
          },
          daysSinceWorksheet,
          lastWorksheetDate: createdAt.toISOString(),
        });
      }
    }

    // phone 기준으로 중복 제거 (가장 오래된 미제출 건만 유지)
    const phoneMap = new Map<string, typeof nonSubmitters[0]>();
    for (const item of nonSubmitters) {
      const existing = phoneMap.get(item.student.phone);
      if (!existing || item.daysSinceWorksheet > existing.daysSinceWorksheet) {
        phoneMap.set(item.student.phone, item);
      }
    }
    const dedupedNonSubmitters = Array.from(phoneMap.values());

    // 경과일 기준 내림차순 정렬
    dedupedNonSubmitters.sort((a, b) => b.daysSinceWorksheet - a.daysSinceWorksheet);

    return NextResponse.json({ nonSubmitters: dedupedNonSubmitters });
  } catch (error) {
    console.error('미제출자 조회 오류:', error);
    return NextResponse.json(
      { error: '미제출자 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
