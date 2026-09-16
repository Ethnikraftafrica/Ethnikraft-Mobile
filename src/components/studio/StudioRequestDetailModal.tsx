import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  closeDetailModal,
  openEditModal,
  openDeleteModal,
} from '@/store/slices/studioSlice';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const StudioRequestDetailModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isDetailModalOpen, selectedRequestForDetail: req } = useAppSelector(
    (state) => state.studio.hub
  );
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(closeDetailModal());
  }, [dispatch]);

  const handleEdit = useCallback(() => {
    if (!req) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(closeDetailModal());
    dispatch(openEditModal(req));
  }, [dispatch, req]);

  const handleDelete = useCallback(() => {
    if (!req) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(closeDetailModal());
    dispatch(openDeleteModal(req));
  }, [dispatch, req]);

  const handleAcceptBid = useCallback(
    (bidId: string, vendorName: string, amount: number) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Accept Artisan Quote',
        `Would you like to accept the quote of ₦${amount.toLocaleString()} from ${vendorName} and fund escrow?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept & Lock Escrow',
            onPress: () => {
              Alert.alert(
                'Escrow Funded',
                `Success! ₦${amount.toLocaleString()} has been safely locked in Ethnikraft Escrow. ${vendorName} has been notified to begin production.`
              );
            },
          },
        ]
      );
    },
    []
  );

  if (!req) return null;

  const images = req.inspirationImages || [];
  const statusColor =
    req.status === 'OPEN'
      ? '#F59E0B'
      : req.status === 'COMPLETED'
      ? '#10B981'
      : req.status === 'CANCELLED'
      ? '#EF4444'
      : Colors.primary;

  return (
    <Modal
      visible={isDetailModalOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Request Details</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.iconBtn}>
              <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Inspiration Gallery */}
          {images.length > 0 ? (
            <View style={styles.galleryContainer}>
              <View style={styles.mainImageWrapper}>
                <Image
                  source={{ uri: images[activeImageIdx] || images[0] }}
                  style={styles.mainImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>

              {images.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailRow}
                >
                  {images.map((imgUri, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveImageIdx(idx);
                      }}
                      style={[
                        styles.thumbWrapper,
                        activeImageIdx === idx && styles.thumbWrapperActive,
                      ]}
                    >
                      <Image
                        source={{ uri: imgUri }}
                        style={styles.thumbImage}
                        contentFit="cover"
                        transition={150}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.noImageBox}>
              <Ionicons name="image-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.noImageText}>No inspiration images attached</Text>
            </View>
          )}

          {/* Title & Status */}
          <View style={styles.mainInfoCard}>
            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {req.status}
                </Text>
              </View>

              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{req.categoryType}</Text>
              </View>
            </View>

            <Text style={styles.title}>{req.title}</Text>
            <Text style={styles.description}>{req.description}</Text>

            {/* Spec Highlights Grid */}
            <View style={styles.specGrid}>
              <View style={styles.specCol}>
                <Text style={styles.specLabel}>Allocated Budget</Text>
                <Text style={styles.specBudgetValue}>₦{req.budget.toLocaleString()}</Text>
              </View>

              <View style={styles.specCol}>
                <Text style={styles.specLabel}>Target Delivery</Text>
                <Text style={styles.specValue}>
                  {new Date(req.timeline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.specCol}>
                <Text style={styles.specLabel}>Fabric / Material</Text>
                <Text style={styles.specValue}>{req.materialType || 'Artisan Choice'}</Text>
              </View>

              <View style={styles.specCol}>
                <Text style={styles.specLabel}>Quantity & Tier</Text>
                <Text style={styles.specValue}>
                  {req.quantity} {req.quantity > 1 ? 'Units' : 'Unit'} • {req.quality || 'Standard'}
                </Text>
              </View>
            </View>

            {req.measurements ? (
              <View style={styles.measurementsBox}>
                <Ionicons name="body-outline" size={16} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.measurementsLabel}>Measurements / Dimensions</Text>
                  <Text style={styles.measurementsText}>{req.measurements}</Text>
                </View>
              </View>
            ) : null}

            {req.notes ? (
              <View style={styles.notesBox}>
                <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notesLabel}>Special Notes</Text>
                  <Text style={styles.notesText}>{req.notes}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Artisan Bids & Offers Section */}
          <View style={styles.bidsSection}>
            <View style={styles.bidsSectionHeader}>
              <Text style={styles.bidsSectionTitle}>
                Artisan Quotes & Bids ({req.bids?.length || 0})
              </Text>
              <Text style={styles.bidsSectionSub}>
                Verified master craftsmen quotes for this commission
              </Text>
            </View>

            {req.bids && req.bids.length > 0 ? (
              req.bids.map((bid) => {
                const isAccepted = bid.status === 'ACCEPTED';
                return (
                  <View
                    key={bid.id}
                    style={[
                      styles.bidCard,
                      isAccepted && styles.bidCardAccepted,
                    ]}
                  >
                    <View style={styles.bidVendorRow}>
                      <Image
                        source={{
                          uri:
                            bid.vendor.profileImage ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                        }}
                        style={styles.bidVendorAvatar}
                        contentFit="cover"
                        transition={150}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={styles.bidVendorNameRow}>
                          <Text style={styles.bidVendorName}>
                            {bid.vendor.businessName}
                          </Text>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={Colors.primary}
                          />
                        </View>
                        {bid.vendor.rating ? (
                          <View style={styles.bidRatingRow}>
                            <Ionicons name="star" size={12} color="#EAB308" />
                            <Text style={styles.bidRatingText}>
                              {bid.vendor.rating} ({bid.vendor.reviewCount || 0})
                            </Text>
                            {bid.vendor.location && (
                              <Text style={styles.bidLocationText}>
                                • {bid.vendor.location}
                              </Text>
                            )}
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.bidPriceCol}>
                        <Text style={styles.bidPriceLabel}>Quote</Text>
                        <Text style={styles.bidPriceValue}>
                          ₦{bid.amount.toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {bid.message ? (
                      <Text style={styles.bidMessage}>{bid.message}</Text>
                    ) : null}

                    {/* Action buttons */}
                    <View style={styles.bidActionsRow}>
                      {isAccepted ? (
                        <View style={styles.acceptedBanner}>
                          <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                          <Text style={styles.acceptedText}>Escrow Active & Tailoring in Progress</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() =>
                            handleAcceptBid(
                              bid.id,
                              bid.vendor.businessName,
                              bid.amount
                            )
                          }
                          style={styles.acceptBidBtn}
                        >
                          <Ionicons name="checkmark-circle" size={16} color={Colors.textInverse} />
                          <Text style={styles.acceptBidBtnText}>Accept Quote & Lock Escrow</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyBidsCard}>
                <Ionicons name="hourglass-outline" size={36} color={Colors.accentGold} />
                <Text style={styles.emptyBidsTitle}>Awaiting Artisan Quotes</Text>
                <Text style={styles.emptyBidsDesc}>
                  Master craftsmen have been notified. You will receive quotes and delivery timeline offers directly on this request.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
  },
  topTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  galleryContainer: {
    padding: Spacing.md,
  },
  mainImageWrapper: {
    width: '100%',
    height: 240,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceMuted,
    marginBottom: Spacing.sm,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailRow: {
    gap: Spacing.sm,
  },
  thumbWrapper: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapperActive: {
    borderColor: Colors.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  noImageBox: {
    margin: Spacing.md,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  noImageText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  mainInfoCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.primaryDark,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  specCol: {
    width: '47%',
  },
  specLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  specBudgetValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
  specValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  measurementsBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    marginTop: Spacing.xs,
  },
  measurementsLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  measurementsText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  notesBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  bidsSection: {
    marginHorizontal: Spacing.md,
  },
  bidsSectionHeader: {
    marginBottom: Spacing.sm + 2,
  },
  bidsSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  bidsSectionSub: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  bidCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.sm + 2,
  },
  bidCardAccepted: {
    borderColor: Colors.success,
    backgroundColor: '#F0FDF4',
  },
  bidVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bidVendorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceMuted,
  },
  bidVendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidVendorName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  bidRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  bidRatingText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
  },
  bidLocationText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  bidPriceCol: {
    alignItems: 'flex-end',
  },
  bidPriceLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textMuted,
  },
  bidPriceValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
  bidMessage: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  bidActionsRow: {
    marginTop: Spacing.xs,
  },
  acceptBidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 2,
  },
  acceptBidBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  acceptedText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: '#15803D',
  },
  emptyBidsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyBidsTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  emptyBidsDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
