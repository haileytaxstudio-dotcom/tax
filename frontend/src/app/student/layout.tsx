'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { StudentProvider, useStudent } from '@/context/StudentContext';
import { Button } from '@/components/common';

const studentNavItems = [
  {
    href: '/student',
    label: '내 학습',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    href: '/student/community',
    label: '커뮤니티',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
];

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { student, enrollments, loading, login, logout, switchEnrollment } = useStudent();
  const [phone, setPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const success = await login(phone);
    if (!success) {
      setLoginError('등록되지 않은 전화번호입니다.');
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            학습자 로그인
          </h1>
          <p className="text-gray-500 text-center mb-6">
            등록된 전화번호로 로그인하세요
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {loginError && (
              <p className="text-red-500 text-sm">{loginError}</p>
            )}

            <Button type="submit" className="w-full" disabled={loginLoading}>
              {loginLoading ? '확인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/student" className="text-xl font-bold text-gray-900">
              세무사 헤일리의 암기노트
            </Link>
            <div className="flex items-center gap-4">
              {enrollments.length > 1 && (
                <select
                  value={student.id}
                  onChange={(e) => switchEnrollment(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  {enrollments.map((enrollment) => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {enrollment.curriculum?.name || '과정'}
                    </option>
                  ))}
                </select>
              )}
              <span className="text-sm text-gray-600">{student.name}님</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
          <nav className="flex gap-1 -mb-px">
            {studentNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentProvider>
      <StudentLayoutContent>{children}</StudentLayoutContent>
    </StudentProvider>
  );
}
