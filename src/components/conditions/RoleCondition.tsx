import React from 'react';

interface RoleConditionProps {
  selectedRole: 'MT' | 'ST' | 'H1' | 'H2' | 'D1' | 'D2' | 'D3' | 'D4';
  setSelectedRole: React.Dispatch<React.SetStateAction<'MT' | 'ST' | 'H1' | 'H2' | 'D1' | 'D2' | 'D3' | 'D4'>>;
  handleAddCondition: () => void;
  isEditingCondition: boolean;
  selectedGroupId: string | null;
  cancelEditingCondition: () => void;
}

const RoleConditionComponent: React.FC<RoleConditionProps> = ({
  selectedRole,
  setSelectedRole,
  handleAddCondition,
  isEditingCondition,
  selectedGroupId,
  cancelEditingCondition
}) => {
  const roles = [
    { value: 'MT', label: 'MT' },
    { value: 'ST', label: 'ST' },
    { value: 'H1', label: 'H1' },
    { value: 'H2', label: 'H2' },
    { value: 'D1', label: 'D1' },
    { value: 'D2', label: 'D2' },
    { value: 'D3', label: 'D3' },
    { value: 'D4', label: 'D4' }
  ] as const;

  return (
    <div className="condition-form">
      <div className="input-group">
        <label>选择职能:</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as 'MT' | 'ST' | 'H1' | 'H2' | 'D1' | 'D2' | 'D3' | 'D4')}
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
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

export default RoleConditionComponent; 