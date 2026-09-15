import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
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
} from '@/store/slices/studioSlice';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { StudioStepCategory } from './StudioStepCategory';
import { StudioStepInspiration } from './StudioStepInspiration';
import { StudioStepDetails } from './StudioStepDetails';
import { StudioStepVendors } from './StudioStepVendors';
import { StudioStepSuccess } from './StudioStepSuccess';

const TOTAL_STEPS = 4;

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

  const handleClose = () => {
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
  };

  return (
    <Modal
      visible={isWizardOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
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
              onSelectCategory={(cat) => dispatch(setSelectedCategory(cat))}
              onNext={() => dispatch(setWizardStep(1))}
            />
          )}

          {currentStep === 1 && (
            <StudioStepInspiration
              images={images}
              selectedCategory={selectedCategory}
              onAddImage={(img) => dispatch(addWizardImage(img))}
              onRemoveImage={(idx) => dispatch(removeWizardImage(idx))}
              onClearImages={() => dispatch(clearWizardImages())}
              onNext={() => dispatch(setWizardStep(2))}
              onBack={() => dispatch(setWizardStep(0))}
            />
          )}

          {currentStep === 2 && (
            <StudioStepDetails
              details={details}
              selectedCategory={selectedCategory}
              onUpdateDetails={(upd) => dispatch(updateWizardDetails(upd))}
              onNext={() => dispatch(setWizardStep(3))}
              onBack={() => dispatch(setWizardStep(1))}
            />
          )}

          {currentStep === 3 && (
            <StudioStepVendors
              selectedCategory={selectedCategory}
              vendorSelectionMode={vendorSelectionMode}
              selectedVendorIds={selectedVendorIds}
              onSetMode={(mode) => dispatch(setVendorSelectionMode(mode))}
              onToggleVendor={(id) => dispatch(toggleWizardVendor(id))}
              onSelectAll={(ids) => dispatch(selectAllWizardVendors(ids))}
              onClearVendors={() => dispatch(clearWizardVendors())}
              onSubmit={() => dispatch(submitWizardRequest())}
              onBack={() => dispatch(setWizardStep(2))}
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
