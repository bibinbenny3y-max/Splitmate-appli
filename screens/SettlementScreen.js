// screens/SettlementScreen.js
// ---------------------------------------------------------------------------
// THE TRANSFORMATION OUTPUT. This is the screen that justifies the app's
// existence: a messy list of who-paid-what becomes a clean, minimal list
// of "X pays Y £Z" transactions. Includes a side-by-side counter against
// the naive pairwise approach so the value of the algorithm is visible.
// Tap a transaction to mark it settled (kept locally in state - "settled"
// markings reset on reload, by design, since the underlying expenses still
// exist; persisting them is a stretch goal not required for the brief).
// ---------------------------------------------------------------------------

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadPeople, loadExpenses } from '../logic/storage';
import {
  computeBalances, minimiseTransactions, naivePairwise, summary,
} from '../logic/settlement';
import BalanceTile from '../components/BalanceTile';
import EmptyState from '../components/EmptyState';

export default function SettlementScreen() {
  const [people,   setPeople]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [settled, setSettled] = useState(new Set()); // ids of marked-settled txns

  const reload = useCallback(async () => {
    const [p, e] = await Promise.all([loadPeople(), loadExpenses()]);
    setPeople(p);
    setExpenses(e);
    setSettled(new Set());
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const balances     = computeBalances(people, expenses);
  const totals       = summary(balances);
  const greedyTxns   = minimiseTransactions(balances);
  const naiveCount   = naivePairwise(people, expenses).length;
  const personById   = Object.fromEntries(people.map((p) => [p.id, p]));

  const txnId = (t, i) => `${t.from}-${t.to}-${i}`;
  const toggleSettled = (id) => {
    setSettled((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const explain = () => {
    Alert.alert(
      'How this is calculated',
      'For each person we compute net balance (paid - share). Then we ' +
      'repeatedly pair the person owed the most with the person who owes ' +
      'the most, and settle the smaller of their balances. The result is ' +
      'at most n-1 transactions for n people.\n\n' +
      `Naive pairwise approach: ${naiveCount} transactions\n` +
      `Greedy approach: ${greedyTxns.length} transactions`,
      [{ text: 'Got it' }],
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />}
    >
      {/* Headline summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total flowing</Text>
        <Text style={styles.summaryValue}>£{totals.totalDue.toFixed(2)}</Text>
        <View style={styles.compareRow}>
          <View style={styles.compareCell}>
            <Text style={styles.compareNum}>{naiveCount}</Text>
            <Text style={styles.compareLabel}>naive pairwise</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
          <View style={[styles.compareCell, { backgroundColor: '#fff' }]}>
            <Text style={[styles.compareNum, { color: '#6c5ce7' }]}>{greedyTxns.length}</Text>
            <Text style={styles.compareLabel}>greedy minimum</Text>
          </View>
          <TouchableOpacity onPress={explain} hitSlop={10} style={styles.infoBtn}>
            <Text style={styles.infoBtnText}>?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Balances */}
      <Text style={styles.heading}>Balances</Text>
      {people.map((p) => (
        <BalanceTile key={p.id} person={p} balance={balances[p.id] || 0} />
      ))}

      {/* Transactions */}
      <Text style={styles.heading}>Settle in {greedyTxns.length} transaction{greedyTxns.length === 1 ? '' : 's'}</Text>
      {greedyTxns.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Everyone's square"
          subtitle="Nobody owes anyone right now."
        />
      ) : (
        greedyTxns.map((t, i) => {
          const id = txnId(t, i);
          const isSettled = settled.has(id);
          const from = personById[t.from];
          const to   = personById[t.to];
          return (
            <TouchableOpacity
              key={id}
              style={[styles.txn, isSettled && styles.txnSettled]}
              onPress={() => toggleSettled(id)}
              activeOpacity={0.85}
            >
              <View style={styles.txnRow}>
                <View style={[styles.dot, { backgroundColor: from?.color || '#999' }]} />
                <Text style={[styles.txnPerson, isSettled && styles.strike]}>
                  {from?.name || '?'}
                </Text>
                <Text style={styles.txnArrow}>→</Text>
                <View style={[styles.dot, { backgroundColor: to?.color || '#999' }]} />
                <Text style={[styles.txnPerson, isSettled && styles.strike]}>
                  {to?.name || '?'}
                </Text>
                <Text style={[styles.txnAmount, isSettled && styles.strike]}>
                  £{t.amount.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.txnHint}>
                {isSettled ? '✓ marked settled — tap to undo' : 'tap when paid'}
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      <Text style={styles.footnote}>
        Greedy minimum-cash-flow. Optimal for typical household sizes; the
        general problem is NP-hard. See settlement.js for full reasoning.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f8fb' },
  content: { padding: 16, paddingBottom: 40 },

  summary: {
    backgroundColor: '#6c5ce7', borderRadius: 16, padding: 18,
    marginBottom: 16, alignItems: 'center',
  },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 4, marginBottom: 12 },

  compareRow: { flexDirection: 'row', alignItems: 'center' },
  compareCell: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
    alignItems: 'center', minWidth: 90,
  },
  compareNum:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  compareLabel: { fontSize: 10, color: '#fff', opacity: 0.85, marginTop: 2 },
  arrow:        { color: '#fff', fontSize: 20, marginHorizontal: 10, fontWeight: '700' },
  infoBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  infoBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  heading: { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginTop: 8, marginBottom: 8 },

  txn: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#eceef3',
  },
  txnSettled: { backgroundColor: '#f0f5f1', borderColor: '#cde9d6' },
  txnRow:     { flexDirection: 'row', alignItems: 'center' },
  dot:        { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  txnPerson:  { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  txnArrow:   { fontSize: 16, color: '#888', marginHorizontal: 6 },
  txnAmount:  { fontSize: 16, fontWeight: '800', color: '#6c5ce7', marginLeft: 'auto' },
  strike:     { textDecorationLine: 'line-through', opacity: 0.6 },
  txnHint:    { fontSize: 11, color: '#888', marginTop: 4 },

  footnote: {
    fontSize: 11, color: '#888', marginTop: 16, fontStyle: 'italic', textAlign: 'center',
  },
});
