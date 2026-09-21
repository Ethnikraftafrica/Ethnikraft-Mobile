import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.primaryDark,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Create Account',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="otp-verify"
        options={{
          title: 'Verify Code',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Forgot Password',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="vendor-business-info"
        options={{
          title: 'Workshop Details',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="vendor-documents"
        options={{
          title: 'Workshop Verification',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="pending-approval"
        options={{
          title: 'Account Pending Approval',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
