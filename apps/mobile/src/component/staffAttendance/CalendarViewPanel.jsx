import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import StaffAttendancePickers from './StaffAttendancePickers';
import { useStaffWeekDaily } from '../../hooks/useStaffAttendance';
import { useBranchesDropdown } from '../../hooks/useBranchProfilesList';
import { useUserStore } from '../../store/userStore';
import { STAFF_STATUS_PILL } from '../../constants/staffAttendance';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

function startOfWeekMonday(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay();
  const diff = (day + 6) % 7;
  dt.setDate(dt.getDate() - diff);
  return dt;
}

function addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function fmtRange(start, end) {
  const sm = start.toLocaleString('en', { month: 'short' });
  const em = end.toLocaleString('en', { month: 'short' });
  const sy = start.getFullYear();
  const ey = end.getFullYear();
  if (sy === ey && sm === em) return `${sm} ${start.getDate()} – ${end.getDate()}, ${sy}`;
  if (sy === ey) return `${sm} ${start.getDate()} – ${em} ${end.getDate()}, ${sy}`;
  return `${sm} ${start.getDate()}, ${sy} – ${em} ${end.getDate()}, ${ey}`;
}

export default function CalendarViewPanel() {
  const C = useColors();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-staff-attendance');
  const userBranchId =
    (typeof user?.branchId === 'string' && user.branchId) ||
    user?.branchId?._id ||
    user?.branch?._id ||
    '';

  const [branchId, setBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [staffType, setStaffType] = useState('');
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekEnd = days[6];
  const dateStrings = useMemo(() => days.map(toISO), [days]);

  const { data: branchData } = useBranchesDropdown({ enabled: isOrgLevel });
  const branches = branchData?.data || [];
  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const dayQueries = useStaffWeekDaily({
    branchId: effectiveBranchId,
    staffType,
    dates: dateStrings,
  });
  const isLoading = dayQueries.some((q) => q.isFetching);

  const { staffList, statusMap } = useMemo(() => {
    const map = {};
    const seen = new Map();
    dayQueries.forEach((q, idx) => {
      const roster = q?.data?.data?.roster || [];
      const iso = dateStrings[idx];
      roster.forEach((r) => {
        const sid = r.staffId;
        if (!seen.has(sid))
          seen.set(sid, {
            staffId: sid,
            name: r.name,
            serialNumber: r.serialNumber,
            staffType: r.staffType,
            photo: r.photo,
          });
        if (!map[sid]) map[sid] = {};
        if (r.attendance?.status) map[sid][iso] = r.attendance.status;
      });
    });
    return {
      staffList: Array.from(seen.values()).sort((a, b) =>
        (a.name || '').localeCompare(b.name || ''),
      ),
      statusMap: map,
    };
    // dataUpdatedAt is the canonical signal that a query has fresh data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayQueries.map((q) => q.dataUpdatedAt).join('|'), dateStrings]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <StaffAttendancePickers
          isOrgLevel={isOrgLevel}
          branches={branches}
          branchId={branchId}
          onBranchId={setBranchId}
          staffType={staffType}
          onStaffType={setStaffType}
          mode="date"
          date={toISO(weekStart)}
          onDate={(v) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
              setWeekStart(startOfWeekMonday(new Date(`${v}T00:00:00`)));
            }
          }}
        />
      </View>

      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border, gap: 10 }]}>
        <View style={styles.weekNav}>
          <Pressable
            onPress={() => setWeekStart(addDays(weekStart, -7))}
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="chevron-left" size={18} color={C.text} />
          </Pressable>
          <Pressable
            onPress={() => setWeekStart(startOfWeekMonday(new Date()))}
            style={({ pressed }) => [
              styles.todayBtn,
              { borderColor: C.border },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.todayBtnText, { color: C.text }]}>Today</Text>
          </Pressable>
          <Text style={[styles.weekText, { color: C.text }]} numberOfLines={1}>
            {fmtRange(days[0], weekEnd)}
          </Text>
          <Pressable
            onPress={() => setWeekStart(addDays(weekStart, 7))}
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="chevron-right" size={18} color={C.text} />
          </Pressable>
        </View>

        {!effectiveBranchId ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={28} color={C.mutedSoft} />
            <Text style={[styles.emptyText, { color: C.muted }]}>
              Pick a branch to load the week.
            </Text>
          </View>
        ) : isLoading && staffList.length === 0 ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={COLORS.brand} />
          </View>
        ) : staffList.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="users" size={28} color={C.mutedSoft} />
            <Text style={[styles.emptyText, { color: C.muted }]}>
              No staff in this branch.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.headerRow}>
                <View style={[styles.staffHeadCell, { borderColor: C.border }]}>
                  <Feather name="clock" size={14} color={COLORS.brand} />
                </View>
                {days.map((d) => (
                  <View
                    key={toISO(d)}
                    style={[styles.dayHeadCell, { borderColor: C.border }]}
                  >
                    <Text style={[styles.dayHeadWeekday, { color: COLORS.brand }]}>
                      {d.toLocaleDateString('en', { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.dayHeadDate, { color: C.text }]}>
                      {d.getDate()}
                    </Text>
                  </View>
                ))}
              </View>

              {staffList.map((s) => (
                <View key={s.staffId} style={styles.bodyRow}>
                  <View
                    style={[
                      styles.staffCell,
                      { borderColor: C.border, backgroundColor: C.card },
                    ]}
                  >
                    <Text style={[styles.staffType, { color: COLORS.brand }]} numberOfLines={1}>
                      {s.staffType || s.serialNumber || ''}
                    </Text>
                    <Text style={[styles.staffName, { color: C.text }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                  </View>
                  {days.map((d) => {
                    const iso = toISO(d);
                    const status = statusMap[s.staffId]?.[iso];
                    const cfg = status ? STAFF_STATUS_PILL[status] : null;
                    return (
                      <View
                        key={iso}
                        style={[styles.statusCell, { borderColor: C.border }]}
                      >
                        {cfg ? (
                          <View style={[styles.statusBadge, { backgroundColor: cfg.solid }]}>
                            <Text style={styles.statusBadgeText}>{cfg.short}</Text>
                          </View>
                        ) : (
                          <Text style={[styles.statusDash, { color: C.mutedSoft }]}>—</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <View style={[styles.legend, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={[styles.legendTitle, { color: C.muted }]}>LEGEND</Text>
        <View style={styles.legendRow}>
          {Object.entries(STAFF_STATUS_PILL).map(([k, cfg]) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cfg.solid }]}>
                <Text style={styles.legendDotText}>{cfg.short}</Text>
              </View>
              <Text style={[styles.legendLabel, { color: C.text }]}>{cfg.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const STAFF_CELL_W = 130;
const DAY_CELL_W = 50;

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 32, gap: 12 },
  card: { borderRadius: 14, padding: 12, borderWidth: 1, gap: 12 },
  empty: { paddingVertical: 36, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13, textAlign: 'center' },

  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  todayBtnText: { fontSize: 12, fontWeight: '700' },
  weekText: { flex: 1, fontSize: 13, fontWeight: '700', textAlign: 'center' },

  headerRow: { flexDirection: 'row' },
  staffHeadCell: {
    width: STAFF_CELL_W,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayHeadCell: {
    width: DAY_CELL_W,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayHeadWeekday: { fontSize: 10, fontWeight: '800' },
  dayHeadDate: { fontSize: 13, fontWeight: '700' },

  bodyRow: { flexDirection: 'row' },
  staffCell: {
    width: STAFF_CELL_W,
    height: 48,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  staffType: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  staffName: { fontSize: 12, fontWeight: '700' },
  statusCell: {
    width: DAY_CELL_W,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  statusBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  statusDash: { fontSize: 14 },

  legend: { borderRadius: 14, padding: 12, borderWidth: 1, gap: 8 },
  legendTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendDotText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  legendLabel: { fontSize: 11, fontWeight: '600' },
});
