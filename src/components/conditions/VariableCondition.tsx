import React from 'react';

interface VariableConditionProps {
  variableName: string;
  setVariableName: (name: string) => void;
  expectedValue: boolean;
  setExpectedValue: (value: boolean) => void;
  variables: { name: string; value: boolean }[];
  handleAddCondition: () => void;
  isEditingCondition: boolean;
  selectedGroupId: string | null;
  cancelEditingCondition: () => void;
}

const VariableConditionComponent: React.FC<VariableConditionProps> = ({
  variableName,
  setVariableName,
  expectedValue,
  setExpectedValue,
  variables,
  handleAddCondition,
  isEditingCondition,
  selectedGroupId,
  cancelEditingCondition
}) => {
  return (
    <div className="condition-form">
      <div className="input-group">
        <label>变量名:</label>
        <select
          value={variableName}
          onChange={(e) => setVariableName(e.target.value)}
          disabled={variables.length === 0}
        >
          <option value="">选择变量</option>
          {variables.map((variable) => (
            <option key={variable.name} value={variable.name}>
              {variable.name}
            </option>
          ))}
        </select>
      </div>

      {variableName && (
        <div className="input-group">
          <label>预期值:</label>
          <select
            value={expectedValue ? "true" : "false"}
            onChange={(e) => setExpectedValue(e.target.value === "true")}
          >
            <option value="true">真</option>
            <option value="false">假</option>
          </select>
        </div>
      )}

      <div className="form-buttons">
        <button 
          className={`button ${isEditingCondition ? 'update-button' : 'add-button'}`}
          onClick={handleAddCondition}
          disabled={!selectedGroupId || !variableName}
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

export default VariableConditionComponent;