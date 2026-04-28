// logic/storage.js
// ---------------------------------------------------------------------------
// All AsyncStorage interactions live here. A single keys map keeps usage
// consistent and makes it trivial to refactor or namespace later. Every
// helper falls back gracefully on parse errors so a corrupted key cannot
// brick the app.
// ---------------------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PEOPLE, DEFAULT_EXPENSES } from '../data/initialData';

const KEYS = {
  AUTH:      '@splitmate/auth',
  PEOPLE:    '@splitmate/people',
  EXPENSES:  '@splitmate/expenses',
  PREFS:     '@splitmate/prefs',
  SEEDED:    '@splitmate/seeded',
  PROFILES:  '@splitmate/profiles',
  ACTIVITY:  '@splitmate/activity',
};

async function getJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[storage] getJSON failed for', key, err);
    return fallback;
  }
}

async function setJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[storage] setJSON failed for', key, err);
  }
}

// ---- auth ---------------------------------------------------------------
export const loadAuthUser  = ()    => getJSON(KEYS.AUTH, null);
export const saveAuthUser  = (u)   => setJSON(KEYS.AUTH, u);
export const clearAuthUser = ()    => AsyncStorage.removeItem(KEYS.AUTH);

// ---- people -------------------------------------------------------------
export const loadPeople = () => getJSON(KEYS.PEOPLE, DEFAULT_PEOPLE);
export const savePeople = (p) => setJSON(KEYS.PEOPLE, p);

// ---- expenses -----------------------------------------------------------
export const loadExpenses = () => getJSON(KEYS.EXPENSES, DEFAULT_EXPENSES);
export const saveExpenses = (e) => setJSON(KEYS.EXPENSES, e);

// ---- prefs --------------------------------------------------------------
const DEFAULT_PREFS = {
  sortBy:         'date',   // 'date' | 'amount' | 'title'
  sortDir:        'desc',   // 'asc'  | 'desc'
  filterCategory: 'All',
  pageSize:       6,
};
export const loadPrefs = () => getJSON(KEYS.PREFS, DEFAULT_PREFS);
export const savePrefs = (p) => setJSON(KEYS.PREFS, p);

// ---- profiles -----------------------------------------------------------
// Per-user editable profile data (overrides the demo display name, lets
// the user change their accent colour, phone, bio etc.). Keyed by the
// person id from data/initialData.js. Falls back to defaults derived from
// the people record so the UI never has to handle a missing profile.
const DEFAULT_PROFILE_FIELDS = {
  displayName: '',
  color:       '#6c5ce7',
  email:       '',
  phone:       '',
  bio:         '',
  joinedAt:    null,
};

export async function loadProfile(userId) {
  const all = await getJSON(KEYS.PROFILES, {});
  return all[userId] || null;
}

export async function loadAllProfiles() {
  return getJSON(KEYS.PROFILES, {});
}

export async function saveProfile(userId, profile) {
  const all = await getJSON(KEYS.PROFILES, {});
  all[userId] = { ...DEFAULT_PROFILE_FIELDS, ...all[userId], ...profile };
  await setJSON(KEYS.PROFILES, all);
  return all[userId];
}

// ---- activity log -------------------------------------------------------
// Append-only timeline of events: expense added/edited/deleted, person
// settled, etc. Capped at 200 entries (newest first) to bound storage size.
const ACTIVITY_CAP = 200;

export async function logActivity(entry) {
  const list = await getJSON(KEYS.ACTIVITY, []);
  const now = Date.now();
  const next = [{ id: `act_${now}`, timestamp: now, ...entry }, ...list].slice(0, ACTIVITY_CAP);
  await setJSON(KEYS.ACTIVITY, next);
}

export const loadActivity  = () => getJSON(KEYS.ACTIVITY, []);
export const clearActivity = () => setJSON(KEYS.ACTIVITY, []);

// ---- one-shot seed ------------------------------------------------------
// On the very first launch we write the seed data through. After that the
// flag prevents re-seeding so the user's edits survive across reloads.
export async function seedIfNeeded() {
  const seeded = await getJSON(KEYS.SEEDED, false);
  if (!seeded) {
    await setJSON(KEYS.PEOPLE,   DEFAULT_PEOPLE);
    await setJSON(KEYS.EXPENSES, DEFAULT_EXPENSES);
    await setJSON(KEYS.SEEDED,   true);
  }
}

// Wipe everything (used by Settings -> "Reset demo data" button).
export async function resetAllData() {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (err) {
    console.warn('[storage] resetAllData failed', err);
  }
}
