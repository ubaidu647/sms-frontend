import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { fmtMoney } from '../../constants/billing';
import { useColors } from '../../theme/useColors';

const enabledKeys = (obj, fallback) =>
  Object.entries(obj ?? fallback ?? {})
    .filter(([, on]) => on)
    .map(([k]) => k);

// Read-only package detail. Mirrors web PackageDetailModal.
export default function PackageDetailModal({ open, pkg, onClose }) {
  const C = useColors();
  const platforms = enabledKeys(pkg?.platforms);
  const dashboards = enabledKeys(pkg?.dashboards, { staff: true, student: false, parent: false });

  return (
    <Modal visible={open} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: C.card }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
              {pkg?.name || 'Package'}
            </Text>
            <Text style={[styles.subtitle, { color: C.muted }]}>Package details</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [styles.closeBtn, { backgroundColor: C.bg }, pressed && { opacity: 0.6 }]}
          >
            <Feather name="x" size={20} color={C.text} />
          </Pressable>
        </View>

        {!pkg ? (
          <View style={styles.center}>
            <Text style={[styles.subtitle, { color: C.muted }]}>No package selected.</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: C.bg, borderColor: C.border }]}>
              {pkg.serialNumber != null && <Row label="Serial" value={`#${pkg.serialNumber}`} C={C} />}
              {!!pkg.description && <Row label="Description" value={pkg.description} C={C} />}
              <Row label="Price" value={fmtMoney(pkg.price)} C={C} />
              <Row label="Duration" value={`${pkg.durationInDays} days`} C={C} />
              <Row label="Students" value={pkg.limits?.noOfStudents ?? '-'} C={C} />
              <Row label="Branches" value={pkg.limits?.noOfBranches ?? '-'} C={C} />
              <Row label="Staff" value={pkg.limits?.noOfStaffs ?? '-'} C={C} />
              <Row label="Sections" value={pkg.limits?.noOfSections ?? '-'} C={C} />
              <Row label="Platforms" value={platforms.length ? platforms.join(', ') : 'None'} C={C} cap />
              <Row label="Dashboards" value={dashboards.length ? dashboards.join(', ') : 'None'} C={C} cap />
              <Row
                label="Features"
                value={pkg.features?.length ? pkg.features.join(', ') : 'All features'}
                C={C}
              />
              <Row label="Status" value={pkg.isActive ? 'Active' : 'Inactive'} C={C} last />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function Row({ label, value, C, last, cap }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }, { borderBottomColor: C.border }]}>
      <Text style={[styles.rowLabel, { color: C.muted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: C.text }, cap && { textTransform: 'capitalize' }]} numberOfLines={3}>
        {value === 0 ? '0' : value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: { fontSize: 19, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  body: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 12, fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
});
