import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSelector } from '@/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPromptModal } from './AuthPromptModal';
import { Radius, Shadows, Spacing } from '@/constants/theme';

export const WebParityHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currency, setCurrency] = useState('NGN');

  const handleProtectedAction = (target: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isAuthenticated) {
      router.push(target as any);
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Left: Brand Identity */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => router.push('/(user)')}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../../assets/revamp/logo.jpg')}
            style={styles.logoImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.brandTextCol}>
            <Text style={styles.brandName}>Ethnikraft</Text>
            <Text style={styles.brandTagline}>HERITAGE • CRAFT • LUXURY</Text>
          </View>
        </TouchableOpacity>

        {/* Right: Actions Island */}
        <View style={styles.actionsIsland}>
          {/* Country Flag Pill */}
          <TouchableOpacity
            style={styles.glassPill}
            onPress={() => {
              Haptics.selectionAsync();
              setCurrency(currency === 'NGN' ? 'USD' : 'NGN');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.flagEmoji}>🇳🇬</Text>
            <Ionicons name="chevron-down" size={10} color="#FFF5DE" style={{ opacity: 0.8 }} />
          </TouchableOpacity>

          {/* Search Glass Button */}
          <TouchableOpacity
            style={styles.glassPillRound}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(user)/explore');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={15} color="#FFF5DE" />
          </TouchableOpacity>

          {/* Account / Sign In Pill */}
          {!isAuthenticated ? (
            <TouchableOpacity
              style={styles.signInPill}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(auth)/login');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.glassPillRound}
              onPress={() => router.push('/(user)/profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={14} color="#FFF5DE" />
            </TouchableOpacity>
          )}

          {/* Combined Favorites & Cart Pill */}
          <View style={styles.combinedPill}>
            <TouchableOpacity
              onPress={() => handleProtectedAction('/(user)/orders')}
              style={styles.subIconBtn}
              activeOpacity={0.75}
            >
              <Ionicons name="heart-outline" size={16} color="#FFF5DE" />
            </TouchableOpacity>
            <View style={styles.pillDivider} />
            <TouchableOpacity
              onPress={() => handleProtectedAction('/(user)/orders')}
              style={styles.subIconBtn}
              activeOpacity={0.75}
            >
              <Ionicons name="cart-outline" size={16} color="#FFF5DE" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <AuthPromptModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm + 2,
    zIndex: 30,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF7E8',
    letterSpacing: 0.2,
  },
  brandTagline: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#E8BA7A',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  actionsIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 3,
  },
  flagEmoji: {
    fontSize: 13,
  },
  glassPillRound: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInPill: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  signInText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF5DE',
  },
  combinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.full,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  subIconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pillDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
