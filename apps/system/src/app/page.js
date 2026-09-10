import { redirect } from 'next/navigation';

// The system console has no marketing/landing page — it is an internal tool.
// Send '/' straight to the dashboard; middleware bounces to /signin when the
// visitor has no session.
export default function Home() {
  redirect('/dashboard');
}
