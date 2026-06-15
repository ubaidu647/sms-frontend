import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  useBranchProfilesList,
  useBranchesDropdown,
} from '../../../src/hooks/useBranchProfilesList';
import { useUserStore } from '../../../src/store/userStore';
import { COLORS } from '../../../src/theme/colors';
import { useColors } from '../../../src/theme/useColors';

function ProfileCard({ branch, profile, canCreate, onOpen }) {
  const C = useColors();
  const hasProfile = !!profile;
  const accent = profile?.primaryColor || '#cbd5e1';
  const disabled = !hasProfile && !canCreate;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: C.card, borderColor: C.border, borderTopColor: accent },
      ]}
    >
      <View style={[styles.cardImage, { backgroundColor: C.bg, borderBottomColor: C.border }]}>
        {profile?.logo ? (
          <Image
            source={{ uri: profile.logo }}
            style={styles.cardLogo}
            resizeMode="contain"
          />
        ) : (
          <Feather name="home" size={40} color={C.mutedSoft} />
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>
          {profile?.displayName || branch?.name || '—'}
        </Text>
        {!!profile?.tagline && (
          <Text style={[styles.cardTagline, { color: C.muted }]} numberOfLines={1}>
            {profile.tagline}
          </Text>
        )}

        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: C.muted }]} numberOfLines={1}>
            Branch:{' '}
            <Text style={[styles.metaValue, { color: C.text }]} numberOfLines={1}>
              {branch?.name || '—'}
            </Text>
          </Text>
          <View
            style={[
              styles.pill,
              hasProfile ? styles.pillGreen : styles.pillAmber,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                hasProfile ? styles.pillTextGreen : styles.pillTextAmber,
              ]}
            >
              {hasProfile ? 'Has profile' : 'No profile'}
            </Text>
          </View>
        </View>

        {hasProfile &&
          (profile.printPhone || profile.printEmail || profile.website) && (
            <View style={[styles.contactBlock, { borderTopColor: C.border }]}>
              {!!profile.printPhone && (
                <View style={styles.contactRow}>
                  <Feather name="phone" size={12} color={C.mutedSoft} />
                  <Text style={[styles.contactText, { color: C.muted }]} numberOfLines={1}>
                    {profile.printPhone}
                  </Text>
                </View>
              )}
              {!!profile.printEmail && (
                <View style={styles.contactRow}>
                  <Feather name="mail" size={12} color={C.mutedSoft} />
                  <Text style={[styles.contactText, { color: C.muted }]} numberOfLines={1}>
                    {profile.printEmail}
                  </Text>
                </View>
              )}
              {!!profile.website && (
                <View style={styles.contactRow}>
                  <Feather name="globe" size={12} color={C.mutedSoft} />
                  <Text style={[styles.contactText, { color: C.muted }]} numberOfLines={1}>
                    {profile.website}
                  </Text>
                </View>
              )}
            </View>
          )}

        <Pressable
          onPress={onOpen}
          disabled={disabled}
          style={({ pressed }) => [
            styles.cardBtn,
            hasProfile
              ? styles.cardBtnEdit
              : canCreate
                ? styles.cardBtnCreate
                : [styles.cardBtnDisabled, { backgroundColor: C.border }],
            pressed && !disabled && { opacity: 0.9 },
          ]}
        >
          <Feather
            name={hasProfile ? 'edit-2' : 'plus'}
            size={13}
            color={disabled ? C.muted : '#fff'}
          />
          <Text
            style={[
              styles.cardBtnText,
              disabled && { color: C.muted },
            ]}
          >
            {hasProfile ? 'Edit Profile' : 'Create Profile'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AllBranchProfilesPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const C = useColors();

  const isAdmin = !!user?.role?.isPredefined;
  const acts = user?.role?.actions || [];
  const canList = isAdmin || acts.includes('view-all-branch-profile');
  const canCreate = isAdmin || acts.includes('create-all-branch-profile');
  const canViewBranches = isAdmin || acts.includes('view-branch');

  const {
    data: profilesData,
    isLoading: loadingProfiles,
    isFetching: fetchingProfiles,
    refetch: refetchProfiles,
  } = useBranchProfilesList({ enabled: canList });

  const {
    data: branchesData,
    isLoading: loadingBranches,
    refetch: refetchBranches,
  } = useBranchesDropdown({ enabled: canList });

  const profiles = useMemo(() => profilesData?.data || [], [profilesData]);
  const branches = useMemo(() => branchesData?.data || [], [branchesData]);
  const isLoading = loadingProfiles || loadingBranches;
  const branchListUnavailable = !branchesData && !loadingBranches;

  const cards = useMemo(() => {
    const map = new Map();
    for (const b of branches) {
      map.set(String(b._id), { branch: b, profile: null });
    }
    for (const p of profiles) {
      const bid = p.branchId?._id || p.branchId;
      if (!bid) continue;
      const key = String(bid);
      const existing = map.get(key);
      if (existing) {
        existing.profile = p;
      } else {
        const populated = typeof p.branchId === 'object' ? p.branchId : null;
        map.set(key, {
          branch: populated || { _id: bid, name: '—' },
          profile: p,
        });
      }
    }
    return Array.from(map.values());
  }, [profiles, branches]);

  const openEditor = (branchId) =>
    router.push(`/(app)/branches/${branchId}/profile`);

  const Header = (
    <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={({ pressed }) => [
          styles.backBtn,
          { backgroundColor: C.bg },
          pressed && { opacity: 0.6 },
        ]}
      >
        <Feather name="arrow-left" size={20} color={C.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        {canViewBranches && (
          <Text style={[styles.titleSmall, { color: C.muted }]}>Branches /</Text>
        )}
        <View style={styles.titleRow}>
          <Feather name="grid" size={18} color={COLORS.brand} />
          <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
            Branch Profiles
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => router.push('/(app)/branches/my-profile')}
        hitSlop={10}
        style={({ pressed }) => [styles.myBtn, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.myBtnText}>My profile →</Text>
      </Pressable>
    </View>
  );

  if (!canList) {
    return (
      <View style={[styles.safe, { backgroundColor: C.bg }]}>
        {Header}
        <View style={styles.center}>
          <Feather name="lock" size={32} color={COLORS.red} />
          <Text style={[styles.errorText, { color: C.muted }]}>
            You don't have permission to view this list.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: C.bg }]}>
      {Header}

      <FlatList
        data={cards}
        keyExtractor={(item) => String(item.branch._id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          branchListUnavailable ? (
            <View style={styles.warnBanner}>
              <Feather name="alert-circle" size={16} color="#92400e" />
              <Text style={styles.warnBannerText}>
                Showing only branches that already have a profile. To see
                branches that still need one, ask an admin to grant{' '}
                <Text style={{ fontFamily: 'monospace' }}>view-branch</Text>.
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={COLORS.brand} />
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={[styles.emptyTitle, { color: C.text }]}>No branches yet</Text>
              <Text style={[styles.emptySub, { color: C.muted }]}>
                {branchListUnavailable
                  ? 'No profiles found. To see branches that still need a profile, ask an admin to grant view-branch.'
                  : 'Create a branch first, then come back to set up its profile.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ProfileCard
            branch={item.branch}
            profile={item.profile}
            canCreate={canCreate}
            onOpen={() => openEditor(item.branch._id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={fetchingProfiles && !loadingProfiles}
            onRefresh={() => {
              refetchProfiles();
              refetchBranches();
            }}
            tintColor={COLORS.brand}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  titleSmall: { fontSize: 11, color: COLORS.muted, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  myBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  myBtnText: { color: COLORS.brand, fontWeight: '700', fontSize: 12 },

  list: { padding: 14, paddingBottom: 32 },

  warnBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  warnBannerText: { color: '#92400e', fontSize: 13, flex: 1, lineHeight: 18 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  errorText: { color: COLORS.muted, textAlign: 'center', fontSize: 14 },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderTopWidth: 3,
    overflow: 'hidden',
  },
  cardImage: {
    aspectRatio: 16 / 9,
    backgroundColor: '#f9fafb',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLogo: { width: '60%', height: '70%' },

  cardBody: { padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardTagline: { fontSize: 12, color: COLORS.muted, marginTop: -4 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaLabel: { fontSize: 12, color: COLORS.muted, flex: 1 },
  metaValue: { fontSize: 12, color: COLORS.text, fontWeight: '700' },

  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillGreen: { backgroundColor: COLORS.pillGreenBg },
  pillAmber: { backgroundColor: COLORS.pillYellowBg },
  pillText: { fontSize: 11, fontWeight: '700' },
  pillTextGreen: { color: COLORS.pillGreenFg },
  pillTextAmber: { color: COLORS.pillYellowFg },

  contactBlock: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: 12, color: COLORS.muted, flex: 1 },

  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
    marginTop: 4,
  },
  cardBtnEdit: { backgroundColor: COLORS.brand },
  cardBtnCreate: { backgroundColor: COLORS.statAmber },
  cardBtnDisabled: { backgroundColor: '#e5e7eb' },
  cardBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
