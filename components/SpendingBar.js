// components/SpendingBar.js
// ---------------------------------------------------------------------------
// Horizontal stacked bar: shows how the household's total spend is split
// across categories. Adds visual texture to the Home screen and reinforces
// that the app *thinks about* the data, not just stores it. Categories
// with zero spend are dropped from both the bar and the legend.
// ---------------------------------------------------------------------------

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CATEGORY_COLORS } from '../data/initialData';

export default function SpendingBar({ expenses }) {
  // Roll up spending per category. useMemo so we don't recompute on every
  // re-render of the parent screen.
  const { totals, grandTotal } = useMemo(() => {
    const t = {};
    let g = 0;
    for (const e of expenses) {
      t[e.category] = (t[e.category] || 0) + e.amount;
      g += e.amount;
    }
    return { totals: t, grandTotal: g };
  }, [expenses]);

  // Sort biggest first so the bar reads left-to-right by importance.
  const segments = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  if (segments.length === 0 || grandTotal <= 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No spending tracked yet.</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.bar}>
        {segments.map(([cat, amount], i) => {
          const pct = (amount / grandTotal) * 100;
          // Floor pct of 1% so a tiny category is still visible.
          const flex = Math.max(pct, 1);
          return (
            <View
              key={cat}
              style={{
                flex,
                backgroundColor: CATEGORY_COLORS[cat] || '#b2bec3',
                borderTopLeftRadius:    i === 0 ? 6 : 0,
                borderBottomLeftRadius: i === 0 ? 6 : 0,
                borderTopRightRadius:    i === segments.length - 1 ? 6 : 0,
                borderBottomRightRadius: i === segments.length - 1 ? 6 : 0,
              }}
            />
          );
        })}
      </View>

      <View style={styles.legend}>
        {segments.map(([cat, amount]) => {
          const pct = Math.round((amount / grandTotal) * 100);
          return (
            <View key={cat} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: CATEGORY_COLORS[cat] || '#b2bec3' }]} />
              <Text style={styles.legendCat} numberOfLines={1}>{cat}</Text>
              <Text style={styles.legendAmt}>£{amount.toFixed(0)} <Text style={styles.legendPct}>({pct}%)</Text></Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#eef0f5',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 6,
    paddingRight: 8,
  },
  swatch: {
    width: 10, height: 10, borderRadius: 2, marginRight: 6,
  },
  legendCat: { flex: 1, fontSize: 11, color: '#444', fontWeight: '600' },
  legendAmt: { fontSize: 11, color: '#1a1a2e', fontWeight: '700' },
  legendPct: { color: '#888', fontWeight: '500' },
  empty: {
    padding: 16, alignItems: 'center',
  },
  emptyText: { color: '#888', fontSize: 12 },
});
