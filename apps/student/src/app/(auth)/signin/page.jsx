"use client";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { planNoticeFor, takeSigninNotice } from "@/utils/authErrors";
import { Video, MessageSquare, ClipboardCheck } from "lucide-react";
import AuthShell from "../AuthShell";
import SignInForm from "./SignInForm";

// A forced sign-out can leave a reason for this page (?reason=…). Only known
// keys are shown; the plan refusal carries the server's own message.
function useSigninReason() {
  useEffect(() => {
    let reason = null;
    try {
      reason = new URLSearchParams(window.location.search).get("reason");
    } catch {
      reason = null;
    }
    if (!reason) return;
    const message = planNoticeFor(reason, takeSigninNotice());
    if (message)
      toast.error(message, { id: `signin-reason-${reason}`, duration: 10000 });
    window.history.replaceState(null, "", "/signin");
  }, []);
}

const SignInPage = () => {
  useSigninReason();
  return (
    <AuthShell
      portal="Student portal"
      title="Everything you"
      highlight="need to learn."
      lead="Your classes, assignments, results and more — all in one place."
      features={[
        { icon: Video, title: "Live classes" },
        { icon: MessageSquare, title: "Live chat" },
        { icon: ClipboardCheck, title: "Live tests" },
      ]}
      heading="Student sign in"
      sub="Welcome back — sign in to continue to your dashboard."
    >
      <SignInForm />
    </AuthShell>
  );
};

export default SignInPage;
