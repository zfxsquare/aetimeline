import React, { useState } from 'react';
import './TimelineManager.css';
import TimelineParser from './TimelineParser';
import TimelineVisualizer from './TimelineVisualizer';

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

interface TimelineManagerProps {
  onTimelineImported?: (entries: TimelineEntry[]) => void;
}

const TimelineManager: React.FC<TimelineManagerProps> = ({ onTimelineImported }) => {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [hasImportedTimeline, setHasImportedTimeline] = useState(false);

  const handleTimelineParsed = (entries: TimelineEntry[]) => {
    setTimelineEntries(entries);
    setHasImportedTimeline(true);
    
    // 如果提供了导入回调，也调用它
    if (onTimelineImported) {
      onTimelineImported(entries);
    }
  };

  return (
    <div className="timeline-manager">
      <h1>时间轴管理器</h1>
      <div className="timeline-manager-content">
        {!hasImportedTimeline ? (
          <TimelineParser onTimelineParsed={handleTimelineParsed} />
        ) : (
          <div className="timeline-visualizer-container">
            <div className="timeline-actions">
              <button onClick={() => setHasImportedTimeline(false)}>
                返回导入
              </button>
              <span className="timeline-info">
                已导入 {timelineEntries.length} 个时间轴条目
              </span>
              {onTimelineImported && (
                <button 
                  className="send-to-editor-button"
                  onClick={() => onTimelineImported(timelineEntries)}
                >
                  发送到编辑器
                </button>
              )}
            </div>
            <TimelineVisualizer entries={timelineEntries} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineManager; 