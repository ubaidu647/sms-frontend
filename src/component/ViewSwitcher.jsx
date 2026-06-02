import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useColors } from '../theme/useColors';

export const VIEW_OPTIONS = [
  { id: 'general-1', label: 'General 1', group: 'general' },
  { id: 'general-2', label: 'General 2', group: 'general' },
  { id: 'general-3', label: 'General 3', group: 'general' },
  { id: 'general-4', label: 'General 4', group: 'general' },
  { id: 'general-5', label: 'General 5', group: 'general' },
  { id: 'general-6', label: 'General 6', group: 'general' },
  { id: 'general-7', label: 'General 7', group: 'general' },
  { id: 'class-1', label: 'Class 1 Design 1', group: 'class' },
  { id: 'class-2', label: 'Class 1 Design 2', group: 'class' },
  { id: 'class-3', label: 'Class 1 Design 3', group: 'class' },
  { id: 'class-4', label: 'Class 1 Design 4', group: 'class' },
  { id: 'class-5', label: 'Class 1 Design 5', group: 'class' },
  { id: 'class-6', label: 'Class 1 Design 6', group: 'class' },
  { id: 'class-7', label: 'Class 1 Design 7', group: 'class' },
];

const TRIGGER_W = 288;
const { height: SCREEN_H } = Dimensions.get('window');

export default function ViewSwitcher({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const chevron = useRef(new Animated.Value(0)).current;
  const triggerRef = useRef(null);
  const C = useColors();

  const selected = VIEW_OPTIONS.find((o) => o.id === value);
  const isGeneral = selected?.group === 'general';
  const triggerIcon = isGeneral ? 'grid' : 'book-open';

  const generals = VIEW_OPTIONS.filter((o) => o.group === 'general');
  const classes = VIEW_OPTIONS.filter((o) => o.group === 'class');

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
      Animated.timing(chevron, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeDropdown = () => {
    Animated.timing(chevron, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  const handleSelect = (id) => {
    onChange?.(id);
    closeDropdown();
  };

  const chevronRotate = chevron.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const dropdownTop = anchor.y + anchor.height + 8;
  const remainingSpace = SCREEN_H - dropdownTop - 16;
  const dropdownMaxH = Math.min(remainingSpace, 420);

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openDropdown}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: C.card, borderColor: C.border },
          pressed && { opacity: 0.92 },
        ]}
      >
        <View style={styles.triggerLeft}>
          <View style={styles.triggerIconWrap}>
            <Feather name={triggerIcon} size={14} color={COLORS.brand} />
          </View>
          <Text style={[styles.triggerLabel, { color: C.text }]} numberOfLines={1}>
            {selected?.label || 'Select'}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Feather name="chevron-down" size={16} color={C.muted} />
        </Animated.View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <Pressable style={styles.backdrop} onPress={closeDropdown}>
          <View
            style={[
              styles.dropdown,
              {
                top: dropdownTop,
                left: anchor.x,
                width: anchor.width,
                maxHeight: dropdownMaxH,
                backgroundColor: C.card,
                borderColor: C.border,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionLabel, { color: C.mutedSoft }]}>General</Text>
              {generals.map((o) => {
                const active = value === o.id;
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => handleSelect(o.id)}
                    style={({ pressed }) => [
                      styles.row,
                      active && styles.rowActive,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <Feather name="grid" size={15} color={COLORS.brand} />
                      <Text style={[styles.rowText, { color: C.text }]}>{o.label}</Text>
                    </View>
                    {active && (
                      <Feather name="check" size={15} color={COLORS.brand} />
                    )}
                  </Pressable>
                );
              })}

              <View style={[styles.divider, { backgroundColor: C.border }]} />
              <Text style={[styles.sectionLabel, { color: C.mutedSoft }]}>Classes</Text>
              {classes.map((o) => {
                const active = value === o.id;
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => handleSelect(o.id)}
                    style={({ pressed }) => [
                      styles.row,
                      active && styles.rowActive,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <Feather name="book-open" size={15} color={COLORS.brand} />
                      <Text style={[styles.rowText, { color: C.text }]}>{o.label}</Text>
                    </View>
                    {active && (
                      <Feather name="check" size={15} color={COLORS.brand} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: TRIGGER_W,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  triggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  triggerIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#e8f6f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerLabel: { fontSize: 13, fontWeight: '700', flex: 1 },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dropdown: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  rowActive: { backgroundColor: 'rgba(0,145,142,0.12)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { fontSize: 14, fontWeight: '600' },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 6,
  },
});
