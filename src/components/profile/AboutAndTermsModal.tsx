import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AboutAndTermsModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, Shadows.lg]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>About & Legal Terms</Text>
              <Text style={styles.modalSub}>Ethnikraft African Luxury Commerce</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#341B00" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.brandBox}>
              <View style={styles.logoBadge}>
                <Image
                  source={require('../../../assets/revamp/logo.jpg')}
                  style={styles.logoImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>
              <Text style={styles.brandTitle}>ETHNIKRAFT</Text>
              <Text style={styles.brandSub}>Version 1.0.0 (Production Build)</Text>
              <Text style={styles.brandDesc}>
                Ethnikraft is the premier African luxury marketplace and bespoke artisan network connecting global patrons with verified master craftsmen across West Africa and beyond.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>1. Free Membership Agreement</Text>
              <Text style={styles.bodyText}>
                By accessing Ethnikraft, you agree to fair patron engagement, authentic artisan compensation, and adherence to our community conduct standards.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>2. Artisan Authenticity Guarantee</Text>
              <Text style={styles.bodyText}>
                Every luxury item is certified authentic and handcrafted using indigenous African textiles, hand-spun silks, terracotta, reclaimed bronze, or sustainable timber.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>3. Privacy & Buyer Protection</Text>
              <Text style={styles.bodyText}>
                Your personal biometric, delivery, and payment records are protected with industry-standard bank-grade encryption and will never be shared without your explicit authorization.
              </Text>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.88}>
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 14, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7D9',
    paddingBottom: Spacing.sm + 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#341B00',
  },
  modalSub: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  brandBox: {
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E4DACB',
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#341B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 1.5,
    borderColor: '#C46C27',
  },
  logoImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#341B00',
    letterSpacing: 2,
  },
  brandSub: {
    fontSize: 11,
    color: '#8A7A68',
    marginTop: 2,
    marginBottom: 6,
  },
  brandDesc: {
    fontSize: Typography.fontSize.xs,
    color: '#662502',
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: 4,
  },
  bodyText: {
    fontSize: Typography.fontSize.xs,
    color: '#662502',
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});
