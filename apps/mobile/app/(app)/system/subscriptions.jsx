import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../../src/store/userStore';
import { isSuperAdmin } from '../../../src/utils/permissions';
import { useOrganizations } from '../../../src/hooks/useOrganizations';
import {
  useCurrentSubscription,
  useSubscriptionHistory,
  useInvoiceSummary,
  useRenewSubscription,
  useCancelSubscription,
} from '../../../src/hooks/useSubscriptions';
import {
  fmtMoney,
  fmtDate,
  effectiveLimit,
  graceCutoff,
  platformList,
  validateGraceDays,
  SUB_STATUS_PILL,
} from '../../../src/constants/billing';
import AssignSubscriptionModal from '../../../src/component/system/AssignSubscriptionModal';
import ChangePlanModal from '../../../src/component/system/ChangePlanModal';
import InvoiceModal from '../../../src/component/system/InvoiceModal';
import ConfirmModal from '../../../src/component/system/ConfirmModal';
import SubscriptionDetailModal from '../../../src/component/billing/SubscriptionDetailModal';
import { useColors } from '../../../src/theme/useColors';
import { COLORS } from '../../../src/theme/colors';

function StatusPill({ status, C }) {
  const cfg = SUB_STATUS_PILL[status] || { bg: '#f3f4f6', fg: '#374151' };
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.pillText, { color: cfg.fg }]}>{status || 'unknown'}</Text>
    </View>
  );
}

