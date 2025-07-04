import React from 'react';

interface EditorTabsProps {
  selectedGroupId: string | null;
  conditionTypes: { id: string; name: string }[];
  actionTypes: { id: string; name: string }[];
  conditionType: string;
  actionType: string;
  handleConditionTypeChange: (type: string) => void;
  handleActionTypeChange: (type: string) => void;
  renderConditionForm: () => React.ReactNode;
  renderActionForm: () => React.ReactNode;
}

const EditorTabs: React.FC<EditorTabsProps> = ({
  selectedGroupId,
  conditionTypes,
  actionTypes,
  conditionType,
  actionType,
  handleConditionTypeChange,
  handleActionTypeChange,
  renderConditionForm,
  renderActionForm,
}) => {
  if (!selectedGroupId) {
    return null;
  }

  return (
    <div className="tab-sections">
      <div className="condition-tabs">
        <div className="section-header">
          <h4>添加条件</h4>
        </div>
        <div className="tab-scroll-container">
          <div className="tab-selection">
            {conditionTypes.map((type) => (
              <button 
                key={type.id}
                className={`tab-button ${conditionType === type.id ? 'active' : ''}`}
                onClick={() => handleConditionTypeChange(type.id)}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
        <div className="tab-content">
          {renderConditionForm()}
        </div>
      </div>

      <div className="action-tabs">
        <div className="section-header">
          <h4>添加动作</h4>
        </div>
        <div className="tab-scroll-container">
          <div className="tab-selection">
            {actionTypes.map((type) => (
              <button 
                key={type.id}
                className={`tab-button ${actionType === type.id ? 'active' : ''}`}
                onClick={() => handleActionTypeChange(type.id)}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
        <div className="tab-content">
          {renderActionForm()}
        </div>
      </div>
    </div>
  );
};

export default EditorTabs;
