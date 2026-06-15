import { useQuery } from '@tanstack/react-query';
import { fetchData } from '../services/api';
import { canSee } from '../utils/permissions';

// Real headline counts for the dashboard summary. Each list endpoint returns the
// role-scoped `total` in its envelope (the backend scopes by the token when no
// branchId is passed), so a branch user sees their branch's totals and an
// org-level admin sees the whole org. limit:1 keeps the payload tiny — we only
// read the count, not the rows.
const useCount = (url, key, enabled) =>
  useQuery({
    queryKey: ['dashboard-count', key],
    queryFn: async () => {
      const res = await fetchData({ url, page: 1, limit: 1 });
      return res?.total ?? (Array.isArray(res?.data) ? res.data.length : 0);
    },
    enabled,
    staleTime: 60_000,
  });

export function useDashboardStats(role) {
  const students = useCount('/student/list', 'students', canSee(role, 'view-student'));
  const staff = useCount('/staff/list', 'staff', canSee(role, 'view-staff'));
  const classes = useCount('/class/list', 'classes', canSee(role, 'view-class'));
  const branches = useCount('/branch/list', 'branches', canSee(role, 'view-branch'));
  return { students, staff, classes, branches };
}
