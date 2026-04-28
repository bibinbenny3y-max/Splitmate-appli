// screens/HelpScreen.js
// ---------------------------------------------------------------------------
// Help / how-to-use screen. Opened from the Login screen's question-mark
// icon and from Settings. Three sections: Getting Started, How Settle Up
// Works, and Tips. Pure presentational - no storage interaction.
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
  {
    icon: 'rocket-outline',
    title: 'Getting started',
    items: [
      {
        q: 'How do I sign in?',
        a: 'Two demo accounts are pre-built and shown on the login screen. Tap a demo card to auto-fill the form, then tap Sign In. Both use the password "password123".',
      },
      {
        q: 'Who is in the household?',
        a: 'Four housemates: Alice, Bibin, Charlie, and Dana. The seed data ships with 15 sample expenses spread across them, so you can explore every screen with realistic data on first launch.',
      },
      {
        q: 'How do I add an expense?',
        a: 'Tap the purple "+" floating button on Home or Expenses. Fill in title, amount, category, who paid, and who shares the cost. Save and the balances update everywhere.',
      },
      {
        q: 'Can I edit or delete expenses?',
        a: 'Yes. Long-press an expense to open the action menu (Edit / Delete), or swipe left on it to reveal a quick Delete action.',
      },
    ],
  },
  {
    icon: 'git-network-outline',
    title: 'How "settle up" works',
    items: [
      {
        q: 'What does Settle Up actually do?',
        a: 'It computes everyone\'s net balance, then finds the smallest set of person-to-person payments that clear every debt. For four people with intertwined expenses, it can collapse six naive transactions into three.',
      },
      {
        q: 'Which algorithm is used?',
        a: 'A greedy "max creditor pays max debtor" pass: repeatedly pair the person owed the most with the person who owes the most, settle the smaller of their two balances, and remove whichever hits zero. Runs in O(n²) and produces n-1 transactions at most.',
      },
      {
        q: 'Why is the count showing 6 → 3?',
        a: 'The number on the left is what a naive pairwise approach would need (every pair settles their own debt). The number on the right is what the greedy minimum-cash-flow algorithm finds. The reduction is the value the app adds.',
      },
      {
        q: 'How do I mark a payment as done?',
        a: 'On the Settle Up screen, tap a transaction. It strikes through and turns green. Tap again to undo. Settled markings are session-only by design — the underlying expenses still exist.',
      },
    ],
  },
  {
    icon: 'bulb-outline',
    title: 'Tips & tricks',
    items: [
      {
        q: 'Search smarter',
        a: 'The search box on Expenses matches the title, the notes, and the payer\'s name. Try typing a person\'s name to see every expense they\'ve paid for.',
      },
      {
        q: 'Customize sort',
        a: 'On Expenses, tap Date / Amount / Title to sort by that field, then the arrow toggles ascending/descending. Your preference is saved between sessions.',
      },
      {
        q: 'Filter by category',
        a: 'The chip strip below the sort row filters the list. Tap "All" to clear. The active filter persists.',
      },
      {
        q: 'Reset demo data',
        a: 'Settings → Data → Reload demo expenses, or Reset all data to wipe everything including your sign-in. Useful when recording a clean demo.',
      },
    ],
  },
];

export default function HelpScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Ionicons name="book-outline" size={28} color="#6c5ce7" />
        <Text style={styles.introTitle}>Welcome to SplitMate</Text>
        <Text style={styles.introBody}>
          A guide to every feature. Tap any question to expand its answer in your head.
        </Text>
      </View>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name={section.icon} size={20} color="#6c5ce7" />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          {section.items.map((item, i) => (
            <View key={i} style={styles.qa}>
              <Text style={styles.q}>{item.q}</Text>
              <Text style={styles.a}>{item.a}</Text>
            </View>
          ))}
        </View>
      ))}

      <Text style={styles.footer}>
        Stuck? Pull down on any list to refresh, or check Settings for data recovery.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f8fb' },
  content: { padding: 16, paddingBottom: 40 },

  intro: {
    backgroundColor: '#f1efff', borderRadius: 14, padding: 16,
    alignItems: 'flex-start', marginBottom: 20,
  },
  introTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a2e', marginTop: 8 },
  introBody:  { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },

  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#eceef3',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eceef3',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginLeft: 8 },

  qa: { marginTop: 10, marginBottom: 4 },
  q:  { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  a:  { fontSize: 12, color: '#555', lineHeight: 17 },

  footer: { textAlign: 'center', color: '#aaa', fontSize: 11, marginTop: 16, fontStyle: 'italic' },
});
