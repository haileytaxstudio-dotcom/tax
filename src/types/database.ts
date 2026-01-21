export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          name: string;
          phone: string;
          start_date: string;
          curriculum_id: string;
          status: 'active' | 'paused' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          start_date: string;
          curriculum_id: string;
          status?: 'active' | 'paused' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          start_date?: string;
          curriculum_id?: string;
          status?: 'active' | 'paused' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
      curriculums: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
      };
      worksheets: {
        Row: {
          id: string;
          curriculum_id: string;
          title: string;
          description: string;
          file_url: string;
          day_offset: number;
          reminder_hours: number;
          order_num: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          curriculum_id: string;
          title: string;
          description?: string;
          file_url?: string;
          day_offset: number;
          reminder_hours?: number;
          order_num: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          curriculum_id?: string;
          title?: string;
          description?: string;
          file_url?: string;
          day_offset?: number;
          reminder_hours?: number;
          order_num?: number;
          created_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          student_id: string;
          worksheet_id: string;
          file_url: string | null;
          status: 'pending' | 'submitted' | 'confirmed';
          submitted_at: string | null;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          worksheet_id: string;
          file_url?: string | null;
          status?: 'pending' | 'submitted' | 'confirmed';
          submitted_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          worksheet_id?: string;
          file_url?: string | null;
          status?: 'pending' | 'submitted' | 'confirmed';
          submitted_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
      };
      kakao_logs: {
        Row: {
          id: string;
          student_id: string;
          template_no: string;
          message_type: 'start' | 'worksheet' | 'reminder';
          status: 'success' | 'failed';
          response: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          template_no: string;
          message_type: 'start' | 'worksheet' | 'reminder';
          status: 'success' | 'failed';
          response?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          template_no?: string;
          message_type?: 'start' | 'worksheet' | 'reminder';
          status?: 'success' | 'failed';
          response?: Json | null;
          created_at?: string;
        };
      };
    };
  };
}

// 편의 타입
export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type Curriculum = Database['public']['Tables']['curriculums']['Row'];
export type Worksheet = Database['public']['Tables']['worksheets']['Row'];
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type KakaoLog = Database['public']['Tables']['kakao_logs']['Row'];
