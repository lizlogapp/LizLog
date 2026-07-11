import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Image, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashAnimationProps {
  isLoading: boolean;
  onFinish: () => void;
}

export const SplashAnimation: React.FC<SplashAnimationProps> = ({ isLoading, onFinish }) => {
  const op1 = useRef(new Animated.Value(0)).current; // lizard-head-light
  const op2 = useRef(new Animated.Value(0)).current; // lizard-head-dark
  const op3 = useRef(new Animated.Value(0)).current; // logo-image-only
  const containerOp = useRef(new Animated.Value(1)).current;

  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // 短載入就快，長載入就慢
    const baseDuration = isLoading ? 800 : 300;

    const animSequence = Animated.sequence([
      Animated.timing(op1, { toValue: 1, duration: baseDuration, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(op1, { toValue: 0, duration: baseDuration, useNativeDriver: true }),
        Animated.timing(op2, { toValue: 1, duration: baseDuration, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(op2, { toValue: 0, duration: baseDuration, useNativeDriver: true }),
        Animated.timing(op3, { toValue: 1, duration: baseDuration, useNativeDriver: true }),
      ]),
      Animated.delay(isLoading ? 500 : 100),
    ]);

    const runAnimation = () => {
      animSequence.start(({ finished }) => {
        if (isLoading) {
          // 如果還在載入，重置繼續播放
          op1.setValue(0);
          op2.setValue(0);
          op3.setValue(0);
          runAnimation();
        } else {
          // 載入完畢，整體淡出
          Animated.timing(containerOp, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            setIsAnimating(false);
            onFinish();
          });
        }
      });
    };

    runAnimation();

    return () => {
      animSequence.stop();
    };
  }, [isLoading]);

  if (!isAnimating) return null;

  return (
    <Animated.View style={[styles.container, { opacity: containerOp }]} pointerEvents="auto">
      <View style={styles.imageContainer}>
        <Animated.Image 
          source={require('../../../assets/illustrations/lizard-head-light.png')}
          style={[styles.image, { opacity: op1 }]}
          resizeMode="contain"
        />
        <Animated.Image 
          source={require('../../../assets/illustrations/lizard-head-dark.png')}
          style={[styles.image, { opacity: op2 }]}
          resizeMode="contain"
        />
        <Animated.Image 
          source={require('../../../assets/branding/logos/logo-image-only.png')}
          style={[styles.image, { opacity: op3 }]}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFEFA', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
