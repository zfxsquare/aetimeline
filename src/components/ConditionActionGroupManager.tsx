import React, { useState } from 'react';
import SkillSearch from './SkillSearch';
import { skills } from '../data/skills';

// 导入接口定义
interface ActionType {
  id: string;
  name: string;
}

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

interface TimelineEntry {
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

// 组件属性接口
interface ConditionActionGroupManagerProps {
  selectedEntry: TimelineEntry;
  groups: ConditionActionGroup[];
  setGroups: React.Dispatch<React.SetStateAction<ConditionActionGroup[]>>;
  selectedGroupId: string | null;
  setSelectedGroupId: React.Dispatch<React.SetStateAction<string | null>>;
  resetAllEditStates: () => void;
}

// 生成唯一ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

// 添加目标类型选项
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

const ConditionActionGroupManager: React.FC<ConditionActionGroupManagerProps> = ({
  selectedEntry,
  groups,
  setGroups,
  selectedGroupId,
  setSelectedGroupId,
  resetAllEditStates
}) => {
  // 组编辑状态
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newTimeout, setNewTimeout] = useState(10);
  
  // 动作编辑状态
  const [actionType, setActionType] = useState<string>('skill');
  const [isEditingAction, setIsEditingAction] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number>(-1);
  const [skillId, setSkillId] = useState('');
  const [skillTarget, setSkillTarget] = useState<SkillAction['target']>(undefined);
  const [forceUse, setForceUse] = useState(false);
  const [toggleName, setToggleName] = useState('');
  const [toggleState, setToggleState] = useState(true);
  const [timeOffset, setTimeOffset] = useState(0);
  const [targetId, setTargetId] = useState('');
  const [targetCoordinate, setTargetCoordinate] = useState({ x: 100, y: 0, z: 100 });
  
  // 条件编辑状态
  const [conditionType, setConditionType] = useState<string>('skill_available');
  const [isEditingCondition, setIsEditingCondition] = useState(false);
  const [editingConditionIndex, setEditingConditionIndex] = useState<number>(-1);
  const [skillConditionId, setSkillConditionId] = useState('');
  const [teamCountOperator, setTeamCountOperator] = useState<'>' | '<' | '==' | '>=' | '<='>('>=');
  const [teamCountValue, setTeamCountValue] = useState(1);
  const [teamCountRange, setTeamCountRange] = useState(30);
  const [excludeTank, setExcludeTank] = useState(false);

  // 选项数据
  const actionTypes: ActionType[] = [
    { id: 'skill', name: '使用技能' },
    { id: 'toggle', name: '切换开关' }
  ];

  const conditionTypes = [
    { id: 'skill_available', name: '技能可用' },
    { id: 'team_count', name: '周围队友' },
    { id: 'team_hp', name: '团队血量' }
  ];

  const operators = [
    { value: '>', label: '大于' },
    { value: '<', label: '小于' },
    { value: '==', label: '等于' },
    { value: '>=', label: '大于等于' },
    { value: '<=', label: '小于等于' }
  ];

