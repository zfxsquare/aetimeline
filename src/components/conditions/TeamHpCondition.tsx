import React from 'react';

interface TeamHpConditionProps {
  teamCountValue: number;
  setTeamCountValue: (value: number) => void;
  excludeTank: boolean;
  setExcludeTank: (exclude: boolean) => void;
  handleAddCondition: () => void;
  isEditingCondition: boolean;
  selectedGroupId: string | null;
  cancelEditingCondition: () => void;
}

const TeamHpConditionComponent: React.FC<TeamHpConditionProps> = ({
  teamCountValue,
  setTeamCountValue,
  excludeTank,
  setExcludeTank,
  handleAddCondition,
  isEditingCondition,
  selectedGroupId,
  cancelEditingCondition
}) => {
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
      
      <div className="checkbox-group">
        <label className="checkbox-label-main">选项:</label>
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={excludeTank}
            onChange={(e) => setExcludeTank(e.target.checked)}
          />
          <span className="checkbox-mark"></span>
          <span className="checkbox-label">排除坦克职业</span>
        </label>
      </div>
      
      <div className="form-buttons">
        <button 
          className={`button ${isEditingCondition ? 'update-button' : 'add-button'}`}
          onClick={handleAddCondition}
          disabled={!selectedGroupId}
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

export default TeamHpConditionComponent; 