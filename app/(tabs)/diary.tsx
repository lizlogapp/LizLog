// 日記頁籤 - 內部管理子頁面切換（日記列表 / 新增日記 / 年份月曆篩選 / 日記檢視）
// 不再使用 Stack 導航，確保頁籤始終可見且浮動按鈕位置一致
import React, { useState } from 'react';
import DiaryScreen from '../diary/index';
import AddDiaryScreen from '../diary/add';
import CalendarFilterScreen from '../diary/calendar';
import DiaryViewScreen from '../diary/view';

export type DiarySubView = 'list' | 'add' | 'calendar' | 'view';

export default function DiaryTab() {
  const [currentView, setCurrentView] = useState<DiarySubView>('list');
  const [viewingDiaryId, setViewingDiaryId] = useState<number | null>(null);

  const handleNavigate = (view: DiarySubView, diaryId?: number) => {
    setCurrentView(view);
    if (view === 'view' && diaryId !== undefined) {
      setViewingDiaryId(diaryId);
    }
  };

  switch (currentView) {
    case 'add':
      return <AddDiaryScreen onNavigate={handleNavigate} />;
    case 'calendar':
      return <CalendarFilterScreen onNavigate={handleNavigate} />;
    case 'view':
      return <DiaryViewScreen onNavigate={handleNavigate} diaryId={viewingDiaryId} />;
    default:
      return <DiaryScreen onNavigate={handleNavigate} />;
  }
}
