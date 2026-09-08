import React, { useRef } from 'react';
import {
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraggableFABProps {
  initialX: number;
  initialY: number;
  children: React.ReactNode;
  onPress?: () => void;
  zIndex?: number;
}

export const DraggableFAB: React.FC<DraggableFABProps> = ({
  initialX,
  initialY,
  children,
  onPress,
  zIndex = 100,
}) => {
  // Store the active coordinate offset
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const currentPos = useRef({ x: initialX, y: initialY });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,

      onPanResponderGrant: () => {
        Haptics.selectionAsync();
        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        const finalX = currentPos.current.x + gestureState.dx;
        const finalY = currentPos.current.y + gestureState.dy;

        // Check if movement was minimal (tap threshold)
        if (Math.hypot(gestureState.dx, gestureState.dy) < 6) {
          if (onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }
          return;
        }

        // Clamp inside safe screen boundaries
        const clampedX = Math.max(12, Math.min(SCREEN_WIDTH - 80, finalX));
        const clampedY = Math.max(70, Math.min(SCREEN_HEIGHT - 160, finalY));

        currentPos.current = { x: clampedX, y: clampedY };

        Animated.spring(pan, {
          toValue: { x: clampedX, y: clampedY },
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.fabContainer,
        { zIndex },
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
