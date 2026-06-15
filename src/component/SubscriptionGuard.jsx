import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSubscriptionGuard } from '../hooks/useSubscriptionGuard';
import { isBlockedState } from '../utils/subscriptionState';
import { fmtDate } from '../constants/billing';
import { useAuth } from '../hooks/useAuth';
import { useColors } from '../theme/useColors';

// During the grace period it floats a persistent warning bar under the TopBar;
// once grace ends (expired/cancelled/none) it covers the app with a
// non-dismissable block. Active subscriptions render nothing.
// Renders two things: an in-flow banner (the layout places it after the TopBar)
// and a full-screen blocking Modal that floats above everything.
export default function SubscriptionGuard() {
  const C = useColors();
  const { logout } = useAuth();
  const { state, endDate, hardBlockAt } = useSubscriptionGuard();
  const blocked = isBlockedState(state);

  return (
    <>
      {state === 'grace' && (
        <View style={styles.banner}>
          <Feather name="alert-triangle" size={15} color="#b91c1c" />
          <Text style={styles.bannerText}>
            Subscription expired on {fmtDate(endDate)} — grace period. Renew before{' '}
            {fmtDate(hardBlockAt)} or access will be blocked. Contact your administrator.
          </Text>
        </View>
      )}

      <Modal visible={blocked} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: C.card }]}>
            <View style={styles.lockBadge}>
              <Feather name="lock" size={26} color="#dc2626" />
            </View>
            <Text style={[styles.title, { color: C.text }]}>
              {state === 'cancelled' ? 'Subscription cancelled' : 'Subscription expired'}
            </Text>
            <Text style={[styles.message, { color: C.muted }]}>
              {state === 'cancelled'
                ? "Your school's subscription was cancelled."
                : state === 'none'
                  ? 'Your school has no active subscription.'
                  : `Your grace period ended on ${fmtDate(hardBlockAt)}.`}{' '}
              Please contact your administrator to renew and restore access.
            </Text>
            <Pressable
              onPress={logout}
              style={({ pressed }) => [
                styles.logoutBtn,
                { borderColor: C.border, backgroundColor: C.bg },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather name="log-out" size={15} color={C.text} />
              <Text style={[styles.logoutText, { color: C.text }]}>Log out</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#fecaca',
  },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#b91c1c', lineHeight: 16 },

  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.8)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  lockBadge: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 22,
  },
  logoutText: { fontSize: 14, fontWeight: '700' },
});
