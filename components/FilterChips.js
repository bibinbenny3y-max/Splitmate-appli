// components/FilterChips.js
// ---------------------------------------------------------------------------
// Horizontally scrollable chip strip. Generic over option labels so it
// can be reused as a category filter, a sort-by selector, or anywhere
// else a single-select chip row is wanted.
// ---------------------------------------------------------------------------

import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function FilterChips({ options, value, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, paddingHorizontal: 4 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dcdde6',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  chipText:       { fontSize: 13, color: '#444', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
});
