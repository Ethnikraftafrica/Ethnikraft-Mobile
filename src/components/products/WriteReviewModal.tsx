import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Shadows, Spacing, Typography, FontFamily } from '@/constants/theme';
import { useCreateProductReviewMutation } from '@/store/api/productApi';

export interface ReviewProductTarget {
  id: string;
  name: string;
  image?: string;
  artisanName?: string;
}

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  product: ReviewProductTarget | null;
  onSuccess?: () => void;
}

const SENTIMENT_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Poor — Needs Improvement', color: '#DC2626' },
  2: { text: 'Fair — Below Expectations', color: '#EA580C' },
  3: { text: 'Good — Satisfied with Craft', color: '#D97706' },
  4: { text: 'Very Good — Highly Pleased', color: '#16A34A' },
  5: { text: 'Masterpiece — Exceptional Craftsmanship!', color: '#15803D' },
};

const QUICK_PRAISE_TAGS = [
  'True to Size',
  'Authentic Fabric',
  'Exquisite Embroidery',
  'Fast Delivery',
  'Sturdy & Durable',
  'Flawless Packaging',
];

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  visible,
  onClose,
  product,
  onSuccess,
}) => {
  const [createReview, { isLoading: isSubmitting }] = useCreateProductReviewMutation();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Star scale animation
  const starScale = React.useRef(new Animated.Value(1)).current;

  const handleSelectRating = useCallback(
    (star: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRating(star);

      // Bounce star animation
      Animated.sequence([
        Animated.timing(starScale, {
          toValue: 1.25,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(starScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [starScale]
  );

  const handleToggleTag = useCallback((tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags((prev) => {
      const exists = prev.includes(tag);
      return exists ? prev.filter((t) => t !== tag) : [...prev, tag];
    });
  }, []);

  const handleResetAndClose = useCallback(() => {
    setRating(5);
    setComment('');
    setSelectedTags([]);
    setErrorMessage('');
    setIsSuccess(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!product?.id) return;
    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a rating between 1 and 5 stars.');
      return;
    }

    setErrorMessage('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Combine comment with selected tags if tags exist
    let finalComment = comment.trim();
    if (selectedTags.length > 0) {
      const tagText = `[Highlights: ${selectedTags.join(', ')}]`;
      finalComment = finalComment ? `${finalComment}\n\n${tagText}` : tagText;
    }

    try {
      await createReview({
        productId: product.id,
        rating,
        comment: finalComment || undefined,
        isPublic: true,
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSuccess(true);

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        handleResetAndClose();
      }, 1800);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'Failed to submit review. You may have already reviewed this product.';
      setErrorMessage(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [product, rating, comment, selectedTags, createReview, onSuccess, handleResetAndClose]);

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleResetAndClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Rate & Review</Text>
              <Text style={styles.headerSubtitle}>Share your artisanal experience</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleResetAndClose}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Success Celebration View */}
            {isSuccess ? (
              <View style={styles.successState}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={48} color="#15803D" />
                </View>
                <Text style={styles.successHeading}>Review Published!</Text>
                <Text style={styles.successSubtext}>
                  Thank you for supporting African craftsmanship and celebrating authentic heritage.
                </Text>
              </View>
            ) : (
              <>
                {/* Product Summary Card */}
                <View style={[styles.productCard, Shadows.sm]}>
                  {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.productThumb} contentFit="cover" />
                  ) : (
                    <View style={styles.productThumbPlaceholder}>
                      <Ionicons name="cube-outline" size={24} color={Colors.secondary} />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    {product.artisanName ? (
                      <View style={styles.artisanRow}>
                        <Ionicons name="sparkles" size={12} color={Colors.secondary} />
                        <Text style={styles.artisanName} numberOfLines={1}>
                          {product.artisanName}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Rating Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Overall Rating</Text>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= rating;
                      return (
                        <TouchableOpacity
                          key={star}
                          activeOpacity={0.7}
                          onPress={() => handleSelectRating(star)}
                          style={styles.starTouch}
                        >
                          <Animated.View style={star === rating ? { transform: [{ scale: starScale }] } : undefined}>
                            <Ionicons
                              name={isFilled ? 'star' : 'star-outline'}
                              size={36}
                              color={isFilled ? '#F59E0B' : '#D1D5DB'}
                            />
                          </Animated.View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[styles.sentimentText, { color: SENTIMENT_LABELS[rating]?.color || Colors.secondary }]}>
                    {SENTIMENT_LABELS[rating]?.text || ''}
                  </Text>
                </View>

                {/* Quick Praise Pills */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>What stood out most? (Optional)</Text>
                  <View style={styles.tagWrap}>
                    {QUICK_PRAISE_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          activeOpacity={0.75}
                          onPress={() => handleToggleTag(tag)}
                          style={[styles.tagPill, isSelected && styles.tagPillActive]}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color={Colors.textInverse}
                              style={{ marginRight: 4 }}
                            />
                          )}
                          <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Written Comment Input */}
                <View style={styles.section}>
                  <View style={styles.commentHeaderRow}>
                    <Text style={styles.sectionLabel}>Written Feedback</Text>
                    <Text style={styles.charCounter}>{comment.length} / 1000</Text>
                  </View>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={5}
                    maxLength={1000}
                    placeholder="How was the texture, sizing, and authentic artisan craftsmanship? Help other collectors make the right choice."
                    placeholderTextColor={Colors.textMuted}
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                  />
                </View>

                {/* Verified Buyer Escrow Notice */}
                <View style={styles.trustBanner}>
                  <Ionicons name="shield-checkmark" size={16} color="#15803D" style={{ marginRight: 8 }} />
                  <Text style={styles.trustText}>
                    Verified Buyer Review: Your feedback assists fellow art collectors and celebrates master African artisans.
                  </Text>
                </View>

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled, Shadows.md]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.textInverse} style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="sparkles" size={18} color={Colors.textInverse} style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Publishing Review...' : 'Publish Verified Review'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: FontFamily.cormorantBold,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: '#FAF5ED',
  },
  productThumbPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: '#FAF5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  productName: {
    fontFamily: FontFamily.poppinsSemiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  artisanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  artisanName: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
    color: Colors.secondary,
    marginLeft: 4,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontFamily: FontFamily.poppinsSemiBold,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  starTouch: {
    padding: 4,
  },
  sentimentText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5ED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.2)',
  },
  tagPillActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  tagText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  tagTextActive: {
    color: Colors.textInverse,
    fontFamily: FontFamily.poppinsMedium,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 13.5,
    color: Colors.textPrimary,
    minHeight: 120,
    marginTop: 6,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: Spacing.lg,
  },
  trustText: {
    flex: 1,
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11.5,
    color: '#166534',
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: Spacing.lg,
  },
  errorText: {
    flex: 1,
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
    color: '#B91C1C',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: FontFamily.poppinsSemiBold,
    fontSize: 15,
    color: Colors.textInverse,
  },
  successState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successHeading: {
    fontFamily: FontFamily.cormorantBold,
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  successSubtext: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
