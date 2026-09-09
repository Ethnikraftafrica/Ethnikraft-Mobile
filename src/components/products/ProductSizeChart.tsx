import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius } from '@/constants/theme';
import { Product } from '@/store/api/productApi';

export type CategoryType =
  | 'wears'
  | 'shoes'
  | 'painting'
  | 'crafts'
  | 'antiques'
  | 'generic';

export function detectCategory(product: Partial<Product>): CategoryType {
  const raw = (
    product?.productCategory ??
    product?.details?.accessoryType ??
    product?.details?.subCategory ??
    ''
  )
    .toString()
    .toUpperCase()
    .trim();

  if (['SHOES', 'FOOTWEAR', 'SNEAKERS', 'SANDALS', 'BOOTS', 'SLIPPERS'].some((c) => raw.includes(c))) {
    return 'shoes';
  }
  if (['PAINTING', 'ART', 'ARTWORK', 'CANVAS', 'PRINT'].some((c) => raw.includes(c))) {
    return 'painting';
  }
  if (['CRAFT', 'CRAFTS', 'HANDMADE', 'BEAD', 'JEWELRY', 'JEWELLERY', 'ACCESSORIES'].some((c) => raw.includes(c))) {
    return 'crafts';
  }
  if (['ANTIQUE', 'VINTAGE', 'COLLECTIBLE'].some((c) => raw.includes(c))) {
    return 'antiques';
  }
  if (['WEAR', 'WEARS', 'CLOTHING', 'APPAREL', 'FASHION', 'TOPS', 'BOTTOM', 'DRESS'].some((c) => raw.includes(c))) {
    return 'wears';
  }
  return 'generic';
}

const WEARS_KEYS = ['Shoulder', 'Bust', 'Waist', 'Hips', 'Pants Length'] as const;
type WearsKey = (typeof WEARS_KEYS)[number];

interface ParsedWearSize {
  label: string;
  measurements: Record<WearsKey, { cm: string; inch: string }>;
}

interface ParsedShoeSize {
  label: string;
  footLength: { cm: string; inch: string } | null;
  ukSize: string;
  usSize: string;
}

const EU_FOOT_LENGTH: Record<string, { cm: string; inch: string }> = {
  'EU 36': { cm: '22.5', inch: '8.9' },
  'EU 37': { cm: '23.0', inch: '9.1' },
  'EU 38': { cm: '24.0', inch: '9.4' },
  'EU 39': { cm: '24.5', inch: '9.6' },
  'EU 40': { cm: '25.0', inch: '9.8' },
  'EU 41': { cm: '25.5', inch: '10.0' },
  'EU 42': { cm: '26.5', inch: '10.4' },
  'EU 42-43': { cm: '26.5–27.0', inch: '10.4–10.6' },
  'EU 43': { cm: '27.0', inch: '10.6' },
  'EU 43-44': { cm: '27.0–27.5', inch: '10.6–10.8' },
  'EU 44': { cm: '28.0', inch: '11.0' },
  'EU 44-45': { cm: '28.0–28.5', inch: '11.0–11.2' },
  'EU 45': { cm: '29.0', inch: '11.4' },
  'EU 45-46': { cm: '29.0–29.5', inch: '11.4–11.6' },
  'EU 46': { cm: '30.0', inch: '11.8' },
  'EU 47': { cm: '30.5', inch: '12.0' },
};

const EU_TO_UK: Record<string, string> = {
  'EU 36': 'UK 3.5',
  'EU 37': 'UK 4',
  'EU 38': 'UK 5',
  'EU 39': 'UK 5.5',
  'EU 40': 'UK 6.5',
  'EU 41': 'UK 7',
  'EU 42': 'UK 8',
  'EU 42-43': 'UK 8–8.5',
  'EU 43': 'UK 9',
  'EU 43-44': 'UK 9–9.5',
  'EU 44': 'UK 9.5',
  'EU 44-45': 'UK 9.5–10',
  'EU 45': 'UK 10.5',
  'EU 45-46': 'UK 10.5–11',
  'EU 46': 'UK 11',
  'EU 47': 'UK 12',
};

