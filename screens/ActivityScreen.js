// screens/ActivityScreen.js
// ---------------------------------------------------------------------------
// Activity feed. Combines two sources:
//   1. The explicit logActivity() entries (added/edited/deleted events)
//   2. Synthesised "expense" events from the persisted expenses list
//      sorted by date - so even before the user adds anything new, the
//      feed shows realistic historical activity from the seed data.
// Filterable by All / Mine / Settle.
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  loadPeople, loadExpenses, loadActivity, clearActivity,
} from '../logic/storage';
import EmptyState from '../components/EmptyState';

const FILTERS = [
  { key: 'all',  label: 'All',     icon: 'apps-outline' },
  { key: 'mine', label: 'Mine',    icon: 'person-outline' },
  { key: 'edit', label: 'Edits',   icon: 'create-outline' },
];

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 4)   return `${w}w ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

function dateToTs(iso) {
  // 'YYYY-MM-DD' -> midnight timestamp
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
}

export default function ActivityScreen({ navigation, route }) {
  const userId = route?.params?.user?.id;

  const [people,   setPeople]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activity, setActivity] = useState([]);
  const [filter,   setFilter]   = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const [p, e, a] = await Promise.all([
      loadPeople(),
      loadExpenses(),
      loadActivity(),
    ]);
    setPeople(p); setExpenses(e); setActivity(a);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const onRefresh = async () => {
    setRefreshing(true); await reload(); setRefreshing(false);
  };

  const personById = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p])),
    [people],
  );

  // Combine: explicit activity entries + synthesised "expense added" entries.
  const merged = useMemo(() => {
    const synthesised = expenses.map((e) => ({
      id: `syn_${e.id}`,
      type: 'expense_added',
      timestamp: dateToTs(e.date),
      payload: e,
      synthetic: true,
    }));

    const all = [...activity, ...synthesised].sort((a, b) => b.timestamp - a.timestamp);

    return all.filter((item) => {
      if (filter === 'mine') {
        const exp = item.payload;
        return exp?.paidBy === userId || exp?.splitAmong?.includes(userId);
      }
      if (filter === 'edit') {
        return item.type === 'expense_edited' || item.type === 'expense_deleted';
      }
      return true;
    });
  }, [activity, expenses, filter, userId]);

  const renderItem = ({ item }) => {
    const exp   = item.payload;
    const payer = personById[exp?.paidBy];

    let icon, title, accent;
    switch (item.type) {
      case 'expense_added':
        icon = 'add-circle-outline'; accent = '#0c8d54';
        title = `${payer?.name || 'Someone'} paid for ${exp?.title}`;
        break;
      case 'expense_edited':
        icon = 'create-outline'; accent = '#fdcb6e';
        title = `${exp?.title} was edited`;
        break;
      case 'expense_deleted':
        icon = 'trash-outline'; accent = '#b8312f';
        title = `${exp?.title} was removed`;
        break;
      case 'settled':
        icon = 'checkmark-done-outline'; accent = '#6c5ce7';
        title = `Settlement marked complete`;
        break;
      default:
        icon = 'ellipse-outline'; accent = '#888';
        title = 'Activity';
    }

    return (
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
          <Ionicons name={icon} size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.meta}>
            {exp?.category ? `${exp.category} · ` : ''}
            {timeAgo(item.timestamp)}
          </Text>
        </View>
        {exp?.amount != null && (
          <Text style={styles.amount}>£{exp.amount.toFixed(2)}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Filter row */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
              activeOpacity={0.7}
            >
              <Ionicons name={f.icon} size={14} color={active ? '#fff' : '#666'} />
              <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.clearBtn}
          onPress={async () => { await clearActivity(); reload(); }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={14} color="#888" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={merged}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="📭"
            title="Nothing here yet"
            subtitle="Add an expense and it'll show up here straight away."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f8fb' },

  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: '#fff', borderRadius: 999,
    borderWidth: 1, borderColor: '#dcdde6',
    marginRight: 6,
  },
  filterBtnActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  filterBtnText:   { fontSize: 12, fontWeight: '700', color: '#666', marginLeft: 4 },
  filterBtnTextActive: { color: '#fff' },
  clearBtn: {
    marginLeft: 'auto',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#dcdde6',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#eceef3',
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  title:  { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  meta:   { fontSize: 11, color: '#888', marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '800', color: '#1a1a2e' },
});
