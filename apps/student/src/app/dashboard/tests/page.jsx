'use client';
import { ClipboardCheck } from 'lucide-react';
import ComingSoon from '@/component/ComingSoon';

export default function TestsPage() {
  return (
    <ComingSoon
      icon={ClipboardCheck}
      title="Live Tests"
      description="Take timed online tests and quizzes. Your upcoming tests will show up here."
    />
  );
}
