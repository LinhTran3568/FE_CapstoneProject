import React from 'react';
import { Tabs } from 'expo-router';
import { ReceiptText, ScanLine, Store, Ticket, UserRound } from 'lucide-react-native';
import { theme, fontFamilies } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="marketplace"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: theme.typography.sizes.xs,
          fontFamily: fontFamilies.semibold,
          letterSpacing: 0.3,
          marginBottom: 6,
        },
        tabBarHideOnKeyboard: true,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: fontFamilies.bold,
          fontSize: theme.typography.sizes.lg,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Store size={size || 22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell Ticket',
          headerTitle: 'Sell Ticket',
          tabBarIcon: ({ color, size, focused }) => (
            <ScanLine size={size || 22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'My Tickets',
          headerTitle: 'My Ticket Wallet',
          tabBarIcon: ({ color, size, focused }) => (
            <Ticket size={size || 22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerTitle: 'Orders & Escrow',
          tabBarIcon: ({ color, size, focused }) => (
            <ReceiptText size={size || 22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Account & Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <UserRound size={size || 22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
