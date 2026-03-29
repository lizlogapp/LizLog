import React, { ReactNode } from 'react';
import { View, ScrollView, StyleProp, ViewStyle, ScrollViewProps } from 'react-native';
import { STATUS_BAR_HEIGHT, TAB_BAR_HEIGHT } from '../../theme/layoutSettings';

interface BaseScreenProps extends ScrollViewProps {
  children: ReactNode;
  /** 預留給底部的浮動按鈕區塊 */
  floatingAction?: ReactNode;
  /** 預設為 true，若為 false 則以純 View 取代 ScrollView */
  scrollable?: boolean;
  /** 內容區域外層 View 的客製化樣式 */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * 共用螢幕版面容器
 * 依照設計圖層結構設定：
 * - 面板-內容+按鈕：扣除狀態列與頁籤後的滿版空間
 * - 內容：padding 16, clip content (overflow: hidden)
 * - 浮動按鈕：固定在面板底部 (頁籤上方)，預設 w滿版 h114 padding 32 gap 16
 */
export function BaseScreen({
  children,
  floatingAction,
  scrollable = true,
  style,
  contentContainerStyle,
  contentStyle,
  ...rest
}: BaseScreenProps) {
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* 
        面板-內容+按鈕
        - 手機螢幕畫面扣掉頂部(狀態列)和底部(頁籤)後的範圍
        - x0, w滿版
      */}
      <View
        style={{
          position: 'absolute',
          top: STATUS_BAR_HEIGHT,
          bottom: TAB_BAR_HEIGHT,
          left: 0,
          right: 0,
        }}
      >
        {/* 
          內容
          - padding: 16
          - clip content (overflow: 'hidden')
        */}
        <View style={[{ flex: 1, padding: 16, overflow: 'hidden' }, contentStyle]}>
          {scrollable ? (
            <ScrollView
              style={[{ flex: 1, backgroundColor: 'transparent' }, style]}
              contentContainerStyle={[
                { 
                  paddingBottom: floatingAction ? 114 : 0, 
                  flexGrow: 1 
                }, 
                contentContainerStyle
              ]}
              showsVerticalScrollIndicator={false}
              {...rest}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[
              { 
                flex: 1, 
                backgroundColor: 'transparent',
              }, 
              style
            ]}>
              {children}
            </View>
          )}
        </View>

        {/* 
          浮動按鈕容器
          - y 固定在頁籤上方位置 (此 View 的 bottom: 0 即為頁籤上方)
          - w滿版, h114
          - padding 32, gap 16
        */}
        {floatingAction && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: 114,
              padding: 32,
              gap: 16,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              pointerEvents: 'box-none',
            }}
          >
            {floatingAction}
          </View>
        )}
      </View>
    </View>
  );
}
