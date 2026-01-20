import { NextResponse } from 'next/server';

export async function GET() {
  const username = process.env.DIRECTSEND_USERNAME;
  const key = process.env.DIRECTSEND_API_KEY;

  if (!username || !key) {
    return NextResponse.json(
      { error: 'API 설정이 필요합니다. .env.local 파일을 확인해주세요.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      'https://directsend.co.kr/index.php/api_kakao/template/get/list',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          username,
          key,
          template_type: '3', // 알림톡 템플릿
        }),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('템플릿 조회 오류:', error);
    return NextResponse.json(
      { error: '템플릿 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
