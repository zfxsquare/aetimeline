import React from 'react';
import ConditionContent from './conditions/ConditionContent';
import ActionContent from './actions/ActionContent';
import './ConditionActionGroup.css';

// 组件需要的接口定义
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

type TimelineCondition = SkillCondition | TeamCountCondition | TeamHpCondition;

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

type Action = SkillAction | ToggleAction;

interface ConditionActionGroup {
  id: string;
  name: string;
  timeout: number;
  enabled: boolean;
  conditions: TimelineCondition[];
  actions: Action[];
}

interface ConditionActionGroupProps {
  group: ConditionActionGroup;
  selectedGroupId: string | null;
  handleSelectGroup: (id: string) => void;
  handleToggleGroupEnabled: (id: string) => void;
  handleEditGroup: (id: string) => void;
  handleDeleteGroup: (id: string) => void;
  handleToggleConditionEnabled: (groupId: string, conditionIndex: number) => void;
  handleEditCondition: (groupId: string, conditionIndex: number) => void;
  handleRemoveCondition: (groupId: string, conditionIndex: number) => void;
  handleToggleActionEnabled: (groupId: string, actionIndex: number) => void;
  handleEditAction: (groupId: string, actionIndex: number) => void;
  handleRemoveAction: (groupId: string, actionIndex: number) => void;
}

const ConditionActionGroupComponent: React.FC<ConditionActionGroupProps> = ({
  group,
  selectedGroupId,
  handleSelectGroup,
  handleToggleGroupEnabled,
  handleEditGroup,
  handleDeleteGroup,
  handleToggleConditionEnabled,
  handleEditCondition,
  handleRemoveCondition,
  handleToggleActionEnabled,
  handleEditAction,
  handleRemoveAction
}) => {
  return (
    <div 
      key={group.id} 
      className={`group-item ${selectedGroupId === group.id ? 'selected' : ''} ${!group.enabled ? 'disabled' : ''}`}
    >
      <div 
        className="group-header"
        onClick={() => handleSelectGroup(group.id)}
      >
        <div className="group-title">
          <button 
            className={`toggle-button ${group.enabled ? 'enabled' : 'disabled'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleGroupEnabled(group.id);
            }}
            title={group.enabled ? "禁用组" : "启用组"}
          >
            {group.enabled ? "✓" : "✗"}
          </button>
          <span className="group-name">{group.name}</span>
        </div>
        <div className="group-summary">
          <span className="group-condition-count">条件: {group.conditions.length}</span>
          <span className="group-action-count">动作: {group.actions.length}</span>
        </div>
        <div className="group-buttons">
          <button 
            className="edit-group-button"
            onClick={(e) => {
              e.stopPropagation();
              handleEditGroup(group.id);
            }}
            title="编辑组"
          >
            ✎
          </button>
          <button 
            className="remove-group-button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteGroup(group.id);
            }}
            title="删除组"
          >
            ×
          </button>
        </div>
      </div>
      
      {selectedGroupId === group.id && (
        <div className="group-content">
          <div className="group-config">
            <div className="input-group">
              <label>超时时间:</label>
              <div className="timeout-value">
                <span className="value">{group.timeout}</span>
                <span className="unit">秒</span>
              </div>
            </div>
          </div>
          
          {/* 条件列表 */}
          <div className="conditions-section">
            <div className="section-header">
              <h4>条件</h4>
            </div>
            <div className="conditions-list">
              {group.conditions.length > 0 ? (
                group.conditions.map((condition, condIndex) => (
                  <div 
                    key={condIndex} 
                    className={`condition-item ${!condition.enabled ? 'disabled' : ''}`}
                  >
                    <button 
                      className={`toggle-button ${condition.enabled ? 'enabled' : 'disabled'}`}
                      onClick={() => handleToggleConditionEnabled(group.id, condIndex)}
                      title={condition.enabled ? "禁用条件" : "启用条件"}
                    >
                      {condition.enabled ? "✓" : "✗"}
                    </button>
                    <span className="condition-number">{condIndex + 1}</span>
                    <span className="condition-content">
                      <ConditionContent condition={condition} />
                    </span>
                    <div className="condition-buttons">
                      <button 
                        className="edit-condition-button"
                        onClick={() => handleEditCondition(group.id, condIndex)}
                        title="编辑条件"
                      >
                        ✎
                      </button>
                      <button 
                        className="remove-condition-button"
                        onClick={() => handleRemoveCondition(group.id, condIndex)}
                        title="删除条件"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-conditions">尚未添加任何条件</div>
              )}
            </div>
          </div>
          
          {/* 动作列表 */}
          <div className="actions-section">
            <div className="section-header">
              <h4>动作</h4>
            </div>
            <div className="actions-list">
              {group.actions.length > 0 ? (
                group.actions.map((action, actionIndex) => (
                  <div 
                    key={actionIndex} 
                    className={`action-item ${!action.enabled ? 'disabled' : ''}`}
                  >
                    <button 
                      className={`toggle-button ${action.enabled ? 'enabled' : 'disabled'}`}
                      onClick={() => handleToggleActionEnabled(group.id, actionIndex)}
                      title={action.enabled ? "禁用动作" : "启用动作"}
                    >
                      {action.enabled ? "✓" : "✗"}
                    </button>
                    <span className="action-number">{actionIndex + 1}</span>
                    <span className="action-content">
                      <ActionContent action={action} />
                    </span>
                    <div className="action-buttons">
                      <button 
                        className="edit-action-button"
                        onClick={() => handleEditAction(group.id, actionIndex)}
                        title="编辑"
                      >
                        ✎
                      </button>
                      <button 
                        className="remove-action-button"
                        onClick={() => handleRemoveAction(group.id, actionIndex)}
                        title="删除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-actions">尚未添加任何动作</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionActionGroupComponent; 