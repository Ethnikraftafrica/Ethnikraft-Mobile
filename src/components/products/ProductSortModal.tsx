import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';

export type SortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'rating';

interface ProductSortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: SortOption;
  onSelectSort: (option: SortOption) => void;
}

const SORT_OPTIONS: { id: SortOption; label: string; desc: string }[] = [
  { id: 'relevance', label: 'Relevance', desc: 'Curated editorial priority' },
  { id: 'price_asc', label: 'Price: Low to High', desc: 'Most affordable first' },
  { id: 'price_desc', label: 'Price: High to Low', desc: 'Premium luxury first' },
  { id: 'newest', label: 'Newest Arrivals', desc: 'Fresh from the workshop' },
  { id: 'rating', label: 'Highest Rated', desc: 'Artisan guild masterpieces' },
];

export const ProductSortModal: React.FC<ProductSortModalProps> = ({
  visible,
  onClose,
  selectedSort,
  onSelectSort,
}) => {
  const handleSelect = (option: SortOption) => {
    Haptics.selectionAsync();
    onSelectSort(option);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Sort Collection</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#1C0D05" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsList}>
            {SORT_OPTIONS.map((item) => {
              const isActive = selectedSort === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(item.id)}
                  style={[styles.sortRow, isActive && styles.sortRowActive]}
                >
                  <View style={styles.sortTextCol}>
                    <Text
                      style={[styles.sortLabel, isActive && styles.sortLabelActive]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.sortDesc}>{item.desc}</Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isActive && styles.radioCircleActive,
                    ]}
                  >
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 10, 3, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FAF6F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 10,
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
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    color: '#1C0D05',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE4D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsList: {
    paddingTop: Spacing.xs,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
  },
  sortRowActive: {
    backgroundColor: '#F5ECE1',
  },
  sortTextCol: {
    flex: 1,
  },
  sortLabel: {
    fontSize: 13.5,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#3D2817',
  },
  sortLabelActive: {
    color: '#C46C27',
  },
  sortDesc: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsRegular,
    color: '#8C7765',
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C7B7A4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioCircleActive: {
    borderColor: '#C46C27',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C46C27',
  },
});
