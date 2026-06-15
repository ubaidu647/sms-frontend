import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
} from '@/services/billing';

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

// Every subscription action re-reads the school's current + history (and the
// schools list, since school.currentSubscriptionId may change).
const useSubscriptionMutation = (mutationFn, successMsg) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (res, vars) => {
      const schoolId = typeof vars === 'string' ? vars : vars?.schoolId;
      toast.success(res?.message || successMsg);
      if (schoolId) {
        queryClient.invalidateQueries({ queryKey: ['subscription', 'current', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['subscription', 'history', schoolId] });
        // assign/change/renew each mint a new invoice → refresh dues + invoice list.
        queryClient.invalidateQueries({ queryKey: ['invoice', 'list', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['invoice', 'summary', schoolId] });
      }
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
  });
};

export const useAssignSubscription = () =>
  useSubscriptionMutation((p) => assignSubscription(p), 'Subscription assigned');

export const useChangePackage = () =>
  useSubscriptionMutation((p) => changePackage(p), 'Plan changed');

export const useRenewSubscription = () =>
  useSubscriptionMutation((p) => renewSubscription(p), 'Subscription renewed');

export const useCancelSubscription = () =>
  useSubscriptionMutation((schoolId) => cancelSubscription(schoolId), 'Subscription cancelled');

/* ------------------------------- Invoices ------------------------------- */

export const useInvoices = (schoolId) =>
  useQuery({
    queryKey: ['invoice', 'list', schoolId],
    queryFn: () => listInvoices(schoolId),
    enabled: !!schoolId,
  });

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

// Mark an invoice paid, then refresh dues + invoice list for the school.
export const useMarkInvoicePaid = (schoolId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentInfo }) => markInvoicePaid(id, paymentInfo),
    onSuccess: (res) => {
      toast.success(res?.message || 'Invoice marked paid');
      if (schoolId) {
        queryClient.invalidateQueries({ queryKey: ['invoice', 'list', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['invoice', 'summary', schoolId] });
      }
      queryClient.invalidateQueries({ queryKey: ['invoice', 'subscription'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to update invoice'),
  });
};
