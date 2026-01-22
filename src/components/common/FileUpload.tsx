'use client';

import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from './Button';

// 클라이언트용 Supabase 인스턴스
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FileUploadProps {
  onUpload: (url: string, fileName?: string) => void;
  folder?: string;
  accept?: string;
  currentUrl?: string;
  label?: string;
}

export function FileUpload({
  onUpload,
  folder = 'uploads',
  accept = '*/*',
  currentUrl,
  label = '파일 선택',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 파일 이름 생성
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${timestamp}-${safeName}`;

      // Supabase Storage에 직접 업로드
      const { data, error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError(uploadError.message || '업로드에 실패했습니다.');
        return;
      }

      // 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      setFileName(file.name);
      onUpload(urlData.publicUrl, file.name);
    } catch (err) {
      console.error('Upload error:', err);
      setError('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayName = fileName || (currentUrl ? '파일이 등록되어 있습니다' : null);

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={uploading}
        >
          {uploading ? '업로드 중...' : label}
        </Button>

        {displayName && (
          <span className="text-sm text-gray-600 truncate max-w-[200px]">
            {displayName}
          </span>
        )}
      </div>

      {currentUrl && !fileName && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          현재 파일 보기
        </a>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
