"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { useTokenStore } from "@/store/tokenStore";
import { useUserStore } from "@/store/userStore";
import { useAuth } from "@/hooks/useAuth";
import { useSyncSelectedChild } from "@/hooks/useChildren";
import { Sidebar } from "@/component/SideBar";
import { Topbar } from "@/component/TopBar";
import { Loading, ErrorState, EmptyState } from "@/component/dashboard/States";

function FullScreenSpinner() {
  return (
    <div className="h-screen flex justify-center items-center">
      <Loader2 className="animate-spin w-10 h-10 text-[#00918e]" />
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const hasHydrated = useTokenStore((s) => s.hasHydrated);
  const accessToken = useTokenStore((s) => s.accessToken);
  const user = useUserStore((s) => s.user);
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const signedIn = hasHydrated && !!accessToken;
  // Only parent accounts may use this portal. The backend enforces it too;
  // this just ends a wrong-type session instead of showing empty pages.
  const isParent = user?.type === "parent";
  const wrongType = signedIn && !isParent;

  // Guard: once the persisted store has hydrated, bounce guests to the login.
  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/signin");
    }
  }, [hasHydrated, accessToken, router]);

  useEffect(() => {
    if (wrongType) logout({ reason: "not-parent" });
  }, [wrongType, logout]);

  const childrenQuery = useSyncSelectedChild({
    enabled: signedIn && isParent,
  });

  if (!signedIn || wrongType) return <FullScreenSpinner />;

  let content;
  if (childrenQuery.isLoading) {
    content = <Loading label="Loading your children…" />;
  } else if (childrenQuery.isError) {
    content = (
      <ErrorState error={childrenQuery.error} onRetry={childrenQuery.refetch} />
    );
  } else if (childrenQuery.children.length === 0) {
    content = (
      <EmptyState
        icon={Users}
        title="No children linked"
        description="No active children are linked to your account yet. Please contact the school."
      />
    );
  } else if (!childrenQuery.ready) {
    // The selection is being reconciled with the list (one render).
    content = <Loading />;
  } else {
    content = children;
  }

  return (
    <div className="w-full md:w-[99%] flex h-screen overflow-hidden">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 bg-[rgb(246,246,246)] dark:bg-[#161616] p-3 sm:p-6 pt-[calc(4rem+0.75rem)] md:pt-6 rounded-none md:!rounded-tl-[50px] md:!rounded-tr-[50px] z-1 md:mt-3 overflow-y-auto md:overflow-hidden flex flex-col">
        <Topbar user={user} onMenuClick={() => setIsMobileOpen(true)} />
        <div className="flex-1 overflow-y-auto">{content}</div>
      </div>
    </div>
  );
}