  const handleNewTimeoutChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num)) {
      setNewTimeout(num);
    }
  };

  // 创建新组
  const handleCreateGroup = () => {
    if (!selectedEntry) return;
    
    const newGroup: ConditionActionGroup = {
      id: generateId(),
      name: newGroupName || `组 ${groups.length + 1}`,
      timeout: newTimeout,
      enabled: true,
      conditions: [],
      actions: []
    };
    
    setGroups([...groups, newGroup]);
    setSelectedGroupId(newGroup.id);
    setNewGroupName('');
  };

  // 编辑组
  const handleEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    setIsEditingGroup(true);
    setEditingGroupId(groupId);
    setNewGroupName(group.name);
    setNewTimeout(group.timeout);
  };

  // 更新组名称和配置
  const handleUpdateGroupName = () => {
    if (!editingGroupId) return;
    
    const updatedGroups = groups.map(group => 
      group.id === editingGroupId 
        ? { 
            ...group, 
            name: newGroupName || group.name,
            timeout: newTimeout
          } 
        : group
    );
    
    setGroups(updatedGroups);
    setIsEditingGroup(false);
    setEditingGroupId(null);
    setNewGroupName('');
  };

  // 删除组
  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = groups.filter(group => group.id !== groupId);
    setGroups(updatedGroups);
    
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
      resetAllEditStates();
    }
  };

  // 选择组
  const handleSelectGroup = (groupId: string) => {
    console.log('选择组:', groupId, '当前选中:', selectedGroupId);
    // 如果点击当前选中的组，则折叠（取消选择）
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    } else {
      // 否则选择新组
      setSelectedGroupId(groupId);
    }
    
    // 只重置编辑状态，但不清除选中的组
    setIsEditingGroup(false);
    setEditingGroupId(null);
    setNewGroupName('');
    
    setIsEditingAction(false);
    setEditingActionIndex(-1);
    
    setIsEditingCondition(false);
    setEditingConditionIndex(-1);
  };

  // 切换组的启用状态
  const handleToggleGroupEnabled = (groupId: string) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return { ...group, enabled: !group.enabled };
      }
      return group;
    });
    setGroups(updatedGroups);
  };

  // 切换条件的启用状态
  const handleToggleConditionEnabled = (groupId: string, conditionIndex: number) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const updatedConditions = [...group.conditions];
        updatedConditions[conditionIndex] = {
          ...updatedConditions[conditionIndex],
          enabled: !updatedConditions[conditionIndex].enabled
        };
        return { ...group, conditions: updatedConditions };
      }
      return group;
    });
    setGroups(updatedGroups);
  };

  // 切换动作的启用状态
  const handleToggleActionEnabled = (groupId: string, actionIndex: number) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const updatedActions = [...group.actions];
        updatedActions[actionIndex] = {
          ...updatedActions[actionIndex],
          enabled: !updatedActions[actionIndex].enabled
        };
        return { ...group, actions: updatedActions };
      }
      return group;
    });
    setGroups(updatedGroups);
  };

  // 处理动作类型切换
  const handleActionTypeChange = (newType: string) => {
    setActionType(newType);
    if (isEditingAction) {
      cancelEditingAction();
    }
  };

  // 处理条件类型切换
  const handleConditionTypeChange = (newType: string) => {
    setConditionType(newType);
    if (isEditingCondition) {
      cancelEditingCondition();
    }
  };

  // 处理时间偏移变更
  const handleTimeOffsetChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setTimeOffset(num);
    }
  };

  // 渲染动作表单
  const renderActionForm = () => {
    switch (actionType) {
      case 'skill':
        // 获取当前技能的信息
        const currentSkillInfo = skillId ? skills.find(s => s.id === skillId) : null;
        // 确定技能类型
        const isSelfOnlySkill = currentSkillInfo && currentSkillInfo.canTargetSelf && !currentSkillInfo.canTargetParty && !currentSkillInfo.canTargetHostile;
        const isHostileOnlySkill = currentSkillInfo && !currentSkillInfo.canTargetSelf && !currentSkillInfo.canTargetParty && currentSkillInfo.canTargetHostile;
        const isAreaOnlySkill = currentSkillInfo && !currentSkillInfo.canTargetSelf && !currentSkillInfo.canTargetParty && !currentSkillInfo.canTargetHostile && currentSkillInfo.targetArea;
        
        return (
          <div className="action-form">
            <div className="input-group">
              <label>技能ID:</label>
              <SkillSearch
                value={skillId}
                onChange={setSkillId}
                onSelect={handleSkillSelect}
              />
            </div>
            <div className="input-group">
              <label>目标:</label>
              <select
                value={skillTarget || ''}
                onChange={(e) => setSkillTarget(e.target.value as SkillAction['target'] || undefined)}
              >
                <option value="">选择目标</option>
                {targetTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {!skillTarget && isSelfOnlySkill && (
                <div className="target-hint self-only">此技能未设置目标时将默认对自己释放</div>
              )}
              {!skillTarget && isHostileOnlySkill && (
                <div className="target-hint hostile-only">此技能未设置目标时将默认对当前目标释放</div>
              )}
              {!skillTarget && isAreaOnlySkill && (
                <div className="target-hint area-only">此技能未设置目标时将默认对(100,0,100)释放</div>
              )}
            </div>
            {skillTarget === 'id' && (
              <div className="input-group">
                <label>目标ID:</label>
                <input
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="输入目标ID"
                />
              </div>
            )}
            {skillTarget === 'coordinate' && (
              <div className="input-group">
                <label>坐标:</label>
                <div className="coordinate-input">
                  <input
                    type="number"
                    value={targetCoordinate.x}
                    onChange={(e) => setTargetCoordinate({ ...targetCoordinate, x: parseFloat(e.target.value) })}
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={targetCoordinate.y}
                    onChange={(e) => setTargetCoordinate({ ...targetCoordinate, y: parseFloat(e.target.value) })}
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    value={targetCoordinate.z}
                    onChange={(e) => setTargetCoordinate({ ...targetCoordinate, z: parseFloat(e.target.value) })}
                    placeholder="Z"
                  />
                </div>
              </div>
            )}
            <div className="input-group">
              <label>时间偏移(秒):</label>
              <div className="number-input">
                <input
                  type="number"
                  step="0.1"
                  value={timeOffset}
                  onChange={(e) => handleTimeOffsetChange(e.target.value)}
                />
                <div className="number-controls">
                  <button onClick={() => handleTimeOffsetChange((timeOffset - 0.1).toFixed(1))}>-</button>
                  <button onClick={() => handleTimeOffsetChange((timeOffset + 0.1).toFixed(1))}>+</button>
                </div>
              </div>
            </div>
            <div className="input-group">
              <label>
                <input
                  type="checkbox"
                  checked={forceUse}
                  onChange={(e) => setForceUse(e.target.checked)}
                />
                强制使用
              </label>
            </div>
            <div className="action-form-buttons">
              <button 
                className="action-add-button" 
                onClick={handleAddAction}
                disabled={!selectedGroupId || !skillId}
              >
                {isEditingAction ? '更新' : '添加'}
              </button>
              {isEditingAction && (
                <button 
                  className="action-cancel-button"
                  onClick={cancelEditingAction}
                >
                  取消
                </button>
              )}
            </div>
          </div>
        );
      
      case 'toggle':
        return (
          <div className="action-form">
            <div className="input-group">
              <label>开关名称:</label>
              <input
                type="text"
                value={toggleName}
                onChange={(e) => setToggleName(e.target.value)}
                placeholder="输入开关名称"
              />
            </div>
            <div className="input-group">
              <label>状态:</label>
              <select
                value={toggleState.toString()}
                onChange={(e) => setToggleState(e.target.value === 'true')}
              >
                <option value="true">开启</option>
                <option value="false">关闭</option>
              </select>
            </div>
            <div className="input-group">
              <label>时间偏移(秒):</label>
              <div className="number-input">
                <input
                  type="number"
                  step="0.1"
                  value={timeOffset}
                  onChange={(e) => handleTimeOffsetChange(e.target.value)}
                />
                <div className="number-controls">
                  <button onClick={() => handleTimeOffsetChange((timeOffset - 0.1).toFixed(1))}>-</button>
                  <button onClick={() => handleTimeOffsetChange((timeOffset + 0.1).toFixed(1))}>+</button>
                </div>
              </div>
            </div>
            <div className="action-form-buttons">
              <button 
                className="action-add-button" 
                onClick={handleAddAction}
                disabled={!selectedGroupId || !toggleName}
              >
                {isEditingAction ? '更新' : '添加'}
              </button>
              {isEditingAction && (
                <button 
                  className="action-cancel-button"
                  onClick={cancelEditingAction}
                >
                  取消
                </button>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // 渲染动作内容
  const renderActionContent = (action: Action) => {
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
    } else {
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
    }
    
    return action.enabled ? content : <span className="disabled-content">{content}</span>;
  };

  // 渲染条件表单
  const renderConditionForm = () => {
    switch (conditionType) {
      case 'skill_available':
        // 获取当前选择的技能信息
        const currentSkillInfo = skillConditionId ? skills.find(s => s.id === skillConditionId) : null;
        const skillName = currentSkillInfo ? currentSkillInfo.name : '';
        
        return (
          <div className="condition-form">
            <div className="input-group">
              <label>技能ID:</label>
              <SkillSearch
                value={skillConditionId}
                onChange={setSkillConditionId}
                onSelect={setSkillConditionId}
              />
            </div>
            {skillConditionId && (
              <div className="skill-info">
                <div className="skill-name">{skillName || '未知技能'}</div>
                <div className="skill-id">ID: {skillConditionId}</div>
              </div>
            )}
            <div className="action-form-buttons">
              <button 
                className="action-add-button" 
                onClick={handleAddCondition}
                disabled={!selectedGroupId || !skillConditionId}
              >
                {isEditingCondition ? '更新' : '添加'}
              </button>
              {isEditingCondition && (
                <button 
                  className="action-cancel-button"
                  onClick={cancelEditingCondition}
                >
                  取消
                </button>
              )}
            </div>
          </div>
        );
      
      case 'team_count':
        return (
          <div className="condition-form">
            <div className="input-group">
              <label>条件:</label>
              <select
                value={teamCountOperator}
                onChange={(e) => setTeamCountOperator(e.target.value as any)}
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>队友数量:</label>
              <div className="number-input">
                <input
                  type="number"
                  min="0"
                  value={teamCountValue}
                  onChange={(e) => setTeamCountValue(parseInt(e.target.value))}
                />
                <div className="number-controls">
                  <button onClick={() => setTeamCountValue(Math.max(0, teamCountValue - 1))}>-</button>
                  <button onClick={() => setTeamCountValue(teamCountValue + 1)}>+</button>
                </div>
              </div>
            </div>
            <div className="input-group">
              <label>检测范围(yalm):</label>
              <div className="number-input">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={teamCountRange}
                  onChange={(e) => setTeamCountRange(parseInt(e.target.value))}
                />
                <div className="number-controls">
                  <button onClick={() => setTeamCountRange(Math.max(1, teamCountRange - 1))}>-</button>
                  <button onClick={() => setTeamCountRange(Math.min(50, teamCountRange + 1))}>+</button>
                </div>
              </div>
            </div>
            <div className="action-form-buttons">
              <button 
                className="action-add-button" 
                onClick={handleAddCondition}
                disabled={!selectedGroupId}
              >
                {isEditingCondition ? '更新' : '添加'}
              </button>
              {isEditingCondition && (
                <button 
                  className="action-cancel-button"
                  onClick={cancelEditingCondition}
                >
                  取消
                </button>
              )}
            </div>
          </div>
        );
      
      case 'team_hp':
        return (
          <div className="condition-form">
            <div className="input-group">
              <label>团队血量百分比:</label>
              <div className="slider-container">
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="100"
                  value={teamCountValue}
                  onChange={(e) => setTeamCountValue(parseInt(e.target.value))}
                />
                <span className="slider-value">{teamCountValue}%</span>
              </div>
            </div>
            <div className="input-group">
              <label>
                <input
                  type="checkbox"
                  checked={excludeTank}
                  onChange={(e) => setExcludeTank(e.target.checked)}
                />
                排除坦克
              </label>
            </div>
            <div className="action-form-buttons">
              <button 
                className="action-add-button" 
                onClick={handleAddCondition}
                disabled={!selectedGroupId}
              >
                {isEditingCondition ? '更新' : '添加'}
              </button>
              {isEditingCondition && (
                <button 
                  className="action-cancel-button"
                  onClick={cancelEditingCondition}
                >
                  取消
                </button>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // 渲染条件内容
  const renderConditionContent = (condition: TimelineCondition) => {
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
    }
    
    return condition.enabled ? content : <span className="disabled-content">{content}</span>;
  };

  // 修改SkillSearch组件的onSelect处理
  const handleSkillSelect = (skillId: string) => {
    setSkillId(skillId);
  };

  // 动作管理功能
  // 添加或更新动作
  const handleAddAction = () => {
    if (!selectedGroupId) return;
    
    let newAction: Action | null = null;
    
    switch (actionType) {
      case 'skill':
        if (skillId) {
          // 查找技能信息
          const skillInfo = skills.find(s => s.id === skillId);
          
          // 确定目标
          let targetToUse = skillTarget;
          
          // 如果没有选择目标，根据技能类型设置默认目标
          if (skillInfo && !targetToUse) {
            // 只能对自己释放的技能
            if (skillInfo.canTargetSelf && !skillInfo.canTargetParty && !skillInfo.canTargetHostile) {
              targetToUse = 'self';
            }
            // 只能对敌人释放的技能
            else if (!skillInfo.canTargetSelf && !skillInfo.canTargetParty && skillInfo.canTargetHostile) {
              targetToUse = 'current';
            }
            // 只能对地面释放的技能
            else if (!skillInfo.canTargetSelf && !skillInfo.canTargetParty && !skillInfo.canTargetHostile && skillInfo.targetArea) {
              targetToUse = 'coordinate';
              // 设置默认坐标为 100,0,100
              setTargetCoordinate({ x: 100, y: 0, z: 100 });
            }
          }
          
          newAction = {
            type: 'skill',
            enabled: true,
            skillId,
            target: targetToUse || undefined,
            timeOffset,
            forceUse
          };
          
          // 根据目标类型添加额外属性
          if (targetToUse === 'id' && targetId) {
            (newAction as SkillAction).targetId = targetId;
          } else if (targetToUse === 'coordinate') {
            if (skillInfo && !skillInfo.canTargetSelf && !skillInfo.canTargetParty && !skillInfo.canTargetHostile && skillInfo.targetArea) {
              // 对地面释放的技能使用默认坐标
              (newAction as SkillAction).targetCoordinate = { x: 100, y: 0, z: 100 };
            } else {
              // 其他情况使用用户设置的坐标
              (newAction as SkillAction).targetCoordinate = targetCoordinate;
            }
          }
        }
        break;
      case 'toggle':
        if (toggleName) {
          newAction = {
            type: 'toggle',
            enabled: true,
            toggleName,
            state: toggleState,
            timeOffset
          };
        }
        break;
    }
    
    if (newAction) {
      const updatedGroups = groups.map(group => {
        if (group.id === selectedGroupId) {
          if (isEditingAction && editingActionIndex >= 0) {
            // 更新现有动作
            const updatedActions = [...group.actions];
            updatedActions[editingActionIndex] = newAction!;
            return { ...group, actions: updatedActions };
          } else {
            // 添加新动作
            return { ...group, actions: [...group.actions, newAction] };
          }
        }
        return group;
      });
      
      setGroups(updatedGroups);
      
      // 重置动作表单
      setIsEditingAction(false);
      setEditingActionIndex(-1);
      setSkillId('');
      setSkillTarget(undefined);
      setForceUse(false);
      setToggleName('');
      setToggleState(true);
      setTimeOffset(0);
    }
  };

  // 开始编辑动作
  const handleEditAction = (groupId: string, actionIndex: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const action = group.actions[actionIndex];
    setIsEditingAction(true);
    setEditingActionIndex(actionIndex);
    setActionType(action.type);
    setSelectedGroupId(groupId);
    
    // 根据动作类型设置表单值
    if (action.type === 'skill') {
      setSkillId(action.skillId);
      
      // 获取技能信息
      const skillInfo = skills.find(s => s.id === action.skillId);
      
      // 如果没有设置目标，根据技能类型设置默认目标
      if (skillInfo && !action.target) {
        // 只能对自己释放的技能
        if (skillInfo.canTargetSelf && !skillInfo.canTargetParty && !skillInfo.canTargetHostile) {
          setSkillTarget('self');
        }
        // 只能对敌人释放的技能
        else if (!skillInfo.canTargetSelf && !skillInfo.canTargetParty && skillInfo.canTargetHostile) {
          setSkillTarget('current');
        }
        // 只能对地面释放的技能
        else if (!skillInfo.canTargetSelf && !skillInfo.canTargetParty && !skillInfo.canTargetHostile && skillInfo.targetArea) {
          setSkillTarget('coordinate');
          // 设置默认坐标为 100,0,100
          setTargetCoordinate({ x: 100, y: 0, z: 100 });
        }
        else {
          setSkillTarget(action.target);
        }
      } else {
        setSkillTarget(action.target);
      }
      
      setForceUse(action.forceUse || false);
      
      // 设置目标ID和坐标（如果有）
      if (action.target === 'id' && action.targetId) {
        setTargetId(action.targetId);
      } else if (action.target === 'coordinate' && action.targetCoordinate) {
        setTargetCoordinate(action.targetCoordinate);
      }
    } else if (action.type === 'toggle') {
      setToggleName(action.toggleName);
      setToggleState(action.state);
    }
    
    setTimeOffset(action.timeOffset);
  };

  // 删除动作
  const handleRemoveAction = (groupId: string, actionIndex: number) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const newActions = [...group.actions];
        newActions.splice(actionIndex, 1);
        return { ...group, actions: newActions };
      }
      return group;
    });
    
    setGroups(updatedGroups);
    
    // 如果正在编辑此动作，取消编辑
    if (isEditingAction && selectedGroupId === groupId && editingActionIndex === actionIndex) {
      setIsEditingAction(false);
      setEditingActionIndex(-1);
    }
  };

  // 取消编辑动作
  const cancelEditingAction = () => {
    setIsEditingAction(false);
    setEditingActionIndex(-1);
    setSkillId('');
    setSkillTarget(undefined);
    setTargetId('');
    setTargetCoordinate({x: 100, y: 0, z: 100});
    setForceUse(false);
    setToggleName('');
    setToggleState(true);
    setTimeOffset(0);
  };

  // 条件管理功能
  // 添加条件
  const handleAddCondition = () => {
    if (!selectedGroupId) return;
    
    let newCondition: TimelineCondition | null = null;
    
    switch (conditionType) {
      case 'skill_available':
        if (skillConditionId) {
          newCondition = {
            type: 'skill_available',
            enabled: true,
            skillId: skillConditionId
          };
        }
        break;
      case 'team_count':
        newCondition = {
          type: 'team_count',
          enabled: true,
          operator: teamCountOperator,
          count: teamCountValue,
          range: teamCountRange
        };
        break;
      case 'team_hp':
        newCondition = {
          type: 'team_hp',
          enabled: true,
          hpPercent: teamCountValue,
          excludeTank
        };
        break;
    }
    
    if (newCondition) {
      const updatedGroups = groups.map(group => {
        if (group.id === selectedGroupId) {
          if (isEditingCondition && editingConditionIndex >= 0) {
            // 更新现有条件
            const updatedConditions = [...group.conditions];
            updatedConditions[editingConditionIndex] = newCondition!;
            return { ...group, conditions: updatedConditions };
          } else {
            // 添加新条件
            return { ...group, conditions: [...group.conditions, newCondition] };
          }
        }
        return group;
      });
      
      setGroups(updatedGroups);
      
      // 重置条件表单
      setIsEditingCondition(false);
      setEditingConditionIndex(-1);
      setSkillConditionId('');
      setTeamCountOperator('>=');
      setTeamCountValue(1);
      setTeamCountRange(30);
      setExcludeTank(false);
    }
  };

  // 开始编辑条件
  const handleEditCondition = (groupId: string, conditionIndex: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const condition = group.conditions[conditionIndex];
    setIsEditingCondition(true);
    setEditingConditionIndex(conditionIndex);
    setConditionType(condition.type);
    setSelectedGroupId(groupId);
    
    // 根据条件类型设置表单值
    if (condition.type === 'skill_available') {
      setSkillConditionId(condition.skillId);
    } else if (condition.type === 'team_count') {
      setTeamCountOperator(condition.operator);
      setTeamCountValue(condition.count);
      setTeamCountRange(condition.range);
    } else if (condition.type === 'team_hp') {
      setTeamCountValue(condition.hpPercent);
      setExcludeTank(condition.excludeTank);
    }
  };

  // 删除条件
  const handleRemoveCondition = (groupId: string, conditionIndex: number) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const newConditions = [...group.conditions];
        newConditions.splice(conditionIndex, 1);
        return { ...group, conditions: newConditions };
      }
      return group;
    });
    
    setGroups(updatedGroups);
    
    // 如果正在编辑此条件，取消编辑
    if (isEditingCondition && selectedGroupId === groupId && editingConditionIndex === conditionIndex) {
      setIsEditingCondition(false);
      setEditingConditionIndex(-1);
    }
  };

  // 取消编辑条件
  const cancelEditingCondition = () => {
    setIsEditingCondition(false);
    setEditingConditionIndex(-1);
    setSkillConditionId('');
    setTeamCountValue(1);
    setTeamCountRange(30);
    setExcludeTank(false);
  };

  return (
    <div className="groups-section">
      <div className="section-header">
        <h3>条件-动作组：{selectedEntry.text}</h3>
        <button 
          className="add-button" 
          onClick={() => {
            setIsEditingGroup(true);
            setEditingGroupId(null);
            setNewGroupName('');
          }}
          title="添加新组"
        >
          +
        </button>
      </div>
      
      {isEditingGroup && (
        <div className="group-form">
          <div className="input-group">
            <label>组名称:</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="输入组名称"
            />
          </div>

          <div className="input-group">
            <label>超时时间 (秒):</label>
            <div className="number-input">
              <input 
                type="number" 
                value={newTimeout}
                onChange={(e) => handleNewTimeoutChange(e.target.value)}
              />
              <div className="number-controls">
                <button onClick={() => setNewTimeout(Math.max(1, newTimeout - 1))}>-</button>
                <button onClick={() => setNewTimeout(newTimeout + 1)}>+</button>
              </div>
            </div>
          </div>
          
          <div className="action-form-buttons">
            <button 
              className="action-add-button" 
              onClick={editingGroupId ? handleUpdateGroupName : handleCreateGroup}
            >
              {editingGroupId ? '更新' : '创建'}
            </button>
            <button 
              className="action-cancel-button"
              onClick={() => {
                setIsEditingGroup(false);
                setEditingGroupId(null);
                setNewGroupName('');
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
      
      <div className="groups-list">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div 
              key={group.id} 
              className={`group-item ${selectedGroupId === group.id ? 'selected' : ''} ${!group.enabled ? 'disabled' : ''}`}
            >
              <div 
                className="group-header"
                onClick={() => {
                  console.log('点击组标题');
                  handleSelectGroup(group.id);
                }}
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
                      <span>{group.timeout} 秒</span>
                    </div>
                  </div>
                  
                  <div className="conditions-section">
                    <div className="section-header">
                      <h4>条件</h4>
                    </div>
                    <div className="condition-tabs">
                      <div className="tab-scroll-container">
                        <div className="tab-selection">
                          {conditionTypes.map((type) => (
                            <button 
                              key={type.id}
                              className={`tab-button ${conditionType === type.id ? 'active' : ''}`}
                              onClick={() => handleConditionTypeChange(type.id)}
                            >
                              {type.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="tab-content">
                        {renderConditionForm()}
                      </div>
                    </div>
                    
                    <div className="conditions-list">
                      {group.conditions.length > 0 ? (
                        group.conditions.map((condition, condIndex) => (
                          <div 
                            key={condIndex} 
                            className={`condition-item ${isEditingCondition && editingConditionIndex === condIndex ? 'editing' : ''} ${!condition.enabled ? 'disabled' : ''}`}
                          >
                            <button 
                              className={`toggle-button ${condition.enabled ? 'enabled' : 'disabled'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleConditionEnabled(group.id, condIndex);
                              }}
                              title={condition.enabled ? "禁用条件" : "启用条件"}
                            >
                              {condition.enabled ? "✓" : "✗"}
                            </button>
                            <span className="condition-number">{condIndex + 1}</span>
                            <span className="condition-content">
                              {renderConditionContent(condition)}
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
                  
                  <div className="actions-section">
                    <div className="section-header">
                      <h4>动作</h4>
                    </div>
                    <div className="action-tabs">
                      <div className="tab-scroll-container">
                        <div className="tab-selection">
                          {actionTypes.map((type) => (
                            <button 
                              key={type.id}
                              className={`tab-button ${actionType === type.id ? 'active' : ''}`}
                              onClick={() => handleActionTypeChange(type.id)}
                            >
                              {type.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="tab-content">
                        {renderActionForm()}
                      </div>
                    </div>
                    
                    <div className="actions-list">
                      {group.actions.length > 0 ? (
                        group.actions.map((action, actionIndex) => (
                          <div 
                            key={actionIndex} 
                            className={`action-item ${isEditingAction && editingActionIndex === actionIndex ? 'editing' : ''} ${!action.enabled ? 'disabled' : ''}`}
                          >
                            <button 
                              className={`toggle-button ${action.enabled ? 'enabled' : 'disabled'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActionEnabled(group.id, actionIndex);
                              }}
                              title={action.enabled ? "禁用动作" : "启用动作"}
                            >
                              {action.enabled ? "✓" : "✗"}
                            </button>
                            <span className="action-number">{actionIndex + 1}</span>
                            <span className="action-content">
                              {renderActionContent(action)}
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
          ))
        ) : (
          <div className="no-groups">尚未创建任何条件-动作组</div>
        )}
      </div>
    </div>
  );
};

export default ConditionActionGroupManager; 