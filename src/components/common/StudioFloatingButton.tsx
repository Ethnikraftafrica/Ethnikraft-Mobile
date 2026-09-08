import React from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DraggableFAB } from './DraggableFAB';
import { Shadows } from '@/constants/theme';
import { useAppSelector } from '@/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StudioFloatingButtonProps {
  onRequireAuth?: () => void;
}

export const StudioFloatingButton: React.FC<StudioFloatingButtonProps> = ({
  onRequireAuth,
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isAuthenticated) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        router.push('/(auth)/login');
      }
      return;
    }
    router.push('/(user)/studio');
  };

  return (
    <DraggableFAB
      initialX={SCREEN_WIDTH - 76}
      initialY={300}
      onPress={handlePress}
      zIndex={125}
    >
      <View style={[styles.studioBubble, Shadows.lg]}>
        <Image
          source={require('../../../assets/revamp/studio.png')}
          style={styles.studioImage}
          contentFit="cover"
        />
        {/* Subtle glowing ring badge */}
        <View style={styles.glowRing} />
      </View>
    </DraggableFAB>
  );
};

const styles = StyleSheet.create({
  studioBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3E2413',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#E8BA7A',
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  studioImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  glowRing: {
    position: 'absolute',
    inset: -3,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: 'rgba(232, 186, 122, 0.4)',
  },
});
