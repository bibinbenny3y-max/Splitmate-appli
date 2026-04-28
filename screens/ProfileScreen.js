// screens/ProfileScreen.js
// ---------------------------------------------------------------------------
// Profile view for the logged-in user. Shows avatar, display name, email,
// member-since, and a stats grid (paid, share, net, expenses). Edit button
// pushes EditProfileScreen onto the stack. Quick links to Activity and
// Statistics. Pulls profile from storage; falls back to the seed person
// record if no profile has been saved yet.
// ---------------------------------------------------------------------------

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  loadPeople, loadExpenses, loadProfile, saveProfile,
} from '../logic/storage';
import { computeBalances } from '../logic/settlement';
import Avatar from '../components/Avatar';

function formatJoinDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function ProfileScreen({ navigation, route }) {
  const user = route?.params?.user;

  const [people,   setPeople]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [profile,  setProfile]  = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    const [p, e, prof] = await Promise.all([
      loadPeople(),
      loadExpenses(),
      loadProfile(user.id),
    ]);
    setPeople(p);
    setExpenses(e);

    // Auto-create a profile from the seed person record if none exists yet.
    if (!prof) {
      const seedPerson = p.find((x) => x.id === user.id);
      const initial = {
        displayName: user.displayName || seedPerson?.name || '',
        color:       seedPerson?.color || '#6c5ce7',
        email:       user.email || '',
        phone:       '',
        bio:         '',
        joinedAt:    Date.now(),
      };
      const saved = await saveProfile(user.id, initial);
      setProfile(saved);
    } else {
      setProfile(prof);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const onRefresh = async () => {
    setRefreshing(true); await reload(); setRefreshing(false);
  };

  if (!profile) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: '#888' }}>Loading profile…</Text>
      </View>
    );
  }

  // Stats for this user
  const balances  = computeBalances(people, expenses);
  const myBalance = balances[user.id] || 0;
  const paid      = expenses
    .filter((e) => e.paidBy === user.id)
    .reduce((s, e) => s + e.amount, 0);
  const share     = expenses
    .filter((e) => e.splitAmong.includes(user.id))
    .reduce((s, e) => s + e.amount / e.splitAmong.length, 0);
  const involved  = expenses.filter((e) => e.splitAmong.includes(user.id)).length;
  const ownedExpenses = expenses.filter((e) => e.paidBy === user.id).length;

  const isOwed = myBalance > 0.005;
  const isOwing = myBalance < -0.005;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />}
    >
      {/* Hero card */}
      <View style={[styles.hero, { backgroundColor: profile.color }]}>
        <View style={styles.heroTop}>
          <Avatar name={profile.displayName} color="rgba(255,255,255,0.25)" size={72} ring />
          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={() => navigation.navigate('EditProfile', { user, profile })}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editIconText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heroName}>{profile.displayName}</Text>
        <Text style={styles.heroEmail}>{profile.email || '—'}</Text>

        {profile.bio ? <Text style={styles.heroBio}>“{profile.bio}”</Text> : null}

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMeta}>
            <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroMetaText}>Joined {formatJoinDate(profile.joinedAt)}</Text>
          </View>
          {profile.phone ? (
            <View style={styles.heroMeta}>
              <Ionicons name="call-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaText}>{profile.phone}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Balance pill */}
      <View style={[
        styles.balancePill,
        isOwed   && { backgroundColor: '#e0f8ee' },
        isOwing  && { backgroundColor: '#fde8e8' },
      ]}>
        <Ionicons
          name={isOwed ? 'arrow-up-circle' : isOwing ? 'arrow-down-circle' : 'checkmark-circle'}
          size={20}
          color={isOwed ? '#0c8d54' : isOwing ? '#b8312f' : '#666'}
        />
        <Text style={[
          styles.balancePillText,
          { color: isOwed ? '#0c8d54' : isOwing ? '#b8312f' : '#666' },
        ]}>
          {isOwed
            ? `You're owed £${myBalance.toFixed(2)}`
            : isOwing
              ? `You owe £${Math.abs(myBalance).toFixed(2)}`
              : 'You\'re all square'}
        </Text>
      </View>

      {/* Stats grid */}
      <Text style={styles.heading}>Your activity</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Ionicons name="card-outline" size={22} color="#6c5ce7" />
          <Text style={styles.statValue}>£{paid.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total paid</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="pie-chart-outline" size={22} color="#6c5ce7" />
          <Text style={styles.statValue}>£{share.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Your share</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="receipt-outline" size={22} color="#6c5ce7" />
          <Text style={styles.statValue}>{ownedExpenses}</Text>
          <Text style={styles.statLabel}>You paid for</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="people-outline" size={22} color="#6c5ce7" />
          <Text style={styles.statValue}>{involved}</Text>
          <Text style={styles.statLabel}>You're on</Text>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.heading}>Quick actions</Text>
      <View style={styles.actionGroup}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('Activity')}
          activeOpacity={0.7}
        >
          <Ionicons name="pulse-outline" size={20} color="#6c5ce7" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionTitle}>Activity feed</Text>
            <Text style={styles.actionSub}>Chronological log of every expense</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('Statistics')}
          activeOpacity={0.7}
        >
          <Ionicons name="bar-chart-outline" size={20} color="#6c5ce7" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionTitle}>Statistics</Text>
            <Text style={styles.actionSub}>Spending insights and breakdowns</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('EditProfile', { user, profile })}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={20} color="#6c5ce7" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionTitle}>Edit profile</Text>
            <Text style={styles.actionSub}>Display name, colour, bio, contact</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f8fb' },
  content: { padding: 16, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    borderRadius: 18, padding: 20, marginBottom: 12,
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  editIconBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
  },
  editIconText: { color: '#fff', fontWeight: '700', marginLeft: 4, fontSize: 12 },
  heroName:  { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 12 },
  heroEmail: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  heroBio:   { color: 'rgba(255,255,255,0.95)', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  heroMetaRow: {
    flexDirection: 'row', flexWrap: 'wrap', marginTop: 12,
  },
  heroMeta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
    marginRight: 6, marginBottom: 4,
  },
  heroMetaText: { color: '#fff', fontSize: 11, marginLeft: 4, fontWeight: '600' },

  balancePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eef0f5', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8,
  },
  balancePillText: { fontWeight: '800', fontSize: 14, marginLeft: 8 },

  heading: { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginTop: 16, marginBottom: 8 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
  },
  statBox: {
    width: '48.5%', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#eceef3',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },

  actionGroup: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#eceef3', overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14,
  },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  actionSub:   { fontSize: 11, color: '#888', marginTop: 2 },
  divider:     { height: 1, backgroundColor: '#eceef3', marginLeft: 46 },
});
