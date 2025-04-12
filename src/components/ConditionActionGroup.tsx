import React from 'react';
import { ConditionActionGroup as ConditionActionGroupType, TimelineCondition, Action } from '../types/timeline';
import { targetTypes } from '../constants/timeline';

interface ConditionActionGroupProps {
  group: ConditionActionGroupType;
  isSelected: boolean;
  isEditing: boolean;
  onEdit: (groupId: string) => void;
  onDelete: (groupId: string) => void;
  onToggleEnabled: (groupId: string) => void;
  onToggleConditionEnabled: (conditionIndex: number) => void;
  onToggleActionEnabled: (actionIndex: number) => void;
  onEditCondition: (conditionIndex: number) => void;
  onEditAction: (actionIndex: number) => void;
  onRemoveCondition: (conditionIndex: number) => void;
  onRemoveAction: (actionIndex: number) => void;
}

const ConditionActionGroup: React.FC<ConditionActionGroupProps> = ({
  group,
  isSelected,
  isEditing,
  onEdit,
  onDelete,
  onToggleEnabled,
  onToggleConditionEnabled,
  onToggleActionEnabled,
  onEditCondition,
  onEditAction,
  onRemoveCondition,
  onRemoveAction
}) => {
  const renderConditionContent = (condition: TimelineCondition) => {
    switch (condition.type) {
      case 'skill_available':
        return `技能可用: ${condition.skillId}`;
      case 'team_count':
        return `队伍人数 ${condition.operator} ${condition.count} (范围: ${condition.range})`;
      case 'team_hp':
        return `队伍血量 ${condition.hpPercent}%${condition.excludeTank ? ' (排除坦克)' : ''}`;
      default:
        return '';
    }
  };

  const renderActionContent = (action: Action) => {
    if (action.type === 'skill') {
      const targetLabel = action.target ? targetTypes.find((t: { value: string; label: string }) => t.value === action.target)?.label : '无目标';
      return `使用技能: ${action.skillId} (目标: ${targetLabel}, 偏移: ${action.timeOffset}s)`;
    } else if (action.type === 'toggle') {
      return `切换开关: ${action.toggleName} (状态: ${action.state ? '开' : '关'}, 偏移: ${action.timeOffset}s)`;
    }
    return '';
  };

  return (
    <div className={`condition-action-group ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${!group.enabled ? 'disabled' : ''}`}>
      <div className="group-header">
        <div className="group-title">
          <input
            type="checkbox"
            checked={group.enabled}
            onChange={() => onToggleEnabled(group.id)}
          />
          <span>{group.name}</span>
          <span className="timeout">超时: {group.timeout}s</span>
        </div>
        <div className="group-actions">
          <button onClick={() => onEdit(group.id)}>编辑</button>
          <button onClick={() => onDelete(group.id)}>删除</button>
        </div>
      </div>
      
      {isSelected && (
        <div className="group-content">
          <div className="conditions-section">
            <h4>条件</h4>
            {group.conditions.map((condition, index) => (
              <div key={index} className="condition-item">
                <input
                  type="checkbox"
                  checked={condition.enabled}
                  onChange={() => onToggleConditionEnabled(index)}
                />
                <span>{renderConditionContent(condition)}</span>
                <button onClick={() => onEditCondition(index)}>编辑</button>
                <button onClick={() => onRemoveCondition(index)}>删除</button>
              </div>
            ))}
          </div>
          
          <div className="actions-section">
            <h4>动作</h4>
            {group.actions.map((action, index) => (
              <div key={index} className="action-item">
                <input
                  type="checkbox"
                  checked={action.enabled}
                  onChange={() => onToggleActionEnabled(index)}
                />
                <span>{renderActionContent(action)}</span>
                <button onClick={() => onEditAction(index)}>编辑</button>
                <button onClick={() => onRemoveAction(index)}>删除</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionActionGroup; 