export default function SubscriptionsScreen() {
  const C = useColors();
  const { user } = useUserStore();
  const allowed = isSuperAdmin(user?.role);

  const { data: schoolsData, isLoading: schoolsLoading } = useOrganizations({});
  const schools = schoolsData?.data ?? [];

  const [schoolId, setSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const selectedSchool = schools.find((s) => s._id === schoolId);

  const current = useCurrentSubscription(schoolId);
  const sub = current.data?.data ?? null;
  const history = useSubscriptionHistory(schoolId);
  const historyRows = history.data?.data ?? [];
  const summary = useInvoiceSummary(schoolId);
  const dues = summary.data?.data ?? null;

  const renew = useRenewSubscription({ onSuccess: () => setRenewOpen(false) });
  const cancel = useCancelSubscription({ onSuccess: () => setCancelOpen(false) });

  const [assignOpen, setAssignOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [renewGrace, setRenewGrace] = useState('');
  const [subTarget, setSubTarget] = useState(null);
  const [invoiceTarget, setInvoiceTarget] = useState(null);

  const filteredSchools = useMemo(() => {
    if (!schoolSearch.trim()) return schools;
    const q = schoolSearch.toLowerCase();
    return schools.filter((s) => s.name?.toLowerCase().includes(q));
  }, [schools, schoolSearch]);

  if (!allowed) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg }]}>
        <View style={styles.center}><Feather name="lock" size={36} color={COLORS.red || '#dc2626'} /><Text style={[styles.title, { color: C.text }]}>No access</Text></View>
      </View>
    );
  }

  const grace = sub?.gracePeriodInDays ?? 0;
  const refreshing = current.isFetching || history.isFetching || summary.isFetching;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: C.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        schoolId ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { current.refetch(); history.refetch(); summary.refetch(); }}
            tintColor={COLORS.brand}
          />
        ) : undefined
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Subscriptions</Text>
        <Text style={[styles.sub, { color: C.muted }]}>View and manage each school's subscription.</Text>
      </View>

      {/* School picker */}
      {!schoolId ? (
        <>
          <View style={[styles.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
            <Feather name="search" size={16} color={C.mutedSoft} />
            <TextInput
              value={schoolSearch}
              onChangeText={setSchoolSearch}
              placeholder="Search schools..."
              placeholderTextColor={C.mutedSoft}
              style={[styles.searchInput, { color: C.text }]}
            />
          </View>
          {schoolsLoading ? (
            <ActivityIndicator color={COLORS.brand} style={{ marginTop: 20 }} />
          ) : (
            filteredSchools.map((s) => (
              <Pressable
                key={s._id}
                onPress={() => setSchoolId(s._id)}
                style={({ pressed }) => [styles.schoolRow, { backgroundColor: C.card, borderColor: C.border }, pressed && { opacity: 0.9 }]}
              >
                <Feather name="home" size={16} color={COLORS.brand} />
                <Text style={[styles.schoolName, { color: C.text }]} numberOfLines={1}>{s.name}</Text>
                <Feather name="chevron-right" size={18} color={C.mutedSoft} />
              </Pressable>
            ))
          )}
        </>
      ) : (
        <>
          <Pressable
            onPress={() => setSchoolId('')}
            style={({ pressed }) => [styles.schoolHeader, { backgroundColor: C.card, borderColor: C.border }, pressed && { opacity: 0.9 }]}
          >
            <Feather name="home" size={16} color={COLORS.brand} />
            <Text style={[styles.schoolName, { color: C.text }]} numberOfLines={1}>{selectedSchool?.name}</Text>
            <Text style={[styles.changeLink, { color: COLORS.brand }]}>Change</Text>
          </Pressable>

          {current.isLoading ? (
            <ActivityIndicator color={COLORS.brand} style={{ marginTop: 24 }} />
          ) : (
            <>
              {/* Current subscription */}
              <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
                {sub ? (
                  <>
                    <View style={styles.planTitleRow}>
                      <Text style={[styles.planName, { color: C.text }]} numberOfLines={1}>
                        {sub.packageSnapshot?.name ?? 'Subscription'}
                      </Text>
                      <StatusPill status={sub.status} C={C} />
                    </View>
                    <Text style={[styles.sub, { color: C.muted }]}>
                      {fmtMoney(sub.packageSnapshot?.price)} · {sub.packageSnapshot?.durationInDays}d cycle
                    </Text>
                    <Text style={[styles.subSmall, { color: C.muted }]}>
                      {fmtDate(sub.startDate)} → {fmtDate(sub.endDate)}
                    </Text>
                    <Text style={[styles.subSmall, { color: C.muted }]}>
                      Grace: {grace} {grace === 1 ? 'day' : 'days'}
                      {grace > 0 ? ` · blocked after ${fmtDate(graceCutoff(sub.endDate, grace))}` : ''}
                    </Text>

                    <View style={styles.limitGrid}>
                      {[
                        ['noOfStudents', 'Students'],
                        ['noOfBranches', 'Branches'],
                        ['noOfStaffs', 'Staff'],
                        ['noOfSections', 'Sections'],
                      ].map(([key, lbl]) => (
                        <View key={key} style={[styles.limitCard, { backgroundColor: C.bg }]}>
                          <Text style={[styles.limitValue, { color: C.text }]}>{effectiveLimit(sub, key) ?? '∞'}</Text>
                          <Text style={[styles.limitLabel, { color: C.muted }]}>{lbl}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.planMeta, { borderTopColor: C.border }]}>
                      <Text style={[styles.kv, { color: C.muted }]}>
                        Platforms: <Text style={{ color: C.text, textTransform: 'capitalize' }}>{platformList(sub.packageSnapshot?.platforms)}</Text>
                      </Text>
                      <Text style={[styles.kv, { color: C.muted, marginTop: 4 }]}>
                        Features: <Text style={{ color: C.text }}>{sub.packageSnapshot?.features?.length ? sub.packageSnapshot.features.join(', ') : 'All features'}</Text>
                      </Text>
                    </View>
                    {sub.customLimits && Object.keys(sub.customLimits).length > 0 && (
                      <Text style={[styles.warn, { color: '#b45309' }]}>This school has custom limit overrides applied.</Text>
                    )}

                    <View style={styles.actionRow}>
                      <Pressable onPress={() => setChangeOpen(true)} style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.9 }]}>
                        <Feather name="refresh-cw" size={14} color="#fff" />
                        <Text style={styles.primaryActionText}>Change</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => { setRenewGrace(sub?.gracePeriodInDays != null ? String(sub.gracePeriodInDays) : ''); setRenewOpen(true); }}
                        style={({ pressed }) => [styles.ghostAction, { borderColor: C.border, backgroundColor: C.bg }, pressed && { opacity: 0.85 }]}
                      >
                        <Feather name="rotate-cw" size={14} color={C.text} />
                        <Text style={[styles.ghostActionText, { color: C.text }]}>Renew</Text>
                      </Pressable>
                      <Pressable onPress={() => setCancelOpen(true)} style={({ pressed }) => [styles.ghostAction, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }, pressed && { opacity: 0.85 }]}>
                        <Feather name="slash" size={14} color="#991b1b" />
                        <Text style={[styles.ghostActionText, { color: '#991b1b' }]}>Cancel</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <View style={{ gap: 12, alignItems: 'center', paddingVertical: 8 }}>
                    <Feather name="credit-card" size={32} color={C.mutedSoft} />
                    <Text style={[styles.emptyTitle, { color: C.text }]}>No active subscription</Text>
                    <Text style={[styles.sub, { color: C.muted, textAlign: 'center' }]}>
                      {selectedSchool?.name} has no active plan. Assign one to get started.
                    </Text>
                    <Pressable onPress={() => setAssignOpen(true)} style={({ pressed }) => [styles.assignBtn, pressed && { opacity: 0.9 }]}>
                      <Feather name="plus" size={16} color="#fff" />
                      <Text style={styles.primaryActionText}>Assign Subscription</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Billing & dues */}
              <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={styles.sectionHead}>
                  <Feather name="file-text" size={18} color={COLORS.brand} />
                  <Text style={[styles.sectionTitle, { color: C.text }]}>Billing & Dues</Text>
                </View>
                <View style={styles.duesGrid}>
                  <DueStat value={fmtMoney(dues?.totalDue ?? 0)} label="Outstanding dues" bg="#fee2e2" fg="#991b1b" />
                  <DueStat value={fmtMoney(dues?.totalPaid ?? 0)} label="Total paid" bg="#dcfce7" fg="#166534" />
                  <DueStat value={`${dues?.unpaidCount ?? 0}`} label="Unpaid invoices" bg={C.bg} fg={C.text} />
                  <DueStat value={`${dues?.invoiceCount ?? 0}`} label="Total invoices" bg={C.bg} fg={C.text} />
                </View>
                <Text style={[styles.hint, { color: C.mutedSoft }]}>
                  Open a plan below and choose “View Invoice” to see line items or mark it paid.
                </Text>
              </View>

              {/* History */}
              <Text style={[styles.listHeading, { color: C.text }]}>History</Text>
              {history.isLoading ? (
                <ActivityIndicator color={COLORS.brand} style={{ marginVertical: 16 }} />
              ) : historyRows.length === 0 ? (
                <Text style={[styles.emptyLine, { color: C.muted }]}>No subscription history.</Text>
              ) : (
                historyRows.map((row) => (
                  <View key={row._id} style={[styles.histRow, { backgroundColor: C.card, borderColor: C.border }]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.histTitle, { color: C.text }]} numberOfLines={1}>{row.packageSnapshot?.name ?? '-'}</Text>
                      <Text style={[styles.histMeta, { color: C.muted }]} numberOfLines={1}>
                        {fmtMoney(row.packageSnapshot?.price)} · {fmtDate(row.startDate)} → {fmtDate(row.endDate)}
                      </Text>
                    </View>
                    <StatusPill status={row.status} C={C} />
                    <View style={styles.histActions}>
                      <Pressable onPress={() => setSubTarget(row)} hitSlop={6} style={({ pressed }) => [styles.histIconBtn, { backgroundColor: C.bg }, pressed && { opacity: 0.7 }]}>
                        <Feather name="eye" size={15} color={C.text} />
                      </Pressable>
                      <Pressable onPress={() => setInvoiceTarget(row)} hitSlop={6} style={({ pressed }) => [styles.histIconBtn, { backgroundColor: C.bg }, pressed && { opacity: 0.7 }]}>
                        <Feather name="file-text" size={15} color={C.text} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </>
      )}

      {/* Modals */}
      <AssignSubscriptionModal open={assignOpen} onClose={() => setAssignOpen(false)} schoolId={schoolId} schoolName={selectedSchool?.name} />
      <ChangePlanModal open={changeOpen} onClose={() => setChangeOpen(false)} schoolId={schoolId} schoolName={selectedSchool?.name} current={sub} />
      <ConfirmModal
        open={renewOpen}
        title="Renew Subscription"
        message={sub ? `Renew "${sub.packageSnapshot?.name}" for ${selectedSchool?.name}? This starts a fresh ${sub.packageSnapshot?.durationInDays}-day cycle at current pricing.` : ''}
        confirmLabel="Renew"
        confirmTone="primary"
        loading={renew.isPending}
        onClose={() => setRenewOpen(false)}
        onConfirm={() => {
          const err = validateGraceDays(renewGrace);
          if (err) { return; }
          const payload = { schoolId };
          if (renewGrace !== '' && renewGrace != null) payload.gracePeriodInDays = Number(renewGrace);
          renew.mutate(payload);
        }}
      >
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text style={[styles.label, { color: C.muted }]}>GRACE PERIOD (DAYS AFTER EXPIRY)</Text>
          <TextInput
            value={renewGrace}
            onChangeText={setRenewGrace}
            placeholder="0"
            placeholderTextColor={C.mutedSoft}
            keyboardType="number-pad"
            style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: C.bg }]}
          />
          <Text style={[styles.hint, { color: C.mutedSoft }]}>Leave unchanged to keep the current grace period.</Text>
        </View>
      </ConfirmModal>
      <ConfirmModal
        open={cancelOpen}
        title="Cancel Subscription"
        message={selectedSchool ? `Cancel the active subscription for "${selectedSchool.name}"? The school will be left without an active plan.` : ''}
        confirmLabel="Cancel Subscription"
        confirmTone="danger"
        loading={cancel.isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancel.mutate(schoolId)}
      />
      <SubscriptionDetailModal open={!!subTarget} subscription={subTarget} onClose={() => setSubTarget(null)} />
      <InvoiceModal open={!!invoiceTarget} subscription={invoiceTarget} schoolId={schoolId} onClose={() => setInvoiceTarget(null)} />
    </ScrollView>
  );
}

