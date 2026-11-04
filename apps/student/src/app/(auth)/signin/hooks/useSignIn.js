import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { mustChangePasswordOf } from "@/utils/authErrors";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_COOKIE } from "@/utils/session";

export function useSignIn() {
  const { login } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post("/auth/student/login", data);
      return res.data; // API body: { data: { user }, ... } — tokens are httpOnly cookies
    },
    onSuccess: (response) => {
      const payload = response.data || response;
      login(payload); // store the user and mark the session

      // Role hint for client-side routing (mirrors the admin app).
      document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(
        JSON.stringify(payload.user?.role || {}),
      )}; path=/; max-age=604800; SameSite=Lax;`;

      toast.success("Welcome back!");
      // A forced password change comes first; the dashboard layout keeps the
      // user there until it is done.
      router.push(
        mustChangePasswordOf(payload)
          ? "/dashboard/change-password"
          : "/dashboard",
      );
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || err.message || "Something went wrong";
      toast.error(message);
    },
  });
}
