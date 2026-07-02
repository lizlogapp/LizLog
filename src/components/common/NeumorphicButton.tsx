import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import Svg, { Rect, Defs, Filter, FeOffset, FeGaussianBlur, FeComposite, FeFlood, FeBlend, FeMerge, FeMergeNode } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { getThemeTokens } from '../../theme/themeSettings';

// The shadow parameters specified by the user
export type ShadowVariant = 'tab-active' | 'floating';

type Props = {
  variant: ShadowVariant;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
};

export function NeumorphicButton({ variant, onPress, style, children }: Props) {
  const { themeId } = useTheme();
  const theme = getThemeTokens(themeId);
  const bgColor = theme.panelBackground;

  // Render SVG Filter combinations
  const renderTabActiveFilter = () => (
    <Filter id="tab-active-shadow">
      {/* Light Inner Shadow: x-2 y-2 blur2 #ffffff 25% */}
      <FeOffset dx="-2" dy="-2" in="SourceAlpha" result="lightOffset" />
      <FeGaussianBlur stdDeviation="2" in="lightOffset" result="lightBlur" />
      <FeComposite operator="out" in="SourceAlpha" in2="lightBlur" result="lightInv" />
      <FeFlood floodColor="#FFFFFF" floodOpacity="0.25" result="lightColor" />
      <FeComposite operator="in" in="lightColor" in2="lightInv" result="lightInnerShadow" />

      {/* Dark Inner Shadow: x2 y2 blur2 #000000 25% */}
      <FeOffset dx="2" dy="2" in="SourceAlpha" result="darkOffset" />
      <FeGaussianBlur stdDeviation="2" in="darkOffset" result="darkBlur" />
      <FeComposite operator="out" in="SourceAlpha" in2="darkBlur" result="darkInv" />
      <FeFlood floodColor="#000000" floodOpacity="0.25" result="darkColor" />
      <FeComposite operator="in" in="darkColor" in2="darkInv" result="darkInnerShadow" />

      {/* Combine Inner Shadows over Original Background */}
      <FeMerge>
        <FeMergeNode in="SourceGraphic" />
        <FeMergeNode in="lightInnerShadow" />
        <FeMergeNode in="darkInnerShadow" />
      </FeMerge>
    </Filter>
  );

  const renderFloatingFilter = () => (
    <Filter id="floating-shadow" x="-50%" y="-50%" width="200%" height="200%">
      {/* Drop shadow 1: x2 y2 blur 3 color 000000 25% */}
      <FeOffset dx="2" dy="2" in="SourceAlpha" result="drop1Offset" />
      <FeGaussianBlur stdDeviation="3" in="drop1Offset" result="drop1Blur" />
      <FeFlood floodColor="#000000" floodOpacity="0.25" result="drop1Color" />
      <FeComposite operator="in" in="drop1Color" in2="drop1Blur" result="drop1Shadow" />

      {/* Drop shadow 2: x1 y1 blur 1 color 000000 25% */}
      <FeOffset dx="1" dy="1" in="SourceAlpha" result="drop2Offset" />
      <FeGaussianBlur stdDeviation="1" in="drop2Offset" result="drop2Blur" />
      <FeFlood floodColor="#000000" floodOpacity="0.25" result="drop2Color" />
      <FeComposite operator="in" in="drop2Color" in2="drop2Blur" result="drop2Shadow" />

      {/* Inner shadow 1: x1 y1 blur1 color 000000 25% */}
      <FeOffset dx="1" dy="1" in="SourceAlpha" result="inner1Offset" />
      <FeGaussianBlur stdDeviation="1" in="inner1Offset" result="inner1Blur" />
      <FeComposite operator="out" in="SourceAlpha" in2="inner1Blur" result="inner1Inv" />
      <FeFlood floodColor="#000000" floodOpacity="0.25" result="inner1Color" />
      <FeComposite operator="in" in="inner1Color" in2="inner1Inv" result="inner1Shadow" />

      {/* Inner shadow 2: x-1 y-1 blur4 color ffffff 55% */}
      <FeOffset dx="-1" dy="-1" in="SourceAlpha" result="inner2Offset" />
      <FeGaussianBlur stdDeviation="4" in="inner2Offset" result="inner2Blur" />
      <FeComposite operator="out" in="SourceAlpha" in2="inner2Blur" result="inner2Inv" />
      <FeFlood floodColor="#FFFFFF" floodOpacity="0.55" result="inner2Color" />
      <FeComposite operator="in" in="inner2Color" in2="inner2Inv" result="inner2Shadow" />

      {/* Combine all layers */}
      <FeMerge>
        <FeMergeNode in="drop1Shadow" />
        <FeMergeNode in="drop2Shadow" />
        <FeMergeNode in="SourceGraphic" />
        <FeMergeNode in="inner1Shadow" />
        <FeMergeNode in="inner2Shadow" />
      </FeMerge>
    </Filter>
  );

  const filterId = variant === 'tab-active' ? 'url(#tab-active-shadow)' : 'url(#floating-shadow)';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[style, { width: 50, height: 50 }]}>
      <View style={{ position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, overflow: 'visible' }} pointerEvents="none">
        <Svg width="70" height="70" viewBox="0 0 70 70">
          <Defs>
            {variant === 'tab-active' ? renderTabActiveFilter() : renderFloatingFilter()}
          </Defs>
          <Rect
            x="10"
            y="10"
            width="50"
            height="50"
            rx="16"
            ry="16"
            fill={bgColor}
            filter={filterId}
          />
        </Svg>
      </View>
      {/* Container for SVG icons and text placed exactly over the rect */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
        {children}
      </View>
    </TouchableOpacity>
  );
}
