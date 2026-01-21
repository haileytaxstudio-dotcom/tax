'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Student {
  id: string;
  name: string;
  phone: string;
  start_date: string;
  curriculum_id: string;
  status: string;
  curriculum?: { id: string; name: string };
}

interface StudentContextType {
  student: Student | null;
  loading: boolean;
  login: (phone: string) => Promise<boolean>;
  logout: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 학생 정보 복원
    const stored = localStorage.getItem('student');
    if (stored) {
      try {
        setStudent(JSON.parse(stored));
      } catch {
        localStorage.removeItem('student');
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
        setStudent(data);
        localStorage.setItem('student', JSON.stringify(data));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setStudent(null);
    localStorage.removeItem('student');
  };

  return (
    <StudentContext.Provider value={{ student, loading, login, logout }}>
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
