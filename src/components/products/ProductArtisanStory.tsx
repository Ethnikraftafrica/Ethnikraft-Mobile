import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius } from '@/constants/theme';
import { Product } from '@/store/api/productApi';

interface ProductArtisanStoryProps {
  product: Partial<Product>;
}

interface AboutItem {
  label: string;
  body: string;
}

export const ProductArtisanStory: React.FC<ProductArtisanStoryProps> = ({ product }) => {
  const [expanded, setExpanded] = useState(false);

  const buildItems = (): AboutItem[] => {
    const items: AboutItem[] = [];

    // Artisan Note
    if (product.details?.artisanStory) {
      items.push({
        label: 'Artisan Story & Note',
        body: product.details.artisanStory.replace(/<\/?[^>]+(>|$)/g, ' ').trim(),
      });
    }

    // Materials
    if (product.details?.materialType || product.details?.materialList) {
      const materialType = product.details.materialType || '';
      const materialList: string[] = product.details.materialList || [];
      if (materialList.length > 0) {
        const formatted = materialList.map((m) => m.replace(/_/g, ' ')).join(', ');
        items.push({
          label: 'Authentic Materials',
          body: `Crafted with ${formatted}.${materialType ? ` Primary material: ${materialType}.` : ''}`,
        });
      } else if (materialType) {
        items.push({
          label: 'Authentic Materials',
          body: `Crafted with premium authentic ${materialType}.`,
        });
      }
    }

    // Provenance & Heritage
    items.push({
      label: 'Provenance & Heritage',
      body: `Handcrafted in ${product.details?.origin || 'Nigeria (West Africa)'}, preserving ancient traditional loom and carving lineages.`,
    });

    // Care & Preservation
    if (product.details?.careInstructions || product.details?.care) {
      items.push({
        label: 'Care & Preservation',
        body: product.details.careInstructions || product.details.care || '',
      });
    } else {
      items.push({
        label: 'Care & Preservation',
        body: 'Treat gently with love. Store in a cool, dry place away from direct sunlight. Professional textile/artisan care recommended.',
      });
    }

    // Bespoke
    if (product.isCustomizable || product.isRequestable) {
      items.push({
        label: 'Bespoke Commission',
        body: 'This piece can be personalized to your exact measurements, color palette, and styling preferences upon request.',
      });
    }

    // Condition
    if (product.condition) {
      items.push({
        label: 'Item Condition',
        body: `Pristine ${product.condition} condition, directly verified by the master maker.`,
      });
    }

    return items;
  };

  const items = buildItems();
  const PREVIEW_COUNT = 3;
  const showToggle = items.length > PREVIEW_COUNT;
  const visibleItems = expanded || !showToggle ? items : items.slice(0, PREVIEW_COUNT);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subHeader}>HERITAGE & CRAFT</Text>
          <Text style={styles.title}>About This Piece</Text>
        </View>
        <Ionicons name="sparkles-outline" size={20} color="#8C532B" />
      </View>

      <View style={styles.cardsList}>
        {visibleItems.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
          </View>
        ))}
      </View>

      {showToggle && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.selectionAsync();
            setExpanded(!expanded);
          }}
          style={styles.toggleBtn}
        >
          <Text style={styles.toggleBtnText}>
            {expanded ? 'Show Less' : `Show All Details (${items.length})`}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#8C532B"
          />
        </TouchableOpacity>
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
  cardsList: {
    gap: 10,
  },
  card: {
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  cardLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#4A3B32',
    lineHeight: 18,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    marginTop: 6,
  },
  toggleBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
});
