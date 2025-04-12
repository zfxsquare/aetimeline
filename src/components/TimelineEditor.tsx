import React, { useState, useEffect } from 'react';
import './TimelineEditor.css';
import SkillSearch from './SkillSearch';
import WarningBanner from './WarningBanner';
import ImportExport from './ImportExport';
import TimelineEntriesList from './TimelineEntriesList';
import ConditionActionGroupComponent from './ConditionActionGroup';
import { TimelineEntry, TimelineConfig, ConditionActionGroup as ConditionActionGroupType, SkillAction } from '../types/timeline';
import { generateId } from '../utils/timelineUtils';
import { targetTypes } from '../constants/timeline';

interface TimelineEditorProps {
  importedEntries?: TimelineEntry[];
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({ importedEntries = [] }) => {
  // 基本配置状态
  const [name, setName] = useState('timeline');
  const [showWarning, setShowWarning] = useState(true);
  
  // 条目相关状态
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(importedEntries);
  const [searchText, setSearchText] = useState('');
  const [showTimes, setShowTimes] = useState(false);
  const [timeFormat, setTimeFormat] = useState<'seconds' | 'minutes'>('seconds');
  
  // 条件-动作组相关状态
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<ConditionActionGroupType[]>([]);
  const [entryGroupMap, setEntryGroupMap] = useState<Record<string, ConditionActionGroupType[]>>({});
  
  // 组编辑状态
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
  
  // 当导入的条目发生变化时更新本地状态
  useEffect(() => {
    setTimelineEntries(importedEntries);
  }, [importedEntries]);

  // 处理条目选择
  const handleEntrySelect = (entry: TimelineEntry) => {
    setSelectedEntry(entry);
    setSelectedGroupId(null);
  };

  // 创建新组
  const handleCreateGroup = () => {
    if (!selectedEntry) return;
    
    const newGroup: ConditionActionGroupType = {
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
    
    setEditingGroupId(groupId);
    setNewGroupName(group.name);
    setNewTimeout(group.timeout);
  };

  // 删除组
  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = groups.filter(group => group.id !== groupId);
    setGroups(updatedGroups);
    
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
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
  const handleToggleConditionEnabled = (conditionIndex: number) => {
    if (selectedGroupId) {
      const updatedGroups = groups.map(group => {
        if (group.id === selectedGroupId) {
          const newConditions = [...group.conditions];
          newConditions[conditionIndex] = {
            ...newConditions[conditionIndex],
            enabled: !newConditions[conditionIndex].enabled
          };
          return { ...group, conditions: newConditions };
        }
        return group;
      });
      setGroups(updatedGroups);
    }
  };

  // 切换动作的启用状态
  const handleToggleActionEnabled = (actionIndex: number) => {
    if (selectedGroupId) {
      const updatedGroups = groups.map(group => {
        if (group.id === selectedGroupId) {
          const newActions = [...group.actions];
          newActions[actionIndex] = {
            ...newActions[actionIndex],
            enabled: !newActions[actionIndex].enabled
          };
          return { ...group, actions: newActions };
        }
        return group;
      });
      setGroups(updatedGroups);
    }
  };

  // 开始编辑条件
  const handleEditCondition = (conditionIndex: number) => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        const condition = group.conditions[conditionIndex];
        setIsEditingCondition(true);
        setEditingConditionIndex(conditionIndex);
        setConditionType(condition.type);
        
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
      }
    }
  };

  // 开始编辑动作
  const handleEditAction = (actionIndex: number) => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        const action = group.actions[actionIndex];
        setIsEditingAction(true);
        setEditingActionIndex(actionIndex);
        setActionType(action.type);
        
        // 根据动作类型设置表单值
        if (action.type === 'skill') {
          setSkillId(action.skillId);
          setSkillTarget(action.target);
          setForceUse(action.forceUse || false);
          setTimeOffset(action.timeOffset);
          
          if (action.target === 'id' && action.targetId) {
            setTargetId(action.targetId);
          } else if (action.target === 'coordinate' && action.targetCoordinate) {
            setTargetCoordinate(action.targetCoordinate);
          }
        } else if (action.type === 'toggle') {
          setToggleName(action.toggleName);
          setToggleState(action.state);
          setTimeOffset(action.timeOffset);
        }
      }
    }
  };

  // 删除条件
  const handleRemoveCondition = (conditionIndex: number) => {
    if (selectedGroupId) {
      const updatedGroups = groups.map(group => {
        if (group.id === selectedGroupId) {
          const newConditions = [...group.conditions];
          newConditions.splice(conditionIndex, 1);
          return { ...group, conditions: newConditions };
        }
        return group;
      });
      setGroups(updatedGroups);
      
      if (isEditingCondition && editingConditionIndex === conditionIndex) {
        setIsEditingCondition(false);
        setEditingConditionIndex(-1);
      }
    }
  };

  // 删除动作
  const handleRemoveAction = (actionIndex: number) => {
    if (selectedGroupId) {
      const updatedGroups = groups.map(group => {
        if (group.id === selectedGroupId) {
          const newActions = [...group.actions];
          newActions.splice(actionIndex, 1);
          return { ...group, actions: newActions };
        }
        return group;
      });
      setGroups(updatedGroups);
      
      if (isEditingAction && editingActionIndex === actionIndex) {
        setIsEditingAction(false);
        setEditingActionIndex(-1);
      }
    }
  };

  // 导出时间轴配置
  const handleExport = () => {
    const config: TimelineConfig = {
      name,
      entries: timelineEntries.map(entry => ({
        ...entry,
        groups: entryGroupMap[`${entry.time}-${entry.text}`] || []
      }))
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'timeline'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入时间轴配置
  const handleImport = (config: TimelineConfig) => {
    setName(config.name || '');
    setTimelineEntries(config.entries);
    
    const newEntryGroupMap: Record<string, ConditionActionGroupType[]> = {};
    config.entries.forEach(entry => {
      const entryId = `${entry.time}-${entry.text}`;
      if (entry.groups) {
        newEntryGroupMap[entryId] = entry.groups;
      }
    });
    setEntryGroupMap(newEntryGroupMap);
    
    if (config.entries.length > 0) {
      handleEntrySelect(config.entries[0]);
    }
  };

  return (
    <div className="timeline-editor">
      {showWarning && (
        <WarningBanner onClose={() => setShowWarning(false)} />
      )}
      <div className="editor-layout">
        <div className="editor-sidebar">
          <div className="sidebar-header">
            <h3>时间轴编辑器</h3>
            <ImportExport 
              name={name}
              onImport={handleImport}
              onExport={handleExport}
            />
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
            <TimelineEntriesList
              entries={timelineEntries}
              selectedEntry={selectedEntry}
              searchText={searchText}
              showTimes={showTimes}
              timeFormat={timeFormat}
              onEntrySelect={handleEntrySelect}
              onSearchChange={setSearchText}
              onToggleShowTimes={() => setShowTimes(!showTimes)}
              onToggleTimeFormat={() => setTimeFormat(timeFormat === 'seconds' ? 'minutes' : 'seconds')}
            />
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
                    onClick={handleCreateGroup}
                    title="添加新组"
                  >
                    +
                  </button>
                </div>
                
                <div className="groups-list">
                  {groups.map((group) => (
                    <ConditionActionGroupComponent
                      key={group.id}
                      group={group}
                      isSelected={selectedGroupId === group.id}
                      isEditing={editingGroupId === group.id}
                      onEdit={handleEditGroup}
                      onDelete={handleDeleteGroup}
                      onToggleEnabled={handleToggleGroupEnabled}
                      onToggleConditionEnabled={handleToggleConditionEnabled}
                      onToggleActionEnabled={handleToggleActionEnabled}
                      onEditCondition={handleEditCondition}
                      onEditAction={handleEditAction}
                      onRemoveCondition={handleRemoveCondition}
                      onRemoveAction={handleRemoveAction}
                    />
                  ))}
                </div>

                {isEditingAction && (
                  <div className="action-edit-form">
                    <h4>编辑动作</h4>
                    <div className="form-group">
                      <label>动作类型：</label>
                      <select 
                        value={actionType}
                        onChange={(e) => setActionType(e.target.value)}
                      >
                        <option value="skill">技能</option>
                        <option value="toggle">开关</option>
                      </select>
                    </div>

                    {actionType === 'skill' ? (
                      <>
                        <div className="form-group">
                          <label>技能：</label>
                          <SkillSearch
                            value={skillId}
                            onChange={setSkillId}
                          />
                        </div>
                        <div className="form-group">
                          <label>目标：</label>
                          <select
                            value={skillTarget}
                            onChange={(e) => setSkillTarget(e.target.value as SkillAction['target'])}
                          >
                            {targetTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={forceUse}
                              onChange={(e) => setForceUse(e.target.checked)}
                            />
                            强制使用
                          </label>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label>开关名称：</label>
                          <input
                            type="text"
                            value={toggleName}
                            onChange={(e) => setToggleName(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={toggleState}
                              onChange={(e) => setToggleState(e.target.checked)}
                            />
                            状态
                          </label>
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label>时间偏移：</label>
                      <input
                        type="number"
                        value={timeOffset}
                        onChange={(e) => setTimeOffset(Number(e.target.value))}
                      />
                    </div>

                    {skillTarget === 'id' && (
                      <div className="form-group">
                        <label>目标ID：</label>
                        <input
                          type="text"
                          value={targetId}
                          onChange={(e) => setTargetId(e.target.value)}
                        />
                      </div>
                    )}

                    {skillTarget === 'coordinate' && (
                      <div className="form-group">
                        <label>目标坐标：</label>
                        <div className="coordinate-inputs">
                          <input
                            type="number"
                            value={targetCoordinate.x}
                            onChange={(e) => setTargetCoordinate({...targetCoordinate, x: Number(e.target.value)})}
                            placeholder="X"
                          />
                          <input
                            type="number"
                            value={targetCoordinate.y}
                            onChange={(e) => setTargetCoordinate({...targetCoordinate, y: Number(e.target.value)})}
                            placeholder="Y"
                          />
                          <input
                            type="number"
                            value={targetCoordinate.z}
                            onChange={(e) => setTargetCoordinate({...targetCoordinate, z: Number(e.target.value)})}
                            placeholder="Z"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isEditingCondition && (
                  <div className="condition-edit-form">
                    <h4>编辑条件</h4>
                    <div className="form-group">
                      <label>条件类型：</label>
                      <select 
                        value={conditionType}
                        onChange={(e) => setConditionType(e.target.value)}
                      >
                        <option value="skill_available">技能可用</option>
                        <option value="team_count">队伍人数</option>
                        <option value="team_hp">队伍血量</option>
                      </select>
                    </div>

                    {conditionType === 'skill_available' && (
                      <div className="form-group">
                        <label>技能：</label>
                        <SkillSearch
                          value={skillConditionId}
                          onChange={setSkillConditionId}
                        />
                      </div>
                    )}

                    {conditionType === 'team_count' && (
                      <>
                        <div className="form-group">
                          <label>运算符：</label>
                          <select
                            value={teamCountOperator}
                            onChange={(e) => setTeamCountOperator(e.target.value as '>' | '<' | '==' | '>=' | '<=')}
                          >
                            <option value=">">大于</option>
                            <option value="<">小于</option>
                            <option value="==">等于</option>
                            <option value=">=">大于等于</option>
                            <option value="<=">小于等于</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>人数：</label>
                          <input
                            type="number"
                            value={teamCountValue}
                            onChange={(e) => setTeamCountValue(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label>范围：</label>
                          <input
                            type="number"
                            value={teamCountRange}
                            onChange={(e) => setTeamCountRange(Number(e.target.value))}
                          />
                        </div>
                      </>
                    )}

                    {conditionType === 'team_hp' && (
                      <>
                        <div className="form-group">
                          <label>血量百分比：</label>
                          <input
                            type="number"
                            value={teamCountValue}
                            onChange={(e) => setTeamCountValue(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={excludeTank}
                              onChange={(e) => setExcludeTank(e.target.checked)}
                            />
                            排除坦克
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor; 