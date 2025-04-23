import React, { useState, useCallback } from 'react';
import { skills } from '../data/skills';
// 导入拆分后的条件组件
import SkillConditionComponent from './conditions/SkillCondition';
import TeamCountConditionComponent from './conditions/TeamCountCondition';
import TeamHpConditionComponent from './conditions/TeamHpCondition';
// 导入拆分后的动作组件
import SkillActionComponent from './actions/SkillAction';
import ToggleActionComponent from './actions/ToggleAction';
// 导入组组件
import ConditionActionGroupComponent from './ConditionActionGroup';
import GroupForm from './GroupForm';
// 导入样式
import './ConditionActionForm.css';
import './ConditionActionGroupManager.css';

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
  timelineEntries: TimelineEntry[];
  entryGroupMap: {[entryId: string]: ConditionActionGroup[]};
}

// 生成唯一ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

const ConditionActionGroupManager: React.FC<ConditionActionGroupManagerProps> = ({
  selectedEntry,
  groups,
  setGroups,
  selectedGroupId,
  setSelectedGroupId,
  resetAllEditStates,
  timelineEntries,
  entryGroupMap
}) => {
  // 组编辑状态
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newTimeout, setNewTimeout] = useState(10);
  
  // 复制粘贴相关状态
  const [copiedGroup, setCopiedGroup] = useState<ConditionActionGroup | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showPasteSuccess, setShowPasteSuccess] = useState(false);
  
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
  
  // 技能冷却状态
  const [skillCooldownInfo, setSkillCooldownInfo] = useState<{
    isCooldown: boolean;
    nextAvailableTime: number | null;
    cooldownInfo: string;
  } | undefined>(undefined);
  
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
      
      // 当更改时间偏移时，更新冷却状态
      if (skillId && selectedEntry) {
        const cooldownStatus = checkSkillCooldown(skillId, selectedEntry.time, num);
        setSkillCooldownInfo(cooldownStatus);
      }
    }
  };

  // 渲染动作表单
  const renderActionForm = () => {
    switch (actionType) {
      case 'skill':
        return (
          <SkillActionComponent
            skillId={skillId}
            setSkillId={setSkillId}
            skillTarget={skillTarget}
            setSkillTarget={setSkillTarget}
            timeOffset={timeOffset}
            handleTimeOffsetChange={handleTimeOffsetChange}
            forceUse={forceUse}
            setForceUse={setForceUse}
            targetId={targetId}
            setTargetId={setTargetId}
            targetCoordinate={targetCoordinate}
            setTargetCoordinate={setTargetCoordinate}
            handleAddAction={handleAddAction}
            isEditingAction={isEditingAction}
            selectedGroupId={selectedGroupId}
            cancelEditingAction={cancelEditingAction}
            handleSkillSelect={handleSkillSelect}
            cooldownInfo={skillCooldownInfo}
          />
        );
      
      case 'toggle':
        return (
          <ToggleActionComponent
            toggleName={toggleName}
            setToggleName={setToggleName}
            toggleState={toggleState}
            setToggleState={setToggleState}
            timeOffset={timeOffset}
            handleTimeOffsetChange={handleTimeOffsetChange}
            handleAddAction={handleAddAction}
            isEditingAction={isEditingAction}
            selectedGroupId={selectedGroupId}
            cancelEditingAction={cancelEditingAction}
          />
        );
      
      default:
        return null;
    }
  };

  // 渲染条件表单
  const renderConditionForm = () => {
    switch (conditionType) {
      case 'skill_available':
        return (
          <SkillConditionComponent
            skillConditionId={skillConditionId}
            setSkillConditionId={setSkillConditionId}
            handleAddCondition={handleAddCondition}
            isEditingCondition={isEditingCondition}
            selectedGroupId={selectedGroupId}
            cancelEditingCondition={cancelEditingCondition}
          />
        );
      
      case 'team_count':
        return (
          <TeamCountConditionComponent
            teamCountOperator={teamCountOperator}
            setTeamCountOperator={setTeamCountOperator}
            teamCountValue={teamCountValue}
            setTeamCountValue={setTeamCountValue}
            teamCountRange={teamCountRange}
            setTeamCountRange={setTeamCountRange}
            handleAddCondition={handleAddCondition}
            isEditingCondition={isEditingCondition}
            selectedGroupId={selectedGroupId}
            cancelEditingCondition={cancelEditingCondition}
          />
        );
      
      case 'team_hp':
        return (
          <TeamHpConditionComponent
            teamCountValue={teamCountValue}
            setTeamCountValue={setTeamCountValue}
            excludeTank={excludeTank}
            setExcludeTank={setExcludeTank}
            handleAddCondition={handleAddCondition}
            isEditingCondition={isEditingCondition}
            selectedGroupId={selectedGroupId}
            cancelEditingCondition={cancelEditingCondition}
          />
        );
      
      default:
        return null;
    }
  };

  // 修改SkillSearch组件的onSelect处理
  const handleSkillSelect = (skillId: string) => {
    setSkillId(skillId);
    
    // 当选择技能时检查冷却
    if (skillId && selectedEntry) {
      const cooldownStatus = checkSkillCooldown(skillId, selectedEntry.time, timeOffset);
      setSkillCooldownInfo(cooldownStatus);
    } else {
      setSkillCooldownInfo(undefined);
    }
  };

  // 动作管理功能
  // 添加或更新动作
  const handleAddAction = () => {
    if (!selectedGroupId) return;
    
    let newAction: Action | null = null;
    let addedSkillId = ''; // 记录添加的技能ID
    
    switch (actionType) {
      case 'skill':
        if (skillId) {
          addedSkillId = skillId; // 保存当前添加的技能ID
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
      // 记录添加前的技能和时间偏移量，用于后续计算
      const addedSkillTimeOffset = timeOffset;
      
      // 更新组
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
      
      // 更新状态
      setGroups(updatedGroups);
      
      // 如果是添加技能动作，需要重新计算冷却状态
      if (newAction.type === 'skill' && selectedEntry) {
        // 延迟更新冷却状态，确保组状态已更新
        setTimeout(() => {
          // 当前技能的信息
          const skillInfo = skills.find(s => s.id === addedSkillId);
          
          if (skillInfo) {
            console.log(`添加技能 ${addedSkillId}(${skillInfo.name})，立即更新冷却状态`);
            
            // 重新计算冷却状态（为下一次添加做准备）
            // 特别注意：这里需要正确传递时间点，下一个动作的时间点应该比当前动作晚
            const currentEntryTime = selectedEntry.time;
            // 计算一个新的时间偏移，确保它与当前添加的技能有区别
            const nextTimeOffset = addedSkillTimeOffset + 0.01; // 略微增加时间偏移
            
            const cooldownStatus = checkSkillCooldown(addedSkillId, currentEntryTime, nextTimeOffset);
            console.log('添加后更新冷却状态:', cooldownStatus);
            
            // 无论正在连续添加哪种技能，都更新界面显示
            setSkillId(addedSkillId); // 保持当前技能选中
            setSkillCooldownInfo(cooldownStatus);
          }
        }, 10); // 延长超时时间，确保状态已更新
      }
      
      // 重置动作表单但保留当前技能ID
      setIsEditingAction(false);
      setEditingActionIndex(-1);
      
      // 如果添加的是技能动作，保留技能ID以便连续添加
      if (newAction.type === 'skill') {
        // 保持同一个技能ID，但重置其他表单项
        setSkillTarget(undefined);
        setForceUse(false);
        setTimeOffset(0);
      } else {
        // 如果是其他类型的动作，完全重置表单
        setSkillId('');
        setSkillTarget(undefined);
        setForceUse(false);
        setToggleName('');
        setToggleState(true);
        setTimeOffset(0);
        setSkillCooldownInfo(undefined);
      }
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
      
      // 检查技能冷却状态
      if (skillInfo && selectedEntry) {
        const cooldownStatus = checkSkillCooldown(action.skillId, selectedEntry.time, action.timeOffset);
        setSkillCooldownInfo(cooldownStatus);
      } else {
        setSkillCooldownInfo(undefined);
      }
      
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
    setSkillCooldownInfo(undefined);
    
    // 清除操作类型状态，防止影响下次冷却检查
    setTimeout(() => {
      console.log('重置技能状态');
    }, 0);
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

  // 添加一个取消编辑组的函数
  const cancelEditingGroup = () => {
    setIsEditingGroup(false);
    setEditingGroupId(null);
    setNewGroupName('');
  };

  // 检查技能冷却状态的函数
  const checkSkillCooldown = (skillId: string, currentEntryTime: number, timeOffset: number): {
    isCooldown: boolean; // 是否在冷却中
    nextAvailableTime: number | null; // 下一次可用时间
    cooldownInfo: string; // 冷却信息描述
    cooldownSource?: { // 冷却来源信息（用于调试）
      type: 'timeline' | 'current_entry' | 'same_group';
      entryTime?: number;
      entryText?: string;
      actionTime: number;
    }
  } => {
    // 获取技能信息
    const skillInfo = skills.find(s => s.id === skillId);
    if (!skillInfo) {
      return { 
        isCooldown: false, 
        nextAvailableTime: null, 
        cooldownInfo: '未找到技能信息' 
      };
    }

    // 当前技能的重置时间（秒）
    const recastTime = skillInfo.recast;
    // 技能的最大充能数
    const maxCharges = skillInfo.maxcharge || 0;
    
    // 如果重置时间为0，则技能没有冷却
    if (recastTime <= 0) {
      return { 
        isCooldown: false, 
        nextAvailableTime: null, 
        cooldownInfo: '此技能没有冷却时间' 
      };
    }

    // 当前动作的实际执行时间点
    const actionTime = currentEntryTime + timeOffset;
    
    // 记录技能使用的时间列表和来源信息
    const usageTimesList: number[] = [];
    const usageSources: {
      type: 'timeline' | 'current_entry' | 'same_group';
      entryTime?: number;
      entryText?: string;
      actionTime: number;
    }[] = [];
    
    // 遍历所有时间轴条目
    for (const entry of timelineEntries) {
      const entryId = `${entry.time}:${entry.text}`;
      
      // 从entryGroupMap中获取该条目关联的所有组
      const groupsForEntry = entryGroupMap[entryId] || [];
      
      // 检查每个组中的技能使用
      for (const group of groupsForEntry) {
        // 跳过禁用的组
        if (!group.enabled) continue;
        
        // 检查每个组中的动作
        for (const action of group.actions) {
          // 只关注启用的技能动作且技能ID匹配
          if (action.type === 'skill' && action.enabled && action.skillId === skillId) {
            // 计算此动作的实际执行时间
            const actionExecTime = entry.time + action.timeOffset;
            
            // 注意: 这里不再判断时间先后，而是收集所有使用记录
            // 只要是时间轴上的使用记录，都应该计入计算
            usageTimesList.push(actionExecTime);
            usageSources.push({
              type: 'timeline',
              entryTime: entry.time,
              entryText: entry.text,
              actionTime: actionExecTime
            });
            console.log(`在条目 ${entry.time}:${entry.text} 发现技能 ${skillId} 使用记录，时间点: ${actionExecTime}`);
          }
        }
      }
    }
    
    // 在当前正在编辑的条目中也检查技能使用情况
    if (selectedEntry && selectedGroupId) {
      const currentGroups = groups.filter(group => group.enabled && group.id !== selectedGroupId);
      
      // 同样检查当前条目其他组中的技能使用
      for (const group of currentGroups) {
        for (const action of group.actions) {
          if (action.type === 'skill' && action.enabled && action.skillId === skillId) {
            const actionExecTime = currentEntryTime + action.timeOffset;
            
            // 同样不判断时间先后，收集所有使用记录
            usageTimesList.push(actionExecTime);
            usageSources.push({
              type: 'current_entry',
              entryTime: currentEntryTime,
              entryText: selectedEntry.text,
              actionTime: actionExecTime
            });
            console.log(`在当前条目的其他组中发现技能 ${skillId} 使用记录，时间点: ${actionExecTime}`);
          }
        }
      }
      
      // 检查当前正在编辑的组内的其他动作
      const currentGroup = groups.find(g => g.id === selectedGroupId);
      if (currentGroup) {
        for (let i = 0; i < currentGroup.actions.length; i++) {
          const action = currentGroup.actions[i];
          
          // 只跳过当前正在编辑的动作，其他同组中的相同技能都计入
          if (isEditingAction && editingActionIndex === i) {
            continue;
          }
          
          if (action.type === 'skill' && action.enabled && action.skillId === skillId) {
            const actionExecTime = currentEntryTime + action.timeOffset;
            
            // 添加所有同组内其他动作的使用记录，不考虑时间先后顺序
            usageTimesList.push(actionExecTime);
            usageSources.push({
              type: 'same_group',
              entryTime: currentEntryTime,
              entryText: selectedEntry.text,
              actionTime: actionExecTime
            });
            console.log(`在当前编辑的同一组内发现技能 ${skillId} 使用记录，时间点: ${actionExecTime}`);
          }
        }
        
        // 特殊处理：如果当前正在添加一个新的相同技能（非编辑模式），也计入使用记录
        // 这样能处理连续添加多个相同技能的情况
        if (!isEditingAction && skillId && actionType === 'skill') {
          // 记录当前即将添加的动作，假设它已经被添加
          const potentialActionTime = currentEntryTime + timeOffset;
          console.log(`检测到当前正在添加的相同技能 ${skillId}，计入使用记录，时间点: ${potentialActionTime}`);
          usageTimesList.push(potentialActionTime);
          usageSources.push({
            type: 'same_group',
            entryTime: currentEntryTime,
            entryText: selectedEntry.text,
            actionTime: potentialActionTime
          });
        }
      }
    }
    
    // 如果没有使用记录，技能可用
    if (usageTimesList.length === 0) {
      return { 
        isCooldown: false, 
        nextAvailableTime: null, 
        cooldownInfo: '技能可用' 
      };
    }
    
    // 按时间排序所有使用记录（从早到晚）
    usageTimesList.sort((a, b) => a - b);
    
    console.log(`技能${skillId}(${skillInfo.name})使用时间列表:`, usageTimesList, `当前时间: ${actionTime}`);
    
    // 对于充能技能，我们需要特殊处理
    if (maxCharges > 0) {
      // 采用更直接的充能计算方式
      console.log(`----充能技能计算开始----`);
      console.log(`技能: ${skillId}(${skillInfo.name}), 最大充能数: ${maxCharges}, 充能时间: ${recastTime}秒`);
      console.log(`当前时间点: ${actionTime}秒, 相关使用记录: ${usageTimesList.join(', ')}`);
      
      // 筛选当前时间点之前的使用记录
      const pastUsages = usageTimesList.filter(time => time < actionTime);
      
      // 如果没有过去的使用记录，技能是满充能的
      if (pastUsages.length === 0) {
        console.log(`没有过去的使用记录，技能满充能`);
        return {
          isCooldown: false,
          nextAvailableTime: null,
          cooldownInfo: `技能可用 (${maxCharges}/${maxCharges}充能)`,
          cooldownSource: undefined
        };
      }
      
      console.log(`过去的使用记录(${pastUsages.length}个): ${pastUsages.join(', ')}`);
      
      // 按照充能的简单规则：
      // 1. 初始充能是满的
      // 2. 每次使用消耗一层充能
      // 3. 每隔recastTime时间恢复一层充能
      // 4. 不能超过最大充能数
      
      // 计算从第一次使用到当前时间恢复了多少充能
      const firstUsageTime = pastUsages[0];
      const totalElapsedTime = actionTime - firstUsageTime;
      const totalRecoveredCharges = Math.floor(totalElapsedTime / recastTime);
      
      console.log(`从第一次使用(${firstUsageTime})到现在(${actionTime})过了${totalElapsedTime}秒, 总共恢复了${totalRecoveredCharges}充能`);
      
      // 计算当前可用充能 = 初始充能 - 使用次数 + 恢复充能数
      let currentCharges = maxCharges - pastUsages.length + totalRecoveredCharges;
      currentCharges = Math.min(maxCharges, Math.max(0, currentCharges));
      
      console.log(`计算: ${maxCharges}(初始) - ${pastUsages.length}(使用) + ${totalRecoveredCharges}(恢复) = ${currentCharges}(当前充能)`);
      
      // 计算下一次充能时间
      let nextChargeTime = null;
      if (currentCharges < maxCharges) {
        // 计算最后一次恢复充能的时间
        const lastRecoveryTime = firstUsageTime + (totalRecoveredCharges * recastTime);
        // 下一次恢复充能需要的时间
        nextChargeTime = lastRecoveryTime + recastTime;
        console.log(`下一次充能时间: ${nextChargeTime}秒`);
      }
      
      console.log(`----充能技能计算结束----`);
      
      // 判断是否有充能可用
      if (currentCharges > 0) {
        return {
          isCooldown: false,
          nextAvailableTime: nextChargeTime,
          cooldownInfo: `技能可用 (${currentCharges}/${maxCharges}充能)`,
          cooldownSource: usageSources[usageSources.length - 1]
        };
      } else {
        const remainingTime = nextChargeTime ? nextChargeTime - actionTime : 0;
        return {
          isCooldown: true,
          nextAvailableTime: nextChargeTime,
          cooldownInfo: `技能在冷却中 (还需 ${remainingTime.toFixed(1)} 秒获得下一次充能)`,
          cooldownSource: usageSources[usageSources.length - 1]
        };
      }
    } 
    // 普通技能（无充能）
    else {
      // 找到最近一次使用的时间
      const lastUsedTime = usageTimesList[usageTimesList.length - 1];
      
      // 计算冷却结束时间
      const cooldownEndTime = lastUsedTime + recastTime;
      
      // 检查当前时间点技能是否可用
      const isCooldown = cooldownEndTime > actionTime;
      
      console.log(`普通技能${skillId}计算结果:`, {
        lastUsedTime,
        recastTime,
        cooldownEndTime,
        actionTime,
        isCooldown
      });
      
      // 构建冷却信息
      let cooldownInfo = '';
      if (isCooldown) {
        const remainingTime = (cooldownEndTime - actionTime).toFixed(1);
        cooldownInfo = `技能在冷却中 (还需 ${remainingTime} 秒)`;
      } else {
        cooldownInfo = '技能可用';
      }
      
      return {
        isCooldown,
        nextAvailableTime: isCooldown ? cooldownEndTime : null,
        cooldownInfo,
        cooldownSource: usageSources[usageTimesList.length - 1]
      };
    }
  };

  // 复制组
  const handleCopyGroup = useCallback((groupId: string) => {
    const groupToCopy = groups.find(g => g.id === groupId);
    if (groupToCopy) {
      setCopiedGroup({...groupToCopy});
      // 显示复制成功提示
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  }, [groups]);

  // 粘贴组
  const handlePasteGroup = useCallback(() => {
    if (copiedGroup) {
      const newGroup = {
        ...copiedGroup,
        id: generateId(), // 生成新ID
        name: copiedGroup.name // 保持原名称不变
      };
      setGroups([...groups, newGroup]);
      // 显示粘贴成功提示
      setShowPasteSuccess(true);
      setTimeout(() => setShowPasteSuccess(false), 2000);
    }
  }, [copiedGroup, groups, setGroups]);

  return (
    <div className="groups-section">
      <div className="section-header">
        <h3>条件-动作组：{selectedEntry.text}</h3>
        <div className="header-buttons">
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
          {copiedGroup && (
            <button
              className="paste-button"
              onClick={handlePasteGroup}
              title="粘贴已复制的组"
            >
              <span className="icon">📋</span> 粘贴
            </button>
          )}
        </div>
      </div>
      
      {/* 复制状态显示区域 */}
      {copiedGroup && (
        <div className={`copy-status ${showCopySuccess ? 'success-flash' : ''} ${showPasteSuccess ? 'paste-flash' : ''}`}>
          <div className="copy-info">
            <span className="copy-icon">📋</span>
            <span className="copy-text">
              {showCopySuccess && <span className="copy-success">✓ 复制成功!</span>}
              {showPasteSuccess && <span className="paste-success">✓ 粘贴成功!</span>}
              {!showCopySuccess && !showPasteSuccess && '已复制:'} <strong>{copiedGroup.name}</strong>
            </span>
            <span className="copy-details">
              {copiedGroup.conditions.length} 个条件, {copiedGroup.actions.length} 个动作
            </span>
          </div>
          <button 
            className="clear-copy-button"
            onClick={() => setCopiedGroup(null)}
            title="清除复制内容"
          >
            ×
          </button>
        </div>
      )}
      
      {isEditingGroup && (
        <GroupForm
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          newTimeout={newTimeout}
          handleNewTimeoutChange={handleNewTimeoutChange}
          editingGroupId={editingGroupId}
          handleUpdateGroupName={handleUpdateGroupName}
          handleCreateGroup={handleCreateGroup}
          cancelEditingGroup={cancelEditingGroup}
        />
      )}
      
      <div className="groups-list">
        {groups.length > 0 ? (
          groups.map((group) => (
            <ConditionActionGroupComponent
              key={group.id}
              group={group}
              selectedGroupId={selectedGroupId}
              handleSelectGroup={handleSelectGroup}
              handleToggleGroupEnabled={handleToggleGroupEnabled}
              handleEditGroup={handleEditGroup}
              handleDeleteGroup={handleDeleteGroup}
              handleToggleConditionEnabled={handleToggleConditionEnabled}
              handleEditCondition={handleEditCondition}
              handleRemoveCondition={handleRemoveCondition}
              handleToggleActionEnabled={handleToggleActionEnabled}
              handleEditAction={handleEditAction}
              handleRemoveAction={handleRemoveAction}
              handleCopyGroup={handleCopyGroup}
            />
          ))
        ) : (
          <div className="no-groups">尚未创建任何条件-动作组</div>
        )}
      </div>
      
      {/* 条件和动作编辑区域 */}
      {selectedGroupId && (
        <div className="tab-sections">
          <div className="condition-tabs">
            <div className="section-header">
              <h4>添加条件</h4>
            </div>
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

          <div className="action-tabs">
            <div className="section-header">
              <h4>添加动作</h4>
            </div>
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
        </div>
      )}
    </div>
  );
};

export default ConditionActionGroupManager; 