const EU_TO_US: Record<string, string> = {
  'EU 36': 'US 6',
  'EU 37': 'US 7',
  'EU 38': 'US 8',
  'EU 39': 'US 8.5',
  'EU 40': 'US 9',
  'EU 41': 'US 9.5',
  'EU 42': 'US 10',
  'EU 42-43': 'US 10–10.5',
  'EU 43': 'US 11',
  'EU 43-44': 'US 11–11.5',
  'EU 44': 'US 11.5',
  'EU 44-45': 'US 11.5–12',
  'EU 45': 'US 12',
  'EU 45-46': 'US 12–13',
  'EU 46': 'US 13',
  'EU 47': 'US 14',
};

const DEFAULT_WEAR_SIZES: ParsedWearSize[] = [
  {
    label: 'S',
    measurements: {
      Shoulder: { cm: '44', inch: '17.3' },
      Bust: { cm: '96', inch: '37.8' },
      Waist: { cm: '82', inch: '32.3' },
      Hips: { cm: '96', inch: '37.8' },
      'Pants Length': { cm: '103', inch: '40.6' },
    },
  },
  {
    label: 'M',
    measurements: {
      Shoulder: { cm: '47', inch: '18.5' },
      Bust: { cm: '104', inch: '40.9' },
      Waist: { cm: '90', inch: '35.4' },
      Hips: { cm: '104', inch: '40.9' },
      'Pants Length': { cm: '105', inch: '41.3' },
    },
  },
  {
    label: 'L',
    measurements: {
      Shoulder: { cm: '48', inch: '18.9' },
      Bust: { cm: '108', inch: '42.5' },
      Waist: { cm: '94', inch: '37.0' },
      Hips: { cm: '108', inch: '42.5' },
      'Pants Length': { cm: '106', inch: '41.7' },
    },
  },
  {
    label: 'XL',
    measurements: {
      Shoulder: { cm: '49', inch: '19.3' },
      Bust: { cm: '112', inch: '44.1' },
      Waist: { cm: '98', inch: '38.6' },
      Hips: { cm: '112', inch: '44.1' },
      'Pants Length': { cm: '107', inch: '42.1' },
    },
  },
  {
    label: 'XXL',
    measurements: {
      Shoulder: { cm: '50', inch: '19.7' },
      Bust: { cm: '116', inch: '45.7' },
      Waist: { cm: '102', inch: '40.1' },
      Hips: { cm: '116', inch: '45.7' },
      'Pants Length': { cm: '108', inch: '42.5' },
    },
  },
];

const DEFAULT_SHOE_SIZES: ParsedShoeSize[] = [
  { label: 'EU 40', footLength: EU_FOOT_LENGTH['EU 40'], ukSize: EU_TO_UK['EU 40'], usSize: EU_TO_US['EU 40'] },
  { label: 'EU 41', footLength: EU_FOOT_LENGTH['EU 41'], ukSize: EU_TO_UK['EU 41'], usSize: EU_TO_US['EU 41'] },
  { label: 'EU 42', footLength: EU_FOOT_LENGTH['EU 42'], ukSize: EU_TO_UK['EU 42'], usSize: EU_TO_US['EU 42'] },
  { label: 'EU 43', footLength: EU_FOOT_LENGTH['EU 43'], ukSize: EU_TO_UK['EU 43'], usSize: EU_TO_US['EU 43'] },
  { label: 'EU 44', footLength: EU_FOOT_LENGTH['EU 44'], ukSize: EU_TO_UK['EU 44'], usSize: EU_TO_US['EU 44'] },
  { label: 'EU 45', footLength: EU_FOOT_LENGTH['EU 45'], ukSize: EU_TO_UK['EU 45'], usSize: EU_TO_US['EU 45'] },
];

const WARNING_MESSAGES: Record<CategoryType, string> = {
  wears: 'Our sizes differ from standard sizing. Please review the chart carefully before ordering.',
  shoes: 'Shoe sizes are in EU. Foot length is approximate — measure your foot before ordering.',
  painting: 'Dimensions shown are approximate. Actual piece may vary slightly due to handcrafted canvas.',
  crafts: 'Handcrafted items may vary slightly in size and weight from piece to piece.',
  antiques: 'Antique pieces are one-of-a-kind. Dimensions are as measured.',
  generic: 'Sizes may vary. Please check the chart before ordering.',
};

interface ProductSizeChartProps {
  product: Partial<Product>;
}

