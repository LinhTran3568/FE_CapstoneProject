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
          paddingTop: 4,
          paddingBottom: 4,
          height: 58,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: fontFamilies.semibold,
          letterSpacing: 0,
          lineHeight: 11,
          marginTop: 1,
          marginBottom: 1,
        },
        tabBarIconStyle: { marginTop: 1 },
        tabBarItemStyle: { paddingVertical: 1 },
        tabBarAllowFontScaling: false,
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
            <Store size={18} color={color} strokeWidth={focused ? 2.2 : 1.7} />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell Ticket',
          headerTitle: 'Sell Ticket',
          tabBarIcon: ({ color, size, focused }) => (
            <ScanLine size={18} color={color} strokeWidth={focused ? 2.2 : 1.7} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'My Tickets',
          headerTitle: 'My Ticket Wallet',
          tabBarIcon: ({ color, size, focused }) => (
            <Ticket size={18} color={color} strokeWidth={focused ? 2.2 : 1.7} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerTitle: 'Orders & Escrow',
          tabBarIcon: ({ color, size, focused }) => (
            <ReceiptText size={18} color={color} strokeWidth={focused ? 2.2 : 1.7} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Account & Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <UserRound size={18} color={color} strokeWidth={focused ? 2.2 : 1.7} />
          ),
        }}
      />
    </Tabs>
  );
}
