import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBranchesDropdown } from '../../hooks/useBranchProfilesList';
import {
  useClassesForAnnouncement,
  useSectionsForAnnouncement,
  useStaffForAnnouncement,
} from '../../hooks/useAnnouncements';
import {
  ANNOUNCEMENT_SCOPES,
  SCOPE_LABELS,
  TARGET_USER_TYPES,
  titleCase,
} from '../../constants/announcement';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

const BLANK = {
  scope: 'school',
  branchIds: [],
  classIds: [],
  sectionIds: [],
  staffIds: [],
  targetUserTypes: ['staff', 'student', 'parent'],
};

export default function AudiencePicker({ value = BLANK, onChange, isOrgLevel, academicYear }) {
  const C = useColors();
  const v = { ...BLANK, ...(value || {}) };
  const set = (patch) => onChange({ ...v, ...patch });

  const { data: branchData } = useBranchesDropdown({
    enabled: v.scope === 'branch' && isOrgLevel,
  });
  const branches = branchData?.data || [];

  const { data: classData } = useClassesForAnnouncement({
    academicYear,
    enabled: v.scope === 'class' || v.scope === 'section',
  });
  const classes = classData?.data || [];

  const sectionsTargetClassId = v.classIds?.[0] || '';
  const { data: sectionData } = useSectionsForAnnouncement({
    classId: sectionsTargetClassId,
    enabled: v.scope === 'section' && !!sectionsTargetClassId,
  });
  const sections = sectionData?.data || [];

  const { data: staffData } = useStaffForAnnouncement({
    enabled: v.scope === 'staff',
  });
  const staff = staffData?.data || [];

  const onScopeChange = (scope) => {
    set({
      scope,
      branchIds: [],
      classIds: [],
      sectionIds: [],
      staffIds: [],
    });
  };

  const toggleId = (key, id) => {
    const list = v[key] || [];
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    set({ [key]: next });
  };

  const toggleUserType = (t) => {
    const has = v.targetUserTypes.includes(t);
    set({
      targetUserTypes: has
        ? v.targetUserTypes.filter((x) => x !== t)
        : [...v.targetUserTypes, t],
    });
  };

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={[styles.label, { color: C.muted }]}>SEND TO *</Text>
        <View style={styles.chipRow}>
          {ANNOUNCEMENT_SCOPES.map((s) => {
            const active = v.scope === s;
            return (
              <Pressable
                key={s}
                onPress={() => onScopeChange(s)}
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
                  {SCOPE_LABELS[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {v.scope === 'branch' && (
        <MultiPicker
          label="Branches"
          items={branches.map((b) => ({ value: b._id, label: b.name }))}
          selected={v.branchIds || []}
          onToggle={(id) => toggleId('branchIds', id)}
          empty={
            !isOrgLevel
              ? 'You can only target your own branch — pick School or Class.'
              : branches.length === 0
              ? 'No branches loaded yet.'
              : null
          }
          C={C}
          disabled={!isOrgLevel}
        />
      )}

      {v.scope === 'class' && (
        <MultiPicker
          label="Classes"
          items={classes.map((c) => ({
            value: c._id,
            label: c.grade ? `${c.name} · Gr ${c.grade}` : c.name,
          }))}
          selected={v.classIds || []}
          onToggle={(id) => toggleId('classIds', id)}
          empty="No classes for this academic year."
          C={C}
        />
      )}

      {v.scope === 'section' && (
        <>
          <View>
            <Text style={[styles.label, { color: C.muted }]}>CLASS *</Text>
            {classes.length === 0 ? (
              <Text style={[styles.helper, { color: C.mutedSoft }]}>
                No classes for this academic year.
              </Text>
            ) : (
              <View style={styles.chipRow}>
                {classes.map((c) => {
                  const active = sectionsTargetClassId === c._id;
                  return (
                    <Pressable
                      key={c._id}
                      onPress={() => set({ classIds: [c._id], sectionIds: [] })}
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
                        {c.name}
                        {c.grade ? ` · Gr ${c.grade}` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
          <MultiPicker
            label="Sections"
            items={sections.map((s) => ({ value: s._id, label: s.name }))}
            selected={v.sectionIds || []}
            onToggle={(id) => toggleId('sectionIds', id)}
            empty={
              !sectionsTargetClassId
                ? 'Pick a class first.'
                : 'No sections in this class.'
            }
            C={C}
          />
        </>
      )}

      {v.scope === 'staff' && (
        <MultiPicker
          label="Staff"
          items={staff.map((s) => ({
            value: s._id,
            label: `${s.user?.name || s.name || 'Staff'}${
              s.staffType ? ` · ${s.staffType}` : ''
            }`,
          }))}
          selected={v.staffIds || []}
          onToggle={(id) => toggleId('staffIds', id)}
          empty="No staff."
          C={C}
        />
      )}

      <View>
        <Text style={[styles.label, { color: C.muted }]}>NOTIFY USER TYPES *</Text>
        <View style={styles.chipRow}>
          {TARGET_USER_TYPES.map((t) => {
            const active = v.targetUserTypes.includes(t);
            return (
              <Pressable
                key={t}
                onPress={() => toggleUserType(t)}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: C.bg, borderColor: C.border },
                  active && styles.chipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Feather
                  name={active ? 'check' : 'circle'}
                  size={11}
                  color={active ? '#fff' : C.mutedSoft}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: C.text },
                    active && styles.chipTextActive,
                    { marginLeft: 4 },
                  ]}
                >
                  {titleCase(t)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function MultiPicker({ label, items, selected, onToggle, empty, disabled, C }) {
  return (
    <View>
      <Text style={[styles.label, { color: C.muted }]}>{label} *</Text>
      {disabled || items.length === 0 ? (
        <Text style={[styles.helper, { color: C.mutedSoft }]}>{empty || 'No options'}</Text>
      ) : (
        <View style={styles.chipRow}>
          {items.map((it) => {
            const active = selected.includes(it.value);
            return (
              <Pressable
                key={it.value}
                onPress={() => onToggle(it.value)}
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
                  numberOfLines={1}
                >
                  {it.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700', marginBottom: 6 },
  helper: { fontSize: 12 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 240,
  },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
});
