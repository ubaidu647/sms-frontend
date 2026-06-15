import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listPackages, createPackage, updatePackage, deletePackage } from '@/services/billing';

// List query. `filters` holds APPLIED filter state only (changed on Search click,
// never bound to keystrokes) so we don't refetch on every character. `isActive`
// is intentionally left unset by default so newly created packages are never
// silently filtered out of a post-create view.
export const usePackages = ({ page = 1, limit = 20, filters = {}, enabled = true } = {}) =>
  useQuery({
    queryKey: ['packages', { page, limit, ...filters }],
    queryFn: () =>
      listPackages({
        page,
        limit,
        search: filters.search,
        isActive: filters.isActive,
      }),
    keepPreviousData: true,
    enabled,
  });

// Create — push the new package straight into every cached list variation and
// do NOT invalidate (no post-create list GET).
export const useCreatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createPackage(payload),
    onSuccess: (res) => {
      const created = res?.data;
      if (created) {
        queryClient.setQueriesData({ queryKey: ['packages'] }, (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [created, ...(old.data || [])],
            total: (old.total ?? old.data?.length ?? 0) + 1,
          };
        });
      }
      toast.success(res?.message || 'Package created');
    },
    onError: (err) => toast.error(err.message || 'Failed to create package'),
  });
};

// Update — patch affects future subscriptions only. Invalidate so the list/detail
// reflect the server-canonical record.
export const useUpdatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updatePackage(id, payload),
    onSuccess: (res) => {
      toast.success(res?.message || 'Package updated');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to update package'),
  });
};

// Soft delete (isActive:false). Invalidate so the row moves to the Inactive tab.
export const useDeletePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deletePackage(id),
    onSuccess: (res) => {
      toast.success(res?.message || 'Package deactivated');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to deactivate package'),
  });
};
