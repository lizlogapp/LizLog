import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SplashAnimationProps {
  isLoading: boolean;
  onFinish: () => void;
}

export const SplashAnimation: React.FC<SplashAnimationProps> = ({ isLoading, onFinish }) => {
  const lightOpacity = useRef(new Animated.Value(1)).current;
  const darkOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(lightOpacity, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(darkOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(darkOpacity, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]);

    sequence.start(({ finished }) => {
      if (finished) setSequenceComplete(true);
    });

    return () => sequence.stop();
  }, [darkOpacity, lightOpacity, logoOpacity]);

  useEffect(() => {
    if (isLoading || !sequenceComplete) return;

    const fadeOut = Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    });

    fadeOut.start(({ finished }) => {
      if (finished) {
        setVisible(false);
        onFinish();
      }
    });

    return () => fadeOut.stop();
  }, [containerOpacity, isLoading, onFinish, sequenceComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity: containerOpacity }]}
      pointerEvents="auto"
    >
      <View style={styles.imageContainer}>
        <Animated.Image
          source={require('../../../assets/illustrations/lizard-head-light.png')}
          style={[styles.image, { opacity: lightOpacity }]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require('../../../assets/illustrations/lizard-head-dark.png')}
          style={[styles.image, { opacity: darkOpacity }]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require('../../../assets/branding/logos/logo-image.png')}
          style={[styles.image, { opacity: logoOpacity }]}
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
