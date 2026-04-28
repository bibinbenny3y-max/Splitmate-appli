// screens/PersonDetailScreen.js
// ---------------------------------------------------------------------------
// Detail view for a single household member. Pushed from PeopleScreen.
// Shows headline stats, the expenses they paid for, and the expenses they
// owe a share on. Filterable. Includes a settle-up shortcut to the
// SettleUp tab.
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadPeople, loadExpenses } from '../logic/storage';
import { computeBalances } from '../logic/settlement';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { CATEGORY_ICONS } from '../data/initialData';

const TABS = [
  { key: 'paid',     label: 'Paid for',  icon: 'card-outline' },
  { key: 'involved', label: 'On the hook', icon: 'people-outline' },
];

export default function PersonDetailScreen({ navigation, route }) {
  const personId = route?.params?.personId;

  const [people,   setPeople]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tab,      setTab]      = useState('paid');
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const [p, e] = await Promise.all([loadPeople(), loadExpenses()]);
    setPeople(p); setExpenses(e);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const onRefresh = async () => {
    setRefreshing(true); await reload(); setRefreshing(false);
  };

  const person = people.find((p) => p.id === personId);

  const balances = useMemo(() => computeBalances(people, expenses), [people, expenses]);
  const personById = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p])),
    [people],
  );

  if (!person) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: '#888' }}>Loading…</Text>
      </View>
    );
  }

  const balance   = balances[personId] || 0;
  const isOwed    = balance > 0.005;
  const isOwing   = balance < -0.005;

  const paidExpenses     = expenses.filter((e) => e.paidBy === personId);
  const involvedExpenses = expenses.filter((e) => e.splitAmong.includes(personId) && e.paidBy !== personId);

  const totalPaid  = paidExpenses.reduce((s, e) => s + e.amount, 0);
  const totalShare = expenses
    .filter((e) => e.splitAmong.includes(personId))
    .reduce((s, e) => s + e.amount / e.splitAmong.length, 0);
  const biggestPaid = paidExpenses.reduce((m, e) => (e.amount > (m?.amount || 0) ? e : m), null);

  const visible = tab === 'paid' ? paidExpenses : involvedExpenses;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />}
    >
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: person.color }]}>
        <Avatar name={person.name} color="rgba(255,255,255,0.25)" size={68} ring />
        <Text style={styles.heroName}>{person.name}</Text>

        <View style={[
          styles.balancePill,
          isOwed   && { backgroundColor: 'rgba(255,255,255,0.95)' },
          isOwing  && { backgroundColor: 'rgba(255,255,255,0.95)' },
        ]}>
          <Ionicons
            name={isOwed ? 'arrow-up-circle' : isOwing ? 'arrow-down-circle' : 'checkmark-circle'}
            size={18}
            color={isOwed ? '#0c8d54' : isOwing ? '#b8312f' : '#666'}
          />
          <Text style={[
            styles.balancePillText,
            { color: isOwed ? '#0c8d54' : isOwing ? '#b8312f' : '#666' },
          ]}>
            {isOwed
              ? `Is owed £${balance.toFixed(2)}`
              : isOwing
                ? `Owes £${Math.abs(balance).toFixed(2)}`
                : 'All settled'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>£{totalPaid.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total paid</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>£{totalShare.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Their share</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{paidExpenses.length}</Text>
          <Text style={styles.statLabel}>Paid for</Text>
        </View>
      </View>

      {biggestPaid && (
        <View style={styles.factCard}>
          <Ionicons name="trophy-outline" size={18} color="#fdcb6e" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.factTitle}>Biggest expense paid</Text>
            <Text style={styles.factSub}>
              {biggestPaid.title} · £{biggestPaid.amount.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Settle-up shortcut */}
      {(isOwed || isOwing) && (
        <TouchableOpacity
          style={styles.settleBtn}
          onPress={() => navigation.navigate('Main', { screen: 'Settle' })}
          activeOpacity={0.85}
        >
          <Ionicons name="git-network-outline" size={18} color="#fff" />
          <Text style={styles.settleBtnText}>Open Settle Up</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Tab strip */}
      <View style={styles.tabStrip}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const count  = t.key === 'paid' ? paidExpenses.length : involvedExpenses.length;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              activeOpacity={0.7}
            >
              <Ionicons name={t.icon} size={14} color={active ? '#fff' : '#666'} />
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                {t.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {visible.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Nothing in this view"
          subtitle={tab === 'paid' ? 'They haven\'t paid for anything yet.' : 'They\'re not on any shared expenses.'}
        />
      ) : (
        visible.map((e) => {
          const payer = personById[e.paidBy];
          return (
            <View key={e.id} style={styles.expRow}>
              <View style={styles.expIcon}>
                <Text style={{ fontSize: 16 }}>{CATEGORY_ICONS[e.category] || '💷'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.expTitle}>{e.title}</Text>
                <Text style={styles.expMeta}>
                  {e.category} · {e.date}
                  {tab === 'involved' ? ` · paid by ${payer?.name}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.expAmount}>£{e.amount.toFixed(2)}</Text>
                {tab === 'involved' && (
                  <Text style={styles.expShare}>
                    share £{(e.amount / e.splitAmong.length).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f8fb' },
  content: { padding: 16, paddingBottom: 40 },
  empty:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 12,
  },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 10 },
  balancePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, marginTop: 12,
  },
  balancePillText: { fontWeight: '800', fontSize: 13, marginLeft: 6, color: '#fff' },

  statsRow: { flexDirection: 'row' },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12,
    marginRight: 6, alignItems: 'center',
    borderWidth: 1, borderColor: '#eceef3',
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },

  factCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff8e1', borderRadius: 12,
    padding: 12, marginTop: 10,
  },
  factTitle: { fontSize: 12, fontWeight: '800', color: '#1a1a2e' },
  factSub:   { fontSize: 12, color: '#666', marginTop: 2 },

  settleBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#6c5ce7', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, marginTop: 12,
  },
  settleBtnText: { color: '#fff', fontWeight: '800', flex: 1, marginLeft: 8 },

  tabStrip: { flexDirection: 'row', marginTop: 16, marginBottom: 8 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: '#fff', borderRadius: 999,
    borderWidth: 1, borderColor: '#dcdde6', marginRight: 6,
  },
  tabBtnActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  tabBtnText:   { fontSize: 12, fontWeight: '700', color: '#666', marginLeft: 4 },
  tabBtnTextActive: { color: '#fff' },

  expRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: '#eceef3',
  },
  expIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1efff',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  expTitle:  { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  expMeta:   { fontSize: 11, color: '#888', marginTop: 2 },
  expAmount: { fontSize: 14, fontWeight: '800', color: '#1a1a2e' },
  expShare:  { fontSize: 10, color: '#888', marginTop: 1 },
});
