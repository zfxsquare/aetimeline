import React from 'react';

interface MoveToActionProps {
  coordinate: { x: number; y: number; z: number };
  setCoordinate: (coords: { x: number; y: number; z: number }) => void;
  tp: boolean;
  settp: (tp: boolean) => void;
  timeOffset: number;
  handleTimeOffsetChange: (value: string) => void;
  handleAddAction: () => void;
  isEditingAction: boolean;
  selectedGroupId: string | null;
  cancelEditingAction: () => void;
}

const MoveToActionComponent: React.FC<MoveToActionProps> = ({
  coordinate,
  setCoordinate,
  tp,
  settp,
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
        <label>坐标:</label>
        <div className="coordinate-input">
          <input
            type="number"
            value={coordinate.x}
            onChange={(e) => setCoordinate({ ...coordinate, x: parseFloat(e.target.value) })}
            placeholder="X"
          />
          <input
            type="number"
            value={coordinate.y}
            onChange={(e) => setCoordinate({ ...coordinate, y: parseFloat(e.target.value) })}
            placeholder="Y"
          />
          <input
            type="number"
            value={coordinate.z}
            onChange={(e) => setCoordinate({ ...coordinate, z: parseFloat(e.target.value) })}
            placeholder="Z"
          />
        </div>
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
      
      <div className="checkbox-group">
        <label className="checkbox-label-main">选项:</label>
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={tp}
            onChange={(e) => settp(e.target.checked)}
          />
          <span className="checkbox-mark"></span>
          <span className="checkbox-label">是否tp</span>
        </label>
      </div>
      
      <div className="form-buttons">
        <button 
          className={`button ${isEditingAction ? 'update-button' : 'add-button'}`}
          onClick={handleAddAction}
          disabled={!selectedGroupId}
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

export default MoveToActionComponent; 