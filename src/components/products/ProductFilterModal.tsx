import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterState {
  category: string;
  pricePreset: string;
  minPrice?: number;
  maxPrice?: number;
  availability: 'all' | 'in_stock' | 'requestable';
  curation: string[];
}

interface ProductFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

const CATEGORIES = [
  { label: 'All', value: 'ALL' },
  { label: 'Wears', value: 'WEARS' },
  { label: 'Shoes', value: 'SHOES' },
  { label: 'Bags', value: 'BAGS' },
  { label: 'Accessories', value: 'ACCESSORIES' },
  { label: 'Crafts', value: 'CRAFTS' },
  { label: 'Paintings', value: 'PAINTINGS' },
  { label: 'Antiques', value: 'ANTIQUES' },
];

const PRICE_PRESETS = [
  { label: 'Any Price', value: 'all', min: undefined, max: undefined },
  { label: 'Under ₦25,000', value: 'under_25k', min: 0, max: 25000 },
  { label: '₦25k - ₦60,000', value: '25k_60k', min: 25000, max: 60000 },
  { label: '₦60k - ₦120,000', value: '60k_120k', min: 60000, max: 120000 },
  { label: 'Above ₦120,000', value: 'above_120k', min: 120000, max: undefined },
];

const CURATION_TAGS = [
  { id: 'isBestseller', label: 'Best Sellers' },
  { id: 'isNewArrival', label: 'New Arrivals' },
  { id: 'isOnDeals', label: 'On Deals' },
  { id: 'isClearanceSale', label: 'Clearance' },
  { id: 'isHeritagemaster', label: 'Heritage Masters' },
  { id: 'isWomenInCraft', label: 'Women in Craft' },
  { id: 'isMixedMediaInnovator', label: 'Mixed Media Innovators' },
];

export const ProductFilterModal: React.FC<ProductFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.category);
  const [selectedPricePreset, setSelectedPricePreset] = useState(currentFilters.pricePreset);
  const [selectedAvailability, setSelectedAvailability] = useState(currentFilters.availability);
  const [selectedCurations, setSelectedCurations] = useState<string[]>(currentFilters.curation);

  useEffect(() => {
    if (visible) {
      setSelectedCategory(currentFilters.category);
      setSelectedPricePreset(currentFilters.pricePreset);
      setSelectedAvailability(currentFilters.availability);
      setSelectedCurations(currentFilters.curation);
    }
  }, [visible, currentFilters]);

  const handleToggleCuration = (id: string) => {
    Haptics.selectionAsync();
    setSelectedCurations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory('ALL');
    setSelectedPricePreset('all');
    setSelectedAvailability('all');
    setSelectedCurations([]);
  };

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const preset = PRICE_PRESETS.find((p) => p.value === selectedPricePreset);
    onApply({
      category: selectedCategory,
      pricePreset: selectedPricePreset,
      minPrice: preset?.min,
      maxPrice: preset?.max,
      availability: selectedAvailability,
      curation: selectedCurations,
    });
    handleDismiss();
  };

  const activeFilterCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedPricePreset !== 'all' ? 1 : 0) +
    (selectedAvailability !== 'all' ? 1 : 0) +
    selectedCurations.length;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleDismiss}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Filters</Text>
              <Text style={styles.sheetSubtitle}>Refine luxury craft catalog</Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color="#1C0D05" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Section 1: Categories */}
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(cat.value);
                    }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, isActive && styles.chipTextActive]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Price Presets */}
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.chipsWrap}>
              {PRICE_PRESETS.map((preset) => {
                const isActive = selectedPricePreset === preset.value;
                return (
                  <TouchableOpacity
                    key={preset.value}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedPricePreset(preset.value);
                    }}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, isActive && styles.chipTextActive]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 3: Availability */}
            <Text style={styles.filterSectionTitle}>Availability</Text>
            <View style={styles.availabilityRow}>
              {[
                { id: 'all', label: 'All Items' },
                { id: 'in_stock', label: 'In Stock' },
                { id: 'requestable', label: 'Made-to-Order' },
              ].map((item) => {
                const isActive = selectedAvailability === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedAvailability(item.id as any);
                    }}
                    style={[
                      styles.availabilityPill,
                      isActive && styles.availabilityPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.availabilityText,
                        isActive && styles.availabilityTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 4: Curated Spotlights & Tags */}
            <Text style={styles.filterSectionTitle}>Curated Spotlights</Text>
            <View style={styles.chipsWrap}>
              {CURATION_TAGS.map((tag) => {
                const isActive = selectedCurations.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    activeOpacity={0.8}
                    onPress={() => handleToggleCuration(tag.id)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    {isActive && (
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color="#FFF"
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[styles.chipText, isActive && styles.chipTextActive]}
                    >
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Action Bar */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleReset}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleApply}
              style={styles.applyBtn}
            >
              <Text style={styles.applyBtnText}>
                Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 10, 3, 0.55)',
  },
  sheetContainer: {
    backgroundColor: '#FAF6F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    ...Shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE0D3',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: FontFamily.cormorantBold,
    color: '#1C0D05',
  },
  sheetSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    color: '#8C7765',
    marginTop: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE4D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#3D2817',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2D6C7',
  },
  chipActive: {
    backgroundColor: '#C46C27',
    borderColor: '#C46C27',
  },
  chipText: {
    fontSize: 11.5,
    fontFamily: FontFamily.poppinsMedium,
    color: '#4A3728',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  availabilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  availabilityPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2D6C7',
  },
  availabilityPillActive: {
    backgroundColor: '#3E2210',
    borderColor: '#3E2210',
  },
  availabilityText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: '#5C4A3A',
  },
  availabilityTextActive: {
    color: '#E8BA7A',
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#EBE0D3',
  },
  resetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#D4C4B2',
    backgroundColor: '#FFFFFF',
  },
  resetBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#5C4A3A',
  },
  applyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C46C27',
    paddingVertical: 12,
    borderRadius: Radius.full,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF5DE',
  },
});
