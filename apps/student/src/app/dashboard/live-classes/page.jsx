'use client';
import { Video } from 'lucide-react';
import ComingSoon from '@/component/ComingSoon';

export default function LiveClassesPage() {
  return (
    <ComingSoon
      icon={Video}
      title="Live Classes"
      description="Join live video classes, see your timetable, and replay recordings here."
    />
  );
}
