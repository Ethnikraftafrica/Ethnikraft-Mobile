import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { setTheme, AppearanceTheme } from '@/store/slices/profileSlice';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AppearanceModal({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { preferences } = useAppSelector((state) => state.profile);

  const themes: { id: AppearanceTheme; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    {
      id: 'system',
      title: 'Match System Default',
      subtitle: 'Automatically follow your device appearance',
      icon: 'phone-portrait-outline',
    },
    {
      id: 'light',
      title: 'Warm Ivory Light',
      subtitle: 'Traditional gold, cream, and terracotta tones',
      icon: 'sunny-outline',
    },
    {
      id: 'dark',
      title: 'Ebony Wood Dark',
      subtitle: 'Deep African mahogany and royal night contrast',
      icon: 'moon-outline',
    },
  ];

  const handleSelectTheme = (id: AppearanceTheme) => {
    Haptics.selectionAsync();
    dispatch(setTheme(id));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, Shadows.lg]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>App Appearance</Text>
              <Text style={styles.modalSub}>Select your preferred visual palette</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#341B00" />
            </TouchableOpacity>
          </View>

          <View style={styles.themeList}>
            {themes.map((t) => {
              const active = preferences.theme === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.themeOption, active && styles.themeOptionActive]}
                  onPress={() => handleSelectTheme(t.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
                    <Ionicons name={t.icon} size={20} color={active ? '#FFFFFF' : '#662502'} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.themeTitle, active && styles.themeTitleActive]}>
                      {t.title}
                    </Text>
                    <Text style={styles.themeSub}>{t.subtitle}</Text>
                  </View>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={active ? '#C46C27' : '#D1C4B2'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.88}>
            <Text style={styles.doneBtnText}>Apply & Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 14, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7D9',
    paddingBottom: Spacing.sm + 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#341B00',
  },
  modalSub: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  themeList: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  themeOptionActive: {
    borderColor: '#C46C27',
    backgroundColor: '#FCF8F2',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFE7DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconCircleActive: {
    backgroundColor: '#C46C27',
  },
  textContainer: {
    flex: 1,
  },
  themeTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#341B00',
  },
  themeTitleActive: {
    color: '#C46C27',
  },
  themeSub: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});
