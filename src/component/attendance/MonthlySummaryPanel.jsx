import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import AttendancePickers from './AttendancePickers';
import { useSectionSummary } from '../../hooks/useAttendance';
import {
  currentAcademicYear,
  currentMonth,
  PERCENTAGE_COLOR,
  STATUS_PILL,
} from '../../constants/attendance';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

const RING_SIZE = 56;
const RING_STROKE = 5;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

function PercentageRing({ pct, C }) {
  const safe = Math.max(0, Math.min(100, pct ?? 0));
  const offset = RING_C - (safe / 100) * RING_C;
  const colors = PERCENTAGE_COLOR(pct);
  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          stroke={colors.bg}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          stroke={colors.fg}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${RING_C} ${RING_C}`}
          strokeDashoffset={pct == null ? RING_C : offset}
          fill="none"
        />
      </Svg>
      <View style={styles.ringInner}>
        <Text style={[styles.ringText, { color: colors.fg }]}>
          {pct != null ? `${pct}%` : '—'}
        </Text>
      </View>
    </View>
  );
}

function StatTile({ kind, count, C }) {
  const c = STATUS_PILL[kind];
  return (
    <View style={[styles.statTile, { backgroundColor: c.bg }]}>
      <View style={[styles.statIcon, { backgroundColor: c.solid }]}>
        <Feather name={c.icon} size={11} color="#fff" />
      </View>
      <View>
        <Text style={[styles.statCount, { color: c.fg }]}>{count ?? 0}</Text>
        <Text style={[styles.statLabel, { color: c.fg }]}>{c.label}</Text>
      </View>
    </View>
  );
}

export default function MonthlySummaryPanel() {
  const C = useColors();

  const [branchId, setBranchId] = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [month, setMonth] = useState(currentMonth());

  const { data, isLoading } = useSectionSummary({ classId, sectionId, month });
  const summary = data?.data;
  const students = summary?.students || [];

  const classTotals = useMemo(() => {
    if (!students.length) return null;
    const t = { present: 0, absent: 0, late: 0, halfDay: 0, leave: 0, holiday: 0, total: 0 };
    let pSum = 0;
    let pCount = 0;
    for (const s of students) {
      t.present += s.present || 0;
      t.absent += s.absent || 0;
      t.late += s.late || 0;
      t.halfDay += s.halfDay || 0;
      t.leave += s.leave || 0;
      t.holiday += s.holiday || 0;
      t.total += s.total || 0;
      if (s.percentage != null) {
        pSum += s.percentage;
        pCount++;
      }
    }
    return { ...t, avg: pCount ? Math.round(pSum / pCount) : null };
  }, [students]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 32 }}
    >
      <AttendancePickers
        branchId={branchId}
        setBranchId={setBranchId}
        academicYear={academicYear}
        setAcademicYear={setAcademicYear}
        classId={classId}
        setClassId={setClassId}
        sectionId={sectionId}
        setSectionId={setSectionId}
        extraSlot={
          <View style={{ gap: 6 }}>
            <Text style={[styles.label, { color: C.muted }]}>MONTH</Text>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={14} color={C.muted} />
              <TextInput
                value={month}
                onChangeText={setMonth}
                placeholder="YYYY-MM"
                placeholderTextColor={C.mutedSoft}
                style={[styles.dateInput, { color: C.text }]}
              />
            </View>
          </View>
        }
      />

      {!classId || !sectionId ? (
        <EmptyState icon="bar-chart-2" text="Pick a class and section for the monthly summary." C={C} />
      ) : isLoading ? (
        <LoadingState />
      ) : students.length === 0 ? (
        <EmptyState icon="inbox" text="No records for this month." C={C} />
      ) : (
        <>
          {classTotals && (
            <View
              style={[
                styles.heroCard,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
            >
              <View style={styles.heroLeft}>
                <Text style={[styles.heroLabel, { color: C.muted }]}>CLASS AVERAGE</Text>
                <PercentageRing pct={classTotals.avg} C={C} />
              </View>
              <View style={styles.heroRight}>
                <HeroRow label="Students" value={students.length} C={C} />
                <HeroRow label="Total days" value={classTotals.total} C={C} />
                <HeroRow
                  label="Present + Late"
                  value={(classTotals.present || 0) + (classTotals.late || 0)}
                  C={C}
                />
                <HeroRow label="Absent" value={classTotals.absent} C={C} />
              </View>
            </View>
          )}

          {students.map((s) => {
            const pct = s.percentage;
            const pc = PERCENTAGE_COLOR(pct);
            return (
              <View
                key={s.studentId}
                style={[
                  styles.row,
                  {
                    backgroundColor: C.card,
                    borderColor: C.border,
                    borderLeftWidth: 4,
                    borderLeftColor: pc.fg,
                  },
                ]}
              >
                <View style={styles.rowHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={[styles.meta, { color: C.mutedSoft }]}>
                      Roll {s.rollNumber || '—'}
                      {s.admissionNumber ? ` · ${s.admissionNumber}` : ''}
                    </Text>
                  </View>
                  <PercentageRing pct={pct} C={C} />
                </View>

                <View style={styles.statsGrid}>
                  <StatTile kind="present" count={s.present} C={C} />
                  <StatTile kind="late" count={s.late} C={C} />
                  <StatTile kind="half-day" count={s.halfDay} C={C} />
                  <StatTile kind="absent" count={s.absent} C={C} />
                  <StatTile kind="leave" count={s.leave} C={C} />
                  <StatTile kind="holiday" count={s.holiday} C={C} />
                </View>

                <View style={[styles.totalRow, { borderTopColor: C.border }]}>
                  <Text style={[styles.totalLabel, { color: C.muted }]}>Total days</Text>
                  <Text style={[styles.totalValue, { color: C.text }]}>{s.total ?? 0}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function HeroRow({ label, value, C }) {
  return (
    <View style={styles.heroRow}>
      <Text style={[styles.heroRowLabel, { color: C.muted }]}>{label}</Text>
      <Text style={[styles.heroRowValue, { color: C.text }]}>{value ?? 0}</Text>
    </View>
  );
}

function EmptyState({ icon, text, C }) {
  return (
    <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
      <Feather name={icon} size={32} color={C.mutedSoft} />
      <Text style={[styles.emptyText, { color: C.muted }]}>{text}</Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator size="large" color={COLORS.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#e5e7eb',
  },
  dateInput: { flex: 1, fontSize: 14 },

  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  heroCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 16,
    gap: 16,
    borderWidth: 1,
  },
  heroLeft: { alignItems: 'center', gap: 8 },
  heroLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  heroRight: { flex: 1, justifyContent: 'space-between', gap: 6 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroRowLabel: { fontSize: 12 },
  heroRowValue: { fontSize: 14, fontWeight: '800' },

  row: { borderRadius: 16, padding: 14, gap: 12, borderWidth: 1 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 11, marginTop: 2 },

  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: { fontSize: 12, fontWeight: '800' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statTile: {
    flexBasis: '31.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: { fontSize: 15, fontWeight: '800', lineHeight: 16 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: { fontSize: 12, fontWeight: '700' },
  totalValue: { fontSize: 14, fontWeight: '800' },
});
