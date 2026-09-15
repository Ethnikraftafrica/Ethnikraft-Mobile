import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { StudioCustomRequest } from '@/store/slices/studioSlice';

interface StudioRequestCardProps {
  request: StudioCustomRequest;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  OPEN: {
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#F59E0B',
    label: 'Open for Bids',
  },
  CLOSED: {
    bg: '#EFF6FF',
    text: '#1E40AF',
    dot: '#3B82F6',
    label: 'In Tailoring',
  },
  COMPLETED: {
    bg: '#DCFCE7',
    text: '#166534',
    dot: '#22C55E',
    label: 'Completed',
  },
  CANCELLED: {
    bg: '#FEE2E2',
    text: '#991B1B',
    dot: '#EF4444',
    label: 'Cancelled',
  },
};

export const StudioRequestCard: React.FC<StudioRequestCardProps> = ({
  request,
  onPress,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const images = request.inspirationImages || [];
  const imageCount = images.length;
  const bidCount = request.bids?.length || 0;
  const statusCfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.OPEN;

  const formattedDelivery = () => {
    if (!request.timeline) return '—';
    try {
      return new Date(request.timeline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return request.timeline;
    }
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen(false);
    onPress();
  };

  const handleMenuToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen((prev) => !prev);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handleCardPress}
      style={styles.card}
    >
      <View style={styles.topRow}>
        {/* Thumbnail Image */}
        <View style={styles.thumbnailContainer}>
          {images[0] ? (
            <Image source={{ uri: images[0] }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Ionicons name="sparkles" size={24} color={Colors.primaryLight} />
            </View>
          )}
          {imageCount > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>+{imageCount - 1}</Text>
            </View>
          )}
        </View>

        {/* Header and Info */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {request.title || 'Bespoke Request'}
            </Text>
            <TouchableOpacity
              onPress={handleMenuToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.menuTrigger}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {request.description || 'No description provided.'}
          </Text>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
              <Text style={[styles.statusText, { color: statusCfg.text }]}>
                {statusCfg.label}
              </Text>
            </View>

            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{request.categoryType}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu overlay dropdown */}
      {menuOpen && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              onEdit();
            }}
            style={styles.menuItem}
          >
            <Ionicons name="pencil-outline" size={14} color={Colors.textPrimary} />
            <Text style={styles.menuItemText}>Edit Terms</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              onDelete();
            }}
            style={styles.menuItem}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>
              Delete Request
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer Row */}
      <View style={styles.footerRow}>
        <View style={styles.metaLeft}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>Due {formattedDelivery()}</Text>
          </View>

          {bidCount > 0 ? (
            <View style={styles.bidMetaBadge}>
              <Ionicons name="people" size={12} color={Colors.primary} />
              <Text style={styles.bidMetaText}>
                {bidCount} {bidCount === 1 ? 'quote' : 'quotes'}
              </Text>
            </View>
          ) : (
            <View style={styles.pendingBidsBadge}>
              <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.pendingBidsText}>Broadcasting</Text>
            </View>
          )}
        </View>

        <View style={styles.budgetCol}>
          <Text style={styles.budgetLabel}>Budget</Text>
          <Text style={styles.budgetValue}>₦{request.budget.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.sm + 2,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#361300',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  thumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceSubtle,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: Radius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  menuTrigger: {
    padding: 2,
  },
  description: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  categoryPill: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.primaryDark,
  },
  menuDropdown: {
    position: 'absolute',
    top: 36,
    right: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 4,
    width: 140,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  menuItemText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  bidMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  bidMetaText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  pendingBidsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingBidsText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  budgetCol: {
    alignItems: 'flex-end',
  },
  budgetLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  budgetValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
});
