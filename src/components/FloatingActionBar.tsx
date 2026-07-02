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

import AddIcon from '../../assets/floating-actions/add.svg';
import CalendarIcon from '../../assets/floating-actions/calendar.svg';
import ConfirmIcon from '../../assets/floating-actions/confirm.svg';
import EditIcon from '../../assets/floating-actions/edit.svg';
import BackIcon from '../../assets/floating-actions/back.svg';
import DiaryIcon from '../../assets/floating-actions/diary.svg';
import { NeumorphicButton } from './common/NeumorphicButton';
export type FloatingActionId =
  | 'add'
  | 'calendar'
  | 'confirm'
  | 'edit'
  | 'back'
  | 'diary';

const ActionIcons: Record<FloatingActionId, React.FC<any>> = {
  add: AddIcon,
  calendar: CalendarIcon,
  confirm: ConfirmIcon,
  edit: EditIcon,
  back: BackIcon,
  diary: DiaryIcon,
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

export function FloatingActionBar({ actions, style }: Props) {
  const { themeId } = useTheme();
  const theme = getThemeTokens(themeId);
  if (actions.length === 0) return null;

  const limitedActions = actions.slice(0, 4);

  return (
    <View style={[styles.actionGroup, style]} pointerEvents="box-none">
      {limitedActions.map(({ id, onPress }) => {
        const IconComponent = ActionIcons[id];
        return (
          <NeumorphicButton
            key={id}
            variant="floating"
            onPress={onPress}
            style={{ width: 50, height: 50, padding: 12 }}
          >
            <IconComponent width="100%" height="100%" preserveAspectRatio="xMidYMid meet" color={theme.primary} />
          </NeumorphicButton>
        );
      })}
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
});
