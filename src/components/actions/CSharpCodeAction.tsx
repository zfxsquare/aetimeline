import React from 'react';

interface CSharpCodeActionProps {
  code: string;
  setCode: (code: string) => void;
  timeOffset: number;
  handleTimeOffsetChange: (value: string) => void;
  handleAddAction: () => void;
  isEditingAction: boolean;
  selectedGroupId: string | null;
  cancelEditingAction: () => void;
}

const CSharpCodeActionComponent: React.FC<CSharpCodeActionProps> = ({
  code,
  setCode,
  timeOffset,
  handleTimeOffsetChange,
  handleAddAction,
  isEditingAction,
  selectedGroupId,
  cancelEditingAction
}) => {
  return (
    <div className="action-form">
      <div className="input-group">
        <label>C# 代码:</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="输入C#代码..."
          rows={10}
          className="code-input"
        />
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
      <div className="form-buttons">
        <button 
          className={`button ${isEditingAction ? 'update-button' : 'add-button'}`}
          onClick={handleAddAction}
          disabled={!selectedGroupId || !code.trim()}
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

export default CSharpCodeActionComponent; 