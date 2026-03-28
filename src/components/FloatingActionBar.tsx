/**
 * 浮動按鈕區塊：位於頁籤列上方，寬滿版，可放 1~4 顆按鈕
 *
 * Figma 規格：滿版寬、H 114、Padding 32、Gap 16、靠右對齊
 * 圖示：add / calendar / confirm / edit / back / diary
 */

import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { getThemeTokens } from '../theme/themeSettings';

import {
  FLOATING_BAR_HEIGHT,
  FLOATING_BAR_PADDING,
  FLOATING_BAR_GAP,
  TAB_BAR_HEIGHT,
} from '../theme/layoutSettings';

export type FloatingActionId =
  | 'add'
  | 'calendar'
  | 'confirm'
  | 'edit'
  | 'back'
  | 'diary';

const actionImages: Record<FloatingActionId, ReturnType<typeof require>> = {
  add: require('../../assets/floating-actions/add-new.png'),
  calendar: require('../../assets/floating-actions/calendar-new.png'),
  confirm: require('../../assets/floating-actions/confirm-new.png'),
  edit: require('../../assets/floating-actions/edit-new.png'),
  back: require('../../assets/floating-actions/back-new.png'),
  diary: require('../../assets/floating-actions/diary-new.png'),
};

export type FloatingActionItem = {
  id: FloatingActionId;
  onPress: () => void;
};

type Props = {
  /** 按鈕列表（左→右），最多 4 顆 */
  actions: FloatingActionItem[];
  /** 額外樣式 */
  style?: ViewStyle;
};

const BUTTON_SIZE = 48;

export function FloatingActionBar({ actions, style }: Props) {
  if (actions.length === 0) return null;

  const limitedActions = actions.slice(0, 4);

  return (
    <View style={[styles.actionGroup, style]} pointerEvents="box-none">
      {limitedActions.map(({ id, onPress }) => (
        <TouchableOpacity
          key={id}
          onPress={onPress}
          activeOpacity={0.7}
          style={styles.button}
        >
          <Image
            source={actionImages[id]}
            style={styles.icon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16, // Figma: Gap 16
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 16, // Figma: Corner radius 16
    justifyContent: 'center',
    alignItems: 'center',
    // Figma 陰影設定：對齊頁籤
    backgroundColor: '#FFE17B', // 若圖檔沒有內建背景色則用這層色票。如果有則透明亦可，暫留以策安全且增加陰影發色
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
});
