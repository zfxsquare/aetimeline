import React, { useState, useEffect, useRef, useMemo } from 'react';
import './TimelineEditor.css';
import ConditionActionGroupManager from './ConditionActionGroupManager';
import { skills } from '../data/skills';

// 在文件开头添加职业枚举
enum Jobs {
  // 坦克
  Paladin = "Paladin",
  Warrior = "Warrior",
  DarkKnight = "DarkKnight",
  Gunbreaker = "Gunbreaker",
  
  // 奶妈
  WhiteMage = "WhiteMage",
  Scholar = "Scholar",
  Astrologian = "Astrologian",
  Sage = "Sage",
  
  // DPS
  Monk = "Monk",
  Dragoon = "Dragoon",
  Ninja = "Ninja",
  Samurai = "Samurai",
  Reaper = "Reaper",
  Bard = "Bard",
  Machinist = "Machinist",
  Dancer = "Dancer",
  BlackMage = "BlackMage",
  Summoner = "Summoner",
  RedMage = "RedMage",
  BlueMage = "BlueMage",
  
  // 新职业
  Viper = "Viper",
  Pictomancer = "Pictomancer"
}

// 职业分类
enum JobCategory {
  Tank = "坦克",
  Healer = "治疗",
  DPS = "输出"
}

// 职业名称映射
const jobNames: { [key in Jobs]: string } = {
  // 坦克
  [Jobs.Paladin]: "骑士",
  [Jobs.Warrior]: "战士",
  [Jobs.DarkKnight]: "黑骑",
  [Jobs.Gunbreaker]: "枪刃",
  
  // 奶妈
  [Jobs.WhiteMage]: "白魔",
  [Jobs.Scholar]: "学者",
  [Jobs.Astrologian]: "占星",
  [Jobs.Sage]: "贤者",
  
  // DPS
  [Jobs.Monk]: "武僧",
  [Jobs.Dragoon]: "龙骑",
  [Jobs.Ninja]: "忍者",
  [Jobs.Samurai]: "武士",
  [Jobs.Reaper]: "镰刀",
  [Jobs.Bard]: "诗人",
  [Jobs.Machinist]: "机工",
  [Jobs.Dancer]: "舞者",
  [Jobs.BlackMage]: "黑魔",
  [Jobs.Summoner]: "召唤",
  [Jobs.RedMage]: "赤魔",
  [Jobs.BlueMage]: "青魔",
  
  // 新职业
  [Jobs.Viper]: "蝰蛇",
  [Jobs.Pictomancer]: "画家"
};

// 职业分类映射
const jobCategories: { [key in Jobs]: JobCategory } = {
  // 坦克
  [Jobs.Paladin]: JobCategory.Tank,
  [Jobs.Warrior]: JobCategory.Tank,
  [Jobs.DarkKnight]: JobCategory.Tank,
  [Jobs.Gunbreaker]: JobCategory.Tank,
  
  // 奶妈
  [Jobs.WhiteMage]: JobCategory.Healer,
  [Jobs.Scholar]: JobCategory.Healer,
  [Jobs.Astrologian]: JobCategory.Healer,
  [Jobs.Sage]: JobCategory.Healer,
  
  // DPS
  [Jobs.Monk]: JobCategory.DPS,
  [Jobs.Dragoon]: JobCategory.DPS,
  [Jobs.Ninja]: JobCategory.DPS,
  [Jobs.Samurai]: JobCategory.DPS,
  [Jobs.Reaper]: JobCategory.DPS,
  [Jobs.Bard]: JobCategory.DPS,
  [Jobs.Machinist]: JobCategory.DPS,
  [Jobs.Dancer]: JobCategory.DPS,
  [Jobs.BlackMage]: JobCategory.DPS,
  [Jobs.Summoner]: JobCategory.DPS,
  [Jobs.RedMage]: JobCategory.DPS,
  [Jobs.BlueMage]: JobCategory.DPS,
  
  // 新职业
  [Jobs.Viper]: JobCategory.DPS,
  [Jobs.Pictomancer]: JobCategory.DPS
};

