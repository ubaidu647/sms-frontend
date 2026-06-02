import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../../src/store/userStore';
import { useColors } from '../../../src/theme/useColors';
import { COLORS } from '../../../src/theme/colors';
import { hasAnyAction, resolveScope } from '../../../src/utils/permissions';
import VouchersPanel from '../../../src/component/fee/VouchersPanel';
import StructuresPanel from '../../../src/component/fee/StructuresPanel';
import PaymentsPanel from '../../../src/component/fee/PaymentsPanel';
import ReportsPanel from '../../../src/component/fee/ReportsPanel';

export default function FeesScreen() {
  const C = useColors();
  const { user } = useUserStore();

  const feeScope = resolveScope(user?.role, 'view-fee');
  const paymentScope = resolveScope(user?.role, 'view-payment');

  const canViewVouchers = feeScope !== 'none';
  const canViewStructures = feeScope === 'branch' || feeScope === 'all';
  const canViewPayments = paymentScope !== 'none';
  const canViewReports =
    (paymentScope === 'branch' || paymentScope === 'all') ||
    feeScope === 'branch' ||
    feeScope === 'all' ||
    hasAnyAction(user?.role, [
      'student-defaults-list-view',
      'student-defaults-list-view-all-branch',
    ]);

  const TABS = [
    canViewVouchers && { key: 'vouchers', label: 'Vouchers', icon: 'file-text' },
    canViewStructures && { key: 'structures', label: 'Structures', icon: 'layers' },
    canViewPayments && { key: 'payments', label: 'Payments', icon: 'credit-card' },
    canViewReports && { key: 'reports', label: 'Reports', icon: 'bar-chart-2' },
  ].filter(Boolean);

  const [tab, setTab] = useState(TABS[0]?.key || 'vouchers');

  if (TABS.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg }]}>
        <View style={styles.center}>
          <Feather name="lock" size={36} color={COLORS.red} />
          <Text style={[styles.title, { color: C.text }]}>No access</Text>
          <Text style={[styles.sub, { color: C.muted, textAlign: 'center' }]}>
            You don't have permission to view fees.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Fees</Text>
        <Text style={[styles.sub, { color: C.muted }]}>
          Vouchers, structures, payments and reports
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={({ pressed }) => [
                styles.tab,
                { backgroundColor: C.card, borderColor: C.border },
                active && styles.tabActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather name={t.icon} size={14} color={active ? '#fff' : C.muted} />
              <Text style={[styles.tabLabel, { color: active ? '#fff' : C.text }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {tab === 'vouchers' && <VouchersPanel />}
        {tab === 'structures' && <StructuresPanel />}
        {tab === 'payments' && <PaymentsPanel />}
        {tab === 'reports' && <ReportsPanel />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: 14, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 4 },

  tabScroll: { flexGrow: 0, flexShrink: 0 },
  tabRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tabLabel: { fontSize: 13, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
});
