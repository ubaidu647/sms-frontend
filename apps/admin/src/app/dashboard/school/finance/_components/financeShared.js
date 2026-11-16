'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { invalidateLedgerQueries } from '@/utils/ledgerQueries';

// Simple finance (every plan): expenses, other income, cash & bank, P&L.
// Every write here also books a journal entry, so the accounting screens'
// caches are refreshed along with these.
export const FINANCE_QUERY_KEYS = [
  'finance-entries',
  'finance-entry',
  'finance-money-accounts',
  'finance-categories',
  'finance-pnl',
];

export function invalidateFinanceQueries(queryClient) {
  for (const key of FINANCE_QUERY_KEYS) queryClient.invalidateQueries({ queryKey: [key] });
  invalidateLedgerQueries(queryClient);
}

export const KIND_COPY = {
  expense: {
    title: 'Expenses',
    singular: 'Expense',
    subtitle: 'Bijli, kiraya, stationery — everything the school spends money on.',
    partyLabel: 'Paid to',
    partyPlaceholder: 'K-Electric',
    moneyLabel: 'Paid from',
    accent: 'bg-red-600',
    accentHover: 'hover:bg-red-700',
    amountColor: 'text-red-700 dark:text-red-400',
  },
  income: {
    title: 'Other Income',
    singular: 'Income',
    subtitle: 'Money that is not a fee — canteen rent, donations, sale of scrap.',
    partyLabel: 'Received from',
    partyPlaceholder: 'Canteen contractor',
    moneyLabel: 'Received into',
    accent: 'bg-green-600',
    accentHover: 'hover:bg-green-700',
    amountColor: 'text-green-700 dark:text-green-400',
  },
  transfer: {
    title: 'Transfers',
    singular: 'Transfer',
    subtitle: 'Money moved between your own cash boxes and bank accounts.',
    moneyLabel: 'From',
    accent: 'bg-indigo-600',
    accentHover: 'hover:bg-indigo-700',
    amountColor: 'text-indigo-700 dark:text-indigo-400',
  },
};

/** What the signed-in user may do on the finance screens, and for which branches. */
export function useFinanceAccess() {
  const { user } = useUserStore();
  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canManage =
    isAdmin || actions.includes('manage-finance') || actions.includes('manage-all-branch-finance');
  const isOrgLevel =
    isAdmin ||
    actions.includes('view-all-branch-finance') ||
    actions.includes('manage-all-branch-finance');
  const userBranchId = user?.branchId || user?.branch?._id || '';
  return { user, canManage, isOrgLevel, userBranchId };
}

export function useBranches(enabled) {
  const { accessToken: token } = useTokenStore();
  const { data } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && enabled,
    staleTime: Infinity,
  });
  return data?.data || [];
}

/** Cash boxes and bank accounts with their balances (one branch, or all). */
export function useMoneyAccounts(branchId, enabled = true) {
  const { accessToken: token } = useTokenStore();
  const { data, isLoading } = useQuery({
    queryKey: ['finance-money-accounts', branchId || 'all'],
    queryFn: () =>
      fetchData({
        url: '/finance/cash-bank-accounts',
        token,
        branchId: branchId || undefined,
      }),
    enabled: !!token && enabled,
    staleTime: 15000,
  });
  return {
    accounts: data?.data?.accounts || [],
    totalCash: data?.data?.totalCash || 0,
    totalBank: data?.data?.totalBank || 0,
    isLoading,
  };
}

/** Expense categories or income sources a branch may use. */
export function useCategories(type, branchId, enabled = true) {
  const { accessToken: token } = useTokenStore();
  const { data } = useQuery({
    queryKey: ['finance-categories', type, branchId || 'all'],
    queryFn: () =>
      fetchData({ url: '/finance/categories', token, type, branchId: branchId || undefined }),
    enabled: !!token && enabled,
    staleTime: 30000,
  });
  return data?.data || [];
}

export const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400';
export const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';
export const filterCls =
  'bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 outline-none';

export const cancelButtonStyle = {
  baseColor: 'bg-white border border-gray-300',
  hoverColor: 'hover:bg-gray-50',
  rounded: 'rounded-full',
  size: 'px-8 py-3 text-md min-h-[3rem]',
  textColor: 'text-gray-700',
};

export const primaryButtonStyle = (accent = 'bg-teal-600', hover = 'hover:bg-teal-700') => ({
  baseColor: accent,
  hoverColor: hover,
  rounded: 'rounded-full',
  size: 'px-8 py-3 text-md min-h-[3rem]',
  textColor: 'text-white',
});
