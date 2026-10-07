import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_COOKIE } from "@/utils/session";

export function useSignIn() {
  const { login } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post("/auth/parent/login", data);
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
      router.push("/dashboard");
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || err.message || "Something went wrong";
      toast.error(message);
    },
  });
}
