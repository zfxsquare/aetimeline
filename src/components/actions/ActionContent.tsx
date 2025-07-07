import React from 'react';
import { skills } from '../../data/skills';

interface SkillAction {
  type: 'skill';
  enabled: boolean;
  skillId: string;
  target?: 'current' | 'self' | 'current_target' | 'party1' | 'party2' | 'party3' | 'party4' | 'party5' | 'party6' | 'party7' | 'party8' | 'id' | 'coordinate';
  timeOffset: number;
  forceUse?: boolean;
  targetId?: string;
  targetCoordinate?: { x: number; y: number; z: number };
}

interface ToggleAction {
  type: 'toggle';
  enabled: boolean;
  toggleName: string;
  state: boolean;
  timeOffset: number;
}

interface MoveToAction {
  type: 'move_to';
  enabled: boolean;
  coordinate: { x: number; y: number; z: number };
  tp: boolean;
  timeOffset: number;
}

type Action = SkillAction | ToggleAction | MoveToAction;

interface ActionContentProps {
  action: Action;
}

const ActionContent: React.FC<ActionContentProps> = ({ action }) => {
  // 目标类型选项
  const targetTypes = [
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

  let content: React.ReactNode;
  
  if (action.type === 'skill') {
    const targetLabel = action.target ? targetTypes.find(t => t.value === action.target)?.label : '无目标';
    // 从skills.ts中查找技能名称
    const skillInfo = skills.find(s => s.id === action.skillId);
    const skillName = skillInfo ? skillInfo.name : action.skillId;
    content = (
      <>
        <span className="action-type">使用技能</span>: {skillName} 
        <span className="action-detail">(ID: {action.skillId})</span>
        <span className="action-detail">目标</span>: {targetLabel}
        {action.target === 'id' && (
          <span className="action-detail">目标ID: {action.targetId}</span>
        )}
        {action.target === 'coordinate' && (
          <span className="action-detail">坐标: {action.targetCoordinate?.x}, {action.targetCoordinate?.y}, {action.targetCoordinate?.z}</span>
        )}
        <span className="action-detail">偏移</span>: 
        <span className={`time-offset ${action.timeOffset > 0 ? 'positive' : action.timeOffset < 0 ? 'negative' : ''}`}>
          {action.timeOffset > 0 ? '+' : ''}{action.timeOffset}s
        </span>
        {action.forceUse && <span className="action-detail force-use">强制使用</span>}
      </>
    );
  } else if (action.type === 'toggle') {
    content = (
      <>
        <span className="action-type">切换开关</span>: {action.toggleName} 
        <span className="action-detail">状态</span>: {action.state ? '开启' : '关闭'}
        <span className="action-detail">偏移</span>: 
        <span className={`time-offset ${action.timeOffset > 0 ? 'positive' : action.timeOffset < 0 ? 'negative' : ''}`}>
          {action.timeOffset > 0 ? '+' : ''}{action.timeOffset}s
        </span>
      </>
    );
  } else if (action.type === 'move_to') {
    content = (
      <>
        <span className="action-type">移动到坐标</span>
        <span className="action-detail">坐标</span>: {action.coordinate.x}, {action.coordinate.y}, {action.coordinate.z}
        {action.tp && <span className="action-detail tp">tp</span>}
        <span className="action-detail">偏移</span>: 
        <span className={`time-offset ${action.timeOffset > 0 ? 'positive' : action.timeOffset < 0 ? 'negative' : ''}`}>
          {action.timeOffset > 0 ? '+' : ''}{action.timeOffset}s
        </span>
      </>
    );
  }
  
  return action.enabled ? <>{content}</> : <span className="disabled-content">{content}</span>;
};

export default ActionContent; 