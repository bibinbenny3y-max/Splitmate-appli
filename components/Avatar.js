// components/Avatar.js
// ---------------------------------------------------------------------------
// Single source of truth for how a person renders as a circular avatar.
// Used on Login, Home, People, PersonDetail, Profile, and inside chips.
// Sizing through `size` prop keeps the same visual identity everywhere.
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Avatar({ name = '?', color = '#6c5ce7', size = 36, ring = false }) {
  const initial = (name || '?').trim().slice(0, 1).toUpperCase();
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        ring && styles.ring,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '800' },
  ring: { borderWidth: 3, borderColor: '#fff' },
});
