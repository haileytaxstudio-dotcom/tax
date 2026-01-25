'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Enrollment {
  id: string;
  name: string;
  phone: string;
  start_date: string;
  curriculum_id: string;
  status: string;
  curriculum?: { id: string; name: string };
}

interface StudentContextType {
  student: Enrollment | null;
  enrollments: Enrollment[];
  loading: boolean;
  login: (phone: string) => Promise<boolean>;
  logout: () => void;
  switchEnrollment: (enrollmentId: string) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Enrollment | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 학생 정보 복원
    const storedEnrollments = localStorage.getItem('enrollments');
    const storedCurrentId = localStorage.getItem('currentEnrollmentId');

    if (storedEnrollments) {
      try {
        const parsed = JSON.parse(storedEnrollments);
        setEnrollments(parsed);

        // 현재 선택된 과정 복원
        if (storedCurrentId) {
          const current = parsed.find((e: Enrollment) => e.id === storedCurrentId);
          setStudent(current || parsed[0]);
        } else if (parsed.length > 0) {
          setStudent(parsed[0]);
        }
      } catch {
        localStorage.removeItem('enrollments');
        localStorage.removeItem('currentEnrollmentId');
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/student/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        const data = await response.json();
        const allEnrollments = data.enrollments || [data];

        setEnrollments(allEnrollments);
        setStudent(data.currentEnrollment || allEnrollments[0]);

        localStorage.setItem('enrollments', JSON.stringify(allEnrollments));
        localStorage.setItem('currentEnrollmentId', (data.currentEnrollment || allEnrollments[0]).id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setStudent(null);
    setEnrollments([]);
    localStorage.removeItem('enrollments');
    localStorage.removeItem('currentEnrollmentId');
  };

  const switchEnrollment = (enrollmentId: string) => {
    const selected = enrollments.find(e => e.id === enrollmentId);
    if (selected) {
      setStudent(selected);
      localStorage.setItem('currentEnrollmentId', enrollmentId);
    }
  };

  return (
    <StudentContext.Provider value={{ student, enrollments, loading, login, logout, switchEnrollment }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
