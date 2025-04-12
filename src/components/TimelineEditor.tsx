import React, { useState, useEffect, useRef, useMemo } from 'react';
import './TimelineEditor.css';
import ConditionActionGroupManager from './ConditionActionGroupManager';
import { skills } from '../data/skills';

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

// 定义一个条件-动作组
interface ConditionActionGroup {
  id: string;  // 组的唯一标识
  name: string; // 组的名称
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

const TimelineEditor: React.FC<TimelineEditorProps> = ({ importedEntries = [] }) => {
  // 基本配置状态
  const [name, setName] = useState('timeline');
  
  // 条目相关状态
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(importedEntries);
  const [searchText, setSearchText] = useState('');
  const [showTimes, setShowTimes] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [timeFormat, setTimeFormat] = useState<'seconds' | 'minutes'>('seconds');
  
  // 条件-动作组相关状态
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<ConditionActionGroup[]>([]); // 当前选中条目的组
  const [entryGroupMap, setEntryGroupMap] = useState<EntryGroupMap>({});
  
  // 导入文件的引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当导入的条目发生变化时更新本地状态
  useEffect(() => {
    setTimelineEntries(importedEntries);
  }, [importedEntries]);
  
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
    setSelectedGroupId(null);
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
            // 通过技能ID查找技能名称
            const skillInfo = skills.find(s => s.id === condition.skillId);
            const skillName = skillInfo ? skillInfo.name.toLowerCase() : condition.skillId.toLowerCase();
            return skillName.includes(lowerSearchText) || condition.skillId.toLowerCase().includes(lowerSearchText);
          }
          return false;
        });
        
        if (conditionMatch) return true;
        
        // 检查动作
        return group.actions.some(action => {
          if (action.type === 'skill') {
            // 通过技能ID查找技能名称
            const skillInfo = skills.find(s => s.id === action.skillId);
            const skillName = skillInfo ? skillInfo.name.toLowerCase() : action.skillId.toLowerCase();
            return skillName.includes(lowerSearchText) || 
                   action.skillId.toLowerCase().includes(lowerSearchText) || 
                   (action.target && action.target.toLowerCase().includes(lowerSearchText));
          } else if (action.type === 'toggle') {
            return action.toggleName.toLowerCase().includes(lowerSearchText);
          }
          return false;
        });
      });
    });
  }, [timelineEntries, searchText, entryGroupMap]);

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

  // 切换时间显示格式
  const toggleTimeFormat = () => {
    setTimeFormat(timeFormat === 'seconds' ? 'minutes' : 'seconds');
  };

  // 格式化时间显示
  const formatTime = (timeInSeconds: number): string => {
    // 处理负数时间
    const isNegative = timeInSeconds < 0;
    const absTime = Math.abs(timeInSeconds);
    
    if (timeFormat === 'seconds') {
      return `${isNegative ? '-' : ''}${absTime.toFixed(1)}`;
    } else {
      const minutes = Math.floor(absTime / 60);
      const seconds = absTime % 60;
      return `${isNegative ? '-' : ''}${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
    }
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
              // 处理每个组中的动作，确保forceUse属性存在
              const processedGroups = (entry as any).groups.map((group: any) => ({
                ...group,
                actions: group.actions.map((action: any) => {
                  if (action.type === 'skill') {
                    return {
                      ...action,
                      forceUse: action.forceUse || false // 确保forceUse属性存在
                    };
                  }
                  return action;
                })
              }));
              newEntryGroupMap[entryId] = processedGroups;
            } else {
              // 兼容旧格式: 如果存在actions但没有groups，创建单个组
              if ((entry as any).actions && (entry as any).actions.length > 0) {
                const processedActions = (entry as any).actions.map((action: any) => {
                  if (action.type === 'skill') {
                    return {
                      ...action,
                      forceUse: action.forceUse || false // 确保forceUse属性存在
                    };
                  }
                  return action;
                });
                
                const newGroup: ConditionActionGroup = {
                  id: generateId(),
                  name: "导入的动作",
                  timeout: 10,
                  enabled: true,
                  conditions: [],
                  actions: processedActions
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

  // 初始化时从cookie中读取警告栏状态
  useEffect(() => {
    const warningClosed = getCookie('timeline_warning_closed');
    if (warningClosed === 'true') {
      setShowWarning(false);
    }
  }, []);

  // 设置cookie的函数
  const setCookie = (name: string, value: string, days: number = 365) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  // 获取cookie的函数
  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  // 处理关闭警告栏
  const handleCloseWarning = () => {
    setShowWarning(false);
    setCookie('timeline_warning_closed', 'true');
  };

  return (
    <div className="timeline-editor">
      {showWarning && (
        <div className="warning-banner">
          ⚠️ 警告：不要导入旧时间轴！新版本不兼容旧格式 ⚠️
          <button className="close-warning-button" onClick={handleCloseWarning}>
            我已知晓
          </button>
        </div>
      )}
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
                    <button
                      className={`time-format-button ${timeFormat === 'minutes' ? 'active' : ''}`}
                      onClick={toggleTimeFormat}
                      title={timeFormat === 'seconds' ? "切换到分:秒格式" : "切换到秒格式"}
                    >
                      {timeFormat === 'seconds' ? "s" : "m:s"}
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
                            <span className="entry-time-display">{formatTime(entry.time)}</span>
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
              <ConditionActionGroupManager
                selectedEntry={selectedEntry}
                groups={groups}
                setGroups={setGroups}
                selectedGroupId={selectedGroupId}
                setSelectedGroupId={setSelectedGroupId}
                resetAllEditStates={resetAllEditStates}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor; 