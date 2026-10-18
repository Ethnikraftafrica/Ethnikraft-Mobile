import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCurrency, SUPPORTED_CURRENCIES } from '@/store/slices/currencySlice';
import { StorageService } from '@/services/storage.service';
import { useAppTheme } from '@/hooks/useAppTheme';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CurrencyPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const currentCurrency = useAppSelector((state) => state.currency);
  const { theme, isDark } = useAppTheme();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  const handleDismiss = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      if (callback) callback();
    });
  };

  const handleSelectCurrency = async (code: string) => {
    Haptics.selectionAsync();
    dispatch(setCurrency(code));
    await StorageService.setCurrency(code);
    handleDismiss();
  };

  if (!modalVisible) return null;

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={() => handleDismiss()}
      statusBarTranslucent
    >
      <View style={styles.overlayContainer}>
        {/* Semi-transparent backdrop */}
        <TouchableWithoutFeedback onPress={() => handleDismiss()}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: isDark ? theme.card : '#FFFFFF',
              borderColor: theme.borderSubtle,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View
            style={[
              styles.dragHandle,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.20)'
                  : 'rgba(54, 19, 0, 0.20)',
              },
            ]}
          />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Select Currency</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Prices will be converted at live exchange rates
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(54, 19, 0, 0.06)',
                },
              ]}
              onPress={() => handleDismiss()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Currency List */}
          <View style={styles.currencyList}>
            {Object.values(SUPPORTED_CURRENCIES).map((curr) => {
              const isSelected = curr.code === currentCurrency.code;
              return (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyItem,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(196, 108, 39, 0.16)'
                          : '#FEF3C7'
                        : isDark
                        ? theme.backgroundSecondary
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? isDark
                          ? '#D1995A'
                          : theme.primary
                        : theme.borderSubtle,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => handleSelectCurrency(curr.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.currencyLeft}>
                    <Text style={styles.currencyFlag}>{curr.flag}</Text>
                    <View style={styles.currencyTextCol}>
                      <View style={styles.currencyCodeRow}>
                        <Text style={[styles.currencyCode, { color: theme.textPrimary }]}>{curr.code}</Text>
                        <View
                          style={[
                            styles.currencySymbolBadge,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(54, 19, 0, 0.06)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.currencySymbol,
                              {
                                color: isSelected
                                  ? isDark
                                    ? '#D1995A'
                                    : theme.primary
                                  : theme.textSecondary,
                              },
                            ]}
                          >
                            {curr.symbol}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.currencyName, { color: theme.textSecondary }]}>{curr.name}</Text>
                    </View>
                  </View>

                  <View style={styles.currencyRight}>
                    {isSelected ? (
                      <View
                        style={[
                          styles.checkIconBadge,
                          {
                            backgroundColor: isDark ? '#D1995A' : theme.primary,
                          },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={15}
                          color={isDark ? '#17120F' : '#FFFFFF'}
                        />
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.textMuted}
                        style={{ opacity: 0.5 }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 24,
    ...Shadows.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginVertical: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.cormorantBold,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.latoRegular,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  currencyList: {
    paddingTop: Spacing.md,
    gap: 8,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  currencyItemSelected: {
    borderWidth: 1.5,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  currencyFlag: {
    fontSize: 26,
  },
  currencyTextCol: {
    gap: 2,
  },
  currencyCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencyCode: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
  },
  currencySymbolBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  currencySymbol: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsSemiBold,
  },
  currencyName: {
    fontSize: 12,
    fontFamily: FontFamily.latoRegular,
  },
  currencyRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
