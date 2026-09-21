import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAppSelector } from '@/store';
import { useUploadVendorDocumentsMutation } from '@/store/api/authApi';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface DocItem {
  key: string;
  title: string;
  subtitle: string;
  uri?: string;
  name?: string;
  type?: string;
  required?: boolean;
}

export default function VendorDocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vendorId?: string }>();
  const authState = useAppSelector((state) => state.auth);
  const vendorId = params.vendorId || authState.vendor?.id || '';

  const [docs, setDocs] = useState<Record<string, DocItem>>({
    businessLogo: {
      key: 'businessLogo',
      title: 'Workshop / Brand Logo',
      subtitle: 'Square image representing your craft brand (JPEG, PNG)',
      required: true,
    },
    proofOfAddress: {
      key: 'proofOfAddress',
      title: 'Proof of Workshop Address',
      subtitle: 'Recent utility bill, tenancy or workshop lease document',
      required: true,
    },
    businessBanner: {
      key: 'businessBanner',
      title: 'Workshop Showcase Banner',
      subtitle: 'Wide photo of your studio, tools, or hero creations',
      required: true,
    },
    cacDocument: {
      key: 'cacDocument',
      title: 'CAC Registration / Business Certificate',
      subtitle: 'Certificate of incorporation or business name (Optional)',
      required: false,
    },
    tinDocument: {
      key: 'tinDocument',
      title: 'Tax Identification Number (TIN)',
      subtitle: 'FIRS / State tax certificate or identification (Optional)',
      required: false,
    },
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadDocuments, { isLoading }] = useUploadVendorDocumentsMutation();

  const handlePickDocument = async (key: string) => {
    Haptics.selectionAsync();

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow media access to upload workshop documents and verification photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || asset.uri.split('/').pop() || `${key}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';

        setDocs((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            uri: asset.uri,
            name: filename,
            type: mimeType,
          },
        }));

        if (errorMessage) setErrorMessage(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('Failed to pick document:', err);
    }
  };

  const handleRemoveDoc = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDocs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        uri: undefined,
        name: undefined,
        type: undefined,
      },
    }));
  };

  const handleUploadSubmit = async () => {
    const hasAnyUpload = Object.values(docs).some((d) => d.uri);
    if (!hasAnyUpload) {
      setErrorMessage('Please select at least one document or image to upload, or tap Skip.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const activeVendorId = vendorId || authState.vendor?.id || '';
    if (!activeVendorId) {
      setErrorMessage('Artisan profile session not found. Please sign in to resume.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      const appendFileToFormData = async (
        fd: FormData,
        field: string,
        rawUri?: string,
        filename?: string,
        mimeType?: string
      ) => {
        if (!rawUri) return;
        let cleaned = rawUri;
        if (cleaned.includes('%25')) {
          try {
            cleaned = decodeURI(cleaned);
          } catch {
            // fallback
          }
        }

        const safeFilename = filename || `${field}.jpg`;
        const safeMimeType = mimeType || 'image/jpeg';

        try {
          const fileResp = await fetch(cleaned);
          const blob = await fileResp.blob();
          if (typeof File !== 'undefined') {
            try {
              const fileObj = new File([blob], safeFilename, { type: safeMimeType });
              fd.append(field, fileObj);
            } catch {
              fd.append(field, blob, safeFilename);
            }
          } else {
            fd.append(field, blob, safeFilename);
          }
        } catch (err) {
          console.warn(`Direct blob conversion failed for ${field}, falling back:`, err);
          fd.append(field, {
            uri: cleaned,
            name: safeFilename,
            type: safeMimeType,
          } as any);
        }
      };

      const formData = new FormData();

      await appendFileToFormData(
        formData,
        'businessLogo',
        docs.businessLogo.uri,
        docs.businessLogo.name,
        docs.businessLogo.type
      );

      await appendFileToFormData(
        formData,
        'proofOfAddressDocument',
        docs.proofOfAddress.uri,
        docs.proofOfAddress.name,
        docs.proofOfAddress.type
      );

      await appendFileToFormData(
        formData,
        'businessBanner',
        docs.businessBanner.uri,
        docs.businessBanner.name,
        docs.businessBanner.type
      );

      if (docs.cacDocument.uri) {
        await appendFileToFormData(
          formData,
          'cacDocument',
          docs.cacDocument.uri,
          docs.cacDocument.name,
          docs.cacDocument.type
        );
      }

      if (docs.tinDocument.uri) {
        await appendFileToFormData(
          formData,
          'tinDocument',
          docs.tinDocument.uri,
          docs.tinDocument.name,
          docs.tinDocument.type
        );
      }

      await uploadDocuments({
        vendorId: activeVendorId,
        formData,
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(auth)/pending-approval');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.data?.message || err?.error || 'Failed to upload documents.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(auth)/pending-approval');
  };

  return (
    <LinearGradient
      colors={['#FCF4E1', '#F5EBD5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Badge */}
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>STEP 4 OF 5</Text>
        </View>

        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={28} color="#F5EBD5" />
        </View>

        <Text style={styles.title}>Verification Documents</Text>
        <Text style={styles.subtitle}>
          Upload your verification documents so our curation team can review and verify your artisan workshop.
        </Text>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#C92929" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Documents Cards */}
        <View style={styles.docList}>
          {Object.values(docs).map((item) => {
            const hasFile = !!item.uri;
            return (
              <View key={item.key} style={[styles.docCard, Shadows.sm]}>
                <View style={styles.docHeader}>
                  <View style={styles.docIconWrap}>
                    <Ionicons
                      name={hasFile ? 'checkmark-circle' : 'cloud-upload-outline'}
                      size={20}
                      color={hasFile ? '#009D1A' : '#341B00'}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.docTitle}>{item.title}</Text>
                      {item.required ? (
                        <Text style={styles.requiredTag}>REQUIRED</Text>
                      ) : (
                        <Text style={styles.optionalTag}>OPTIONAL</Text>
                      )}
                    </View>
                    <Text style={styles.docSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>

                {hasFile ? (
                  <View style={styles.selectedFileRow}>
                    <Image source={{ uri: item.uri }} style={styles.previewImage} />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveDoc(item.key)}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="close-circle" size={20} color="#C92929" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.chooseFileBtn}
                    onPress={() => handlePickDocument(item.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="attach" size={16} color="#662502" style={{ marginRight: 4 }} />
                    <Text style={styles.chooseFileText}>Select Image / Document</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.btn, isLoading && { opacity: 0.7 }]}
          onPress={handleUploadSubmit}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.btnContent}>
              <Text style={styles.btnText}>Submit Documents for Review</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.skipText}>Skip for now & submit later</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg + 10,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  stepBadge: {
    backgroundColor: '#EAE0D3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#D4C6B3',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#341B00',
    letterSpacing: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#341B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: '#662502',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: '#B91C1C',
    fontWeight: '600',
  },
  docList: {
    width: '100%',
    gap: 12,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4DACB',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#341B00',
    flex: 1,
  },
  requiredTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C46C27',
    backgroundColor: '#FBEADE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  optionalTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#887B6C',
    backgroundColor: '#F0EBE3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  docSubtitle: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
    lineHeight: 15,
  },
  chooseFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C46C27',
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: 10,
    marginTop: Spacing.sm,
    backgroundColor: '#FCFAF7',
  },
  chooseFileText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: '#C46C27',
  },
  selectedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.md,
    padding: 8,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E4DACB',
  },
  previewImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#EFE7DA',
  },
  fileName: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: '#341B00',
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  removeBtn: {
    padding: 4,
  },
  btn: {
    width: '100%',
    backgroundColor: '#341B00',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  skipBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  skipText: {
    fontSize: Typography.fontSize.xs,
    color: '#887B6C',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
