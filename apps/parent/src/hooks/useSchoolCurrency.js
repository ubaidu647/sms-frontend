import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useTokenStore } from "@/store/tokenStore";
import { useUserStore } from "@/store/userStore";
import { DEFAULT_SCHOOL_CURRENCY, currencyFromSettings } from "@/utils/currency";

// The school's own currency, { code, symbol }, from GET /schools/settings.
// PKR / Rs while loading, on error, or before sign-in: the portal never blocks
// on a money label. One fetch per session, shared through the query cache.
export function useSchoolCurrency() {
  const uid = useUserStore((s) => s.user?._id || s.user?.id || null);
  const mustChangePassword = useUserStore((s) => s.user?.mustChangePassword === true);
  const accessToken = useTokenStore((s) => s.accessToken);

  const query = useQuery({
    queryKey: ["school-settings", uid],
    queryFn: async () => {
      const res = await apiClient.get("/schools/settings");
      return currencyFromSettings(res.data?.data);
    },
    enabled: !!accessToken && !!uid && !mustChangePassword,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  return query.isSuccess && query.data ? query.data : DEFAULT_SCHOOL_CURRENCY;
}
