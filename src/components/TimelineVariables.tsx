import React, { useState } from 'react';
import './TimelineVariables.css';

export interface TimelineVariable {
  name: string;
  value: boolean;
}

interface TimelineVariablesProps {
  variables: TimelineVariable[];
  onChange: (variables: TimelineVariable[]) => void;
}

const TimelineVariables: React.FC<TimelineVariablesProps> = ({ variables, onChange }) => {
  const [newVarName, setNewVarName] = useState('');

  // 添加新变量
  const handleAddVariable = () => {
    if (!newVarName.trim()) return;
    
    // 检查变量名是否已存在
    if (variables.some(v => v.name === newVarName)) {
      alert('变量名已存在！');
      return;
    }
    
    const newVar: TimelineVariable = {
      name: newVarName,
      value: false
    };
    
    onChange([...variables, newVar]);
    setNewVarName('');
  };

  // 删除变量
  const handleDeleteVariable = (index: number) => {
    const updatedVars = [...variables];
    updatedVars.splice(index, 1);
    onChange(updatedVars);
  };

  // 变更变量值
  const handleToggleValue = (index: number) => {
    const updatedVars = [...variables];
    updatedVars[index] = {
      ...updatedVars[index],
      value: !updatedVars[index].value
    };
    onChange(updatedVars);
  };

  return (
    <div className="timeline-variables">
      <div className="variables-header">
        <h3>时间轴变量</h3>
        <div className="variable-description">
          可以创建在时间轴中使用的布尔变量
        </div>
      </div>
      
      <div className="variables-add">
        <input
          type="text"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          placeholder="输入变量名..."
        />
        <button onClick={handleAddVariable}>添加变量</button>
      </div>
      
      {variables.length > 0 ? (
        <div className="variables-list">
          <table>
            <thead>
              <tr>
                <th>变量名</th>
                <th>初始值</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {variables.map((variable, index) => (
                <tr key={index}>
                  <td>{variable.name}</td>
                  <td>
                    <button 
                      className={`toggle-button ${variable.value ? 'true' : 'false'}`}
                      onClick={() => handleToggleValue(index)}
                    >
                      {variable.value ? '真' : '假'}
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteVariable(index)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-variables">尚未添加任何变量</div>
      )}
    </div>
  );
};

export default TimelineVariables;