import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Spacing } from '@/constants/theme';

export default function UserTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.primaryDark,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          letterSpacing: 0.3,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          ...Shadows.navBar,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ethnikraft',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIconContainer focused={focused} name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore Craft',
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabIconContainer focused={focused} name={focused ? 'grid' : 'grid-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: 'Custom Studio',
          tabBarLabel: 'Studio',
          tabBarIcon: ({ color, focused }) => (
            <TabIconContainer focused={focused} name={focused ? 'sparkles' : 'sparkles-outline'} color={color} isHighlight />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <TabIconContainer focused={focused} name={focused ? 'receipt' : 'receipt-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Account',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIconContainer focused={focused} name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIconContainer({
  name,
  color,
  focused,
  isHighlight,
}: {
  name: any;
  color: any;
  focused: boolean;
  isHighlight?: boolean;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons name={name} size={21} color={isHighlight && focused ? Colors.primaryLight : color} />
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 28,
  },
  iconWrapperActive: {
    transform: [{ scale: 1.05 }],
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});
