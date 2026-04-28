// screens/HomeScreen.js
// ---------------------------------------------------------------------------
// Dashboard. Shown immediately after login. Recomputes balances from the
// persisted state every time the screen comes into focus, so adding or
// deleting an expense elsewhere is reflected here without a manual refresh.
// ---------------------------------------------------------------------------

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadPeople, loadExpenses } from '../logic/storage';
import { computeBalances, summary, minimiseTransactions } from '../logic/settlement';
import BalanceTile from '../components/BalanceTile';
import SpendingBar from '../components/SpendingBar';

export default function HomeScreen({ navigation, user, onLogout }) {
  const [people,   setPeople]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const [p, e] = await Promise.all([loadPeople(), loadExpenses()]);
    setPeople(p);
    setExpenses(e);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const balances     = computeBalances(people, expenses);
  const totals       = summary(balances);
  const txns         = minimiseTransactions(balances);
  const totalSpend   = expenses.reduce((s, e) => s + e.amount, 0);
  const myBalance    = user ? (balances[user.id] || 0) : 0;
  const recent       = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const personById   = Object.fromEntries(people.map((p) => [p.id, p]));

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>Hi {user?.displayName || ''} 👋</Text>
          <Text style={styles.greetSub}>Here's where the house stands.</Text>
        </View>
      </View>

      {/* Headline KPI cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total spend</Text>
          <Text style={styles.kpiValue}>£{totalSpend.toFixed(2)}</Text>
          <Text style={styles.kpiHint}>{expenses.length} expenses</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: '#f1efff' }]}>
          <Text style={styles.kpiLabel}>You</Text>
          <Text style={[
            styles.kpiValue,
            { color: myBalance >= 0 ? '#0c8d54' : '#b8312f' },
          ]}>
            {myBalance >= 0 ? '+' : '-'}£{Math.abs(myBalance).toFixed(2)}
          </Text>
          <Text style={styles.kpiHint}>{myBalance >= 0 ? 'are owed' : 'owe'}</Text>
        </View>
      </View>

      {/* Spending by category */}
      <Text style={styles.sectionHeading}>Where the money goes</Text>
      <View style={styles.breakdownCard}>
        <SpendingBar expenses={expenses} />
      </View>

      {/* Balances */}
      <Text style={styles.sectionHeading}>Balances</Text>
      <View style={{ marginBottom: 8 }}>
        {people.map((p) => (
          <BalanceTile key={p.id} person={p} balance={balances[p.id] || 0} />
        ))}
      </View>

      {/* Settle CTA */}
      <TouchableOpacity
        style={styles.settleCta}
        onPress={() => navigation.navigate('Settle')}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.settleTitle}>
            {txns.length === 0 ? 'All settled 🎉' : `Settle in ${txns.length} transaction${txns.length === 1 ? '' : 's'}`}
          </Text>
          <Text style={styles.settleSub}>
            {txns.length === 0
              ? 'Nobody owes anyone right now.'
              : `£${totals.totalDue.toFixed(2)} flowing across the household`}
          </Text>
        </View>
        <Text style={styles.settleArrow}>›</Text>
      </TouchableOpacity>

      {/* Quick actions */}
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Activity')}
          activeOpacity={0.85}
        >
          <Ionicons name="pulse-outline" size={20} color="#6c5ce7" />
          <Text style={styles.shortcutLabel}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Statistics')}
          activeOpacity={0.85}
        >
          <Ionicons name="bar-chart-outline" size={20} color="#6c5ce7" />
          <Text style={styles.shortcutLabel}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Help')}
          activeOpacity={0.85}
        >
          <Ionicons name="help-circle-outline" size={20} color="#6c5ce7" />
          <Text style={styles.shortcutLabel}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* Recent expenses */}
      <View style={styles.recentHeaderRow}>
        <Text style={styles.sectionHeading}>Recent</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>
      {recent.map((e) => (
        <View key={e.id} style={styles.recentRow}>
          <Text style={styles.recentTitle} numberOfLines={1}>{e.title}</Text>
          <Text style={styles.recentMeta}>
            paid by {personById[e.paidBy]?.name || '?'} · {e.date}
          </Text>
          <Text style={styles.recentAmount}>£{e.amount.toFixed(2)}</Text>
        </View>
      ))}

      {/* Floating add button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Add expense</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f8fb' },
  content: { padding: 16, paddingBottom: 80 },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  greet:    { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  greetSub: { fontSize: 13, color: '#666', marginTop: 2 },
  logout:   { color: '#6c5ce7', fontWeight: '700', fontSize: 13, marginTop: 4 },

  kpiRow: { flexDirection: 'row', marginBottom: 4 },
  kpiCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginRight: 8,
    borderWidth: 1, borderColor: '#eceef3',
  },
  kpiLabel: { fontSize: 11, color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginTop: 4 },
  kpiHint:  { fontSize: 11, color: '#888', marginTop: 2 },

  sectionHeading: { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginTop: 16, marginBottom: 8 },

  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eceef3',
    marginBottom: 4,
  },

  settleCta: {
    backgroundColor: '#6c5ce7', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginTop: 4,
  },
  settleTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  settleSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  settleArrow: { color: '#fff', fontSize: 26, fontWeight: '700' },

  recentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll:    { color: '#6c5ce7', fontSize: 12, fontWeight: '700', marginTop: 16 },

  shortcutsRow: { flexDirection: 'row', marginTop: 16 },
  shortcut: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 12, alignItems: 'center',
    marginRight: 8, borderWidth: 1, borderColor: '#eceef3',
  },
  shortcutLabel: { fontSize: 11, fontWeight: '700', color: '#1a1a2e', marginTop: 4 },
  recentRow:  {
    backgroundColor: '#fff', padding: 12, borderRadius: 10,
    marginBottom: 6, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#eceef3',
  },
  recentTitle:  { flex: 1, fontWeight: '600', color: '#1a1a2e', fontSize: 13 },
  recentMeta:   { fontSize: 11, color: '#888', marginRight: 8 },
  recentAmount: { fontWeight: '700', color: '#1a1a2e', fontSize: 13 },

  fab: {
    position: 'absolute', bottom: 16, right: 16,
    backgroundColor: '#6c5ce7',
    paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
