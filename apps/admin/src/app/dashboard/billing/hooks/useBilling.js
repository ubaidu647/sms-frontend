import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getMyCurrentSubscription,
  getMySubscriptionHistory,
  getMyInvoiceSummary,
  listMyInvoices,
} from '@/services/billing';

// School-admin self-serve reads. schoolId comes from the token, so there is no
// schoolId in the queryKey — the cache is naturally scoped to the logged-in
// school (and cleared on logout when the query client resets).

export const useMyCurrentSubscription = (options = {}) =>
  useQuery({
    queryKey: ['billing', 'me', 'subscription', 'current'],
    queryFn: getMyCurrentSubscription,
    ...options,
  });

export const useMySubscriptionHistory = ({ page = 1, limit = 100 } = {}) =>
  useQuery({
    queryKey: ['billing', 'me', 'subscription', 'history', page, limit],
    queryFn: () => getMySubscriptionHistory({ page, limit }),
    placeholderData: keepPreviousData,
  });

export const useMyInvoiceSummary = () =>
  useQuery({
    queryKey: ['billing', 'me', 'invoice', 'summary'],
    queryFn: getMyInvoiceSummary,
  });

export const useMyInvoices = () =>
  useQuery({
    queryKey: ['billing', 'me', 'invoice', 'list'],
    queryFn: listMyInvoices,
  });
