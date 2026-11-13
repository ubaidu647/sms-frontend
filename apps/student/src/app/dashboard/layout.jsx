"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTokenStore } from "@/store/tokenStore";
import { useUserStore } from "@/store/userStore";
import { Sidebar } from "@/component/SideBar";
import { Topbar } from "@/component/TopBar";
import ForcedPasswordChange from "@/component/ForcedPasswordChange";
import { useAuth } from "@/hooks/useAuth";
import { useCrossTabSignOut } from "@/hooks/useCrossTabSignOut";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { FeatureUnavailableState } from "@/component/dashboard/States";
import { featureForPath } from "@/utils/planFeatures";

const PASSWORD_PATH = "/dashboard/change-password";

export default function DashboardLayout({ children }) {
  useCrossTabSignOut();
  const router = useRouter();
  const hasHydrated = useTokenStore((s) => s.hasHydrated);
  const accessToken = useTokenStore((s) => s.accessToken);
  const user = useUserStore((s) => s.user);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  // The API refuses everything but change-password until it is done, so the
  // dashboard (and its data loading) waits behind that page.
  const mustChangePassword =
    hasHydrated && !!accessToken && user?.mustChangePassword === true;
  // A page of an add-on module the plan leaves out (reached by a direct link):
  // say so instead of loading it. Unknown/loading plan = enabled.
  const { isEnabled } = usePlanFeatures();
  const pageFeature = featureForPath(pathname);
  const featureOff = !!pageFeature && !isEnabled(pageFeature);

  // Guard: once the persisted store has hydrated, bounce guests to the login.
  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/signin");
    }
  }, [hasHydrated, accessToken, router]);

  useEffect(() => {
    if (mustChangePassword && pathname !== PASSWORD_PATH) {
      router.replace(PASSWORD_PATH);
    }
  }, [mustChangePassword, pathname, router]);

  if (!hasHydrated || !accessToken) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10 text-[#00918e]" />
      </div>
    );
  }

  if (mustChangePassword) return <ForcedPasswordChange onLogout={logout} />;

  return (
    <div className="w-full md:w-[99%] flex h-screen overflow-hidden">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 bg-[rgb(246,246,246)] dark:bg-[#161616] p-3 sm:p-6 pt-[calc(4rem+0.75rem)] md:pt-6 rounded-none md:!rounded-tl-[50px] md:!rounded-tr-[50px] z-1 md:mt-3 overflow-y-auto md:overflow-hidden flex flex-col">
        <Topbar user={user} onMenuClick={() => setIsMobileOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          {featureOff ? <FeatureUnavailableState /> : children}
        </div>
      </div>
    </div>
  );
}
