"use client";
import { KeyRound } from "lucide-react";
import { PageHeader, Panel } from "@/component/dashboard/Panel";
import ChangePasswordForm from "@/component/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="max-w-xl">
      <PageHeader
        icon={KeyRound}
        title="Change password"
        subtitle="Enter your current password, then choose a new one"
      />
      <Panel>
        <ChangePasswordForm />
      </Panel>
    </div>
  );
}
