import { ActionType } from '../types/timeline';

export const targetTypes = [
  { value: 'current', label: '当前目标' },
  { value: 'self', label: '自己' },
  { value: 'current_target', label: '当前目标的目标' },
  { value: 'party1', label: '小队1' },
  { value: 'party2', label: '小队2' },
  { value: 'party3', label: '小队3' },
  { value: 'party4', label: '小队4' },
  { value: 'party5', label: '小队5' },
  { value: 'party6', label: '小队6' },
  { value: 'party7', label: '小队7' },
  { value: 'party8', label: '小队8' },
  { value: 'id', label: '目标ID' },
  { value: 'coordinate', label: '坐标' }
];

export const actionTypes: ActionType[] = [
  { id: 'skill', name: '使用技能' },
  { id: 'toggle', name: '切换开关' }
];

export const conditionTypes = [
  { id: 'skill_available', name: '技能可用' },
  { id: 'team_count', name: '周围队友' },
  { id: 'team_hp', name: '团队血量' }
];

export const operators = [
  { value: '>', label: '大于' },
  { value: '<', label: '小于' },
  { value: '==', label: '等于' },
  { value: '>=', label: '大于等于' },
  { value: '<=', label: '小于等于' }
]; 