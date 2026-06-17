import { redirect } from 'next/navigation';

// The student app opens on the login page.
export default function Home() {
  redirect('/signin');
}
