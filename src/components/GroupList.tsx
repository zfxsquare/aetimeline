import React from 'react';
import ConditionActionGroupComponent from './ConditionActionGroup';
import { ConditionActionGroup } from './types'; // Assuming types are defined in a separate file

interface GroupListProps {
  groups: ConditionActionGroup[];
  selectedGroupId: string | null;
  handleSelectGroup: (groupId: string) => void;
  handleToggleGroupEnabled: (groupId: string) => void;
  handleEditGroup: (groupId: string) => void;
  handleDeleteGroup: (groupId: string) => void;
  handleToggleConditionEnabled: (groupId: string, conditionIndex: number) => void;
  handleEditCondition: (groupId: string, conditionIndex: number) => void;
  handleRemoveCondition: (groupId: string, conditionIndex: number) => void;
  handleToggleActionEnabled: (groupId: string, actionIndex: number) => void;
  handleEditAction: (groupId: string, actionIndex: number) => void;
  handleRemoveAction: (groupId: string, actionIndex: number) => void;
  handleCopyGroup: (groupId: string) => void;
}

const GroupList: React.FC<GroupListProps> = ({
  groups,
  selectedGroupId,
  handleSelectGroup,
  handleToggleGroupEnabled,
  handleEditGroup,
  handleDeleteGroup,
  handleToggleConditionEnabled,
  handleEditCondition,
  handleRemoveCondition,
  handleToggleActionEnabled,
  handleEditAction,
  handleRemoveAction,
  handleCopyGroup,
}) => {
  return (
    <div className="groups-list">
      {groups.length > 0 ? (
        groups.map((group) => (
          <ConditionActionGroupComponent
            key={group.id}
            group={group}
            selectedGroupId={selectedGroupId}
            handleSelectGroup={handleSelectGroup}
            handleToggleGroupEnabled={handleToggleGroupEnabled}
            handleEditGroup={handleEditGroup}
            handleDeleteGroup={handleDeleteGroup}
            handleToggleConditionEnabled={handleToggleConditionEnabled}
            handleEditCondition={handleEditCondition}
            handleRemoveCondition={handleRemoveCondition}
            handleToggleActionEnabled={handleToggleActionEnabled}
            handleEditAction={handleEditAction}
            handleRemoveAction={handleRemoveAction}
            handleCopyGroup={handleCopyGroup}
          />
        ))
      ) : (
        <div className="no-groups">尚未创建任何条件-动作组</div>
      )}
    </div>
  );
};

export default GroupList;
