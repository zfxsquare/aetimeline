import { TimelineEntry, ConditionActionGroup, EntryGroupMap } from '../types/timeline';

// 生成唯一ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// 获取条目的唯一标识符
export const getEntryId = (entry: TimelineEntry): string => {
  return `${entry.time}-${entry.text}`;
};

// 设置cookie
export const setCookie = (name: string, value: string, days: number = 365): void => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + value + expires + "; path=/";
};

// 获取cookie
export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// 保存当前条目的组
export const saveGroupsForCurrentEntry = (
  selectedEntry: TimelineEntry | null,
  groups: ConditionActionGroup[],
  entryGroupMap: EntryGroupMap
): EntryGroupMap => {
  if (selectedEntry) {
    const entryId = getEntryId(selectedEntry);
    const updatedMap = { ...entryGroupMap };
    updatedMap[entryId] = [...groups];
    return updatedMap;
  }
  return entryGroupMap;
};

// 格式化时间显示
export const formatTime = (timeInSeconds: number, timeFormat: 'seconds' | 'minutes'): string => {
  const isNegative = timeInSeconds < 0;
  const absTime = Math.abs(timeInSeconds);
  
  if (timeFormat === 'seconds') {
    return `${isNegative ? '-' : ''}${absTime.toFixed(1)}`;
  } else {
    const minutes = Math.floor(absTime / 60);
    const seconds = absTime % 60;
    return `${isNegative ? '-' : ''}${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
  }
}; 