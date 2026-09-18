import React, { memo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Typography } from '@/constants/theme';
import { CheckoutStep } from './types';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
}

const STEPS: { key: CheckoutStep; label: string; stepNumber: number }[] = [
  { key: 'address', label: 'Address', stepNumber: 1 },
  { key: 'shipping', label: 'Shipping', stepNumber: 2 },
  { key: 'payment', label: 'Payment', stepNumber: 3 },
  { key: 'success', label: 'Confirm', stepNumber: 4 },
];

const STEP_INDEX: Record<CheckoutStep, number> = {
  address: 0,
  shipping: 1,
  payment: 2,
  success: 3,
};

const CheckoutStepperComponent: React.FC<CheckoutStepperProps> = ({
  currentStep,
}) => {
  const currentIdx = STEP_INDEX[currentStep] ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, idx) => {
          const isCompleted = currentIdx > idx;
          const isActive = currentIdx === idx;

          return (
            <React.Fragment key={step.key}>
              {/* Step Node */}
              <View style={styles.stepNode}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.circleText,
                        isActive && styles.circleTextActive,
                      ]}
                    >
                      {step.stepNumber}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isActive || isCompleted) && styles.stepLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connector Bar */}
              {idx < STEPS.length - 1 && (
                <View
                  style={[
                    styles.connectorBar,
                    currentIdx > idx && styles.connectorBarCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

export const CheckoutStepper = memo(CheckoutStepperComponent);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNode: {
    alignItems: 'center',
    width: 58,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  circleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  circleCompleted: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  circleText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textMuted,
  },
  circleTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
  connectorBar: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    marginBottom: 16,
    borderRadius: Radius.full,
  },
  connectorBarCompleted: {
    backgroundColor: Colors.primary,
  },
});
