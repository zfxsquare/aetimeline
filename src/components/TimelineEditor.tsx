import React, { useState, useEffect, useRef, useMemo } from 'react';
import './TimelineEditor.css';

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

type TimelineCondition = SkillCondition | TeamCountCondition;

interface SkillAction {
  type: 'skill';
  enabled: boolean;
  skillId: string;
  target?: 'current' | 'self' | 'current_target' | 'party1' | 'party2' | 'party3' | 'party4' | 'party5' | 'party6' | 'party7' | 'party8';
  timeOffset: number;
}

interface ToggleAction {
  type: 'toggle';
  enabled: boolean;
  toggleName: string;
  state: boolean;
  timeOffset: number;
}

type Action = SkillAction | ToggleAction;

// 定义一个条件-动作组
interface ConditionActionGroup {
  id: string;  // 组的唯一标识
  name: string; // 组的名称
  eventType: string; // 触发事件类型
  timeout: number; // 超时时间
  enabled: boolean; // 是否启用
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
  groups?: ConditionActionGroup[]; // 使用组代替单独的actions/conditions
}

interface TimelineConfig {
  name: string;
  entries: TimelineEntry[];
}

// 用于存储条目和组之间关系的映射
interface EntryGroupMap {
  [entryId: string]: ConditionActionGroup[];
}

interface TimelineEditorProps {
  importedEntries?: TimelineEntry[];
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
  { value: 'party8', label: '小队8' }
];

