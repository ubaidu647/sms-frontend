import { redirect } from 'next/navigation';

export default function ReportsIndexPage() {
  redirect('/dashboard/school/reports/defaulters');
}
