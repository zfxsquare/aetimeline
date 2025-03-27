import React, { useState } from 'react';
import './App.css';
import TimelineEditor from './components/TimelineEditor';
import TimelineManager from './components/TimelineManager';

// 定义时间轴条目接口
interface TimelineEntry {
  time: number;
  text: string;
  sync?: string;
  duration?: number;
  window?: {before: number, after: number};
  jump?: string | number;
  forcejump?: string | number;
  label?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'manager'>('editor');
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);

  // 处理从管理器导入的时间轴条目
  const handleTimelineImport = (entries: TimelineEntry[]) => {
    setTimelineEntries(entries);
    // 导入后自动切换到编辑器标签
    setActiveTab('editor');
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1>时间轴工具</h1>
        <div className="tab-selector">
          <button 
            className={activeTab === 'editor' ? 'active' : ''}
            onClick={() => setActiveTab('editor')}
          >
            时间轴编辑器 {timelineEntries.length > 0 ? `(${timelineEntries.length})` : ''}
          </button>
          <button 
            className={activeTab === 'manager' ? 'active' : ''}
            onClick={() => setActiveTab('manager')}
          >
            时间轴管理器
          </button>
        </div>
      </div>

      <div className="app-content">
        {activeTab === 'editor' ? (
          <TimelineEditor importedEntries={timelineEntries} />
        ) : (
          <TimelineManager onTimelineImported={handleTimelineImport} />
        )}
      </div>
    </div>
  );
}

export default App;
