import React, { useState, useEffect } from 'react';
import './TimelineVisualizer.css';

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

interface TimelineVisualizerProps {
  entries: TimelineEntry[];
}

const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({ entries }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scale, setScale] = useState(1); // 缩放比例，1 = 1秒对应10像素

  // 找出最大时间
  const maxTime = entries.length > 0 
    ? Math.max(...entries.map(entry => entry.time + (entry.duration || 0)))
    : 0;

  // 播放/暂停时间轴
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTime(prevTime => {
        if (prevTime >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return prevTime + 0.1;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, maxTime]);

  // 重置时间轴
  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // 调整缩放
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.2));
  };

  // 获取条目的持续时间显示宽度
  const getEntryWidth = (entry: TimelineEntry) => {
    return ((entry.duration || 0) * 10 * scale) + 'px';
  };

  // 获取条目的时间位置
  const getEntryPosition = (entry: TimelineEntry) => {
    return (entry.time * 10 * scale) + 'px';
  };

  // 获取当前时间的位置
  const getCurrentTimePosition = () => {
    return (currentTime * 10 * scale) + 'px';
  };

  // 生成时间刻度
  const generateTimeMarkers = () => {
    const markers = [];
    const interval = scale < 0.5 ? 60 : scale < 1 ? 30 : 10; // 根据缩放级别调整间隔
    
    for (let time = 0; time <= maxTime; time += interval) {
      markers.push(
        <div 
          key={time} 
          className="time-marker" 
          style={{ left: (time * 10 * scale) + 'px' }}
        >
          {time}s
        </div>
      );
    }
    
    return markers;
  };

  // 查找标签
  const findLabelPosition = (labelName: string): number | null => {
    const labelEntry = entries.find(entry => entry.label === labelName);
    return labelEntry ? labelEntry.time : null;
  };

  // 处理跳转线
  const renderJumpLines = () => {
    return entries.map((entry, index) => {
      if (!entry.jump && !entry.forcejump) return null;
      
      const jumpTarget = entry.jump || entry.forcejump;
      let targetTime: number | null = null;
      
      if (typeof jumpTarget === 'number') {
        targetTime = jumpTarget;
      } else if (typeof jumpTarget === 'string') {
        targetTime = findLabelPosition(jumpTarget);
      }
      
      if (targetTime === null) return null;
      
      const fromX = entry.time * 10 * scale;
      const toX = targetTime * 10 * scale;
      const isForcejump = !!entry.forcejump;
      
      // 计算SVG路径
      const path = `M ${fromX} 0 C ${fromX} -30, ${toX} -30, ${toX} 0`;
      
      return (
        <svg 
          key={`jump-${index}`} 
          className="jump-line" 
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '30px', overflow: 'visible', pointerEvents: 'none' }}
        >
          <path 
            d={path} 
            stroke={isForcejump ? "#ff5757" : "#57a3ff"} 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray={isForcejump ? "none" : "5,5"}
          />
          <polygon 
            points={`${toX},0 ${toX-5},-10 ${toX+5},-10`} 
            fill={isForcejump ? "#ff5757" : "#57a3ff"} 
          />
        </svg>
      );
    });
  };

  return (
    <div className="timeline-visualizer">
      <div className="timeline-controls">
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button onClick={handleReset}>重置</button>
        <button onClick={handleZoomIn}>放大</button>
        <button onClick={handleZoomOut}>缩小</button>
        <span className="time-display">{currentTime.toFixed(1)}s</span>
      </div>
      
      <div className="timeline-container">
        <div className="time-ruler">
          {generateTimeMarkers()}
        </div>
        
        <div 
          className="current-time-indicator" 
          style={{ left: getCurrentTimePosition() }}
        />
        
        <div className="entries-container" style={{ width: (maxTime * 10 * scale) + 'px' }}>
          {renderJumpLines()}
          
          {entries.map((entry, index) => (
            <div 
              key={index}
              className={`timeline-entry ${entry.label ? 'has-label' : ''} ${
                entry.sync ? 'has-sync' : ''
              } ${
                entry.time < currentTime ? 'past' : 
                entry.time > currentTime && entry.time <= currentTime + 30 ? 'upcoming' : ''
              }`}
              style={{ 
                left: getEntryPosition(entry),
                width: getEntryWidth(entry)
              }}
            >
              <div className="entry-time">{entry.time.toFixed(1)}</div>
              <div className="entry-text">{entry.text}</div>
              {entry.label && <div className="entry-label">标签: {entry.label}</div>}
              {entry.sync && <div className="entry-sync">同步: {entry.sync}</div>}
              {entry.window && (
                <div className="entry-window">
                  窗口: {entry.window.before},{entry.window.after}
                </div>
              )}
              {(entry.jump || entry.forcejump) && (
                <div className="entry-jump">
                  {entry.forcejump ? '强制跳转: ' : '跳转: '}
                  {String(entry.jump || entry.forcejump)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineVisualizer; 