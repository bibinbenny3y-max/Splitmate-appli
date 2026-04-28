// App.js
// ---------------------------------------------------------------------------
// Root component. Sets up:
//   1. GestureHandlerRootView (required for Swipeable cards)
//   2. SafeAreaProvider (for proper notch/island handling)
//   3. Auth gate: LoginScreen if no auth, else MainTabs
//   4. A native-stack of pushable screens above the tabs - every pushed
//      screen gets a free iOS/Android back arrow from native-stack.
// ---------------------------------------------------------------------------

import 'react-native-gesture-handler'; // must be the first non-react import
import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen        from './screens/LoginScreen';
import HomeScreen         from './screens/HomeScreen';
import ExpensesScreen     from './screens/ExpensesScreen';
import AddExpenseScreen   from './screens/AddExpenseScreen';
import SettlementScreen   from './screens/SettlementScreen';
import PeopleScreen       from './screens/PeopleScreen';
import SettingsScreen     from './screens/SettingsScreen';
import HelpScreen         from './screens/HelpScreen';
import ProfileScreen      from './screens/ProfileScreen';
import EditProfileScreen  from './screens/EditProfileScreen';
import ActivityScreen     from './screens/ActivityScreen';
import StatisticsScreen   from './screens/StatisticsScreen';
import PersonDetailScreen from './screens/PersonDetailScreen';

import {
  loadAuthUser, saveAuthUser, clearAuthUser, seedIfNeeded,
} from './logic/storage';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const PURPLE = '#6c5ce7';

function HeaderIconButton({ name, onPress, color = '#fff' }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={styles.headerIconBtn}
      activeOpacity={0.7}
    >
      <Ionicons name={name} size={22} color={color} />
    </TouchableOpacity>
  );
}

// Bottom tabs - shown after login. Each tab has an Ionicons icon and a
// header-right Profile + Settings button so the user can reach those
// screens from anywhere in the tab graph.
function MainTabs({ user, onOpenProfile, onOpenSettings }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle:        { backgroundColor: PURPLE },
        headerTintColor:    '#fff',
        headerTitleStyle:   { fontWeight: '800' },
        headerRight: () => (
          <View style={{ flexDirection: 'row' }}>
            <HeaderIconButton name="person-circle-outline" onPress={onOpenProfile} />
            <HeaderIconButton name="settings-outline" onPress={onOpenSettings} />
          </View>
        ),
        tabBarActiveTintColor:   PURPLE,
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle:        { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const map = {
            Home:     focused ? 'home'         : 'home-outline',
            Expenses: focused ? 'list'         : 'list-outline',
            Settle:   focused ? 'git-network'  : 'git-network-outline',
            People:   focused ? 'people'       : 'people-outline',
          };
          return <Ionicons name={map[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" options={{ title: 'SplitMate' }}>
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen name="Expenses" component={ExpensesScreen}   options={{ title: 'Expenses' }} />
      <Tab.Screen name="Settle"   component={SettlementScreen} options={{ title: 'Settle Up' }} />
      <Tab.Screen name="People"   component={PeopleScreen}     options={{ title: 'Household' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const u = await loadAuthUser();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const handleLogin = useCallback(async (u) => {
    await saveAuthUser(u);
    setUser(u);
  }, []);

  const handleLogout = useCallback(async () => {
    await clearAuthUser();
    setUser(null);
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  const stackHeaderOptions = {
    headerStyle:      { backgroundColor: PURPLE },
    headerTintColor:  '#fff',
    headerTitleStyle: { fontWeight: '800' },
    headerBackTitleVisible: false,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={stackHeaderOptions}>
            {user ? (
              <>
                <Stack.Screen name="Main" options={{ headerShown: false }}>
                  {(props) => (
                    <MainTabs
                      {...props}
                      user={user}
                      onOpenProfile={() => props.navigation.navigate('Profile', { user })}
                      onOpenSettings={() =>
                        props.navigation.navigate('Settings', { onLogout: handleLogout })
                      }
                    />
                  )}
                </Stack.Screen>

                <Stack.Screen
                  name="AddExpense"
                  component={AddExpenseScreen}
                  options={{ title: 'Add Expense', presentation: 'modal' }}
                />
                <Stack.Screen name="Settings"     component={SettingsScreen}     options={{ title: 'Settings' }} />
                <Stack.Screen name="Help"         component={HelpScreen}         options={{ title: 'Help & Tips' }} />
                <Stack.Screen name="EditProfile"  component={EditProfileScreen}  options={{ title: 'Edit Profile' }} />
                <Stack.Screen name="Statistics"   component={StatisticsScreen}   options={{ title: 'Statistics' }} />
                <Stack.Screen name="PersonDetail" component={PersonDetailScreen} options={{ title: 'Member' }} />

                <Stack.Screen name="Profile" options={{ title: 'My Profile' }}>
                  {(props) => <ProfileScreen {...props} />}
                </Stack.Screen>

                <Stack.Screen name="Activity" options={{ title: 'Activity' }}>
                  {(props) => (
                    <ActivityScreen
                      {...props}
                      route={{ ...props.route, params: { ...(props.route.params || {}), user } }}
                    />
                  )}
                </Stack.Screen>
              </>
            ) : (
              <>
                <Stack.Screen name="Login" options={{ headerShown: false }}>
                  {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
                </Stack.Screen>
                <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Help & Tips' }} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f7f8fb',
  },
  headerIconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
});
