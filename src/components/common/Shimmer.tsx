import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShimmerProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

/**
 * High-performance, warm luxury shimmer element.
 * Uses native driver animated translation with LinearGradient
 * in Ethnikraft's warm parchment palette (#F5EFE6 / #EADFCF).
 */
export const Shimmer: React.FC<ShimmerProps> = ({
  style,
  children,
  width,
  height,
  borderRadius = 6,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.shimmerBase,
        { borderRadius },
        width !== undefined ? { width: width as any } : null,
        height !== undefined ? { height: height as any } : null,
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(240, 233, 222, 0)',
            'rgba(255, 255, 255, 0.45)',
            'rgba(240, 233, 222, 0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  shimmerBase: {
    backgroundColor: '#EBE3D5',
    overflow: 'hidden',
  },
});
