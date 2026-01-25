export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'submitted':
      return 'bg-purple-100 text-purple-800';
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return '학습중';
    case 'paused':
      return '일시정지';
    case 'completed':
      return '완료';
    case 'pending':
      return '미제출';
    case 'submitted':
      return '제출완료';
    case 'confirmed':
      return '확인완료';
    case 'locked':
      return '잠김';
    case 'available':
      return '제출가능';
    default:
      return status;
  }
}
