// src/components/types.ts

export interface ActionType {
  id: string;
  name: string;
}

export interface SkillCondition {
  type: 'skill_available';
  enabled: boolean;
  skillId: string;
}

export interface TeamCountCondition {
  type: 'team_count';
  enabled: boolean;
  operator: '>' | '<' | '==' | '>=' | '<=';
  count: number;
  range: number;
}

export interface TeamHpCondition {
  type: 'team_hp';
  enabled: boolean;
  hpPercent: number;
  excludeTank: boolean;
}

export interface RoleCondition {
  type: 'role';
  enabled: boolean;
  role: 'MT' | 'ST' | 'H1' | 'H2' | 'D1' | 'D2' | 'D3' | 'D4';
}

export type TimelineCondition = SkillCondition | TeamCountCondition | TeamHpCondition | RoleCondition;

export interface SkillAction {
  type: 'skill';
  enabled: boolean;
  skillId: string;
  target?: 'current' | 'self' | 'current_target' | 'party1' | 'party2' | 'party3' | 'party4' | 'party5' | 'party6' | 'party7' | 'party8' | 'id' | 'coordinate';
  timeOffset: number;
  forceUse?: boolean;
  targetId?: string;
  targetCoordinate?: { x: number; y: number; z: number };
}

export interface ToggleAction {
  type: 'toggle';
  enabled: boolean;
  toggleName: string;
  state: boolean;
  timeOffset: number;
}

export interface MoveToAction {
  type: 'move_to';
  enabled: boolean;
  coordinate: { x: number; y: number; z: number };
  tp: boolean;
  timeOffset: number;
}

export type Action = SkillAction | ToggleAction | MoveToAction;

export interface ConditionActionGroup {
  id: string;
  name: string;
  timeout: number;
  enabled: boolean;
  conditions: TimelineCondition[];
  actions: Action[];
}

export interface TimelineEntry {
  time: number;
  text: string;
  sync?: string;
  duration?: number;
  window?: {before: number, after: number};
  jump?: string | number;
  forcejump?: string | number;
  label?: string;
  groups?: ConditionActionGroup[];
}
