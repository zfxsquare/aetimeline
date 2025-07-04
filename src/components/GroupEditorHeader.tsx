import React from 'react';
import { ConditionActionGroup } from './types';

interface GroupEditorHeaderProps {
  selectedEntryText: string;
  copiedGroup: ConditionActionGroup | null;
  showCopySuccess: boolean;
  showPasteSuccess: boolean;
  onAddNewGroup: () => void;
  onPasteGroup: () => void;
  onClearCopiedGroup: () => void;
}

const GroupEditorHeader: React.FC<GroupEditorHeaderProps> = ({
  selectedEntryText,
  copiedGroup,
  showCopySuccess,
  showPasteSuccess,
  onAddNewGroup,
  onPasteGroup,
  onClearCopiedGroup,
}) => {
  return (
    <>
      <div className="section-header">
        <h3>条件-动作组：{selectedEntryText}</h3>
        <div className="header-buttons">
          <button 
            className="add-button" 
            onClick={onAddNewGroup}
            title="添加新组"
          >
            +
          </button>
          {copiedGroup && (
            <button
              className="paste-button"
              onClick={onPasteGroup}
              title="粘贴已复制的组"
            >
              <span className="icon">📋</span> 粘贴
            </button>
          )}
        </div>
      </div>
      
      {copiedGroup && (
        <div className={`copy-status ${showCopySuccess ? 'success-flash' : ''} ${showPasteSuccess ? 'paste-flash' : ''}`}>
          <div className="copy-info">
            <span className="copy-icon">📋</span>
            <span className="copy-text">
              {showCopySuccess && <span className="copy-success">✓ 复制成功!</span>}
              {showPasteSuccess && <span className="paste-success">✓ 粘贴成功!</span>}
              {!showCopySuccess && !showPasteSuccess && '已复制:'} <strong>{copiedGroup.name}</strong>
            </span>
            <span className="copy-details">
              {copiedGroup.conditions.length} 个条件, {copiedGroup.actions.length} 个动作
            </span>
          </div>
          <button 
            className="clear-copy-button"
            onClick={onClearCopiedGroup}
            title="清除复制内容"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
};

export default GroupEditorHeader;
