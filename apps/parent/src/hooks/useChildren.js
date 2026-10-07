import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useUserStore } from "@/store/userStore";
import { useChildStore } from "@/store/childStore";

const useUid = () => useUserStore((s) => s.user?._id || s.user?.id || null);

// The signed-in parent's active children:
// [{ _id, name, admissionNumber, rollNumber, photo, relation,
//    class: { _id, name }, section: { _id, name }, branch: { _id, name }, academicYear }]
export function useChildren({ enabled = true } = {}) {
  const uid = useUid();
  return useQuery({
    queryKey: ["children", uid],
    queryFn: async () => {
      const res = await apiClient.get("/dashboard/parent/children");
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled,
  });
}

// Keeps the persisted selection valid: a single child is selected
// automatically, and a selection that is no longer in the list (unlinked,
// deactivated, another parent's id) falls back to the first child.
// Returns the list query plus the resolved child.
export function useSyncSelectedChild({ enabled = true } = {}) {
  const query = useChildren({ enabled });
  const selectedChildId = useChildStore((s) => s.selectedChildId);
  const setSelectedChildId = useChildStore((s) => s.setSelectedChildId);

  const children = query.data ?? [];
  const selected = children.find((c) => c._id === selectedChildId) || null;
  const resolvedId = selected ? selected._id : (children[0]?._id ?? null);

  useEffect(() => {
    if (!query.isSuccess) return;
    if (resolvedId !== selectedChildId) setSelectedChildId(resolvedId);
  }, [query.isSuccess, resolvedId, selectedChildId, setSelectedChildId]);

  return {
    ...query,
    children,
    child: selected,
    ready: query.isSuccess && !!selected,
  };
}

// The child currently shown, from the cached children list.
export function useSelectedChild() {
  const { data } = useChildren();
  const selectedChildId = useChildStore((s) => s.selectedChildId);
  return (data ?? []).find((c) => c._id === selectedChildId) || null;
}

export const useSelectedChildId = () => useChildStore((s) => s.selectedChildId);
