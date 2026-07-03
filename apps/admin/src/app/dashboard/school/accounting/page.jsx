import { redirect } from 'next/navigation';

export default function AccountingIndexPage() {
  redirect('/dashboard/school/accounting/accounts');
}
