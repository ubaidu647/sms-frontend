import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useTokenStore } from "@/store/tokenStore";
import { useUserStore } from "@/store/userStore";
import { enabledFeaturesOf, isFeatureEnabled } from "@/utils/planFeatures";

// The add-on modules the school's plan includes, from GET /subscription/me/status.
// `features` is the list of enabled add-on keys, or null for "all enabled" —
// which is also what it is while loading or after a failed call: the portal
// never blocks on this. One fetch per session (shared by the sidebar and the
// layout through the query cache).
export function usePlanFeatures() {
  const uid = useUserStore((s) => s.user?._id || s.user?.id || null);
  const mustChangePassword = useUserStore(
    (s) => s.user?.mustChangePassword === true,
  );
  const accessToken = useTokenStore((s) => s.accessToken);

  const query = useQuery({
    queryKey: ["plan-features", uid],
    queryFn: async () => {
      const res = await apiClient.get("/subscription/me/status");
      return enabledFeaturesOf(res.data?.data);
    },
    enabled: !!accessToken && !!uid && !mustChangePassword,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const features = query.isSuccess ? (query.data ?? null) : null;
  return {
    features,
    isLoading: query.isLoading,
    isEnabled: (key) => isFeatureEnabled(features, key),
  };
}
