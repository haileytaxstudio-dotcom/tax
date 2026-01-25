import { Card, CardContent, ProgressBar } from '@/components/common';

interface ProgressCardProps {
  myProgress: number;
  averageProgress: number;
  completedCount: number;
  totalCount: number;
}

export function ProgressCard({
  myProgress,
  averageProgress,
  completedCount,
  totalCount,
}: ProgressCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">내 진행률</p>
            <ProgressBar progress={myProgress} size="lg" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">전체 평균</p>
            <ProgressBar progress={averageProgress} size="lg" />
          </div>
          <div className="flex flex-col justify-center items-center">
            <p className="text-sm text-gray-500">완료한 학습지</p>
            <p className="text-3xl font-bold text-gray-900">
              {completedCount} <span className="text-lg text-gray-400">/ {totalCount}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
