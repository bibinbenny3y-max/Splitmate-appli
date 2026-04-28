// screens/ExpensesScreen.js
// ---------------------------------------------------------------------------
// Main expense list. Implements every navigation control the brief asks for
// in one place: search, category filter, sort, and pagination. Sort/filter
// preferences persist to AsyncStorage so the list opens the way the user
// last left it. Swipe-to-delete on each card and pull-to-refresh on the
// FlatList satisfy the gesture suggestions from the prototype feedback.
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  loadPeople, loadExpenses, saveExpenses, loadPrefs, savePrefs,
} from '../logic/storage';
import { CATEGORIES } from '../data/initialData';
import ExpenseCard from '../components/ExpenseCard';
import FilterChips from '../components/FilterChips';
import EmptyState from '../components/EmptyState';

const SORTS = ['date', 'amount', 'title'];
const SORT_LABELS = { date: 'Date', amount: 'Amount', title: 'Title' };

export default function ExpensesScreen({ navigation }) {
  const [people,   setPeople]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [search,   setSearch]   = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page,     setPage]     = useState(1);

  // Persisted prefs
  const [prefs, setPrefs] = useState({
    sortBy: 'date', sortDir: 'desc', filterCategory: 'All', pageSize: 6,
  });

  const reload = useCallback(async () => {
    const [p, e, pr] = await Promise.all([loadPeople(), loadExpenses(), loadPrefs()]);
    setPeople(p);
    setExpenses(e);
    setPrefs(pr);
    setPage(1);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const updatePrefs = async (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await savePrefs(next);
    setPage(1);
  };

  const personById = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p])),
    [people],
  );

  // ---- Pipeline: filter -> search -> sort -> paginate -------------------
  const filteredSorted = useMemo(() => {
    let list = expenses;

    if (prefs.filterCategory && prefs.filterCategory !== 'All') {
      list = list.filter((e) => e.category === prefs.filterCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q) ||
        personById[e.paidBy]?.name.toLowerCase().includes(q),
      );
    }

    const dir = prefs.sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      let cmp;
      if (prefs.sortBy === 'amount')      cmp = a.amount - b.amount;
      else if (prefs.sortBy === 'title')  cmp = a.title.localeCompare(b.title);
      else                                cmp = a.date.localeCompare(b.date);
      return cmp * dir;
    });

    return list;
  }, [expenses, prefs, search, personById]);

  const visible = filteredSorted.slice(0, page * prefs.pageSize);
  const hasMore = visible.length < filteredSorted.length;

  const handleDelete = async (exp) => {
    const next = expenses.filter((e) => e.id !== exp.id);
    setExpenses(next);
    await saveExpenses(next);
  };

  const handleEdit = (exp) => {
    navigation.navigate('AddExpense', { expenseId: exp.id });
  };

  // -----------------------------------------------------------------------

  const filterOptions = ['All', ...CATEGORIES];

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search expenses, notes, payer…"
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {SORTS.map((s) => {
          const active = prefs.sortBy === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => updatePrefs({ sortBy: s })}
              style={[styles.sortBtn, active && styles.sortBtnActive]}
            >
              <Text style={[styles.sortBtnText, active && styles.sortBtnTextActive]}>
                {SORT_LABELS[s]}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          onPress={() => updatePrefs({ sortDir: prefs.sortDir === 'asc' ? 'desc' : 'asc' })}
          style={styles.dirBtn}
        >
          <Text style={styles.dirBtnText}>{prefs.sortDir === 'asc' ? '↑' : '↓'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <FilterChips
        options={filterOptions}
        value={prefs.filterCategory}
        onChange={(v) => updatePrefs({ filterCategory: v })}
      />

      {/* Result count */}
      <Text style={styles.resultCount}>
        {filteredSorted.length} expense{filteredSorted.length === 1 ? '' : 's'}
        {prefs.filterCategory !== 'All' ? ` in "${prefs.filterCategory}"` : ''}
        {search ? ` matching "${search}"` : ''}
      </Text>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            payer={personById[item.paidBy]}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🔎"
            title="Nothing here"
            subtitle="Try clearing the filter or search."
          />
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity onPress={() => setPage(page + 1)} style={styles.loadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </TouchableOpacity>
          ) : (
            visible.length > 0 && (
              <Text style={styles.endOfList}>— end of list —</Text>
            )
          )
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f8fb' },

  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 10, padding: 10,
    fontSize: 14, borderWidth: 1, borderColor: '#dcdde6',
  },

  sortRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 6,
  },
  sortLabel: { fontSize: 12, color: '#888', fontWeight: '700', marginRight: 8 },
  sortBtn: {
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 6, backgroundColor: '#eef0f5', marginRight: 6,
  },
  sortBtnActive:    { backgroundColor: '#1a1a2e' },
  sortBtnText:      { fontSize: 12, color: '#444', fontWeight: '700' },
  sortBtnTextActive:{ color: '#fff' },
  dirBtn: {
    width: 28, height: 28, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a2e', marginLeft: 'auto',
  },
  dirBtnText: { color: '#fff', fontWeight: '700' },

  resultCount: { fontSize: 11, color: '#888', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 },

  listContent: { paddingHorizontal: 16, paddingBottom: 80, paddingTop: 4 },

  loadMore: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#dcdde6', marginTop: 8,
  },
  loadMoreText: { color: '#6c5ce7', fontWeight: '700' },
  endOfList: { textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 12 },

  fab: {
    position: 'absolute', bottom: 16, right: 16,
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#6c5ce7',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: -2 },
});