const TimelineEditor: React.FC<TimelineEditorProps> = ({ importedEntries = [] }) => {
  // 基本配置状态
  const [name, setName] = useState('timeline');
  
  // 条目相关状态
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(importedEntries);
  const [searchText, setSearchText] = useState('');
  const [showTimes, setShowTimes] = useState(false);
  
  // 条件-动作组相关状态
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<ConditionActionGroup[]>([]); // 当前选中条目的组
  const [entryGroupMap, setEntryGroupMap] = useState<EntryGroupMap>({});
  
  // 组编辑状态
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newEventType, setNewEventType] = useState('OnCastStart');
  const [newTimeout, setNewTimeout] = useState(10);
  
  // 动作编辑状态
  const [actionType, setActionType] = useState<string>('skill');
  const [isEditingAction, setIsEditingAction] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number>(-1);
  const [skillId, setSkillId] = useState('');
  const [skillTarget, setSkillTarget] = useState<SkillAction['target']>(undefined);
  const [toggleName, setToggleName] = useState('');
  const [toggleState, setToggleState] = useState(true);
  const [timeOffset, setTimeOffset] = useState(0);
  
  // 条件编辑状态
  const [conditionType, setConditionType] = useState<string>('skill_available');
  const [isEditingCondition, setIsEditingCondition] = useState(false);
  const [editingConditionIndex, setEditingConditionIndex] = useState<number>(-1);
  const [skillConditionId, setSkillConditionId] = useState('');
  const [teamCountOperator, setTeamCountOperator] = useState<'>' | '<' | '==' | '>=' | '<='>('>=');
  const [teamCountValue, setTeamCountValue] = useState(1);
  const [teamCountRange, setTeamCountRange] = useState(30);
  
  // 导入文件的引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当导入的条目发生变化时更新本地状态
  useEffect(() => {
    setTimelineEntries(importedEntries);
  }, [importedEntries]);
  
  // 选项数据
  const actionTypes: ActionType[] = [
    { id: 'skill', name: '使用技能' },
    { id: 'toggle', name: '切换开关' }
  ];

  const conditionTypes = [
    { id: 'skill_available', name: '技能可用' },
    { id: 'team_count', name: '周围队友' }
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

  // 生成条目的唯一标识符
  const getEntryId = (entry: TimelineEntry) => {
    return `${entry.time}-${entry.text}`;
  };

  // 过滤时间轴条目
  const filteredEntries = useMemo(() => {
    // 如果搜索框为空，返回所有条目
    if (!searchText.trim()) {
      return timelineEntries;
    }
    
    const lowerSearchText = searchText.toLowerCase();
    
    return timelineEntries.filter(entry => {
      // 1. 检查条目文本是否匹配
      const textMatch = entry.text.toLowerCase().includes(lowerSearchText);
      if (textMatch) {
        return true;
      }
      
      // 2. 检查该条目的组中的名称、动作和条件是否匹配
      const entryId = getEntryId(entry);
      const groupsForEntry = entryGroupMap[entryId] || [];
      
      return groupsForEntry.some(group => {
        // 检查组名称
        if (group.name && group.name.toLowerCase().includes(lowerSearchText)) {
          return true;
        }
        
        // 检查条件
        const conditionMatch = group.conditions.some(condition => {
          if (condition.type === 'skill_available') {
            return condition.skillId.toLowerCase().includes(lowerSearchText);
          } else if (condition.type === 'team_count') {
            // 搜索团队数量条件的操作符和数值
            const operatorText = operators.find(op => op.value === condition.operator)?.label || '';
            return operatorText.includes(lowerSearchText) || 
                   condition.count.toString().includes(lowerSearchText) ||
                   condition.range.toString().includes(lowerSearchText);
          }
          return false;
        });
        
        if (conditionMatch) return true;
        
        // 检查动作
        return group.actions.some(action => {
          if (action.type === 'skill') {
            return action.skillId.toLowerCase().includes(lowerSearchText) || 
                  (action.target && action.target.toLowerCase().includes(lowerSearchText));
          } else if (action.type === 'toggle') {
            return action.toggleName.toLowerCase().includes(lowerSearchText);
          }
          return false;
        });
      });
    });
  }, [timelineEntries, searchText, entryGroupMap, operators]);

  // 处理条目选择
  const handleEntrySelect = (entry: TimelineEntry) => {
    setSelectedEntry(entry);
    
    // 加载该条目的所有组
    const entryId = getEntryId(entry);
    const groupsForEntry = entryGroupMap[entryId] || [];
    setGroups(groupsForEntry);
    
    // 重置所有编辑状态
    resetAllEditStates();
  };

  // 重置所有编辑状态
  const resetAllEditStates = () => {
    // 重置组编辑状态
    setIsEditingGroup(false);
    setEditingGroupId(null);
    setNewGroupName('');
    setSelectedGroupId(null);
    
    // 重置动作编辑状态
    setIsEditingAction(false);
    setEditingActionIndex(-1);
    setSkillId('');
    setSkillTarget(undefined);
    setToggleName('');
    setToggleState(true);
    setTimeOffset(0);
    
    // 重置条件编辑状态
    setIsEditingCondition(false);
    setEditingConditionIndex(-1);
    setSkillConditionId('');
    setTeamCountOperator('>=');
    setTeamCountValue(1);
    setTeamCountRange(30);
  };

  // 保存当前条目的组
  const saveGroupsForCurrentEntry = () => {
    if (selectedEntry) {
      const entryId = getEntryId(selectedEntry);
      const updatedMap = { ...entryGroupMap };
      updatedMap[entryId] = [...groups];
      setEntryGroupMap(updatedMap);
    }
  };

  // 当组发生变化时保存
  useEffect(() => {
    saveGroupsForCurrentEntry();
  }, [groups]);

  // 创建新组
  const handleCreateGroup = () => {
    if (!selectedEntry) return;
    
    const newGroup: ConditionActionGroup = {
      id: generateId(),
      name: newGroupName || `组 ${groups.length + 1}`,
      eventType: newEventType,
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
    setNewEventType(group.eventType);
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
            eventType: newEventType,
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

  // 导出时间轴配置
  const exportTimeline = () => {
    // 确保所有组已保存
    saveGroupsForCurrentEntry();
    
    // 创建带有组的时间轴条目副本
    const entriesWithGroups = timelineEntries.map(entry => {
      const entryId = getEntryId(entry);
      const groupsForEntry = entryGroupMap[entryId] || [];
      
      return {
        ...entry,
        groups: groupsForEntry
      };
    });
    
    // 创建配置对象
    const config: TimelineConfig = {
      name,
      entries: entriesWithGroups
    };

    // 将配置转换为JSON字符串
    const jsonString = JSON.stringify(config, null, 2);

    // 创建下载链接
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'timeline'}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // 切换是否显示时间
  const toggleShowTimes = () => {
    setShowTimes(!showTimes);
  };

  // 触发文件选择对话框
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 导入时间轴配置
  const importTimeline = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config: TimelineConfig = JSON.parse(content);
        
        // 更新编辑器状态
        setName(config.name || '');
        
        // 处理时间轴条目和组映射
        if (config.entries && config.entries.length > 0) {
          // 提取不带组的条目用于显示
          const entriesWithoutGroups = config.entries.map(entry => {
            const { groups, ...entryWithoutGroups } = entry as any;
            return entryWithoutGroups;
          });
          
          setTimelineEntries(entriesWithoutGroups);
          
          // 建立条目-组映射
          const newEntryGroupMap: EntryGroupMap = {};
          
          config.entries.forEach(entry => {
            const entryId = getEntryId(entry);
            if ((entry as any).groups && (entry as any).groups.length > 0) {
              newEntryGroupMap[entryId] = (entry as any).groups;
            } else {
              // 兼容旧格式: 如果存在actions但没有groups，创建单个组
              if ((entry as any).actions && (entry as any).actions.length > 0) {
                const newGroup: ConditionActionGroup = {
                  id: generateId(),
                  name: "导入的动作",
                  eventType: 'OnCastStart',
                  timeout: 10,
                  enabled: true,
                  conditions: [],
                  actions: (entry as any).actions
                };
                newEntryGroupMap[entryId] = [newGroup];
              }
            }
          });
          
          setEntryGroupMap(newEntryGroupMap);
          
          // 选择第一个条目
          if (config.entries.length > 0) {
            const firstEntry = entriesWithoutGroups[0];
            setSelectedEntry(firstEntry);
            
            const firstEntryId = getEntryId(firstEntry);
            const groupsForFirstEntry = newEntryGroupMap[firstEntryId] || [];
            setGroups(groupsForFirstEntry);
          }
        }
        
        // 重置所有编辑状态
        resetAllEditStates();
        
        // 显示成功消息
        alert('时间轴导入成功！');
      } catch (error) {
        alert('导入失败：文件格式错误');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
    
    // 重置文件输入，以便可以再次选择同一文件
    event.target.value = '';
  };

  // 渲染动作表单
  const renderActionForm = () => {
    switch (actionType) {
      case 'skill':
        return (
          <div className="action-form">
            <div className="input-group">
              <label>技能ID:</label>
              <input
                type="text"
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                placeholder="输入技能ID"
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
      content = (
        <>
          <span className="action-type">使用技能</span>: {action.skillId} 
          <span className="action-detail">目标</span>: {targetLabel}
          <span className="action-detail">偏移</span>: 
          <span className={`time-offset ${action.timeOffset > 0 ? 'positive' : action.timeOffset < 0 ? 'negative' : ''}`}>
            {action.timeOffset > 0 ? '+' : ''}{action.timeOffset}s
          </span>
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

  // 动作管理功能
  // 添加或更新动作
  const handleAddAction = () => {
    if (!selectedGroupId) return;
    
    let newAction: Action | null = null;
    
    switch (actionType) {
      case 'skill':
        if (skillId) {
          newAction = {
            type: 'skill',
            enabled: true,
            skillId,
            target: skillTarget || undefined,
            timeOffset
          };
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
      setSkillTarget(action.target);
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
    setToggleName('');
    setToggleState(true);
    setTimeOffset(0);
  };

  // 处理动作类型切换
  const handleActionTypeChange = (newType: string) => {
    setActionType(newType);
    if (isEditingAction) {
      cancelEditingAction();
    }
  };

  // 处理时间偏移变更
  const handleTimeOffsetChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setTimeOffset(num);
    }
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
    setTeamCountOperator('>=');
    setTeamCountValue(1);
    setTeamCountRange(30);
  };

  // 处理条件类型切换
  const handleConditionTypeChange = (newType: string) => {
    setConditionType(newType);
    if (isEditingCondition) {
      cancelEditingCondition();
    }
  };

  // 渲染条件表单
  const renderConditionForm = () => {
    switch (conditionType) {
      case 'skill_available':
        return (
          <div className="condition-form">
            <div className="input-group">
              <label>技能ID:</label>
              <input
                type="text"
                value={skillConditionId}
                onChange={(e) => setSkillConditionId(e.target.value)}
                placeholder="输入技能ID"
              />
            </div>
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
      
      default:
        return null;
    }
  };

  // 渲染条件内容
  const renderConditionContent = (condition: TimelineCondition) => {
    let content: React.ReactNode;
    
    if (condition.type === 'skill_available') {
      content = (
        <>
          <span className="condition-type">技能可用</span>: {condition.skillId}
        </>
      );
    } else {
      content = (
        <>
          <span className="condition-type">周围队友</span>: 
          {operators.find(op => op.value === condition.operator)?.label || condition.operator} {condition.count} 人
          <span className="condition-detail">检测范围</span>: {condition.range} yalm
        </>
      );
    }
    
    return condition.enabled ? content : <span className="disabled-content">{content}</span>;
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

  return (
    <div className="timeline-editor">
      <div className="editor-layout">
        <div className="editor-sidebar">
          <div className="sidebar-header">
            <h3>时间轴编辑器</h3>
            <div className="import-export-buttons">
              <button 
                className="import-button" 
                onClick={triggerFileInput}
                title="导入整个时间轴配置，包括所有条目和动作"
              >
                导入时间轴
              </button>
              <button 
                className="export-button" 
                onClick={exportTimeline}
                disabled={!name}
                title="导出整个时间轴配置，包括所有条目和动作"
              >
                导出时间轴
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={importTimeline}
              />
            </div>
          </div>
          
          <div className="timeline-name-input">
            <div className="input-group">
              <label>时间轴名称：</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入时间轴名称"
              />
            </div>
          </div>
          
          <div className="sidebar-content">
            <div className="reactions-section">
              <div className="reactions-list">
                <div className="search-bar">
                  <div className="search-options">
                    <input 
                      type="text" 
                      placeholder="搜索条目或动作..." 
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <button 
                      className={`time-toggle-button ${showTimes ? 'active' : ''}`}
                      onClick={toggleShowTimes}
                      title={showTimes ? "隐藏时间" : "显示时间"}
                    >
                      <i className="time-icon">{showTimes ? "⏱️" : "⏲️"}</i>
                    </button>
                  </div>
                </div>
                <div className="entries-list">
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry, index) => {
                      const entryId = getEntryId(entry);
                      const hasGroups = entryGroupMap[entryId] && entryGroupMap[entryId].length > 0;
                      
                      return (
                        <div 
                          key={index}
                          className={`entry-item ${selectedEntry === entry ? 'selected' : ''} ${hasGroups ? 'has-actions' : ''}`}
                          onClick={() => handleEntrySelect(entry)}
                        >
                          {showTimes && (
                            <span className="entry-time-display">{entry.time.toFixed(1)}</span>
                          )}
                          <span className="entry-text-display">{entry.text}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-entries">导入时间轴条目或添加新条目</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="editor-main">
          <div className="editor-content">
            {selectedEntry && (
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
                      <label>事件：</label>
                      <select 
                        value={newEventType}
                        onChange={(e) => setNewEventType(e.target.value)}
                      >
                        <option value="OnCastStart">读条开始</option>
                        <option value="OnCastEnd">读条结束</option>
                      </select>
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
                            <span className="group-event-type">事件: {group.eventType === 'OnCastStart' ? '读条开始' : '读条结束'}</span>
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
                                <label>事件类型:</label>
                                <span>{group.eventType === 'OnCastStart' ? '读条开始' : '读条结束'}</span>
                              </div>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor; 