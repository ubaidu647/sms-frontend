"use client";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  GraduationCap,
  CalendarCheck,
  BarChart3,
  Wallet,
  Sparkles,
} from "lucide-react";
import SignInForm from "./SignInForm";

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
    if (reason && REASONS[reason]) {
      toast.error(REASONS[reason], { id: `signin-reason-${reason}` });
      window.history.replaceState(null, "", "/signin");
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-white">
      {/* ─── Left brand panel (NodeCampus navy + gold) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#00918e] via-[#007e7b] to-[#005f5c] text-white p-12 flex-col justify-between">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#f5b21c]/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#f5b21c]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,178,28,0.08),transparent_60%)]" />

        <div className="relative flex items-center gap-2 w-fit">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <GraduationCap className="w-5 h-5 text-[#f5b21c]" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Node<span className="text-[#f5b21c]">Campus</span>
          </span>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#f5b21c]" />
            Parent Portal
          </div>
          <h2 className="mt-5 text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
            Stay close to <br /> your child’s school day.
          </h2>
          <p className="mt-4 text-white/80 max-w-md">
            Attendance, homework, results and fees for each of your children —
            all in one place.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <div className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4">
              <CalendarCheck className="w-5 h-5 text-[#f5b21c]" />
              <div className="mt-3 text-sm font-semibold">Attendance</div>
            </div>
            <div className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4">
              <BarChart3 className="w-5 h-5 text-[#f5b21c]" />
              <div className="mt-3 text-sm font-semibold">Results</div>
            </div>
            <div className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4">
              <Wallet className="w-5 h-5 text-[#f5b21c]" />
              <div className="mt-3 text-sm font-semibold">Fees</div>
            </div>
          </div>
        </div>

        <div className="relative text-xs text-white/60">
          © {new Date().getFullYear()} NodeCampus. All rights reserved.
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-10 w-fit">
            <div className="w-10 h-10 rounded-xl bg-[#00918e] flex items-center justify-center shadow-lg shadow-[#00918e]/30">
              <GraduationCap className="w-5 h-5 text-[#f5b21c]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Node<span className="text-[#f5b21c]">Campus</span>
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Parent sign in
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back — sign in to continue to your dashboard.
            </p>
          </div>

          <div className="mt-8">
            <SignInForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
