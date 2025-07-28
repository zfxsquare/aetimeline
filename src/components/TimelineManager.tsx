import React, { useState, useEffect } from 'react';
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
  const [timelineFiles, setTimelineFiles] = useState<string[]>([]);

  // 动态导入data/timelines下的JSON文件
  useEffect(() => {
    const loadTimelineFiles = async () => {
      const files = import.meta.glob('../data/timelines/*.json');
      setTimelineFiles(Object.keys(files).map(path => {
        const filename = path.split('/').pop()?.replace('.json', '') || '';
        return filename;
      }));
    };
    
    loadTimelineFiles();
  }, []);

  const handleTimelineParsed = (entries: TimelineEntry[]) => {
    setTimelineEntries(entries);
    setHasImportedTimeline(true);
    
    // 如果提供了导入回调，也调用它
    if (onTimelineImported) {
      onTimelineImported(entries);
    }
  };

  const handleJsonImport = async (filename: string) => {
    try {
      // 动态导入JSON文件
      const module = await import(`../data/timelines/${filename}.json`);
      const data = module.default || module;
      
      if (data && data.entries) {
        setTimelineEntries(data.entries);
        setHasImportedTimeline(true);
        
        // 如果提供了导入回调，也调用它
        if (onTimelineImported) {
          onTimelineImported(data.entries);
        }
      }
    } catch (error) {
      console.error(`导入 ${filename} 失败:`, error);
    }
  };

  return (
    <div className="timeline-manager">
      <div className="timeline-manager-content">
        {!hasImportedTimeline ? (
          <div>
            <TimelineParser onTimelineParsed={handleTimelineParsed} />
            
            {timelineFiles.length > 0 && (
              <div className="timeline-json-imports">
                <h3>快速导入</h3>
                <div className="json-buttons">
                  {timelineFiles.map(filename => (
                    <button 
                      key={filename}
                      onClick={() => handleJsonImport(filename)}
                      className="json-import-button"
                    >
                      导入 {filename}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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