import React from 'react';

interface ToggleActionProps {
  toggleName: string;
  setToggleName: (name: string) => void;
  toggleState: boolean;
  setToggleState: (state: boolean) => void;
  timeOffset: number;
  handleTimeOffsetChange: (value: string) => void;
  handleAddAction: () => void;
  isEditingAction: boolean;
  selectedGroupId: string | null;
  cancelEditingAction: () => void;
}

const ToggleActionComponent: React.FC<ToggleActionProps> = ({
  toggleName,
  setToggleName,
  toggleState,
  setToggleState,
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
      <div className="form-buttons">
        <button 
          className={`button ${isEditingAction ? 'update-button' : 'add-button'}`}
          onClick={handleAddAction}
          disabled={!selectedGroupId || !toggleName}
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

export default ToggleActionComponent; 