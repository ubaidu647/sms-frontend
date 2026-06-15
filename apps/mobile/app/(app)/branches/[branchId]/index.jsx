import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useBranch } from '../../../../src/hooks/useBranch';
import { COLORS } from '../../../../src/theme/colors';
import { useColors } from '../../../../src/theme/useColors';

const STATUS_PILL = {
  active: { bg: '#dcfce7', fg: '#166534' },
  inactive: { bg: '#fef3c7', fg: '#92400e' },
  disabled: { bg: '#fee2e2', fg: '#991b1b' },
};

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function InfoRow({ icon, label, value, sub, fallback = '—' }) {
  const C = useColors();
  return (
    <View style={[styles.infoRow, { backgroundColor: C.bg, borderColor: C.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: C.card, borderColor: C.border }]}>
        <Feather name={icon} size={14} color={COLORS.brand} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.infoLabel, { color: C.muted }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.infoValue, { color: C.text }]}>{value || fallback}</Text>
        {!!sub && <Text style={[styles.infoSub, { color: C.muted }]}>{sub}</Text>}
      </View>
    </View>
  );
}

export default function BranchDetailPage() {
  const router = useRouter();
  const { branchId } = useLocalSearchParams();
  const C = useColors();

  const { data, isLoading, error } = useBranch(branchId);
  const branch = data?.data;

  if (isLoading && !branch) {
    return (
      <View style={[styles.safe, { backgroundColor: C.bg }]}>
        <Header onBack={() => router.back()} C={C} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </View>
    );
  }

  if (error || !branch) {
    const message =
      error?.response?.data?.message || error?.message || 'Branch not found';
    return (
      <View style={[styles.safe, { backgroundColor: C.bg }]}>
        <Header onBack={() => router.back()} C={C} />
        <View style={styles.errorWrap}>
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={18} color="#b91c1c" />
            <Text style={styles.errorText}>{message}</Text>
          </View>
        </View>
      </View>
    );
  }

  const pill = STATUS_PILL[branch.status] || { bg: '#e5e7eb', fg: '#374151' };

  return (
    <View style={[styles.safe, { backgroundColor: C.bg }]}>
      <Header onBack={() => router.back()} C={C} />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.titleRow}>
                <Feather name="home" size={20} color={COLORS.brand} />
                <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
                  {branch.name}
                </Text>
                <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                  <Text style={[styles.pillText, { color: pill.fg }]}>
                    {branch.status?.charAt(0).toUpperCase() + branch.status?.slice(1)}
                  </Text>
                </View>
              </View>
              {!!branch.serialNumber && (
                <Text style={[styles.code, { color: C.muted }]}>
                  Code: {branch.serialNumber}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() =>
                router.push(`/(app)/branches/${branch._id}/profile`)
              }
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.9 }]}
            >
              <Feather name="edit-2" size={14} color="#fff" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </Pressable>
          </View>

          <View style={styles.infoGrid}>
            <InfoRow
              icon="briefcase"
              label="School"
              value={branch.schoolId?.name}
            />
            <InfoRow icon="hash" label="Serial Number" value={branch.serialNumber} />
            <InfoRow icon="map-pin" label="Address" value={branch.address} />
            <InfoRow icon="phone" label="Phone" value={branch.phone} />
            <InfoRow icon="mail" label="Email" value={branch.email} />
            <InfoRow
              icon="user"
              label="Branch Manager"
              value={branch.branchManager?.name}
              sub={branch.branchManager?.email}
              fallback="Unassigned"
            />
            <InfoRow
              icon="calendar"
              label="Start Date"
              value={fmtDate(branch.startDate)}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.cardTitle, { color: C.text }]}>Audit</Text>
          <View style={styles.infoGrid}>
            <InfoRow
              icon="user"
              label="Created By"
              value={branch.createdBy?.name}
              sub={branch.createdBy?.email}
            />
            <InfoRow
              icon="calendar"
              label="Created At"
              value={fmtDate(branch.createdAt)}
            />
            <InfoRow
              icon="user"
              label="Updated By"
              value={branch.updatedBy?.name}
              sub={branch.updatedBy?.email}
            />
            <InfoRow
              icon="calendar"
              label="Updated At"
              value={fmtDate(branch.updatedAt)}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ onBack, C }) {
  return (
    <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={({ pressed }) => [
          styles.backBtn,
          { backgroundColor: C.bg },
          pressed && { opacity: 0.6 },
        ]}
      >
        <Feather name="arrow-left" size={20} color={C.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerKicker, { color: C.muted }]}>Branches /</Text>
        <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
          Branch Details
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerKicker: { fontSize: 11, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800' },

  body: { padding: 14, paddingBottom: 32, gap: 14 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: { fontSize: 21, fontWeight: '800', flexShrink: 1 },
  code: { fontSize: 12, marginTop: 4 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: COLORS.brand,
    borderRadius: 10,
  },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  infoGrid: { gap: 10 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  infoValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  infoSub: { fontSize: 11, marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  errorWrap: { padding: 16 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  errorText: { color: '#b91c1c', fontSize: 13, flex: 1 },
});
