import React from 'react';
import SkillSearch from '../SkillSearch';
import { skills } from '../../data/skills';
import { FiClock, FiCheck } from 'react-icons/fi';

interface SkillActionProps {
  skillId: string;
  setSkillId: (id: string) => void;
  skillTarget: string | undefined;
  setSkillTarget: (target: any) => void;
  timeOffset: number;
  handleTimeOffsetChange: (value: string) => void;
  forceUse: boolean;
  setForceUse: (force: boolean) => void;
  targetId: string;
  setTargetId: (id: string) => void;
  targetCoordinate: { x: number; y: number; z: number };
  setTargetCoordinate: (coords: { x: number; y: number; z: number }) => void;
  handleAddAction: () => void;
  isEditingAction: boolean;
  selectedGroupId: string | null;
  cancelEditingAction: () => void;
  handleSkillSelect: (skillId: string) => void;
  cooldownInfo?: {
    isCooldown: boolean;
    nextAvailableTime: number | null;
    cooldownInfo: string;
    cooldownSource?: {
      type: string;
      entryTime?: number;
      entryText?: string;
    };
  };
}

const SkillActionComponent: React.FC<SkillActionProps> = ({
  skillId,
  setSkillId,
  skillTarget,
  setSkillTarget,
  timeOffset,
  handleTimeOffsetChange,
  forceUse,
  setForceUse,
  targetId,
  setTargetId,
  targetCoordinate,
  setTargetCoordinate,
  handleAddAction,
  isEditingAction,
  selectedGroupId,
  cancelEditingAction,
  handleSkillSelect,
  cooldownInfo
}) => {
  // 目标类型选项
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

  // 获取当前技能的信息
  const currentSkillInfo = skillId ? skills.find(s => s.id === skillId) : null;
  // 确定技能类型
  const isSelfOnlySkill = currentSkillInfo && currentSkillInfo.canTargetSelf && !currentSkillInfo.canTargetParty && !currentSkillInfo.canTargetHostile;
  const isHostileOnlySkill = currentSkillInfo && !currentSkillInfo.canTargetSelf && !currentSkillInfo.canTargetParty && currentSkillInfo.canTargetHostile;
  const isAreaOnlySkill = currentSkillInfo && !currentSkillInfo.canTargetSelf && !currentSkillInfo.canTargetParty && !currentSkillInfo.canTargetHostile && currentSkillInfo.targetArea;
  
  const renderSkillCooldownStatus = () => {
    if (!skillId || !cooldownInfo) return null;

    const isCooldown = cooldownInfo.isCooldown || false;
    const cooldownText = cooldownInfo.cooldownInfo || '';
    const cooldownSource = cooldownInfo.cooldownSource;
    
    // 构建冷却来源信息
    let sourceInfo = '';
    if (isCooldown && cooldownSource) {
      switch(cooldownSource.type) {
        case 'timeline':
          sourceInfo = `上次在${cooldownSource.entryTime}秒"${cooldownSource.entryText}"处使用过`;
          break;
        case 'current_entry':
          sourceInfo = `在当前条目的其他组中使用过`;
          break;
        case 'same_group':
          sourceInfo = `在当前组中已有使用记录`;
          break;
      }
    }
    
    // 显示更准确的冷却信息，直接使用后端计算的结果
    return (
      <div className={`skill-cooldown-status ${isCooldown ? 'is-cooldown' : ''}`}>
        <div className="cooldown-info">
          {isCooldown ? (
            <>
              <span className="cooldown-icon"><FiClock /></span> 
              <span className="cooldown-text">
                {cooldownText}
                {sourceInfo && <div className="cooldown-source">{sourceInfo}</div>}
              </span>
            </>
          ) : (
            <>
              <span className="cooldown-icon"><FiCheck /></span> 
              <span className="cooldown-text">{cooldownText}</span>
              {cooldownText.includes("充能") && (
                <span className="cooldown-charges-icon">🔋</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

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
      
      {renderSkillCooldownStatus()}
      
      <div className="input-group">
        <label>目标:</label>
        <select
          value={skillTarget || ''}
          onChange={(e) => setSkillTarget(e.target.value || undefined)}
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
      
      <div className="checkbox-group">
        <label className="checkbox-label-main">选项:</label>
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={forceUse}
            onChange={(e) => {
              setForceUse(e.target.checked);
              // 因为强制使用不影响冷却计算，此处不需要更新冷却状态
            }}
          />
          <span className="checkbox-mark"></span>
          <span className="checkbox-label">强制使用</span>
        </label>
      </div>
      
      <div className="form-buttons">
        <button 
          className={`button ${isEditingAction ? 'update-button' : 'add-button'}`}
          onClick={handleAddAction}
          disabled={!selectedGroupId || !skillId}
        >
          {isEditingAction ? '更新' : '添加'}
        </button>
        {isEditingAction && (
          <button 
            className="button cancel-button"
            onClick={cancelEditingAction}
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
};

export default SkillActionComponent; 