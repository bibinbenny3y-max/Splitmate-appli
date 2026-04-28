// screens/EditProfileScreen.js
// ---------------------------------------------------------------------------
// Edit form for the logged-in user's profile. Displays a colour swatch
// picker, text inputs, validation, and a Save button. Persists through
// saveProfile() in storage.js. The profile is keyed by user id, so the
// edits survive sign-out/sign-in.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveProfile, loadPeople, savePeople } from '../logic/storage';
import Avatar from '../components/Avatar';

// Curated palette - matches the people seed colours plus a few more.
const COLOURS = [
  '#6c5ce7', '#00b894', '#e17055', '#fdcb6e',
  '#0984e3', '#d63031', '#a29bfe', '#00cec9',
  '#fd79a8', '#636e72',
];

export default function EditProfileScreen({ navigation, route }) {
  const user    = route?.params?.user;
  const initial = route?.params?.profile || {};

  const [displayName, setDisplayName] = useState(initial.displayName || '');
  const [color,       setColor]       = useState(initial.color || '#6c5ce7');
  const [email,       setEmail]       = useState(initial.email || '');
  const [phone,       setPhone]       = useState(initial.phone || '');
  const [bio,         setBio]         = useState(initial.bio || '');
  const [errors,      setErrors]      = useState({});

  const validate = () => {
    const e = {};
    if (!displayName.trim()) e.displayName = 'Required';
    if (displayName.length > 30) e.displayName = 'Max 30 characters';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = 'Looks invalid';
    if (phone && phone.length > 20) e.phone = 'Too long';
    if (bio.length > 120) e.bio = 'Max 120 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const patch = {
      displayName: displayName.trim(),
      color,
      email: email.trim(),
      phone: phone.trim(),
      bio:   bio.trim(),
      joinedAt: initial.joinedAt || Date.now(),
    };

    await saveProfile(user.id, patch);

    // Mirror name/colour into the people record so the rest of the app
    // (BalanceTile, ExpenseCard payer, PeopleScreen) reflects the change.
    const people = await loadPeople();
    const next = people.map((p) =>
      p.id === user.id ? { ...p, name: patch.displayName, color: patch.color } : p,
    );
    await savePeople(next);

    Alert.alert('Saved', 'Your profile has been updated.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f7f8fb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Live preview */}
        <View style={[styles.preview, { backgroundColor: color }]}>
          <Avatar name={displayName || 'A'} color="rgba(255,255,255,0.25)" size={64} ring />
          <Text style={styles.previewName}>{displayName || 'Your name'}</Text>
          <Text style={styles.previewEmail}>{email || 'your@email.com'}</Text>
        </View>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={[styles.input, errors.displayName && styles.inputErr]}
          placeholder="How others see you"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={30}
        />
        {errors.displayName ? <Text style={styles.err}>{errors.displayName}</Text> : null}
        <Text style={styles.hint}>{displayName.length}/30</Text>

        <Text style={styles.label}>Accent colour</Text>
        <View style={styles.swatchRow}>
          {COLOURS.map((c) => {
            const active = c === color;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  active && styles.swatchActive,
                ]}
                activeOpacity={0.85}
              >
                {active && <Ionicons name="checkmark" size={18} color="#fff" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputErr]}
          placeholder="you@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {errors.email ? <Text style={styles.err}>{errors.email}</Text> : null}

        <Text style={styles.label}>Phone (optional)</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputErr]}
          placeholder="+44 7..."
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        {errors.phone ? <Text style={styles.err}>{errors.phone}</Text> : null}

        <Text style={styles.label}>Bio (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }, errors.bio && styles.inputErr]}
          placeholder="A short note about you…"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={120}
        />
        {errors.bio ? <Text style={styles.err}>{errors.bio}</Text> : null}
        <Text style={styles.hint}>{bio.length}/120</Text>

        <TouchableOpacity style={styles.btn} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Save changes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.btnOutlineText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },

  preview: {
    borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 16,
  },
  previewName:  { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 10 },
  previewEmail: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  label: { fontSize: 12, fontWeight: '700', color: '#444', marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#dcdde6',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#222',
  },
  inputErr: { borderColor: '#b8312f' },
  err:   { color: '#b8312f', fontSize: 11, marginTop: 4, fontWeight: '600' },
  hint:  { color: '#aaa', fontSize: 10, textAlign: 'right', marginTop: 4 },

  swatchRow: {
    flexDirection: 'row', flexWrap: 'wrap', marginTop: 4,
  },
  swatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginBottom: 10,
  },
  swatchActive: {
    borderWidth: 3, borderColor: '#1a1a2e',
  },

  btn: {
    flexDirection: 'row',
    backgroundColor: '#6c5ce7', borderRadius: 10,
    padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 6 },

  btnOutline: {
    borderWidth: 1, borderColor: '#dcdde6', borderRadius: 10,
    padding: 13, alignItems: 'center', marginTop: 8,
  },
  btnOutlineText: { color: '#666', fontSize: 14, fontWeight: '600' },
});
