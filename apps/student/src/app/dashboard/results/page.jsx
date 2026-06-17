'use client';
import { BarChart3 } from 'lucide-react';
import ComingSoon from '@/component/ComingSoon';

export default function ResultsPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Results"
      description="View your grades, test scores and progress reports here."
    />
  );
}
