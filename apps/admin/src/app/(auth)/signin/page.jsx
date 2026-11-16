'use client';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { planNoticeFor, takeSigninNotice } from '@/utils/authErrors';
import { ShieldCheck, BarChart3 } from 'lucide-react';
import AuthShell from '../AuthShell';
import SignInForm from './SignInForm';

const STUDENT_PORTAL_URL = process.env.NEXT_PUBLIC_STUDENT_URL || 'http://localhost:3001/signin';

// A forced sign-out can leave a reason for this page (?reason=…). Only known
// keys are shown; the plan refusal carries the server's own message.
function useSigninReason() {
  useEffect(() => {
    let reason = null;
    try {
      reason = new URLSearchParams(window.location.search).get('reason');
    } catch {
      reason = null;
    }
    if (!reason) return;
    const message = planNoticeFor(reason, takeSigninNotice());
    if (message) toast.error(message, { id: `signin-reason-${reason}`, duration: 10000 });
    window.history.replaceState(null, '', '/signin');
  }, []);
}

const SignInPage = () => {
  useSigninReason();
  return (
    <AuthShell
      portal="Staff portal"
      title="Run your school"
      highlight="from one place."
      lead="Admissions, attendance, fees, exams and reports — in one fast, modern workspace."
      features={[
        { icon: ShieldCheck, title: 'Secure by default', sub: 'Role-based access control' },
        { icon: BarChart3, title: 'Real-time reports', sub: 'Decisions backed by data' },
      ]}
      heading="Staff sign in"
      sub="For school staff — admins, teachers, accountants and any custom role."
      homeHref="/"
      aside={
        // Each audience has its own portal and login endpoint, and a wrong-portal
        // attempt gets the same generic error as a bad password (deliberately —
        // it must not confirm the account exists). So point students at theirs
        // up front, statically.
        <p className="mt-4 text-sm text-[#6a7d7c] dark:text-gray-400">
          Are you a student?{' '}
          <a
            href={STUDENT_PORTAL_URL}
            className="font-semibold text-[#007a77] hover:text-[#004c4a] dark:text-teal-400"
          >
            Sign in to the student portal
          </a>
        </p>
      }
    >
      <SignInForm />
    </AuthShell>
  );
};

export default SignInPage;
