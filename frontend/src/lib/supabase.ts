import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 클라이언트 사이드용 Supabase 클라이언트 (지연 초기화)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any, 'public', any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSupabase = (): SupabaseClient<any, 'public', any> => {
  if (!_supabase && supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!_supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }
  return _supabase;
};

// 이전 버전과의 호환성을 위한 export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, 'public', any> = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);

// 서버 사이드용 클라이언트 (서비스 롤 키 사용)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createServerSupabaseClient = (): SupabaseClient<any, 'public', any> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createClient(url, serviceKey);
};
