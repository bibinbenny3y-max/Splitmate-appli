// components/EmptyState.js
// ---------------------------------------------------------------------------
// Centred empty-state placeholder used by every list screen. Keeps the
// "nothing to show" UX consistent across Expenses, People and Settlement.
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmptyState({ icon = '🗒️', title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: 32 },
  icon:     { fontSize: 48, marginBottom: 12 },
  title:    { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', maxWidth: 240 },
});
