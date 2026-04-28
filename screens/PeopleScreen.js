// screens/PeopleScreen.js
// ---------------------------------------------------------------------------
// Per-person breakdown. For each housemate: how much they paid, how much
// of others' bills they're on the hook for, their net balance, and how
// many expenses they're involved in. Useful for spotting who is carrying
// the household, and a clean third tab to round out the navigation.
// ---------------------------------------------------------------------------

import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadPeople, loadExpenses } from '../logic/storage';
import { computeBalances } from '../logic/settlement';

export default function PeopleScreen({ navigation }) {
  const [people,   setPeople]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const [p, e] = await Promise.all([loadPeople(), loadExpenses()]);
    setPeople(p); setExpenses(e);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const onRefresh = async () => {
    setRefreshing(true); await reload(); setRefreshing(false);
  };

  const balances = computeBalances(people, expenses);

  // Per-person stats
  const stats = people.map((p) => {
    const paid    = expenses
      .filter((e) => e.paidBy === p.id)
      .reduce((s, e) => s + e.amount, 0);
    const involved = expenses.filter((e) => e.splitAmong.includes(p.id)).length;
    const owedShare = expenses.reduce((s, e) => {
      if (!e.splitAmong.includes(p.id)) return s;
      return s + e.amount / e.splitAmong.length;
    }, 0);
    return {
      person: p,
      paid:       Math.round(paid * 100) / 100,
      owedShare:  Math.round(owedShare * 100) / 100,
      involved,
      balance:    balances[p.id] || 0,
    };
  });

  // House callouts: who's carrying the household (max creditor) and who
  // owes the most (max debtor). Only flag if the balance is non-trivial,
  // and only if there's actually variation between people - if everyone
  // is square the badges add nothing.
  let mvpId = null, debtorId = null;
  if (stats.length > 0) {
    const maxCreditor = stats.reduce((a, b) => (b.balance > a.balance ? b : a));
    const maxDebtor   = stats.reduce((a, b) => (b.balance < a.balance ? b : a));
    if (maxCreditor.balance > 0.5)        mvpId    = maxCreditor.person.id;
    if (Math.abs(maxDebtor.balance) > 0.5) debtorId = maxDebtor.person.id;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />}
    >
      <Text style={styles.heading}>Household</Text>
      <Text style={styles.sub}>{people.length} people, {expenses.length} expenses tracked</Text>

      {stats.map((s) => {
        const b = s.balance;
        const isOwed = b > 0.005;
        const isOwing = b < -0.005;
        const isMvp    = s.person.id === mvpId;
        const isDebtor = s.person.id === debtorId;
        return (
          <TouchableOpacity
            key={s.person.id}
            style={[styles.card, { borderLeftColor: s.person.color }]}
            onPress={() => navigation.navigate('PersonDetail', { personId: s.person.id })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.avatar, { backgroundColor: s.person.color }]}>
                <Text style={styles.avatarText}>{s.person.name.slice(0, 1)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{s.person.name}</Text>
                  {isMvp && (
                    <View style={[styles.badge, styles.badgeMvp]}>
                      <Text style={styles.badgeText}>🏆 Carrying the house</Text>
                    </View>
                  )}
                  {isDebtor && (
                    <View style={[styles.badge, styles.badgeDebtor]}>
                      <Text style={styles.badgeText}>📉 Owes the most</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.metaLine}>on {s.involved} expense{s.involved === 1 ? '' : 's'}</Text>
              </View>
              <View style={[
                styles.netPill,
                { backgroundColor: isOwed ? '#e0f8ee' : isOwing ? '#fde8e8' : '#eef0f5' },
              ]}>
                <Text style={[
                  styles.netPillText,
                  { color: isOwed ? '#0c8d54' : isOwing ? '#b8312f' : '#666' },
                ]}>
                  {isOwed ? '+' : isOwing ? '-' : ''}£{Math.abs(b).toFixed(2)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#bbb" style={{ marginLeft: 4 }} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Paid</Text>
                <Text style={styles.statValue}>£{s.paid.toFixed(2)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Their share</Text>
                <Text style={styles.statValue}>£{s.owedShare.toFixed(2)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Net</Text>
                <Text style={[
                  styles.statValue,
                  { color: isOwed ? '#0c8d54' : isOwing ? '#b8312f' : '#1a1a2e' },
                ]}>
                  {isOwed ? '+' : isOwing ? '-' : ''}£{Math.abs(b).toFixed(2)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f8fb' },
  content: { padding: 16, paddingBottom: 40 },

  heading: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  sub:     { fontSize: 12, color: '#888', marginBottom: 16, marginTop: 4 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, borderWidth: 1, borderColor: '#eceef3',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  name:       { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginRight: 6 },
  badge:      { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, marginTop: 2 },
  badgeMvp:   { backgroundColor: '#fff4d6' },
  badgeDebtor:{ backgroundColor: '#fde8e8' },
  badgeText:  { fontSize: 10, fontWeight: '700', color: '#1a1a2e' },
  metaLine:   { fontSize: 11, color: '#888', marginTop: 4 },
  netPill:    { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999 },
  netPillText:{ fontWeight: '800', fontSize: 12 },

  statsRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f8fb', borderRadius: 10, padding: 10 },
  stat:       { flex: 1, alignItems: 'center' },
  statLabel:  { fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.4 },
  statValue:  { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginTop: 4 },
  divider:    { width: 1, height: 28, backgroundColor: '#e3e5ec' },
});
