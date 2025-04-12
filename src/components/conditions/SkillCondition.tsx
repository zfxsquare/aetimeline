import React from 'react';
import SkillSearch from '../SkillSearch';
import { skills } from '../../data/skills';

interface SkillConditionProps {
  skillConditionId: string;
  setSkillConditionId: (id: string) => void;
  handleAddCondition: () => void;
  isEditingCondition: boolean;
  selectedGroupId: string | null;
  cancelEditingCondition: () => void;
}

const SkillConditionComponent: React.FC<SkillConditionProps> = ({
  skillConditionId,
  setSkillConditionId,
  handleAddCondition,
  isEditingCondition,
  selectedGroupId,
  cancelEditingCondition
}) => {
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
      <div className="form-buttons">
        <button 
          className={`button ${isEditingCondition ? 'update-button' : 'add-button'}`}
          onClick={handleAddCondition}
          disabled={!selectedGroupId || !skillConditionId}
        >
          {isEditingCondition ? '更新' : '添加'}
        </button>
        {isEditingCondition && (
          <button 
            className="button cancel-button"
            onClick={cancelEditingCondition}
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
};

export default SkillConditionComponent; 