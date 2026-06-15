import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  getCurrentSubscription,
  getSubscriptionHistory,
  assignSubscription,
  changePackage,
  renewSubscription,
  cancelSubscription,
  listInvoices,
  getInvoiceSummary,
  getInvoiceBySubscription,
  markInvoicePaid,
} from '../services/system';

export const useCurrentSubscription = (schoolId) =>
  useQuery({
    queryKey: ['subscription', 'current', schoolId],
    queryFn: () => getCurrentSubscription(schoolId),
    enabled: !!schoolId,
  });

export const useSubscriptionHistory = (schoolId) =>
  useQuery({
    queryKey: ['subscription', 'history', schoolId],
    queryFn: () => getSubscriptionHistory(schoolId),
    enabled: !!schoolId,
  });

// Every subscription action re-reads the school's current + history + invoices.
const useSubscriptionMutation = (mutationFn, successMsg, onDone) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (res, vars) => {
      const schoolId = typeof vars === 'string' ? vars : vars?.schoolId;
      Toast.show({ type: 'success', text1: res?.message || successMsg });
      if (schoolId) {
        queryClient.invalidateQueries({ queryKey: ['subscription', 'current', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['subscription', 'history', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['invoice', 'list', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['invoice', 'summary', schoolId] });
      }
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      onDone?.(res?.data);
    },
    onError: (err) => Toast.show({ type: 'error', text1: 'Action failed', text2: err.message }),
  });
};

export const useAssignSubscription = (opts = {}) =>
  useSubscriptionMutation((p) => assignSubscription(p), 'Subscription assigned', opts.onSuccess);

export const useChangePackage = (opts = {}) =>
  useSubscriptionMutation((p) => changePackage(p), 'Plan changed', opts.onSuccess);

export const useRenewSubscription = (opts = {}) =>
  useSubscriptionMutation((p) => renewSubscription(p), 'Subscription renewed', opts.onSuccess);

export const useCancelSubscription = (opts = {}) =>
  useSubscriptionMutation(
    (schoolId) => cancelSubscription(schoolId),
    'Subscription cancelled',
    opts.onSuccess,
  );

/* ------------------------------- Invoices ------------------------------- */

export const useInvoiceSummary = (schoolId) =>
  useQuery({
    queryKey: ['invoice', 'summary', schoolId],
    queryFn: () => getInvoiceSummary(schoolId),
    enabled: !!schoolId,
  });

export const useInvoiceBySubscription = (subscriptionId) =>
  useQuery({
    queryKey: ['invoice', 'subscription', subscriptionId],
    queryFn: () => getInvoiceBySubscription(subscriptionId),
    enabled: !!subscriptionId,
  });

export const useMarkInvoicePaid = (schoolId, { onSuccess } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentInfo }) => markInvoicePaid(id, paymentInfo),
    onSuccess: (res) => {
      Toast.show({ type: 'success', text1: res?.message || 'Invoice marked paid' });
      if (schoolId) {
        queryClient.invalidateQueries({ queryKey: ['invoice', 'list', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['invoice', 'summary', schoolId] });
      }
      queryClient.invalidateQueries({ queryKey: ['invoice', 'subscription'] });
      onSuccess?.(res?.data);
    },
    onError: (err) =>
      Toast.show({ type: 'error', text1: 'Failed', text2: err.message || 'Update failed' }),
  });
};

// Re-export so screens can also pull the invoice list if needed.
export { listInvoices };
