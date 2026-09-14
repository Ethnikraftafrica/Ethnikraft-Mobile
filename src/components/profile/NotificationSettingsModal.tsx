import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { updatePreferences } from '@/store/slices/profileSlice';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { preferences } = useAppSelector((state) => state.profile);

  const togglePush = (val: boolean) => {
    Haptics.selectionAsync();
    dispatch(updatePreferences({ pushNotifications: val }));
  };

  const toggleOrders = (val: boolean) => {
    Haptics.selectionAsync();
    dispatch(updatePreferences({ orderUpdates: val }));
  };

  const togglePromotions = (val: boolean) => {
    Haptics.selectionAsync();
    dispatch(updatePreferences({ promotions: val }));
  };

  const toggleNewsletter = (val: boolean) => {
    Haptics.selectionAsync();
    dispatch(updatePreferences({ newsletter: val }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, Shadows.lg]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <Text style={styles.modalSub}>Control alerts and personalized artisan updates</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#341B00" />
            </TouchableOpacity>
          </View>

          <View style={styles.settingsList}>
            {/* Push Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name="notifications" size={20} color="#C46C27" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSub}>Receive real-time alerts on your device</Text>
              </View>
              <Switch
                value={preferences.pushNotifications}
                onValueChange={togglePush}
                trackColor={{ false: '#E4DACB', true: '#C46C27' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Order Updates */}
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name="cube" size={20} color="#662502" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Order & Delivery Tracking</Text>
                <Text style={styles.settingSub}>Status changes, dispatch, and delivery milestones</Text>
              </View>
              <Switch
                value={preferences.orderUpdates}
                onValueChange={toggleOrders}
                trackColor={{ false: '#E4DACB', true: '#C46C27' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Artisan Deals & Bids */}
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Ionicons name="pricetag" size={20} color="#009D1A" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Artisan Deals & Bespoke Bids</Text>
                <Text style={styles.settingSub}>Alerts when master creators bid on custom requests</Text>
              </View>
              <Switch
                value={preferences.promotions}
                onValueChange={togglePromotions}
                trackColor={{ false: '#E4DACB', true: '#C46C27' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Cultural Newsletter */}
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingIcon}>
                <Ionicons name="mail" size={20} color="#341B00" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Ethnikraft Cultural Digest</Text>
                <Text style={styles.settingSub}>Curated weekly stories on African luxury craftsmanship</Text>
              </View>
              <Switch
                value={preferences.newsletter}
                onValueChange={toggleNewsletter}
                trackColor={{ false: '#E4DACB', true: '#C46C27' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.88}>
            <Text style={styles.doneBtnText}>Done</Text>
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
  settingsList: {
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E4DACB',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7DA',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#E4DACB',
  },
  settingText: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  settingTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#341B00',
  },
  settingSub: {
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
