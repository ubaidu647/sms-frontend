'use client';
import { MessageSquare } from 'lucide-react';
import ComingSoon from '@/component/ComingSoon';

export default function ChatPage() {
  return (
    <ComingSoon
      icon={MessageSquare}
      title="Live Chat"
      description="Message teachers and classmates in real time. Chat will appear here."
    />
  );
}
