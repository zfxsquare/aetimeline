import React from 'react';
import { TimelineEntry } from '../types/timeline';
import { formatTime } from '../utils/timelineUtils';

interface TimelineEntriesListProps {
  entries: TimelineEntry[];
  selectedEntry: TimelineEntry | null;
  searchText: string;
  showTimes: boolean;
  timeFormat: 'seconds' | 'minutes';
  onEntrySelect: (entry: TimelineEntry) => void;
  onSearchChange: (text: string) => void;
  onToggleShowTimes: () => void;
  onToggleTimeFormat: () => void;
}

const TimelineEntriesList: React.FC<TimelineEntriesListProps> = ({
  entries,
  selectedEntry,
  searchText,
  showTimes,
  timeFormat,
  onEntrySelect,
  onSearchChange,
  onToggleShowTimes,
  onToggleTimeFormat
}) => {
  const filteredEntries = entries.filter(entry => 
    entry.text.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="reactions-list">
      <div className="search-bar">
        <div className="search-options">
          <input 
            type="text" 
            placeholder="搜索条目或动作..." 
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button 
            className={`time-toggle-button ${showTimes ? 'active' : ''}`}
            onClick={onToggleShowTimes}
            title={showTimes ? "隐藏时间" : "显示时间"}
          >
            <i className="time-icon">{showTimes ? "⏱️" : "⏲️"}</i>
          </button>
          <button
            className={`time-format-button ${timeFormat === 'minutes' ? 'active' : ''}`}
            onClick={onToggleTimeFormat}
            title={timeFormat === 'seconds' ? "切换到分:秒格式" : "切换到秒格式"}
          >
            {timeFormat === 'seconds' ? "s" : "m:s"}
          </button>
        </div>
      </div>
      <div className="entries-list">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry, index) => (
            <div 
              key={index}
              className={`entry-item ${selectedEntry === entry ? 'selected' : ''}`}
              onClick={() => onEntrySelect(entry)}
            >
              {showTimes && (
                <span className="entry-time-display">{formatTime(entry.time, timeFormat)}</span>
              )}
              <span className="entry-text-display">{entry.text}</span>
            </div>
          ))
        ) : (
          <div className="no-entries">导入时间轴条目或添加新条目</div>
        )}
      </div>
    </div>
  );
};

export default TimelineEntriesList; 