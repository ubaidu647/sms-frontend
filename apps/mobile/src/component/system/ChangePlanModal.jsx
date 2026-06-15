import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { usePackages } from '../../hooks/usePackages';
import { useChangePackage } from '../../hooks/useSubscriptions';
import { fmtMoney, validateGraceDays } from '../../constants/billing';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function ChangePlanModal({ open, onClose, schoolId, schoolName, current }) {
  const C = useColors();
  const { data: pkgData } = usePackages({ limit: 100, filters: { isActive: true }, enabled: open });
  const packages = pkgData?.data ?? [];
  const change = useChangePackage({ onSuccess: () => onClose() });

  const [packageId, setPackageId] = useState('');
  const [method, setMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [grace, setGrace] = useState('');

  useEffect(() => {
    if (open) {
      setPackageId('');
      setMethod('');
      setTransactionId('');
      setGrace(current?.gracePeriodInDays != null ? String(current.gracePeriodInDays) : '');
    }
  }, [open, current]);

  const selected = packages.find((p) => p._id === packageId);

  // Client-side proration preview; backend is authoritative.
  const estimate = useMemo(() => {
    const snap = current?.packageSnapshot;
    if (!selected || !snap?.price || !snap?.durationInDays || !current?.endDate) return null;
    const remainingDays = Math.max(0, (new Date(current.endDate) - new Date()) / MS_PER_DAY);
    const credit = snap.price * (remainingDays / snap.durationInDays);
    const amountDue = Math.max(0, selected.price - credit);
    const direction = selected.price >= snap.price ? 'Upgrade' : 'Downgrade';
    return { credit, amountDue, direction };
  }, [selected, current]);

  const submit = () => {
    if (!packageId) return Toast.show({ type: 'error', text1: 'Please choose the new package' });
    if (current?.packageId === packageId || current?.packageSnapshot?.name === selected?.name)
      return Toast.show({ type: 'error', text1: 'That is already the current plan. Use Renew instead.' });
    const graceErr = validateGraceDays(grace);
    if (graceErr) return Toast.show({ type: 'error', text1: graceErr });

    const payload = { schoolId, packageId };
    if (method || transactionId) {
      payload.paymentInfo = { method: method || undefined, transactionId: transactionId || undefined };
    }
    if (grace !== '' && grace != null) payload.gracePeriodInDays = Number(grace);
    change.mutate(payload);
  };

  return (
    <Modal visible={open} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: C.card }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: C.text }]}>Change Plan</Text>
            {!!schoolName && <Text style={[styles.subtitle, { color: C.muted }]}>For {schoolName}</Text>}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [styles.closeBtn, { backgroundColor: C.bg }, pressed && { opacity: 0.6 }]}
          >
            <Feather name="x" size={20} color={C.text} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {current?.packageSnapshot && (
              <View style={[styles.infoBox, { backgroundColor: C.bg, borderColor: C.border }]}>
                <Text style={[styles.infoText, { color: C.muted }]}>
                  Current plan: <Text style={{ fontWeight: '800', color: C.text }}>{current.packageSnapshot.name}</Text>
                  {' — '}{fmtMoney(current.packageSnapshot.price)} / {current.packageSnapshot.durationInDays}d
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: C.muted }]}>NEW PACKAGE *</Text>
            {packages.length === 0 ? (
              <Text style={[styles.infoText, { color: C.mutedSoft }]}>No active packages.</Text>
            ) : (
              <View style={styles.chipRow}>
                {packages.map((p) => {
                  const active = packageId === p._id;
                  return (
                    <Pressable
                      key={p._id}
                      onPress={() => setPackageId(p._id)}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: C.bg, borderColor: C.border },
                        active && styles.chipActive,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: C.text }, active && styles.chipTextActive]}>
                        {p.name} · {fmtMoney(p.price)}/{p.durationInDays}d
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {estimate && (
              <View style={[styles.estBox, { borderColor: '#99f6e4', backgroundColor: '#f0fdfa' }]}>
                <Text style={styles.estTitle}>Estimated billing ({estimate.direction})</Text>
                <View style={styles.estRow}>
                  <Text style={styles.estLabel}>Credit for unused time</Text>
                  <Text style={styles.estLabel}>−{fmtMoney(estimate.credit)}</Text>
                </View>
                <View style={styles.estRow}>
                  <Text style={styles.estStrong}>Amount due</Text>
                  <Text style={styles.estStrong}>{fmtMoney(estimate.amountDue)}</Text>
                </View>
                <Text style={styles.estNote}>
                  Estimate only — a fresh {selected?.durationInDays}-day cycle starts on confirm. The server calculates the final amount.
                </Text>
              </View>
            )}

            <View style={styles.row2}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.label, { color: C.muted }]}>PAYMENT METHOD</Text>
                <TextInput value={method} onChangeText={setMethod} placeholder="e.g. bank" placeholderTextColor={C.mutedSoft} style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: C.bg }]} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.label, { color: C.muted }]}>TRANSACTION ID</Text>
                <TextInput value={transactionId} onChangeText={setTransactionId} placeholder="e.g. TX1" placeholderTextColor={C.mutedSoft} autoCapitalize="none" style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: C.bg }]} />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[styles.label, { color: C.muted }]}>GRACE PERIOD (DAYS AFTER EXPIRY)</Text>
              <TextInput value={grace} onChangeText={setGrace} placeholder="0" placeholderTextColor={C.mutedSoft} keyboardType="number-pad" style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: C.bg }]} />
              <Text style={[styles.infoText, { color: C.mutedSoft }]}>Leave unchanged to keep the current grace period.</Text>
            </View>

            <Pressable onPress={submit} disabled={change.isPending} style={({ pressed }) => [styles.submit, (change.isPending || pressed) && { opacity: 0.85 }]}>
              {change.isPending ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Feather name="refresh-cw" size={16} color="#fff" />
                  <Text style={styles.submitText}>{estimate ? estimate.direction : 'Change Plan'}</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  title: { fontSize: 19, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, paddingBottom: 36, gap: 12 },

  label: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700' },
  input: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  row2: { flexDirection: 'row', gap: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, maxWidth: 260 },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  infoBox: { borderRadius: 10, borderWidth: 1, padding: 10 },
  infoText: { fontSize: 12, lineHeight: 18 },

  estBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  estTitle: { fontSize: 13, fontWeight: '800', color: '#115e59' },
  estRow: { flexDirection: 'row', justifyContent: 'space-between' },
  estLabel: { fontSize: 13, color: '#334155' },
  estStrong: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  estNote: { fontSize: 11, color: '#475569', marginTop: 2 },

  submit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.brand, height: 48, borderRadius: 12, marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
