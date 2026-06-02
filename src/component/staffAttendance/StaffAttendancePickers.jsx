import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';
import { STAFF_TYPES, titleCase } from '../../constants/staffAttendance';

// Shared filter row used across the staff-attendance panels.
// - When `isOrgLevel` is true: render the branch chip row.
// - `mode === 'date'` → YYYY-MM-DD text field
// - `mode === 'month'` → YYYY-MM text field
export default function StaffAttendancePickers({
  isOrgLevel,
  branches = [],
  branchId,
  onBranchId,
  staffType,
  onStaffType,
  date,
  onDate,
  month,
  onMonth,
  mode = 'date',
  showStaffType = true,
}) {
  const C = useColors();

  return (
    <View style={{ gap: 12 }}>
      {isOrgLevel && (
        <View>
          <Text style={[styles.label, { color: C.muted }]}>BRANCH</Text>
          {branches.length === 0 ? (
            <Text style={[styles.helper, { color: C.mutedSoft }]}>Loading branches…</Text>
          ) : (
            <View style={styles.chipRow}>
              {branches.map((b) => {
                const active = branchId === b._id;
                return (
                  <Pressable
                    key={b._id}
                    onPress={() => onBranchId?.(b._id)}
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
          )}
        </View>
      )}

      {showStaffType && (
        <View>
          <Text style={[styles.label, { color: C.muted }]}>STAFF TYPE</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => onStaffType?.('')}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: C.bg, borderColor: C.border },
                !staffType && styles.chipActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: C.text },
                  !staffType && styles.chipTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {STAFF_TYPES.map((t) => {
              const active = staffType === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => onStaffType?.(t)}
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
                    {titleCase(t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View>
        <Text style={[styles.label, { color: C.muted }]}>
          {mode === 'month' ? 'MONTH (YYYY-MM)' : 'DATE (YYYY-MM-DD)'}
        </Text>
        <View
          style={[
            styles.fieldRow,
            { backgroundColor: C.bg, borderColor: C.border },
          ]}
        >
          <Feather name="calendar" size={14} color={COLORS.brand} />
          <TextInput
            value={mode === 'month' ? month || '' : date || ''}
            onChangeText={(v) =>
              mode === 'month' ? onMonth?.(v) : onDate?.(v)
            }
            placeholder={mode === 'month' ? '2026-06' : '2026-06-01'}
            placeholderTextColor={C.mutedSoft}
            style={[styles.fieldInput, { color: C.text }]}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, letterSpacing: 1.1, fontWeight: '700', marginBottom: 6 },
  helper: { fontSize: 12 },
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
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  fieldInput: { flex: 1, fontSize: 14, fontWeight: '600' },
});
