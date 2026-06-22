import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import NutritionScreen from '../screens/NutritionScreen';
import MetricsScreen from '../screens/MetricsScreen';
import AICoachScreen from '../screens/AICoachScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigation
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#00F5FF', // Neon Cyan
        tabBarInactiveTintColor: '#666666',
        safeAreaInsets: Platform.OS === 'web' ? { bottom: 0, top: 0, left: 0, right: 0 } : undefined,
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopWidth: 1,
          borderTopColor: '#2C2C2C',
          height: Platform.OS === 'web' ? 68 : 85,
          paddingBottom: Platform.OS === 'web' ? 8 : 26,
          paddingTop: Platform.OS === 'web' ? 8 : 10,
          overflow: Platform.OS === 'web' ? 'visible' : 'hidden',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          paddingBottom: Platform.OS === 'web' ? 3 : 0,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size - 2} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="Workouts" 
        component={WorkoutScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="Nutrition" 
        component={NutritionScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size - 2} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="Metrics" 
        component={MetricsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scale-outline" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="AICoach" 
        component={AICoachScreen} 
        options={{
          title: "AI Coach",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size - 2} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
}

// Root Navigation Switcher
export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null; // Let the caller render a global spinner
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        // Authenticated Stack
        <Stack.Screen name="MainApp" component={AppTabs} />
      ) : (
        // Non-Authenticated Stack
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
