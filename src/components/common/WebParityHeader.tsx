import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSelector } from '@/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPromptModal } from './AuthPromptModal';
import { CurrencyPickerModal } from './CurrencyPickerModal';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';

export const WebParityHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const activeCurrency = useAppSelector((state) => state.currency);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

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
            <Text style={styles.brandName} numberOfLines={1}>
              Ethnikraft
            </Text>
            <Text style={styles.brandTagline} numberOfLines={1}>
              HERITAGE • CRAFT • LUXURY
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right: Actions Island */}
        <View style={styles.actionsIsland}>
          {/* Country Flag Pill */}
          <TouchableOpacity
            style={styles.glassPill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCurrencyModal(true);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Switch currency"
          >
            <Text style={styles.flagEmoji}>{activeCurrency.flag}</Text>
            <Ionicons name="chevron-down" size={10} color="#FFF5DE" style={{ opacity: 0.8 }} />
          </TouchableOpacity>

          {/* Search Glass Button */}
          <TouchableOpacity
            style={styles.glassPillRound}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/(user)/explore',
                params: { autoFocus: '1' },
              });
            }}
            activeOpacity={0.8}
            accessibilityLabel="Search products"
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleProtectedAction('/(user)/explore');
              }}
              style={styles.subIconBtn}
              activeOpacity={0.75}
              accessibilityLabel="Favorites"
            >
              <Ionicons name="heart" size={15} color="#FFF5DE" />
            </TouchableOpacity>
            <View style={styles.pillDivider} />
            <TouchableOpacity
              onPress={() => handleProtectedAction('/(user)/orders')}
              style={styles.subIconBtn}
              activeOpacity={0.75}
              accessibilityLabel="Cart and Orders"
            >
              <Ionicons name="cart-outline" size={15} color="#FFF5DE" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <AuthPromptModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <CurrencyPickerModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm + 4,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm + 2,
    zIndex: 30,
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    marginRight: 8,
  },
  logoImage: {
    width: 33,
    height: 33,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  brandTextCol: {
    justifyContent: 'center',
    maxWidth: 130,
  },
  brandName: {
    fontSize: 17,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF7E8',
    letterSpacing: 0.2,
  },
  brandTagline: {
    fontSize: 6.2,
    fontFamily: FontFamily.poppinsBold,
    color: '#E8BA7A',
    letterSpacing: 0.5,
    marginTop: 0.5,
  },
  actionsIsland: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 5,
    gap: 2,
  },
  flagEmoji: {
    fontSize: 12,
  },
  glassPillRound: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInPill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  signInText: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#FFF5DE',
  },
  combinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: Radius.full,
    paddingHorizontal: 3,
    paddingVertical: 3,
    marginRight: 2,
  },
  subIconBtn: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
