import Link from 'next/link';
import { Card, CardContent, Badge, Button } from '@/components/common';
import { StudentWorksheetStatus } from '@/types';
import { cn } from '@/lib/utils';

interface WorksheetListProps {
  worksheets: StudentWorksheetStatus[];
}

export function WorksheetList({ worksheets }: WorksheetListProps) {
  return (
    <div className="space-y-4">
      {worksheets.map((worksheet, index) => (
        <Card
          key={worksheet.worksheetId}
          className={cn(
            worksheet.status === 'locked' && 'opacity-60'
          )}
        >
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full font-bold',
                    worksheet.status === 'confirmed'
                      ? 'bg-green-100 text-green-600'
                      : worksheet.status === 'submitted'
                      ? 'bg-purple-100 text-purple-600'
                      : worksheet.status === 'available'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {worksheet.status === 'confirmed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : worksheet.status === 'locked' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{worksheet.worksheetTitle}</h3>
                  {worksheet.dueDate && worksheet.status === 'available' && (
                    <p className="text-sm text-gray-500">마감: {worksheet.dueDate}</p>
                  )}
                  {worksheet.submittedAt && (
                    <p className="text-sm text-gray-500">제출: {worksheet.submittedAt}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={worksheet.status} />
                {worksheet.status === 'available' && (
                  <Link href={`/student/submit/${worksheet.worksheetId}`}>
                    <Button size="sm">제출하기</Button>
                  </Link>
                )}
                {(worksheet.status === 'submitted' || worksheet.status === 'confirmed') && (
                  <Button variant="outline" size="sm">
                    확인
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
