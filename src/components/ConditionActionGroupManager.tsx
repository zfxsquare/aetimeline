import React, { useState, useCallback, useMemo } from 'react';
import { skills } from '../data/skills';
import SkillConditionComponent from './conditions/SkillCondition';
import TeamCountConditionComponent from './conditions/TeamCountCondition';
import TeamHpConditionComponent from './conditions/TeamHpCondition';
import SkillActionComponent from './actions/SkillAction';
import ToggleActionComponent from './actions/ToggleAction';
import GroupForm from './GroupForm';
import GroupList from './GroupList';
import GroupEditorHeader from './GroupEditorHeader';
import EditorTabs from './EditorTabs';
import './ConditionActionForm.css';
import './ConditionActionGroupManager.css';
import { useSkillCooldown } from '../hooks/useSkillCooldown';
import { SkillUsageMap } from '../services/SkillUsageService';
import { Action, ConditionActionGroup, TimelineCondition, TimelineEntry, SkillAction } from './types';

// 组件属性接口
interface ConditionActionGroupManagerProps {
  selectedEntry: TimelineEntry;
  groups: ConditionActionGroup[];
  setGroups: React.Dispatch<React.SetStateAction<ConditionActionGroup[]>>;
  selectedGroupId: string | null;
  setSelectedGroupId: React.Dispatch<React.SetStateAction<string | null>>;
  resetAllEditStates: () => void;
  skillUsageMap: SkillUsageMap;
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
  skillUsageMap
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
  const [skillId, setSkillId] = useState<string | null>(null);
  const [skillTarget, setSkillTarget] = useState<SkillAction['target']>(undefined);
  const [forceUse, setForceUse] = useState(false);
  const [toggleName, setToggleName] = useState('');
  const [toggleState, setToggleState] = useState(true);
  const [timeOffset, setTimeOffset] = useState(0);
  const [targetId, setTargetId] = useState('');
  const [targetCoordinate, setTargetCoordinate] = useState({ x: 100, y: 0, z: 100 });
  
  // --- 重构核心：使用 useSkillCooldown Hook ---
  const actionTime = selectedEntry ? selectedEntry.time + timeOffset : 0;

  const otherUsagesInCurrentAction = useMemo(() => {
    if (!selectedGroupId || !skillId) return [];
    
    const currentGroup = groups.find(g => g.id === selectedGroupId);
    if (!currentGroup) return [];

    return currentGroup.actions
      .map((action, index) => ({ action, index }))
      .filter(({ action, index }) => 
        action.type === 'skill' && 
        action.skillId === skillId &&
        // 排除正在编辑的同一个动作
        !(isEditingAction && editingActionIndex === index)
      )
      .map(({ action }) => selectedEntry.time + (action as SkillAction).timeOffset);
  }, [groups, selectedGroupId, skillId, isEditingAction, editingActionIndex, selectedEntry.time]);

  const cooldownStatus = useSkillCooldown(
    skillId,
    actionTime,
    skillUsageMap,
    otherUsagesInCurrentAction
  );
  // --- Hook 使用结束 ---
  
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
  const actionTypes = [
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
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    } else {
      setSelectedGroupId(groupId);
    }
    
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
            cooldownInfo={cooldownStatus}
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
  const handleSkillSelect = (skillId: string | null) => {
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
        setSkillId(null);
        setSkillTarget(undefined);
        setForceUse(false);
        setToggleName('');
        setToggleState(true);
        setTimeOffset(0);
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
    setSkillId(null);
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

  // 添加一个取消编辑组的函数
  const cancelEditingGroup = () => {
    setIsEditingGroup(false);
    setEditingGroupId(null);
    setNewGroupName('');
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
      <GroupEditorHeader
        selectedEntryText={selectedEntry.text}
        copiedGroup={copiedGroup}
        showCopySuccess={showCopySuccess}
        showPasteSuccess={showPasteSuccess}
        onAddNewGroup={() => {
          setIsEditingGroup(true);
          setEditingGroupId(null);
          setNewGroupName('');
        }}
        onPasteGroup={handlePasteGroup}
        onClearCopiedGroup={() => setCopiedGroup(null)}
      />
      
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
      
      <GroupList
        groups={groups}
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
      
      <EditorTabs
        selectedGroupId={selectedGroupId}
        conditionTypes={conditionTypes}
        actionTypes={actionTypes}
        conditionType={conditionType}
        actionType={actionType}
        handleConditionTypeChange={handleConditionTypeChange}
        handleActionTypeChange={handleActionTypeChange}
        renderConditionForm={renderConditionForm}
        renderActionForm={renderActionForm}
      />
    </div>
  );
};

export default ConditionActionGroupManager;