// 返回按类别排序的职业列表
const getOrderedJobs = (): {job: Jobs, name: string, category: JobCategory}[] => {
  return Object.entries(jobNames)
    .map(([job, name]) => ({
      job: job as Jobs,
      name,
      category: jobCategories[job as Jobs]
    }))
    .sort((a, b) => {
      // 先按类别排序：坦克 > 治疗 > DPS
      const categoryOrder = { [JobCategory.Tank]: 1, [JobCategory.Healer]: 2, [JobCategory.DPS]: 3 };
      const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
      if (categoryDiff !== 0) return categoryDiff;
      
      // 类别相同时按名称排序
      return a.name.localeCompare(b.name, 'zh-CN');
    });
};

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
  mapId: string;
  description: string;  // 添加描述字段
  author: string;      // 添加作者字段
  acr: string;         // 添加适用ACR字段
  job?: Jobs;          // 修改为单个职业
  ClearCustomed?: boolean;  // 添加是否证道字段
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
  const [mapId, setMapId] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [acr, setAcr] = useState('');
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);  // 添加展开状态
  const [selectedJob, setSelectedJob] = useState<Jobs | ''>('');  // 修改为单选
  const [clearCustomed, setClearCustomed] = useState(false);  // 添加是否证道状态
  
  // 条目相关状态
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(importedEntries);
  const [searchText, setSearchText] = useState('');
  const [showTimes, setShowTimes] = useState(false);
  const [showTimeDiff, setShowTimeDiff] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [timeFormat, setTimeFormat] = useState<'seconds' | 'minutes'>('seconds');
  
  // 条件-动作组相关状态
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<ConditionActionGroup[]>([]); // 当前选中条目的组
  const [entryGroupMap, setEntryGroupMap] = useState<EntryGroupMap>({});
  
  // 导入文件的引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 新增ref用于获取内容高度
  const infoContentRef = useRef<HTMLDivElement>(null);

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

  // 获取条目的唯一ID
  const getEntryId = (entry: TimelineEntry) => {
    return `${entry.time}:${entry.text}`;
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

  // 检查所有必填项是否已填写
  const validateRequiredFields = (): boolean => {
    return name.trim() !== '' && 
           mapId.trim() !== '' && 
           description.trim() !== '' && 
           author.trim() !== '' && 
           acr.trim() !== '' &&
           selectedJob !== '';  // 验证职业已选择
  };

  // 导出时间轴配置
  const exportTimeline = () => {
    // 检查必填项
    if (!validateRequiredFields()) {
      alert('请填写所有必填项：时间轴名称、地图ID、描述、作者、适用ACR和职业');
      return;
    }

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
      mapId,
      description,
      author,
      acr,
      job: selectedJob as Jobs,
      ClearCustomed: clearCustomed,  // 添加是否证道字段
      entries: entriesWithGroups
    };

    // 将配置转换为JSON字符串
    const jsonString = JSON.stringify(config, null, 2);

    // 获取所选职业的中文名称
    const jobName = jobNames[selectedJob as Jobs] || '';
    
    // 生成文件名: 时间轴名称-作者-职业
    const fileName = `${name}-${author}-${jobName}.json`;

    // 创建下载链接
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
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

  // 切换是否显示时间差
  const toggleShowTimeDiff = () => {
    setShowTimeDiff(!showTimeDiff);
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
        setMapId(config.mapId || '');
        setDescription(config.description || '');
        setAuthor(config.author || '');
        setAcr(config.acr || '');
        setSelectedJob(config.job || '');  // 设置选中的职业
        setClearCustomed(config.ClearCustomed || false);  // 设置是否证道状态
        
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
          
          <div className="timeline-info-container">
            <div className="timeline-info-header" onClick={() => setIsInfoExpanded(!isInfoExpanded)}>
              <h3>时间轴信息</h3>
              <span className={`expand-icon ${isInfoExpanded ? 'expanded' : ''}`}>▼</span>
            </div>
            
            {isInfoExpanded && (
              <div className="timeline-info-dropdown" ref={infoContentRef}>
                <div className="input-group">
                  <label>时间轴名称：<span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="输入时间轴名称"
                    className={name.trim() === '' ? 'invalid' : ''}
                  />
                </div>
                <div className="input-group">
                  <label>地图ID：<span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={mapId}
                    onChange={(e) => setMapId(e.target.value)}
                    placeholder="输入地图ID"
                    className={mapId.trim() === '' ? 'invalid' : ''}
                  />
                </div>
                <div className="input-group">
                  <label>时间轴描述：<span className="required">*</span></label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="输入时间轴描述"
                    rows={3}
                    className={description.trim() === '' ? 'invalid' : ''}
                  />
                </div>
                <div className="input-group">
                  <label>作者：<span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="输入作者名称"
                    className={author.trim() === '' ? 'invalid' : ''}
                  />
                </div>
                <div className="input-group">
                  <label>适用ACR：<span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={acr}
                    onChange={(e) => setAcr(e.target.value)}
                    placeholder="输入适用ACR"
                    className={acr.trim() === '' ? 'invalid' : ''}
                  />
                </div>
                <div className="input-group">
                  <label>适用职业：<span className="required">*</span></label>
                  <select 
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value as Jobs | '')}
                    className={selectedJob === '' ? 'invalid' : ''}
                  >
                    <option value="">请选择职业</option>
                    
                    {/* 按分类显示职业 */}
                    <optgroup label="坦克">
                      {getOrderedJobs()
                        .filter(item => item.category === JobCategory.Tank)
                        .map(({ job, name }) => (
                          <option key={job} value={job}>{name}</option>
                        ))
                      }
                    </optgroup>
                    
                    <optgroup label="治疗">
                      {getOrderedJobs()
                        .filter(item => item.category === JobCategory.Healer)
                        .map(({ job, name }) => (
                          <option key={job} value={job}>{name}</option>
                        ))
                      }
                    </optgroup>
                    
                    <optgroup label="输出">
                      {getOrderedJobs()
                        .filter(item => item.category === JobCategory.DPS)
                        .map(({ job, name }) => (
                          <option key={job} value={job}>{name}</option>
                        ))
                      }
                    </optgroup>
                  </select>
                </div>
                <div className="input-group">
                  <label>是否证道：</label>
                  <select
                    value={clearCustomed ? "true" : "false"}
                    onChange={(e) => setClearCustomed(e.target.value === "true")}
                  >
                    <option value="false">否</option>
                    <option value="true">是</option>
                  </select>
                </div>
              </div>
            )}
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
                  </div>
                  <div className="time-display-options">
                    <button 
                      className={`time-toggle-button ${showTimes ? 'active' : ''}`}
                      onClick={toggleShowTimes}
                      title={showTimes ? "隐藏时间" : "显示时间"}
                    >
                      {showTimes ? "隐藏时间" : "显示时间"}
                    </button>
                    <button
                      className={`time-format-button ${timeFormat === 'minutes' ? 'active' : ''}`}
                      onClick={toggleTimeFormat}
                      title={timeFormat === 'seconds' ? "切换到分:秒格式" : "切换到秒格式"}
                    >
                      {timeFormat === 'seconds' ? "秒" : "分:秒"}
                    </button>
                    <button
                      className={`time-diff-button ${showTimeDiff ? 'active' : ''}`}
                      onClick={toggleShowTimeDiff}
                      title={showTimeDiff ? "隐藏时间差" : "显示时间差"}
                    >
                      {showTimeDiff ? "隐藏时间差" : "显示时间差"}
                    </button>
                  </div>
                </div>
                <div className="entries-list">
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry, index) => {
                      const entryId = getEntryId(entry);
                      const hasGroups = entryGroupMap[entryId] && entryGroupMap[entryId].length > 0;
                      
                      // 计算与前一个条目的时间差
                      let timeDiff: number | null = null;
                      if (showTimeDiff && index > 0) {
                        timeDiff = entry.time - filteredEntries[index - 1].time;
                      }
                      
                      return (
                        <div 
                          key={index}
                          className={`entry-item ${selectedEntry === entry ? 'selected' : ''} ${hasGroups ? 'has-actions' : ''}`}
                          onClick={() => handleEntrySelect(entry)}
                        >
                          {showTimes && (
                            <span className="entry-time-display">{formatTime(entry.time)}</span>
                          )}
                          {showTimeDiff && index > 0 && timeDiff !== null && (
                            <span className={`entry-time-diff ${timeDiff > 0 ? 'positive' : timeDiff < 0 ? 'negative' : ''}`}>
                              {timeDiff > 0 ? '+' : ''}{formatTime(timeDiff)}
                            </span>
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
                timelineEntries={timelineEntries}
                entryGroupMap={entryGroupMap}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor; 