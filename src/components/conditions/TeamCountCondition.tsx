import React from 'react';

interface TeamCountConditionProps {
  teamCountOperator: '>' | '<' | '==' | '>=' | '<=';
  setTeamCountOperator: (operator: '>' | '<' | '==' | '>=' | '<=') => void;
  teamCountValue: number;
  setTeamCountValue: (value: number) => void;
  teamCountRange: number;
  setTeamCountRange: (range: number) => void;
  handleAddCondition: () => void;
  isEditingCondition: boolean;
  selectedGroupId: string | null;
  cancelEditingCondition: () => void;
}

const TeamCountConditionComponent: React.FC<TeamCountConditionProps> = ({
  teamCountOperator,
  setTeamCountOperator,
  teamCountValue,
  setTeamCountValue,
  teamCountRange,
  setTeamCountRange,
  handleAddCondition,
  isEditingCondition,
  selectedGroupId,
  cancelEditingCondition
}) => {
  const operators = [
    { value: '>', label: '大于' },
    { value: '<', label: '小于' },
    { value: '==', label: '等于' },
    { value: '>=', label: '大于等于' },
    { value: '<=', label: '小于等于' }
  ];

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

export default TeamCountConditionComponent; 