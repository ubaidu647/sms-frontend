import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function BranchActionsSheet({
  open,
  branchName,
  onClose,
  onProfile,
  onView,
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />
            {!!branchName && (
              <Text style={styles.title} numberOfLines={1}>
                {branchName}
              </Text>
            )}
            <Action
              icon="layers"
              label="Profile / Branding"
              onPress={onProfile}
            />
            <Action icon="eye" label="View Details" onPress={onView} last />
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Action({ icon, label, onPress, last }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        last && { borderBottomWidth: 0 },
        pressed && { backgroundColor: '#f3f4f6' },
      ]}
    >
      <View style={styles.actionIcon}>
        <Feather name={icon} size={16} color={COLORS.brand} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Feather name="chevron-right" size={18} color={COLORS.mutedSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginTop: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    paddingHorizontal: 6,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  cancelBtn: {
    marginTop: 10,
    marginBottom: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
});
