import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { StudioImage } from '@/store/slices/studioSlice';

interface StudioStepInspirationProps {
  images: StudioImage[];
  selectedCategory: string;
  onAddImage: (image: StudioImage) => void;
  onRemoveImage: (index: number) => void;
  onClearImages: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const StudioStepInspiration: React.FC<StudioStepInspirationProps> = ({
  images,
  selectedCategory,
  onAddImage,
  onRemoveImage,
  onClearImages,
  onNext,
  onBack,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow camera roll access in your device settings to select inspiration photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        result.assets.forEach((asset) => {
          onAddImage({
            id: `img-${Date.now()}-${Math.random()}`,
            uri: asset.uri,
            name: asset.fileName || 'Inspiration Photo',
            size: asset.fileSize,
          });
        });
      }
    } catch {
      Alert.alert('Error', 'Could not open photo gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow camera access in your device settings to snap reference photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onAddImage({
          id: `img-${Date.now()}`,
          uri: result.assets[0].uri,
          name: 'Camera Capture',
        });
      }
    } catch {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  const handleRemove = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemoveImage(index);
    if (lightboxIndex !== null) {
      if (index === lightboxIndex) {
        setLightboxIndex(images.length - 1 > 0 ? Math.max(0, index - 1) : null);
      } else if (index < lightboxIndex) {
        setLightboxIndex(lightboxIndex - 1);
      }
    }
  };

  const handleContinue = () => {
    if (images.length === 0) {
      Alert.alert(
        'Inspiration Photo Recommended',
        'Uploading at least 1 inspiration sketch or reference image helps artisans craft your vision accurately. Would you like to proceed anyway?',
        [
          { text: 'Add Image', style: 'cancel' },
          {
            text: 'Proceed Anyway',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onNext();
            },
          },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Step Indicator Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="images" size={14} color={Colors.primary} />
            <Text style={styles.badgeText}>STEP 2 OF 4</Text>
          </View>
          <Text style={styles.title}>Inspiration Studio</Text>
          <Text style={styles.subtitle}>
            Upload photos, moodboards, or sketches of the style, patterns, or silhouette you envision.
          </Text>
        </View>

        {/* Upload Action Tiles */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePickFromGallery}
            style={styles.uploadTilePrimary}
          >
            <View style={styles.tileIconCircle}>
              <Ionicons name="cloud-upload" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.tileTitle}>Choose from Gallery</Text>
            <Text style={styles.tileSub}>JPEG, PNG, HEIC up to 10MB</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleTakePhoto}
            style={styles.uploadTileSecondary}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: Colors.surface }]}>
              <Ionicons name="camera" size={24} color={Colors.primaryDark} />
            </View>
            <Text style={styles.tileTitle}>Take Photo</Text>
            <Text style={styles.tileSub}>Snap fabric or reference</Text>
          </TouchableOpacity>
        </View>

        {/* Images Grid */}
        {images.length > 0 ? (
          <View style={styles.gallerySection}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>
                Uploaded Inspiration ({images.length})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClearImages();
                }}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.imageGrid}>
              {images.map((img, index) => (
                <View key={img.id || index} style={styles.imageWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLightboxIndex(index);
                    }}
                    style={styles.imageTile}
                  >
                    <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                    <View style={styles.zoomPill}>
                      <Ionicons name="expand" size={12} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleRemove(index)}
                    style={styles.deleteBadge}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePickFromGallery}
                style={styles.addMoreTile}
              >
                <Ionicons name="add" size={24} color={Colors.primary} />
                <Text style={styles.addMoreText}>Add More</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyGalleryBox}>
            <Ionicons name="image-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyGalleryTitle}>No images added yet</Text>
            <Text style={styles.emptyGalleryDesc}>
              Tap the buttons above to add reference sketches or photos for your {selectedCategory.toLowerCase()} project.
            </Text>
          </View>
        )}

        {/* Quality tip banner */}
        <View style={styles.tipCard}>
          <Ionicons name="sparkles" size={18} color={Colors.accentGold} />
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Artisan Tip:</Text> High-resolution photos showing collar details, embroidery angles, and natural lighting yield the most precise quotes.
          </Text>
        </View>
      </ScrollView>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <Modal
          visible={true}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setLightboxIndex(null)}
        >
          <View style={styles.lightboxContainer}>
            {/* Header */}
            <View style={styles.lightboxHeader}>
              <Text style={styles.lightboxIndexText}>
                {lightboxIndex + 1} of {images.length}
              </Text>
              <TouchableOpacity
                onPress={() => setLightboxIndex(null)}
                style={styles.lightboxCloseBtn}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Main Preview Image */}
            <View style={styles.lightboxImageContainer}>
              <Image
                source={{ uri: images[lightboxIndex].uri }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
            </View>

            {/* Lightbox Footer Navigation */}
            <View style={styles.lightboxFooter}>
              <View style={styles.lightboxNavRow}>
                <TouchableOpacity
                  disabled={lightboxIndex === 0}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
                  }}
                  style={[
                    styles.navArrowBtn,
                    lightboxIndex === 0 && styles.navArrowDisabled,
                  ]}
                >
                  <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                  <Text style={styles.navArrowText}>Prev</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRemove(lightboxIndex)}
                  style={styles.lightboxDeleteBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.lightboxDeleteText}>Remove Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={lightboxIndex === images.length - 1}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLightboxIndex((prev) =>
                      prev !== null && prev < images.length - 1 ? prev + 1 : prev
                    );
                  }}
                  style={[
                    styles.navArrowBtn,
                    lightboxIndex === images.length - 1 && styles.navArrowDisabled,
                  ]}
                >
                  <Text style={styles.navArrowText}>Next</Text>
                  <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Fixed bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>
            Continue to Details
          </Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 110,
  },
  header: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    marginBottom: Spacing.lg,
  },
  uploadTilePrimary: {
    flex: 1,
    backgroundColor: '#FFFDF8',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTileSecondary: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  tileTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  tileSub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  gallerySection: {
    marginBottom: Spacing.md,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  galleryTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  clearAllText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: '#DC2626',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
  },
  imageTile: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  zoomPill: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: Radius.sm,
    padding: 3,
  },
  deleteBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#DC2626',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  addMoreTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
  },
  addMoreText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.primaryDark,
    marginTop: 2,
  },
  emptyGalleryBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyGalleryTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  emptyGalleryDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tipBold: {
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  lightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  lightboxIndexText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsMedium,
  },
  lightboxCloseBtn: {
    padding: 6,
  },
  lightboxImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxFooter: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  lightboxNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navArrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navArrowText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
  },
  lightboxDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  lightboxDeleteText: {
    color: '#EF4444',
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.surface,
  },
  backButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});
