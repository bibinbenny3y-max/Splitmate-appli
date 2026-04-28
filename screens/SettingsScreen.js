// screens/SettingsScreen.js
// ---------------------------------------------------------------------------
// Settings / app management screen. Pushed onto the stack from the gear
// icon in the Home header, so it gets a free back arrow from native-stack.
// Three sections: account (sign out), data (reset/seed/clear), about
// (version, link to Help). All actions confirm before destructive operations.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import {
  resetAllData, seedIfNeeded,
} from '../logic/storage';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ navigation, route }) {
  const onLogout = route?.params?.onLogout;
  const [confirmDeletes, setConfirmDeletes] = useState(true);

  const handleReset = () => {
    Alert.alert(
      'Reset all data?',
      'This will wipe every expense, balance, and preference and reload the demo seed. You\'ll be signed out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            await seedIfNeeded();
            // resetAllData clears auth too, so kick the user back to login
            onLogout?.();
          },
        },
      ],
    );
  };

  const handleReseed = async () => {
    Alert.alert(
      'Reload demo expenses?',
      'Your custom expenses will be replaced with the original 15 demo entries. Your sign-in stays.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reload',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            await seedIfNeeded();
            navigation.navigate('Main');
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in any time with the demo accounts.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => onLogout?.() },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Account */}
      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.group}>
        <TouchableOpacity style={styles.row} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.rowIcon}>🚪</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Sign out</Text>
            <Text style={styles.rowSub}>Return to the login screen</Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Data */}
      <Text style={styles.sectionLabel}>DATA</Text>
      <View style={styles.group}>
        <TouchableOpacity style={styles.row} onPress={handleReseed} activeOpacity={0.7}>
          <Text style={styles.rowIcon}>🔄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Reload demo expenses</Text>
            <Text style={styles.rowSub}>Restore the original 15 sample expenses</Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.row} onPress={handleReset} activeOpacity={0.7}>
          <Text style={styles.rowIcon}>🗑️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: '#b8312f' }]}>Reset all data</Text>
            <Text style={styles.rowSub}>Wipe everything and sign out</Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences */}
      <Text style={styles.sectionLabel}>PREFERENCES</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <Text style={styles.rowIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Confirm before deleting</Text>
            <Text style={styles.rowSub}>Show an alert when swipe-deleting</Text>
          </View>
          <Switch
            value={confirmDeletes}
            onValueChange={setConfirmDeletes}
            trackColor={{ false: '#dcdde6', true: '#6c5ce7' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionLabel}>ABOUT</Text>
      <View style={styles.group}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Help')}
          activeOpacity={0.7}
        >
          <Text style={styles.rowIcon}>❓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>How to use SplitMate</Text>
            <Text style={styles.rowSub}>Walkthrough, FAQ, tips</Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => Alert.alert(
            'About SplitMate',
            `Version ${APP_VERSION}\n\nBuilt as a Mobile Computing final assignment. SplitMate transforms a household's raw expense list into the minimum number of person-to-person transactions needed to settle every debt.\n\nReact Native · Expo · AsyncStorage\nGreedy Min Cash Flow algorithm`,
            [{ text: 'Close' }],
          )}
          activeOpacity={0.7}
        >
          <Text style={styles.rowIcon}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>About this app</Text>
            <Text style={styles.rowSub}>Version, credits, technology</Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>SplitMate v{APP_VERSION}</Text>
      <Text style={styles.footerSub}>Made with 💷 for housemates everywhere</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f7f8fb' },
  content: { padding: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 11, color: '#888', fontWeight: '700',
    letterSpacing: 0.6, marginTop: 16, marginBottom: 8, marginLeft: 4,
  },
  group: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#eceef3',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14,
  },
  rowIcon:  { fontSize: 20, marginRight: 12, width: 26, textAlign: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  rowSub:   { fontSize: 11, color: '#888', marginTop: 2 },
  rowArrow: { fontSize: 22, color: '#bbb', fontWeight: '300', marginLeft: 8 },
  divider:  { height: 1, backgroundColor: '#eceef3', marginLeft: 52 },

  footer:    { textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 24, fontWeight: '700' },
  footerSub: { textAlign: 'center', color: '#bbb', fontSize: 11, marginTop: 4 },
});
