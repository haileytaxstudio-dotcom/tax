import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 파일 다운로드 프록시 (모바일 호환)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'download';

  if (!fileUrl) {
    return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
  }

  try {
    // 파일 가져오기
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json({ error: '파일을 가져올 수 없습니다.' }, { status: 404 });
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Content-Type 결정
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // 파일 확장자 추출
    const urlExtension = fileUrl.split('.').pop()?.split('?')[0] || '';
    const finalFilename = filename.includes('.') ? filename : `${filename}.${urlExtension}`;

    // 다운로드 헤더와 함께 반환
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(finalFilename)}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('다운로드 오류:', error);
    return NextResponse.json({ error: '다운로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
