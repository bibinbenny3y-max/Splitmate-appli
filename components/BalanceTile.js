// components/BalanceTile.js
// ---------------------------------------------------------------------------
// Compact per-person balance card. Used on Home (horizontal scroll row)
// and on Settlement (full-width). The colour-coded pill makes "owes"
// vs "is owed" readable at a glance.
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BalanceTile({ person, balance, compact = false }) {
  const isOwed   = balance >  0.005;
  const isOwing  = balance < -0.005;
  const isSquare = !isOwed && !isOwing;

  const initials = person.name.slice(0, 1).toUpperCase();

  let pillText, pillBg, pillFg;
  if (isSquare) {
    pillText = 'square';
    pillBg = '#eef0f5'; pillFg = '#666';
  } else if (isOwed) {
    pillText = `+£${balance.toFixed(2)}`;
    pillBg = '#e0f8ee'; pillFg = '#0c8d54';
  } else {
    pillText = `-£${Math.abs(balance).toFixed(2)}`;
    pillBg = '#fde8e8'; pillFg = '#b8312f';
  }

  return (
    <View style={[styles.tile, compact && styles.tileCompact, { borderLeftColor: person.color }]}>
      <View style={[styles.avatar, { backgroundColor: person.color }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{person.name}</Text>
        <Text style={styles.subtle}>
          {isSquare ? 'all settled' : (isOwed ? 'is owed' : 'owes')}
        </Text>
      </View>

      <View style={[styles.pill, { backgroundColor: pillBg }]}>
        <Text style={[styles.pillText, { color: pillFg }]}>{pillText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tileCompact: { padding: 10, marginBottom: 0, marginRight: 8, minWidth: 200 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  name:       { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  subtle:     { fontSize: 11, color: '#888', marginTop: 1 },
  pill:       { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  pillText:   { fontSize: 12, fontWeight: '700' },
});
