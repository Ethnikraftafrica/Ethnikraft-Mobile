import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Radius, Shadows, Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface BrandStoryModalProps {
  visible: boolean;
  onClose: () => void;
}

const ARTISAN_STORIES = [
  {
    id: 'kwame',
    name: 'Master Kwame Mensah',
    location: 'Kumasi, Ghana',
    craft: 'Royal Kente & Handloom Weaving',
    image: require('../../../assets/revamp/ready-to-wear.webp'),
    quote:
      'Every pattern tells the history of our ancestors. We don’t just weave thread; we weave memory, dignity, and legacy.',
    experience: '35+ Years Experience',
  },
  {
    id: 'babatunde',
    name: 'Babatunde & Folake Ogunlesi',
    location: 'Oyo, Nigeria',
    craft: 'Traditional Leathercraft & Beadwork',
    image: require('../../../assets/revamp/accessories-card.webp'),
    quote:
      'Handcrafted leatherwork carries a soul that machine factory goods can never imitate. Each piece is one-of-a-kind.',
    experience: 'Heritage Guild Family',
  },
  {
    id: 'amina',
    name: 'Amina Kinteh',
    location: 'Nairobi & Lamu, Kenya',
    craft: 'Terracotta Sculpture & Ceramic Art',
    image: require('../../../assets/revamp/crafts-card.webp'),
    quote:
      'Clay links us directly to the soil of Africa. When you hold our pottery, you hold a fragment of our sacred earth.',
    experience: 'Master Sculptor',
  },
];

