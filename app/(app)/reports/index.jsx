import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../../src/store/userStore';
import { useColors } from '../../../src/theme/useColors';
import { COLORS } from '../../../src/theme/colors';
import { hasAnyAction } from '../../../src/utils/permissions';
import DefaultersReportPanel from '../../../src/component/reports/DefaultersReportPanel';

export default function ReportsScreen() {
  const C = useColors();
  const { user } = useUserStore();

  const canRun =
    !!user?.role?.isPredefined ||
    hasAnyAction(user?.role, [
      'student-defaults-list-view',
      'student-defaults-list-view-all-branch',
    ]);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: '#fee2e2' }]}>
            <Feather name="trending-down" size={18} color="#dc2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: C.text }]}>Reports</Text>
            <Text style={[styles.sub, { color: C.muted }]}>
              Student fee defaulters statement
            </Text>
          </View>
        </View>
      </View>

      {!canRun ? (
        <View style={styles.center}>
          <Feather name="lock" size={36} color={COLORS.red || '#dc2626'} />
          <Text style={[styles.title, { color: C.text }]}>No access</Text>
          <Text style={[styles.sub, { color: C.muted, textAlign: 'center' }]}>
            You don't have permission to view this report.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <DefaultersReportPanel />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: 14, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
});
