// components/ExpenseCard.js
// ---------------------------------------------------------------------------
// Single-expense row. Swipe-left reveals a Delete action. The swipe is
// implemented with react-native-gesture-handler's Swipeable wrapper -
// the parent must be inside a GestureHandlerRootView (we wrap the whole
// app in App.js).
// ---------------------------------------------------------------------------

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { CATEGORY_ICONS } from '../data/initialData';

function formatDate(iso) {
  // 2026-04-09 -> 9 Apr
  try {
    const [y, m, d] = iso.split('-').map(Number);
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] || '';
    return `${d} ${mon}`;
  } catch {
    return iso;
  }
}

export default function ExpenseCard({ expense, payer, onPress, onEdit, onDelete }) {
  const swipeRef = useRef(null);

  // Long-press opens an action menu (Edit / Delete). Standard Android+iOS
  // pattern; uses Alert.alert for portability rather than a third-party
  // action sheet library.
  const handleLongPress = () => {
    Alert.alert(
      expense.title,
      `£${expense.amount.toFixed(2)} · ${expense.category}`,
      [
        { text: 'Edit',   onPress: () => onEdit?.(expense) },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-90, 0],
      outputRange: [1, 0.6],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={confirmDelete}
        activeOpacity={0.85}
      >
        <Animated.Text style={[styles.deleteText, { transform: [{ scale }] }]}>
          Delete
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete expense?',
      `"${expense.title}" will be removed.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => swipeRef.current?.close() },
        { text: 'Delete', style: 'destructive', onPress: () => { onDelete?.(expense); swipeRef.current?.close(); } },
      ],
    );
  };

  const icon  = CATEGORY_ICONS[expense.category] || '💷';
  const split = expense.splitAmong?.length || 0;

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        onPress={() => onPress?.(expense)}
        onLongPress={handleLongPress}
        delayLongPress={400}
        activeOpacity={0.85}
      >
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {expense.category} · {formatDate(expense.date)} · split {split}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amount}>£{expense.amount.toFixed(2)}</Text>
            <Text style={styles.paidBy}>paid by {payer?.name || '?'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eceef3',
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#f1efff',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  icon:      { fontSize: 18 },
  title:     { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  subtitle:  { fontSize: 12, color: '#888', marginTop: 2 },
  amount:    { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  paidBy:    { fontSize: 11, color: '#888', marginTop: 2 },

  deleteAction: {
    backgroundColor: '#b8312f',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    marginBottom: 8,
    borderRadius: 12,
  },
  deleteText: { color: '#fff', fontWeight: '700' },
});
