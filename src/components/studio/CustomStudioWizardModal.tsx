import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  closeWizard,
  setWizardStep,
  setSelectedCategory,
  addWizardImage,
  removeWizardImage,
  clearWizardImages,
  updateWizardDetails,
  setVendorSelectionMode,
  toggleWizardVendor,
  selectAllWizardVendors,
  clearWizardVendors,
  submitWizardRequest,
  setWizardSubmitting,
  StudioImage,
  StudioDetails,
} from '@/store/slices/studioSlice';
import {
  useCreateCustomRequestMutation,
  useSearchVendorsForRequestMutation,
  CreateCustomRequestPayload,
} from '@/store/api/studioApi';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { StudioStepCategory } from './StudioStepCategory';
import { StudioStepInspiration } from './StudioStepInspiration';
import { StudioStepDetails } from './StudioStepDetails';
import { StudioStepVendors } from './StudioStepVendors';
import { StudioStepSuccess } from './StudioStepSuccess';

export const CustomStudioWizardModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isWizardOpen } = useAppSelector((state) => state.studio.hub);
  const {
    currentStep,
    selectedCategory,
    images,
    details,
    vendorSelectionMode,
    selectedVendorIds,
  } = useAppSelector((state) => state.studio.wizard);

  const handleClose = useCallback(() => {
    if (currentStep > 0 && currentStep < 4) {
      Alert.alert(
        'Discard Commission Draft?',
        'You have unsaved changes in your custom request wizard. Are you sure you want to exit?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              dispatch(closeWizard());
            },
          },
        ]
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch(closeWizard());
    }
  }, [currentStep, dispatch]);

  const handleSelectCategory = useCallback(
    (cat: string) => dispatch(setSelectedCategory(cat)),
    [dispatch]
  );
  const handleSetStep = useCallback(
    (step: number) => dispatch(setWizardStep(step)),
    [dispatch]
  );
  const handleAddImage = useCallback(
    (img: StudioImage) => dispatch(addWizardImage(img)),
    [dispatch]
  );
  const handleRemoveImage = useCallback(
    (idx: number) => dispatch(removeWizardImage(idx)),
    [dispatch]
  );
  const handleClearImages = useCallback(
    () => dispatch(clearWizardImages()),
    [dispatch]
  );
  const handleUpdateDetails = useCallback(
    (upd: Partial<StudioDetails>) => dispatch(updateWizardDetails(upd)),
    [dispatch]
  );
  const handleSetVendorMode = useCallback(
    (mode: 'BROADCAST' | 'DIRECT') => dispatch(setVendorSelectionMode(mode)),
    [dispatch]
  );
  const handleToggleVendor = useCallback(
    (id: string) => dispatch(toggleWizardVendor(id)),
    [dispatch]
  );
  const handleSelectAllVendors = useCallback(
    (ids: string[]) => dispatch(selectAllWizardVendors(ids)),
    [dispatch]
  );
  const handleClearVendors = useCallback(
    () => dispatch(clearWizardVendors()),
    [dispatch]
  );
  const [createCustomRequest, { isLoading: isCreating }] = useCreateCustomRequestMutation();
  const [searchVendors] = useSearchVendorsForRequestMutation();

  const handleSubmitRequest = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      dispatch(setWizardSubmitting(true));

      const budgetNum = parseInt(details.budget.replace(/[^0-9]/g, '')) || 20000;
      const quantityNum = parseInt(details.quantity) || 1;
      const timelineDate = details.deliveryDate
        ? new Date(details.deliveryDate).toISOString()
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const inspirationImages = images.map((img) => img.base64 || img.uri);

      const payload: CreateCustomRequestPayload = {
        title: details.title.trim() || `Custom ${selectedCategory} Commission`,
        description: details.notes.trim() || `Custom artisan project in ${selectedCategory.toLowerCase()} category.`,
        budget: budgetNum,
        timeline: timelineDate,
        categoryType: selectedCategory.toUpperCase(),
        materialType: details.material || 'Artisan Choice',
        materialQuality: details.quality || 'Standard',
        colors: details.color ? [details.color] : ['#C46C27'],
        quantity: quantityNum,
        measurements: details.measurements || (details.useProfileMeasurements ? 'Using Profile Measurements' : undefined),
        inspirationImages,
      };

      const res = await createCustomRequest(payload).unwrap();
      const requestId = res?.id;

      if (requestId && vendorSelectionMode === 'DIRECT' && selectedVendorIds.length > 0) {
        searchVendors({
          requestId,
          category: selectedCategory,
          vendorIds: selectedVendorIds,
        }).catch(() => {});
      }

      dispatch(submitWizardRequest());
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to submit custom studio request.';
      Alert.alert('Submission Error', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      dispatch(setWizardSubmitting(false));
    }
  }, [
    details,
    selectedCategory,
    images,
    vendorSelectionMode,
    selectedVendorIds,
    createCustomRequest,
    searchVendors,
    dispatch,
  ]);

  return (
    <Modal
      visible={isWizardOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClose}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topTitleBox}>
            <Text style={styles.topHeaderTitle}>Ethnikraft Custom Studio</Text>
            {currentStep < 4 && (
              <View style={styles.stepDotsRow}>
                {[0, 1, 2, 3].map((stepIdx) => {
                  const isCompleted = stepIdx < currentStep;
                  const isCurrent = stepIdx === currentStep;
                  return (
                    <View
                      key={stepIdx}
                      style={[
                        styles.stepDot,
                        isCurrent && styles.stepDotActive,
                        isCompleted && styles.stepDotCompleted,
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Step Body */}
        <View style={styles.stepContent}>
          {currentStep === 0 && (
            <StudioStepCategory
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onNext={() => handleSetStep(1)}
            />
          )}

          {currentStep === 1 && (
            <StudioStepInspiration
              images={images}
              selectedCategory={selectedCategory}
              onAddImage={handleAddImage}
              onRemoveImage={handleRemoveImage}
              onClearImages={handleClearImages}
              onNext={() => handleSetStep(2)}
              onBack={() => handleSetStep(0)}
            />
          )}

          {currentStep === 2 && (
            <StudioStepDetails
              details={details}
              selectedCategory={selectedCategory}
              onUpdateDetails={handleUpdateDetails}
              onNext={() => handleSetStep(3)}
              onBack={() => handleSetStep(1)}
            />
          )}

          {currentStep === 3 && (
            <StudioStepVendors
              selectedCategory={selectedCategory}
              vendorSelectionMode={vendorSelectionMode}
              selectedVendorIds={selectedVendorIds}
              onSetMode={handleSetVendorMode}
              onToggleVendor={handleToggleVendor}
              onSelectAll={handleSelectAllVendors}
              onClearVendors={handleClearVendors}
              onSubmit={handleSubmitRequest}
              onBack={() => handleSetStep(2)}
            />
          )}

          {currentStep === 4 && (
            <StudioStepSuccess
              selectedCategory={selectedCategory}
              details={details}
              imagesCount={images.length}
              vendorSelectionMode={vendorSelectionMode}
              onViewHub={() => dispatch(closeWizard())}
              onStartAnother={() => {
                dispatch(closeWizard());
                dispatch(setSelectedCategory('WEARS'));
              }}
            />
          )}
        </View>
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
  },
  topTitleBox: {
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stepDotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stepDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    width: 32,
    backgroundColor: Colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: Colors.primaryLight,
  },
  stepContent: {
    flex: 1,
  },
});
