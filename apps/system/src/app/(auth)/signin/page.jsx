'use client';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { planNoticeFor, takeSigninNotice } from '@/utils/authErrors';
import { ShieldCheck, BarChart3 } from 'lucide-react';
import AuthShell from '../AuthShell';
import SignInForm from './SignInForm';

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
      portal="System console"
      title="Every school,"
      highlight="one console."
      lead="Schools, plans, subscriptions and billing for Mizenzo School Management — for super-admins only."
      features={[
        { icon: ShieldCheck, title: 'Secure by default', sub: 'Super-admin access only' },
        { icon: BarChart3, title: 'Tenant-wide view', sub: 'Every school, one place' },
      ]}
      heading="Welcome back"
      sub="Sign in to the Mizenzo School Management system console."
    >
      <SignInForm />
    </AuthShell>
  );
};

export default SignInPage;
