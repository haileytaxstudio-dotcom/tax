import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 파일 업로드 API
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 이름 생성 (중복 방지를 위해 타임스탬프 추가)
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const fileName = `${timestamp}-${originalName}`;
    const filePath = `${folder}/${fileName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다: ' + error.message },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      fileName: originalName,
      filePath: data.path,
      fileUrl: urlData.publicUrl,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
