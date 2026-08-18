import { redirect } from 'next/navigation';

// Each report is its own route/sidebar entry now; /reports keeps working by
// landing on the trial balance.
export default function ReportsIndexPage() {
  redirect('/dashboard/school/accounting/reports/trial-balance');
}
