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
  add: require('../../assets/floating-actions/add.png'),
  calendar: require('../../assets/floating-actions/calendar.png'),
  confirm: require('../../assets/floating-actions/confirm.png'),
  edit: require('../../assets/floating-actions/edit.png'),
  back: require('../../assets/floating-actions/back.png'),
  diary: require('../../assets/floating-actions/diary.png'),
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

const BUTTON_SIZE = 50;

export function FloatingActionBar({ actions, style }: Props) {
  if (actions.length === 0) return null;

  const limitedActions = actions.slice(0, 4);

  return (
    <View
      style={[styles.container, style]}
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        {limitedActions.map(({ id, onPress }, index) => (
          <TouchableOpacity
            key={id}
            onPress={onPress}
            activeOpacity={0.7}
            style={[styles.button, index === 0 && { marginLeft: 0 }]}
          >
            <Image
              source={actionImages[id]}
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TAB_BAR_HEIGHT + 16,
    height: FLOATING_BAR_HEIGHT,
    paddingHorizontal: FLOATING_BAR_PADDING,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    marginLeft: FLOATING_BAR_GAP,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
});
