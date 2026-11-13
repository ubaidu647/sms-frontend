import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getCurrentSubscription,
  getSubscriptionHistory,
  assignSubscription,
  changePackage,
  renewSubscription,
  cancelSubscription,
  syncSubscriptionPlan,
  quoteAddon,
  addAddon,
  removeAddon,
  listInvoices,
  getInvoiceSummary,
  getInvoiceBySubscription,
  markInvoicePaid,
} from '@/services/billing';
import { invoicesById, planInvoiceFor } from '@/utils/addons';

export const useCurrentSubscription = (schoolId) =>
  useQuery({
    queryKey: ['subscription', 'current', schoolId],
    queryFn: () => getCurrentSubscription(schoolId),
    enabled: !!schoolId,
  });

export const useSubscriptionHistory = (schoolId, { page = 1, limit = 100 } = {}) =>
  useQuery({
    queryKey: ['subscription', 'history', schoolId, page, limit],
    queryFn: () => getSubscriptionHistory(schoolId, { page, limit }),
    enabled: !!schoolId,
    placeholderData: keepPreviousData,
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
      queryClient.invalidateQueries({ queryKey: ['invoice', 'subscription'] });
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

// Re-apply the package's current features to the school's live subscription.
// Same subscription row, no new invoice — so only the subscription reads (and
// the schools list, which shows plan access) need refreshing.
export const useSyncSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId }) => syncSubscriptionPlan(subscriptionId),
    onSuccess: (res, { schoolId }) => {
      toast.success(res?.message || 'Plan re-applied');
      if (schoolId) {
        queryClient.invalidateQueries({ queryKey: ['subscription', 'current', schoolId] });
        queryClient.invalidateQueries({ queryKey: ['subscription', 'history', schoolId] });
      }
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to re-apply plan'),
  });
};

/* -------------------------------- Add-ons ------------------------------- */

// Live price of an add-on. `body` is null until the form is valid (and
// debounced by the caller); a 400 (no price listed, period ended) is shown as
// the query error, so it is not retried.
export const useAddonQuote = (body) =>
  useQuery({
    queryKey: ['subscription', 'addon-quote', body],
    queryFn: () => quoteAddon(body),
    enabled: !!body?.schoolId,
    retry: false,
    staleTime: 0,
  });

// Buy an add-on: new `addon` invoice + higher limit → same refreshes as the
// other subscription actions.
export const useAddAddon = () => useSubscriptionMutation((p) => addAddon(p), 'Add-on added');

// Remove an unpaid add-on (its invoice is voided). A 400 "already paid" is
// toasted with the server's message.
export const useRemoveAddon = () =>
  useSubscriptionMutation((p) => removeAddon(p), 'Add-on removed');

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

/**
 * The current plan invoice of a subscription plus every school invoice by id
 * (for its add-ons' payment status), as the billing estimates need them.
 * GET /invoice/subscription/:id returns the newest invoice of any type — an
 * add-on bill once one is bought — so the plan invoice is picked from the
 * school's list, falling back to that read when the list doesn't reach it.
 * `invoice`: undefined while unknown, null when there is none on record.
 * `byId`: undefined while unknown.
 */
export const usePlanInvoice = (schoolId, subscriptionId) => {
  const list = useInvoices(subscriptionId ? schoolId : null);
  const loaded = list.isSuccess;
  const fromList = loaded ? planInvoiceFor(list.data?.data, subscriptionId) : undefined;
  const needSingle = loaded && fromList === null;
  const single = useInvoiceBySubscription(needSingle ? subscriptionId : null);
  let invoice;
  if (fromList) invoice = fromList;
  else if (needSingle && single.isSuccess) {
    const found = single.data?.data ?? null;
    // An add-on bill there means the plan invoice is older still: unknown.
    invoice = found && found.type === 'addon' ? undefined : found;
  }
  return { invoice, byId: loaded ? invoicesById(list.data?.data) : undefined };
};
