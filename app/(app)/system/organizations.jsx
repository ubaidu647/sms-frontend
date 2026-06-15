import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../../src/store/userStore';
import { isSuperAdmin } from '../../../src/utils/permissions';
import {
  useOrganizations,
  splitOrganizations,
  useToggleSchoolStatus,
} from '../../../src/hooks/useOrganizations';
import { fmtDate } from '../../../src/constants/billing';
import AddOrganizationModal from '../../../src/component/system/AddOrganizationModal';
import ConfirmModal from '../../../src/component/system/ConfirmModal';
import { useColors } from '../../../src/theme/useColors';
import { COLORS } from '../../../src/theme/colors';

const isRowDisabled = (o) => o?.isActive === false || o?.status === 'suspended';

function OrgCard({ o, onToggle, C }) {
  const disabled = isRowDisabled(o);
  const statusLabel = disabled ? 'Disabled' : o?.status || 'Active';
  const statusColor = disabled
    ? { bg: '#fee2e2', fg: '#991b1b' }
    : o?.status === 'pending'
      ? { bg: '#fef3c7', fg: '#92400e' }
      : { bg: '#dcfce7', fg: '#166534' };

  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>{o.name}</Text>
          <Text style={[styles.meta, { color: C.muted }]} numberOfLines={1}>{o.email || '—'}</Text>
          {!!o.phone && <Text style={[styles.meta, { color: C.mutedSoft }]} numberOfLines={1}>{o.phone}</Text>}
        </View>
        <View style={[styles.pill, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.pillText, { color: statusColor.fg }]}>
            {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
          </Text>
        </View>
      </View>

      <View style={[styles.footerRow, { borderTopColor: C.border }]}>
        <Text style={[styles.footerText, { color: C.muted }]}>
          {o.packageName ? `${o.packageName} · ` : ''}Created {fmtDate(o.createdAt)}
        </Text>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [
            styles.toggleBtn,
            { backgroundColor: disabled ? '#dcfce7' : '#fee2e2' },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Feather name={disabled ? 'check-circle' : 'slash'} size={12} color={disabled ? '#166534' : '#991b1b'} />
          <Text style={[styles.toggleText, { color: disabled ? '#166534' : '#991b1b' }]}>
            {disabled ? 'Enable' : 'Disable'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function OrganizationsScreen() {
  const C = useColors();
  const { user } = useUserStore();
  const allowed = isSuperAdmin(user?.role);

  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null); // { org, toDisable }

  const { data, isLoading, isFetching, refetch, error } = useOrganizations({});
  const { active, disabled } = useMemo(
    () => splitOrganizations(data?.data || []),
    [data],
  );

  const toggle = useToggleSchoolStatus({ onSuccess: () => setToggleTarget(null) });

  const rows = useMemo(() => {
    const base = tab === 'active' ? active : disabled;
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((o) => o.name?.toLowerCase().includes(q));
  }, [tab, active, disabled, search]);

  if (!allowed) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg }]}>
        <View style={styles.center}>
          <Feather name="lock" size={36} color={COLORS.red || '#dc2626'} />
          <Text style={[styles.title, { color: C.text }]}>No access</Text>
        </View>
      </View>
    );
  }

  const Header = (
    <View style={{ gap: 12 }}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: C.text }]}>Organizations</Text>
          <Text style={[styles.sub, { color: C.muted }]}>Schools registered in your system</Text>
        </View>
        <Pressable
          onPress={() => setAddOpen(true)}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {[
          { k: 'active', l: `Active (${active.length})` },
          { k: 'disabled', l: `Disabled (${disabled.length})` },
        ].map((t) => {
          const on = tab === t.k;
          return (
            <Pressable
              key={t.k}
              onPress={() => setTab(t.k)}
              style={({ pressed }) => [
                styles.tab,
                { backgroundColor: C.card, borderColor: C.border },
                on && styles.tabActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.tabText, { color: on ? '#fff' : C.text }]}>{t.l}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
        <Feather name="search" size={16} color={C.mutedSoft} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search organizations..."
          placeholderTextColor={C.mutedSoft}
          style={[styles.searchInput, { color: C.text }]}
        />
      </View>

      <View style={styles.resultBar}>
        <Text style={[styles.resultText, { color: C.muted }]}>
          {isLoading ? 'Loading…' : `${rows.length} ${rows.length === 1 ? 'school' : 'schools'}`}
        </Text>
        {isFetching && !isLoading && <ActivityIndicator size="small" color={COLORS.brand} />}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={Header}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <OrgCard
            o={item}
            C={C}
            onToggle={() => setToggleTarget({ org: item, toDisable: !isRowDisabled(item) })}
          />
        )}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <Feather name={error ? 'alert-circle' : 'inbox'} size={36} color={error ? COLORS.red : C.mutedSoft} />
              <Text style={[styles.emptyText, { color: C.muted }]}>
                {error ? error.message || 'Failed to load' : 'No organizations'}
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={COLORS.brand} />
        }
      />

      <AddOrganizationModal open={addOpen} onClose={() => setAddOpen(false)} />

      <ConfirmModal
        open={!!toggleTarget}
        title={toggleTarget?.toDisable ? 'Disable School' : 'Enable School'}
        message={
          toggleTarget
            ? toggleTarget.toDisable
              ? `Disable "${toggleTarget.org.name}"? All its users are logged out immediately and cannot log back in until re-enabled.`
              : `Re-enable "${toggleTarget.org.name}"? Users will be able to log in again.`
            : ''
        }
        confirmLabel={toggleTarget?.toDisable ? 'Disable' : 'Enable'}
        confirmTone={toggleTarget?.toDisable ? 'danger' : 'primary'}
        loading={toggle.isPending}
        onClose={() => setToggleTarget(null)}
        onConfirm={() =>
          toggle.mutate({ id: toggleTarget.org._id, isActive: !toggleTarget.toDisable })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  listContent: { padding: 14, paddingBottom: 32 },

  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 16, borderRadius: 10, backgroundColor: COLORS.brand },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tabText: { fontSize: 13, fontWeight: '700' },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 14 },

  resultBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  resultText: { fontSize: 12, fontWeight: '600' },

  card: { borderRadius: 14, padding: 12, gap: 10, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 11, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '800' },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  footerText: { fontSize: 11, fontWeight: '600', flex: 1 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: 999 },
  toggleText: { fontSize: 11, fontWeight: '800' },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
