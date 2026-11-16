"use client";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { CalendarCheck, BarChart3, Wallet } from "lucide-react";
import AuthShell from "../AuthShell";
import SignInForm from "./SignInForm";
import { planNoticeFor, takeSigninNotice } from "@/utils/authErrors";

// Messages a forced sign-out can leave for this page (?reason=…).
const REASONS = {
  "not-parent":
    "This portal is for parents only. Please sign in with a parent account.",
  "no-children":
    "No active children are linked to this account. Please contact the school.",
};

const SignInPage = () => {
  useEffect(() => {
    let reason = null;
    try {
      reason = new URLSearchParams(window.location.search).get("reason");
    } catch {
      reason = null;
    }
    // The plan refusal carries the server's own message.
    const message =
      REASONS[reason] || planNoticeFor(reason, takeSigninNotice());
    if (reason && message) {
      toast.error(message, { id: `signin-reason-${reason}`, duration: 10000 });
      window.history.replaceState(null, "", "/signin");
    }
  }, []);

  return (
    <AuthShell
      portal="Parent portal"
      title="Stay close to your"
      highlight="child’s school day."
      lead="Attendance, homework, results and fees for each of your children — all in one place."
      features={[
        { icon: CalendarCheck, title: "Attendance" },
        { icon: BarChart3, title: "Results" },
        { icon: Wallet, title: "Fees" },
      ]}
      heading="Parent sign in"
      sub="Welcome back — sign in to continue to your dashboard."
    >
      <SignInForm />
    </AuthShell>
  );
};

export default SignInPage;
