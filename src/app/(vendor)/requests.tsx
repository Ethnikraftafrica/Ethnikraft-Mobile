import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';

export default function VendorRequestsScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  const requests = [
    {
      id: 'REQ-8821',
      customer: 'Dr. Folake Balogun',
      location: 'Ikoyi, Lagos, Nigeria',
      title: 'Custom Beaded Royal Velvet Agbada Ensemble',
      budget: 280000,
      deadline: 'Needed in 14 days',
      materials: 'Burgundy Velvet, Gold Beads, Aso-Oke Accents',
    },
    {
      id: 'REQ-8824',
      customer: 'Adewale Adeleke',
      location: 'Victoria Island, Lagos',
      title: 'Hand-Carved Seasoned Mahogany Benin Leopard Mask',
      budget: 195000,
      deadline: 'Needed in 8 days',
      materials: 'Seasoned Mahogany & Hand-Hammered Brass',
    },
    {
      id: 'REQ-8830',
      customer: 'Kofi Mensah',
      location: 'Accra, Ghana (Global Shipping)',
      title: 'Bespoke Hand-Tooled Fulani Leather Travel Duffle',
      budget: 145000,
      deadline: 'Needed in 20 days',
      materials: 'Vegetable-Tanned Full-Grain Cowhide',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>Open Commission Briefs</Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>
          Patrons seeking master craftsmanship. Tap below to inspect specifications and submit bids directly in the Atelier Studio.
        </Text>
      </View>

      {requests.map((item) => (
        <View
          key={item.id}
          style={[
            styles.requestCard,
            {
              backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
              borderColor: isDark ? 'rgba(209, 153, 90, 0.22)' : 'rgba(196, 108, 39, 0.14)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.reqId, { color: theme.primary }]}>{item.id}</Text>
            <View style={[styles.badge, { backgroundColor: isDark ? '#361300' : '#FEF3C7' }]}>
              <Text style={[styles.badgeText, { color: isDark ? '#FFD79E' : '#92400E' }]}>{item.deadline}</Text>
            </View>
          </View>
          <Text style={[styles.reqTitle, { color: theme.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.reqCustomer, { color: theme.textMuted }]}>
            Client: <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.poppinsBold }}>{item.customer}</Text> • {item.location}
          </Text>
          <Text style={[styles.reqMaterials, { color: theme.textSecondary }]}>
            Materials: {item.materials}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          <View style={styles.cardFooter}>
            <View>
              <Text style={[styles.budgetLabel, { color: theme.textMuted }]}>TARGET BUDGET</Text>
              <Text style={[styles.budgetValue, { color: theme.primary }]}>
                {formatPrice(item.budget, currencyCode, exchangeRate)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(vendor)/studio' as any);
              }}
              style={[styles.bidBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Ionicons name="hammer" size={15} color="#FFFFFF" style={styles.btnIcon} />
              <Text style={styles.bidBtnText}>Open in Studio</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  headerBlock: {
    marginBottom: Spacing.md,
  },
  heading: {
    fontFamily: FontFamily.cormorantBold,
    fontSize: 20,
  },
  subheading: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  requestCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  reqId: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 10,
  },
  reqTitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 15,
    marginBottom: 4,
  },
  reqCustomer: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    marginBottom: 2,
  },
  reqMaterials: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  budgetValue: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
    marginTop: 1,
  },
  bidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  btnIcon: {
    marginRight: 6,
  },
  bidBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
  },
});
