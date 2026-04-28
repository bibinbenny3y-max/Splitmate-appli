// screens/StatisticsScreen.js
// ---------------------------------------------------------------------------
// Insights and stats over the persisted expenses. Five sections:
//   1. Headline KPIs (total, avg, biggest, count)
//   2. Top contributors (per-person paid totals as bars)
//   3. Spending by category (full vertical breakdown)
//   4. Biggest single expenses (top 5)
//   5. Activity by month (last 6 months)
// All purely derived - no extra storage needed.
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadPeople, loadExpenses } from '../logic/storage';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../data/initialData';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function StatisticsScreen() {
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

  // ---- derived data ------------------------------------------------------
  const stats = useMemo(() => {
    const total   = expenses.reduce((s, e) => s + e.amount, 0);
    const count   = expenses.length;
    const avg     = count > 0 ? total / count : 0;
    const biggest = expenses.reduce((m, e) => (e.amount > (m?.amount || 0) ? e : m), null);

    // per-person paid totals
    const byPerson = people.map((p) => ({
      person: p,
      paid: expenses.filter((e) => e.paidBy === p.id).reduce((s, e) => s + e.amount, 0),
    })).sort((a, b) => b.paid - a.paid);

    // by category
    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const categoryRanked = Object.entries(byCategory)
      .map(([cat, amt]) => ({ cat, amt }))
      .sort((a, b) => b.amt - a.amt);

    // top 5 expenses
    const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

    // by month (last 6 months)
    const monthly = {};
    expenses.forEach((e) => {
      const [y, m] = e.date.split('-');
      const key = `${y}-${m}`;
      monthly[key] = (monthly[key] || 0) + e.amount;
    });
    const monthEntries = Object.entries(monthly).sort();
    const monthMax = Math.max(...monthEntries.map(([, v]) => v), 1);

    return {
      total, count, avg, biggest, byPerson, categoryRanked, topExpenses,
      monthEntries, monthMax,
    };
  }, [expenses, people]);

  if (expenses.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="stats-chart-outline" size={48} color="#bbb" />
        <Text style={styles.emptyTitle}>No data yet</Text>
        <Text style={styles.emptySub}>Add some expenses to see insights here.</Text>
      </View>
    );
  }

  const personById = Object.fromEntries(people.map((p) => [p.id, p]));
  const personPaidMax = Math.max(...stats.byPerson.map((x) => x.paid), 1);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />}
    >
      {/* Headline KPIs */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCell}>
          <Ionicons name="wallet-outline" size={18} color="#6c5ce7" />
          <Text style={styles.kpiValue}>£{stats.total.toFixed(2)}</Text>
          <Text style={styles.kpiLabel}>Total spend</Text>
        </View>
        <View style={styles.kpiCell}>
          <Ionicons name="receipt-outline" size={18} color="#6c5ce7" />
          <Text style={styles.kpiValue}>{stats.count}</Text>
          <Text style={styles.kpiLabel}>Expenses</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCell}>
          <Ionicons name="trending-up-outline" size={18} color="#6c5ce7" />
          <Text style={styles.kpiValue}>£{stats.avg.toFixed(2)}</Text>
          <Text style={styles.kpiLabel}>Avg expense</Text>
        </View>
        <View style={styles.kpiCell}>
          <Ionicons name="trophy-outline" size={18} color="#6c5ce7" />
          <Text style={styles.kpiValue}>£{(stats.biggest?.amount || 0).toFixed(2)}</Text>
          <Text style={styles.kpiLabel}>Biggest</Text>
        </View>
      </View>

      {/* Top contributors */}
      <Text style={styles.heading}>Top contributors</Text>
      <View style={styles.card}>
        {stats.byPerson.map((s, i) => {
          const pct = (s.paid / personPaidMax) * 100;
          return (
            <View key={s.person.id} style={styles.barRow}>
              <View style={styles.barLabelRow}>
                <View style={[styles.dot, { backgroundColor: s.person.color }]} />
                <Text style={styles.barName}>{s.person.name}</Text>
                <Text style={styles.barAmount}>£{s.paid.toFixed(2)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { width: `${pct}%`, backgroundColor: s.person.color }]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Spending by category */}
      <Text style={styles.heading}>Spending by category</Text>
      <View style={styles.card}>
        {stats.categoryRanked.map((row) => {
          const pct = (row.amt / stats.total) * 100;
          return (
            <View key={row.cat} style={styles.catRow}>
              <Text style={styles.catIcon}>{CATEGORY_ICONS[row.cat] || '💷'}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.catTopRow}>
                  <Text style={styles.catName}>{row.cat}</Text>
                  <Text style={styles.catAmt}>
                    £{row.amt.toFixed(2)} <Text style={styles.catPct}>({pct.toFixed(0)}%)</Text>
                  </Text>
                </View>
                <View style={styles.catBarTrack}>
                  <View
                    style={[
                      styles.catBarFill,
                      { width: `${pct}%`, backgroundColor: CATEGORY_COLORS[row.cat] || '#b2bec3' },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Biggest expenses */}
      <Text style={styles.heading}>Biggest single expenses</Text>
      <View style={styles.card}>
        {stats.topExpenses.map((e, i) => {
          const payer = personById[e.paidBy];
          return (
            <View key={e.id} style={[styles.topExp, i === stats.topExpenses.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.topRank}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.topTitle} numberOfLines={1}>{e.title}</Text>
                <Text style={styles.topMeta}>
                  {e.category} · paid by {payer?.name || '?'}
                </Text>
              </View>
              <Text style={styles.topAmt}>£{e.amount.toFixed(2)}</Text>
            </View>
          );
        })}
      </View>

      {/* Monthly breakdown */}
      <Text style={styles.heading}>Activity by month</Text>
      <View style={styles.card}>
        {stats.monthEntries.length === 0 ? (
          <Text style={styles.emptySmall}>No history yet</Text>
        ) : stats.monthEntries.map(([key, amt]) => {
          const [y, m] = key.split('-');
          const label = `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
          const pct = (amt / stats.monthMax) * 100;
          return (
            <View key={key} style={styles.barRow}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barName}>{label}</Text>
                <Text style={styles.barAmount}>£{amt.toFixed(2)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: '#6c5ce7' }]} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f8fb' },
  content: { padding: 16, paddingBottom: 40 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f8fb' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a2e', marginTop: 12 },
  emptySub:   { fontSize: 13, color: '#888', marginTop: 4 },
  emptySmall: { color: '#888', fontSize: 12, fontStyle: 'italic' },

  kpiRow: { flexDirection: 'row', marginBottom: 8 },
  kpiCell: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginRight: 8, borderWidth: 1, borderColor: '#eceef3',
  },
  kpiValue: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginTop: 6 },
  kpiLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },

  heading: { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginTop: 16, marginBottom: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#eceef3',
  },

  barRow: { marginVertical: 4 },
  barLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot:    { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  barName:   { flex: 1, fontSize: 12, color: '#1a1a2e', fontWeight: '700' },
  barAmount: { fontSize: 12, color: '#1a1a2e', fontWeight: '800' },
  barTrack:  { height: 8, backgroundColor: '#eef0f5', borderRadius: 4, overflow: 'hidden' },
  barFill:   { height: 8, borderRadius: 4 },

  catRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  catIcon: { fontSize: 18, marginRight: 10, width: 22, textAlign: 'center' },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: 12, fontWeight: '700', color: '#1a1a2e' },
  catAmt:  { fontSize: 12, fontWeight: '800', color: '#1a1a2e' },
  catPct:  { color: '#888', fontWeight: '500' },
  catBarTrack: { height: 6, backgroundColor: '#eef0f5', borderRadius: 3, overflow: 'hidden' },
  catBarFill:  { height: 6, borderRadius: 3 },

  topExp: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eceef3',
  },
  topRank:  { fontSize: 12, fontWeight: '800', color: '#888', marginRight: 10, width: 24 },
  topTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  topMeta:  { fontSize: 11, color: '#888', marginTop: 1 },
  topAmt:   { fontSize: 13, fontWeight: '800', color: '#6c5ce7' },
});
