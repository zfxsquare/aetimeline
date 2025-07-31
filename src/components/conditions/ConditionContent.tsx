import React from 'react';
import './ConditionContent.css';
import { skills } from '../../data/skills';

interface SkillCondition {
  type: 'skill_available';
  enabled: boolean;
  skillId: string;
}

interface TeamCountCondition {
  type: 'team_count';
  enabled: boolean;
  operator: '>' | '<' | '==' | '>=' | '<=';
  count: number;
  range: number;
}

interface TeamHpCondition {
  type: 'team_hp';
  enabled: boolean;
  hpPercent: number;
  excludeTank: boolean;
}

interface RoleCondition {
  type: 'role';
  enabled: boolean;
  role: 'MT' | 'ST' | 'H1' | 'H2' | 'D1' | 'D2' | 'D3' | 'D4';
}

interface VariableCondition {
  type: 'variable';
  enabled: boolean;
  variableName: string;
  expectedValue: boolean;
}

type TimelineCondition = SkillCondition | TeamCountCondition | TeamHpCondition | RoleCondition | VariableCondition;

interface ConditionContentProps {
  condition: TimelineCondition;
}

const ConditionContent: React.FC<ConditionContentProps> = ({ condition }) => {
  let content: React.ReactNode;
  
  if (condition.type === 'skill_available') {
    // 获取技能信息
    const skillInfo = skills.find(s => s.id === condition.skillId);
    const skillName = skillInfo ? skillInfo.name : '';
    
    content = (
      <>
        <span className="condition-type">技能可用</span>: {skillName}
        <span className="condition-detail">(ID: {condition.skillId})</span>
      </>
    );
  } else if (condition.type === 'team_count') {
    const operators = [
      { value: '>', label: '大于' },
      { value: '<', label: '小于' },
      { value: '==', label: '等于' },
      { value: '>=', label: '大于等于' },
      { value: '<=', label: '小于等于' }
    ];
    
    content = (
      <>
        <span className="condition-type">周围队友</span>: 
        {operators.find(op => op.value === condition.operator)?.label || condition.operator} {condition.count} 人
        <span className="condition-detail">检测范围</span>: {condition.range} yalm
      </>
    );
  } else if (condition.type === 'team_hp') {
    content = (
      <>
        <span className="condition-type">团队血量</span>: {condition.hpPercent}%
        {condition.excludeTank && <span className="condition-detail">(排除坦克)</span>}
      </>
    );
  } else if (condition.type === 'role') {
    const roleLabels: Record<string, string> = {
      'MT': 'MT',
      'ST': 'ST',
      'H1': 'H1',
      'H2': 'H2',
      'D1': 'D1',
      'D2': 'D2',
      'D3': 'D3',
      'D4': 'D4'
    };

    content = (
      <>
        <span className="condition-type">自身职能</span>: 
        <span className="condition-detail">{roleLabels[condition.role] || condition.role}</span>
      </>
    );
  } else if (condition.type === 'variable') {
    content = (
      <>
        <span className="condition-type">变量</span>: 
        <span className="condition-detail">{condition.variableName}</span> = 
        <span className={`condition-value ${condition.expectedValue ? 'true' : 'false'}`}>
          {condition.expectedValue ? '真' : '假'}
        </span>
      </>
    );
  }
  
  return condition.enabled ? <>{content}</> : <span className="disabled-content">{content}</span>;
};

export default ConditionContent; 