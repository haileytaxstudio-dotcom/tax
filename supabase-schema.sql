-- 커리큘럼 테이블
CREATE TABLE curriculums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학습자 테이블
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  curriculum_id UUID REFERENCES curriculums(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학습지 테이블
CREATE TABLE worksheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id UUID REFERENCES curriculums(id),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  day_offset INTEGER NOT NULL DEFAULT 0,
  reminder_hours INTEGER DEFAULT 48,
  order_num INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 제출물 테이블
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  worksheet_id UUID REFERENCES worksheets(id) ON DELETE CASCADE,
  file_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'confirmed')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, worksheet_id)
);

-- 카카오 발송 로그 테이블
CREATE TABLE kakao_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  template_no VARCHAR(50) NOT NULL,
  message_type VARCHAR(20) CHECK (message_type IN ('start', 'worksheet', 'reminder', 'confirm', 'complete')),
  status VARCHAR(20) CHECK (status IN ('success', 'failed')),
  response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_start_date ON students(start_date);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_kakao_logs_student_id ON kakao_logs(student_id);
CREATE INDEX idx_kakao_logs_created_at ON kakao_logs(created_at);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 커리큘럼 데이터 삽입
INSERT INTO curriculums (name, description) VALUES
('세무 기초 과정', '세무의 기본 개념부터 실무까지 배우는 4주 과정');

-- RLS (Row Level Security) 활성화 - 필요시
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
