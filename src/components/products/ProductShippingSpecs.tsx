import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Radius } from '@/constants/theme';
import { Product } from '@/store/api/productApi';

interface ProductShippingSpecsProps {
  product: Partial<Product>;
}

interface DimSpec {
  label: string;
  value: string;
}

export const ProductShippingSpecs: React.FC<ProductShippingSpecsProps> = ({ product }) => {
  const { height, length, width, weight, weightUnit, details } = product;

  const fmt = (v: number | null | undefined): string | null => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    if (isNaN(n) || n <= 0) return null;
    return n % 1 === 0 ? String(n) : n.toFixed(1);
  };

  const specs: DimSpec[] = [];

  if (details?.materialType) {
    specs.push({ label: 'Material', value: details.materialType });
  }

  if (details?.weaveStyle || details?.fit) {
    specs.push({
      label: details?.weaveStyle ? 'Weave & Finish' : 'Fit & Silhouette',
      value: details?.weaveStyle || details?.fit,
    });
  }

  if (details?.care || details?.careInstructions) {
    specs.push({
      label: 'Care Guideline',
      value: details.care || details.careInstructions,
    });
  }

  const l = fmt(length);
  const w = fmt(width);
  const h = fmt(height);

  if (l || w || h) {
    const parts = [l && `${l} cm`, w && `${w} cm`, h && `${h} cm`].filter(Boolean);
    specs.push({ label: 'Dimensions (L × W × H)', value: parts.join(' × ') });
  } else if (product.dimensions) {
    specs.push({ label: 'Dimensions (L × W × H)', value: product.dimensions });
  }

  const wt = fmt(weight);
  if (wt) {
    specs.push({ label: 'Package Weight', value: `${wt} ${weightUnit || 'kg'}` });
  }

  // Fallback defaults if API has limited technical data
  if (specs.length === 0) {
    specs.push(
      { label: 'Craft Technique', value: 'Master Traditional Handcraft' },
      { label: 'Quality Assurance', value: '100% Artisan Guild Inspected' }
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subHeader}>TECHNICAL SPECIFICATIONS</Text>
          <Text style={styles.title}>Craft & Shipping Dimensions</Text>
        </View>
        <Ionicons name="cube-outline" size={20} color="#8C532B" />
      </View>

      <View style={styles.grid}>
        {specs.map(({ label, value }) => (
          <View key={label} style={styles.gridItem}>
            <Text style={styles.itemLabel}>{label}</Text>
            <Text style={styles.itemValue}>{value}</Text>
          </View>
        ))}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  itemLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: '#4A3B32',
    lineHeight: 16,
  },
});
