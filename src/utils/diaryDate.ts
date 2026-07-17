const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

const pad2 = (value: number) => String(value).padStart(2, '0');

export function toDiaryDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDiaryDate(value?: string | null): Date | null {
  if (!value) return null;

  const dateOnly = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeDiaryDate(value?: string | Date | null): string {
  const parsed = value instanceof Date ? value : parseDiaryDate(value);
  return parsed ? toDiaryDateKey(parsed) : '';
}

export function formatDiaryDate(value?: string | Date | null): string {
  const parsed = value instanceof Date ? value : parseDiaryDate(value);
  if (!parsed) return typeof value === 'string' && value ? value : '-';
  return `${toDiaryDateKey(parsed)}（星期${WEEKDAYS[parsed.getDay()]}）`;
}

