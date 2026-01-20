import { NextRequest, NextResponse } from 'next/server';

interface Receiver {
  name?: string;
  mobile: string;
  note1?: string;
  note2?: string;
  note3?: string;
  note4?: string;
  note5?: string;
}

interface SendRequest {
  templateNo: string;
  receivers: Receiver[];
  // 대체문자 옵션
  useFallback?: boolean;
  fallbackMessage?: string;
}

export async function POST(request: NextRequest) {
  const username = process.env.DIRECTSEND_USERNAME;
  const key = process.env.DIRECTSEND_API_KEY;
  const kakao_plus_id = process.env.DIRECTSEND_KAKAO_PLUS_ID;
  const sender = process.env.DIRECTSEND_SENDER;

  if (!username || !key || !kakao_plus_id) {
    return NextResponse.json(
      { error: 'API 설정이 필요합니다. .env.local 파일을 확인해주세요.' },
      { status: 500 }
    );
  }

  try {
    const body: SendRequest = await request.json();
    const { templateNo, receivers, useFallback, fallbackMessage } = body;

    if (!templateNo || !receivers || receivers.length === 0) {
      return NextResponse.json(
        { error: '템플릿 번호와 수신자 정보는 필수입니다.' },
        { status: 400 }
      );
    }

    // API 요청 데이터 구성
    const requestData: Record<string, unknown> = {
      username,
      key,
      kakao_plus_id,
      user_template_no: templateNo,
      receiver: receivers,
    };

    // 대체문자 사용 시
    if (useFallback && fallbackMessage && sender) {
      requestData.kakao_faild_type = '1'; // SMS
      requestData.message = fallbackMessage;
      requestData.sender = sender;
    }

    const response = await fetch(
      'https://directsend.co.kr/index.php/api_v2/kakao_notice',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(requestData),
      }
    );

    const data = await response.json();

    // 상태 코드에 따른 응답 처리
    if (data.status === 1) {
      return NextResponse.json({
        success: true,
        message: '알림톡 발송이 요청되었습니다.',
        data,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: data.message || '발송 실패',
        errorCode: data.status,
        data,
      });
    }
  } catch (error) {
    console.error('알림톡 발송 오류:', error);
    return NextResponse.json(
      { error: '알림톡 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
