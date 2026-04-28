// screens/LoginScreen.js
// ---------------------------------------------------------------------------
// Pre-built login. Brief explicitly forbids sign-up flow and requires
// credentials to be visible on the screen they're used on - so the demo
// accounts render as tappable cards that auto-fill the form. Three icon
// buttons in the top corner (help, info, eye-toggle for password) and a
// version string at the bottom give the screen a polished, real-app feel.
// ---------------------------------------------------------------------------

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_ACCOUNTS, findAccount } from '../auth/credentials';
import Avatar from '../components/Avatar';

const APP_VERSION = '1.0.0';

export default function LoginScreen({ navigation, onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1,  duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1,  duration: 60, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = () => {
    const acc = findAccount(email, password);
    if (!acc) {
      setError('Wrong email or password.');
      shake();
      return;
    }
    setError('');
    onLogin?.({ id: acc.id, email: acc.email, displayName: acc.displayName });
  };

  const fillFromAccount = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  const showAbout = () => {
    Alert.alert(
      'About SplitMate',
      `Version ${APP_VERSION}\n\nA household expense settler. Tracks who paid for what, then computes the minimum number of payments needed to settle every debt.\n\nBuilt with React Native, AsyncStorage, and a greedy minimum-cash-flow algorithm.`,
      [{ text: 'Close' }],
    );
  };

  const translateX = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top-corner icon row */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topIcon}
          onPress={() => navigation.navigate('Help')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topIcon}
          onPress={showAbout}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="wallet" size={36} color="#fff" />
          </View>
          <Text style={styles.logoText}>SplitMate</Text>
          <Text style={styles.tagline}>settle the household, simply</Text>
        </View>

        {/* Form */}
        <Animated.View style={[styles.card, { transform: [{ translateX }] }]}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@splitmate.demo"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="password123"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
            />
            <TouchableOpacity
              onPress={() => setShowPwd((v) => !v)}
              style={styles.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#b8312f" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.btn} onPress={handleLogin} activeOpacity={0.85}>
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Demo accounts (per the brief - credentials must be visible on screen) */}
        <View style={styles.demoBlock}>
          <View style={styles.demoHeaderRow}>
            <Ionicons name="key-outline" size={14} color="#fff" />
            <Text style={styles.demoHeading}>Demo accounts (tap to fill)</Text>
          </View>

          {DEMO_ACCOUNTS.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              style={styles.demoCard}
              onPress={() => fillFromAccount(acc)}
              activeOpacity={0.85}
            >
              <Avatar name={acc.displayName} color="#6c5ce7" size={36} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.demoName}>{acc.displayName}</Text>
                <Text style={styles.demoEmail}>{acc.email}</Text>
              </View>
              <View style={styles.demoPwdPill}>
                <Ionicons name="key-outline" size={11} color="#6c5ce7" />
                <Text style={styles.demoPwd}>{acc.password}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.demoNote}>
            No registration is supported — these are the only valid logins.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>SplitMate v{APP_VERSION}</Text>
          <Text style={styles.footerLine}>Mobile Computing · Final Submission</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#6c5ce7' },
  scroll: { padding: 24, paddingTop: 60, paddingBottom: 40 },

  topBar: {
    position: 'absolute', top: 36, right: 16,
    flexDirection: 'row', zIndex: 10,
  },
  topIcon: { padding: 8, marginLeft: 4 },

  brand:    { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  tagline:  { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  label: { fontSize: 11, fontWeight: '700', color: '#666', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#dcdde6', borderRadius: 10,
    paddingHorizontal: 10, marginTop: 4,
  },
  inputIcon: { marginRight: 6 },
  input:     { flex: 1, padding: 12, fontSize: 14, color: '#222' },
  eyeBtn:    { padding: 4 },

  errorRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    backgroundColor: '#fde8e8', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
  },
  errorText: { color: '#b8312f', fontSize: 12, fontWeight: '600', marginLeft: 4 },

  btn: {
    flexDirection: 'row',
    backgroundColor: '#6c5ce7', borderRadius: 10,
    padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 6 },

  demoBlock: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14, padding: 14,
  },
  demoHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  demoHeading:   { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 12 },
  demoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    padding: 10, marginBottom: 8,
  },
  demoName:  { fontWeight: '700', color: '#1a1a2e', fontSize: 14 },
  demoEmail: { color: '#666', fontSize: 12, marginTop: 2 },
  demoPwdPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f1efff',
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999,
  },
  demoPwd:   { color: '#6c5ce7', fontWeight: '700', fontSize: 11, marginLeft: 4 },
  demoNote:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 4, textAlign: 'center' },

  footer:        { alignItems: 'center', marginTop: 24 },
  footerVersion: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
  footerLine:    { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 2 },
});