function DueStat({ value, label, bg, fg }) {
  return (
    <View style={[styles.dueCard, { backgroundColor: bg }]}>
      <Text style={[styles.dueValue, { color: fg }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.dueLabel, { color: fg, opacity: 0.7 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 14, paddingBottom: 36, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },

  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  subSmall: { fontSize: 12, marginTop: 4 },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 14 },

  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  schoolHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  schoolName: { flex: 1, fontSize: 15, fontWeight: '800' },
  changeLink: { fontSize: 13, fontWeight: '800' },

  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planName: { fontSize: 18, fontWeight: '800', flexShrink: 1 },

  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },

  limitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  limitCard: { flexBasis: '22%', flexGrow: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  limitValue: { fontSize: 18, fontWeight: '800' },
  limitLabel: { fontSize: 11, marginTop: 2 },

  planMeta: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  kv: { fontSize: 13, fontWeight: '600' },
  warn: { fontSize: 12, fontWeight: '600', marginTop: 8 },

  emptyTitle: { fontSize: 16, fontWeight: '800' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  primaryAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 10, backgroundColor: COLORS.brand },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  ghostAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 10, borderWidth: 1 },
  ghostActionText: { fontWeight: '700', fontSize: 13 },
  assignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, paddingHorizontal: 20, borderRadius: 12, backgroundColor: COLORS.brand, marginTop: 4 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  duesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dueCard: { flexBasis: '47%', flexGrow: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  dueValue: { fontSize: 20, fontWeight: '800' },
  dueLabel: { fontSize: 11, marginTop: 2 },
  hint: { fontSize: 11, marginTop: 8 },

  listHeading: { fontSize: 16, fontWeight: '800', marginBottom: 2, marginTop: 4 },
  emptyLine: { fontSize: 13, paddingVertical: 12, textAlign: 'center' },

  histRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  histTitle: { fontSize: 14, fontWeight: '800' },
  histMeta: { fontSize: 11, marginTop: 2 },
  histActions: { flexDirection: 'row', gap: 6 },
  histIconBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  label: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700' },
  input: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
});
