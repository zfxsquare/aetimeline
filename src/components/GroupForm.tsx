import React from 'react';
import './GroupForm.css';

interface GroupFormProps {
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  newTimeout: number;
  handleNewTimeoutChange: (value: string) => void;
  editingGroupId: string | null;
  handleUpdateGroupName: () => void;
  handleCreateGroup: () => void;
  cancelEditingGroup: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({
  newGroupName,
  setNewGroupName,
  newTimeout,
  handleNewTimeoutChange,
  editingGroupId,
  handleUpdateGroupName,
  handleCreateGroup,
  cancelEditingGroup
}) => {
  return (
    <div className="group-form">
      <div className="input-group">
        <label>组名称:</label>
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="输入组名称"
        />
      </div>

      <div className="input-group">
        <label>超时时间 (秒):</label>
        <div className="number-input">
          <input 
            type="number" 
            value={newTimeout}
            onChange={(e) => handleNewTimeoutChange(e.target.value)}
          />
          <div className="number-controls">
            <button onClick={() => handleNewTimeoutChange((Math.max(1, newTimeout - 1)).toString())}>-</button>
            <button onClick={() => handleNewTimeoutChange((newTimeout + 1).toString())}>+</button>
          </div>
        </div>
      </div>
      
      <div className="form-buttons">
        <button 
          className={`button ${editingGroupId ? 'update-button' : 'add-button'}`}
          onClick={editingGroupId ? handleUpdateGroupName : handleCreateGroup}
        >
          {editingGroupId ? '更新' : '创建'}
        </button>
        <button 
          className="button cancel-button"
          onClick={cancelEditingGroup}
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default GroupForm; 