import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { useBranchesDropdown } from '../../hooks/useBranchProfilesList';
import {
  useDeletePeriodConfig,
  usePeriodConfigs,
} from '../../hooks/useTimetable';
import { hasAnyAction } from '../../utils/permissions';
import {
  DAY_SHORT,
  PERIOD_PILL,
  titleCase,
} from '../../constants/timetable';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';
import PeriodConfigModal from './PeriodConfigModal';

function ConfigCard({ config, canUpdate, canDelete, onEdit, onDelete, C }) {
  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
              {config.name}
            </Text>
            {config.isDefault && (
              <View style={[styles.pill, { backgroundColor: '#fef3c7' }]}>
                <Feather name="star" size={10} color="#92400e" />
                <Text style={[styles.pillText, { color: '#92400e' }]}>Default</Text>
              </View>
            )}
          </View>
          <Text style={[styles.meta, { color: C.muted }]} numberOfLines={1}>
            {config.serialNumber || '—'}
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: config.isActive ? '#dcfce7' : '#fee2e2',
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: config.isActive ? '#166534' : '#991b1b' },
            ]}
          >
            {config.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View>
        <Text style={[styles.section, { color: C.mutedSoft }]}>WORKING DAYS</Text>
        <View style={styles.dayRow}>
          {(config.workingDays || []).map((d) => (
            <View key={d} style={[styles.dayChip, { backgroundColor: '#ccfbf1' }]}>
              <Text style={[styles.dayChipText, { color: '#0f766e' }]}>{DAY_SHORT[d]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View>
        <Text style={[styles.section, { color: C.mutedSoft }]}>
          PERIODS ({(config.periods || []).length})
        </Text>
        <View style={{ gap: 4 }}>
          {(config.periods || []).map((p) => {
            const cfg = PERIOD_PILL[p.type] || PERIOD_PILL.other;
            return (
              <View
                key={p.number}
                style={[styles.periodRow, { borderColor: C.border, backgroundColor: C.bg }]}
              >
                <View style={styles.periodLeft}>
                  <View style={styles.numBadge}>
                    <Text style={styles.numBadgeText}>{p.number}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.periodName, { color: C.text }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={[styles.periodTime, { color: C.mutedSoft }]}>
                      {p.startTime} – {p.endTime}
                    </Text>
                  </View>
                </View>
                <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.typePillText, { color: cfg.fg }]}>
                    {titleCase(p.type)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {(canUpdate || canDelete) && (
        <View style={styles.actionsRow}>
          {canUpdate && (
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: COLORS.brand },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Feather name="edit-2" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Edit</Text>
            </Pressable>
          )}
          {canDelete && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: '#b91c1c' },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather name="trash-2" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default function PeriodConfigsPanel() {
  const C = useColors();
  const { user } = useUserStore();

  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || !!user?.role?.actions?.includes('view-all-branch-timetable');
  const canCreate = hasAnyAction(user?.role, [
    'create-timetable',
    'create-all-branch-timetable',
  ]);
  const canUpdate = hasAnyAction(user?.role, [
    'update-timetable',
    'update-all-branch-timetable',
  ]);
  const canDelete = hasAnyAction(user?.role, [
    'delete-timetable',
    'delete-all-branch-timetable',
  ]);

  const userBranchId =
    (typeof user?.branchId === 'string' && user.branchId) ||
    user?.branchId?._id ||
    user?.branch?._id ||
    '';

  const [branchId, setBranchId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const { data: branchData } = useBranchesDropdown({ enabled: isOrgLevel });
  const branches = branchData?.data || [];
  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: configData, isFetching } = usePeriodConfigs({
    branchId: effectiveBranchId || undefined,
    isActive: true,
  });
  const configs = configData?.data || [];

  const del = useDeletePeriodConfig();

  const onDelete = (c) => {
    Alert.alert(
      'Delete Period Config',
      `Delete "${c.name}"? Sections using it may need to fall back to the branch default.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => del.mutate(c._id),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {isOrgLevel && (
        <View style={[styles.filterCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.label, { color: C.muted }]}>BRANCH</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setBranchId('')}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: C.bg, borderColor: C.border },
                !branchId && styles.chipActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: C.text },
                  !branchId && styles.chipTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {branches.map((b) => {
              const active = branchId === b._id;
              return (
                <Pressable
                  key={b._id}
                  onPress={() => setBranchId(b._id)}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: C.bg, borderColor: C.border },
                    active && styles.chipActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: C.text },
                      active && styles.chipTextActive,
                    ]}
                  >
                    {b.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {canCreate && (
        <Pressable
          onPress={() => setAddOpen(true)}
          style={({ pressed }) => [
            styles.primary,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.primaryText}>New Period Config</Text>
        </Pressable>
      )}

      {isFetching && configs.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : configs.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
          <Feather name="inbox" size={28} color={C.mutedSoft} />
          <Text style={[styles.emptyText, { color: C.muted }]}>
            No period configs yet. Create one to start building section timetables.
          </Text>
        </View>
      ) : (
        configs.map((c) => (
          <ConfigCard
            key={c._id}
            config={c}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={() => setEditTarget(c)}
            onDelete={() => onDelete(c)}
            C={C}
          />
        ))
      )}

      <PeriodConfigModal open={addOpen} onClose={() => setAddOpen(false)} />
      <PeriodConfigModal
        open={!!editTarget}
        config={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 32, gap: 12 },

  filterCard: { borderRadius: 14, padding: 12, borderWidth: 1, gap: 8 },
  label: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.brand,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  empty: {
    borderRadius: 14,
    paddingVertical: 36,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 13, textAlign: 'center' },

  card: { borderRadius: 14, padding: 12, gap: 10, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 11, marginTop: 2 },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: { fontSize: 10, fontWeight: '800' },

  section: { fontSize: 9, letterSpacing: 1.1, fontWeight: '800', marginBottom: 4 },

  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dayChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayChipText: { fontSize: 11, fontWeight: '800' },

  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  periodLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  numBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  periodName: { fontSize: 13, fontWeight: '700' },
  periodTime: { fontSize: 11, marginTop: 1 },

  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typePillText: { fontSize: 10, fontWeight: '800' },

  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
