import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { listSchools, createSchool, toggleSchoolStatus } from '../services/system';

const isDisabled = (org) => org?.isActive === false || org?.status === 'suspended';

export const useOrganizations = ({ page = 1, limit = 200 } = {}) =>
  useQuery({
    queryKey: ['organizations', page, limit],
    queryFn: () => listSchools({ page, limit }),
    placeholderData: keepPreviousData,
  });

// Split a school list into active / disabled buckets (mirrors the web store).
export const splitOrganizations = (list = []) => ({
  active: list.filter((o) => !isDisabled(o)),
  disabled: list.filter(isDisabled),
});

export const useCreateSchool = ({ onSuccess } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createSchool(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      Toast.show({ type: 'success', text1: res?.message || 'School created successfully!' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Create failed', text2: err.message });
    },
  });
};

export const useToggleSchoolStatus = ({ onSuccess } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => toggleSchoolStatus({ id, isActive }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      Toast.show({ type: 'success', text1: res?.message || 'School status updated' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Failed', text2: err.message || 'Update failed' });
    },
  });
};