export const ProductSizeChart: React.FC<ProductSizeChartProps> = ({ product }) => {
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
  const category = detectCategory(product);

  const isDimensionOnly = ['crafts', 'painting', 'antiques'].includes(category);

  return (
    <View style={styles.container}>
      {/* Header with Unit Toggle */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subHeader}>DIMENSION GUIDE</Text>
          <Text style={styles.title}>
            {category === 'shoes'
              ? 'Shoe Size Guide'
              : isDimensionOnly
              ? 'Dimensions'
              : 'Size Chart'}
          </Text>
        </View>

        <View style={styles.unitToggleContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync();
              setUnit('cm');
            }}
            style={[styles.unitBtn, unit === 'cm' && styles.unitBtnActive]}
          >
            <Text style={[styles.unitBtnText, unit === 'cm' && styles.unitBtnTextActive]}>
              cm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync();
              setUnit('inch');
            }}
            style={[styles.unitBtn, unit === 'inch' && styles.unitBtnActive]}
          >
            <Text style={[styles.unitBtnText, unit === 'inch' && styles.unitBtnTextActive]}>
              inch
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Warning Notice Banner */}
      <View style={styles.warningBanner}>
        <Ionicons name="information-circle" size={16} color="#B9472B" style={styles.warningIcon} />
        <Text style={styles.warningText}>{WARNING_MESSAGES[category]}</Text>
      </View>

      {/* Sizing Tables */}
      {category === 'shoes' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: 70 }]}>EU Size</Text>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>Foot Length</Text>
              <Text style={[styles.tableHeaderCell, { width: 70 }]}>UK</Text>
              <Text style={[styles.tableHeaderCell, { width: 70 }]}>US</Text>
            </View>
            {DEFAULT_SHOE_SIZES.map((item, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
              >
                <Text style={[styles.tableCellBold, { width: 70 }]}>{item.label}</Text>
                <Text style={[styles.tableCell, { width: 100 }]}>
                  {item.footLength ? `${item.footLength[unit]} ${unit}` : '—'}
                </Text>
                <Text style={[styles.tableCell, { width: 70 }]}>{item.ukSize}</Text>
                <Text style={[styles.tableCell, { width: 70 }]}>{item.usSize}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : isDimensionOnly ? (
        <View style={styles.dimCard}>
          <View style={styles.dimRow}>
            <Text style={styles.dimLabel}>Dimensions</Text>
            <Text style={styles.dimValue}>
              {product.dimensions ||
                `${product.length || 30} × ${product.width || 20} × ${product.height || 10} cm`}
            </Text>
          </View>
          {product.weight && (
            <View style={[styles.dimRow, styles.dimRowBorder]}>
              <Text style={styles.dimLabel}>Weight</Text>
              <Text style={styles.dimValue}>
                {product.weight} {product.weightUnit || 'kg'}
              </Text>
            </View>
          )}
          <View style={[styles.dimRow, styles.dimRowBorder]}>
            <Text style={styles.dimLabel}>Craftsmanship</Text>
            <Text style={styles.dimValue}>Authentic Master Handcrafted</Text>
          </View>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { width: 60 }]}>Size</Text>
              {WEARS_KEYS.map((key) => (
                <Text key={key} style={[styles.tableHeaderCell, { width: 90 }]}>
                  {key}
                </Text>
              ))}
            </View>
            {DEFAULT_WEAR_SIZES.map((item, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
              >
                <Text style={[styles.tableCellBold, { width: 60 }]}>{item.label}</Text>
                {WEARS_KEYS.map((key) => (
                  <Text key={key} style={[styles.tableCell, { width: 90 }]}>
                    {item.measurements[key]
                      ? `${item.measurements[key][unit]} ${unit}`
                      : '—'}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EADBCC',
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  subHeader: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.displayBold,
    color: '#2A1810',
    marginTop: 2,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAF6F0',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  unitBtnActive: {
    backgroundColor: '#8C532B',
  },
  unitBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#6B5A50',
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FADCD0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#8C532B',
    lineHeight: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#EADBCC',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF6F0',
    borderBottomWidth: 1,
    borderBottomColor: '#EADBCC',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E8DC',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#FCFAF7',
  },
  tableCellBold: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  tableCell: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: '#4A3B32',
  },
  dimCard: {
    backgroundColor: '#FAF6F0',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  dimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dimRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#EADBCC',
  },
  dimLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  dimValue: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: '#2A1810',
  },
});