export const BrandStoryModal: React.FC<BrandStoryModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'artisans' | 'mission'>('video');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState(ARTISAN_STORIES[0]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlayingPreview(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={[styles.dialogCard, Shadows.lg]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="sparkles" size={16} color="#E8BA7A" />
              <Text style={styles.headerTag}>OUR STORY & LEGACY</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color="#FFF5DE" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('video');
              }}
              style={[styles.tabItem, activeTab === 'video' && styles.tabItemActive]}
            >
              <Ionicons
                name="videocam-outline"
                size={14}
                color={activeTab === 'video' ? '#FFF' : '#C4B5A5'}
              />
              <Text
                style={[styles.tabText, activeTab === 'video' && styles.tabTextActive]}
              >
                Film Trailer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('artisans');
              }}
              style={[styles.tabItem, activeTab === 'artisans' && styles.tabItemActive]}
            >
              <Ionicons
                name="people-outline"
                size={14}
                color={activeTab === 'artisans' ? '#FFF' : '#C4B5A5'}
              />
              <Text
                style={[styles.tabText, activeTab === 'artisans' && styles.tabTextActive]}
              >
                Artisans
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('mission');
              }}
              style={[styles.tabItem, activeTab === 'mission' && styles.tabItemActive]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={activeTab === 'mission' ? '#FFF' : '#C4B5A5'}
              />
              <Text
                style={[styles.tabText, activeTab === 'mission' && styles.tabTextActive]}
              >
                Our Mission
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'video' && (
              <View style={styles.videoSection}>
                <View style={styles.mediaPoster}>
                  <Image
                    source={require('../../../assets/revamp/main-background.webp')}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <View style={styles.posterOverlay} />
                  
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setIsPlayingPreview(!isPlayingPreview);
                    }}
                    style={styles.playButtonPill}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isPlayingPreview ? 'pause' : 'play'}
                      size={20}
                      color="#FFF"
                      style={{ marginLeft: isPlayingPreview ? 0 : 3 }}
                    />
                  </TouchableOpacity>

                  <View style={styles.posterFooter}>
                    <Text style={styles.posterLabel}>DOCUMENTARY TRAILER</Text>
                    <Text style={styles.posterTitle}>
                      Ethnikraft: The Hands That Shape Africa
                    </Text>
                  </View>
                </View>

                <Text style={styles.storyParagraph}>
                  Spanning 14 craft guilds across Nigeria, Ghana, Kenya, and Senegal,
                  Ethnikraft bridges ancestral workshops with international patrons who
                  value authentic provenance, timeless design, and fair economic prosperity.
                </Text>
              </View>
            )}

            {activeTab === 'artisans' && (
              <View style={styles.artisanSection}>
                <View style={styles.artisanPillsRow}>
                  {ARTISAN_STORIES.map((a) => {
                    const isSelected = selectedArtisan.id === a.id;
                    return (
                      <TouchableOpacity
                        key={a.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedArtisan(a);
                        }}
                        style={[
                          styles.artisanChip,
                          isSelected && styles.artisanChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.artisanChipText,
                            isSelected && styles.artisanChipTextSelected,
                          ]}
                        >
                          {a.name.split(' ')[1] || a.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.artisanCard}>
                  <Image
                    source={selectedArtisan.image}
                    style={styles.artisanAvatar}
                    contentFit="cover"
                  />
                  <Text style={styles.artisanName}>{selectedArtisan.name}</Text>
                  <View style={styles.artisanLocRow}>
                    <Ionicons name="location-outline" size={13} color="#D96225" />
                    <Text style={styles.artisanLoc}>{selectedArtisan.location}</Text>
                  </View>
                  <Text style={styles.artisanCraft}>{selectedArtisan.craft}</Text>
                  <Text style={styles.artisanQuote}>
                    &ldquo;{selectedArtisan.quote}&rdquo;
                  </Text>
                  <View style={styles.experienceBadge}>
                    <Text style={styles.experienceText}>
                      {selectedArtisan.experience}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'mission' && (
              <View style={styles.missionSection}>
                <View style={styles.missionCard}>
                  <Ionicons name="sparkles" size={24} color="#C46C27" />
                  <Text style={styles.missionTitle}>Ancestral Provenance</Text>
                  <Text style={styles.missionText}>
                    Every piece is certified authentic, handmade using heritage techniques passed down through generations.
                  </Text>
                </View>

                <View style={styles.missionCard}>
                  <Ionicons name="wallet-outline" size={24} color="#C46C27" />
                  <Text style={styles.missionTitle}>Fair Artisan Trade</Text>
                  <Text style={styles.missionText}>
                    Over 80% of earnings flow directly into the pockets of the master artisans and their local apprentices.
                  </Text>
                </View>

                <View style={styles.missionCard}>
                  <Ionicons name="globe-outline" size={24} color="#C46C27" />
                  <Text style={styles.missionTitle}>Global African Luxury</Text>
                  <Text style={styles.missionText}>
                    Redefining luxury through the lens of African craftsmanship, sustainable materials, and timeless dignity.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  dialogCard: {
    width: '100%',
    maxHeight: height * 0.84,
    backgroundColor: '#27160B',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E8BA7A',
    letterSpacing: 1.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    borderRadius: Radius.full,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: '#C46C27',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D8C7B8',
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.md,
  },
  videoSection: {},
  mediaPoster: {
    height: 180,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  posterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  playButtonPill: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#C46C27',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  posterFooter: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  posterLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#E8BA7A',
    letterSpacing: 1,
  },
  posterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF5DE',
    marginTop: 2,
  },
  storyParagraph: {
    fontSize: 12,
    lineHeight: 19,
    color: '#E0D0BF',
  },
  artisanSection: {},
  artisanPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  artisanChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  artisanChipSelected: {
    backgroundColor: '#C46C27',
    borderColor: '#C46C27',
  },
  artisanChipText: {
    fontSize: 11,
    color: '#E0D0BF',
    fontWeight: '600',
  },
  artisanChipTextSelected: {
    color: '#FFF',
    fontWeight: '800',
  },
  artisanCard: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  artisanAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: '#C46C27',
  },
  artisanName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF5DE',
  },
  artisanLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  artisanLoc: {
    fontSize: 11,
    color: '#D8C7B8',
  },
  artisanCraft: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8BA7A',
    marginTop: 4,
  },
  artisanQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#E0D0BF',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  experienceBadge: {
    marginTop: Spacing.md,
    backgroundColor: '#3E2210',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#60381B',
  },
  experienceText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E8BA7A',
  },
  missionSection: {
    gap: Spacing.sm,
  },
  missionCard: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF5DE',
    marginTop: 6,
    marginBottom: 4,
  },
  missionText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#D8C7B8',
  },
});
