import React, { useState } from 'react';
import './TimelineParser.css';

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

interface TimelineParserProps {
  onTimelineParsed: (entries: TimelineEntry[]) => void;
}

const TimelineParser: React.FC<TimelineParserProps> = ({ onTimelineParsed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseTimeline = (content: string): TimelineEntry[] => {
    const lines = content.split('\n');
    const entries: TimelineEntry[] = [];
    
    for (let line of lines) {
      // 跳过空行和注释行
      if (line.trim() === '' || line.trim().startsWith('#')) {
        continue;
      }
      
      // 处理hideall命令
      if (line.trim().startsWith('hideall')) {
        continue;
      }
      
      // 解析正常的时间轴条目
      const timeMatch = line.match(/^(\d+(?:\.\d)?)(?:\s+label\s+"([^"]+)"|\s+"([^"]+)")/);
      if (timeMatch) {
        const time = parseFloat(timeMatch[1]);
        const label = timeMatch[2];
        const text = timeMatch[3];
        
        const entry: TimelineEntry = {
          time,
          text: label || text
        };
        
        // 解析同步信息
        const syncMatch = line.match(/(?:StartsUsing|Ability|AddedCombatant|ActorControl|SystemLogMessage|InCombat|MapEffect)\s+{\s[^}]+\s}/);
        if (syncMatch) {
          entry.sync = syncMatch[0];
        }
        
        // 解析窗口信息
        const windowMatch = line.match(/window\s+(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/);
        if (windowMatch) {
          entry.window = {
            before: parseFloat(windowMatch[1]),
            after: parseFloat(windowMatch[2])
          };
        }
        
        // 解析跳转信息
        const jumpMatch = line.match(/jump\s+(?:"([^"]+)"|(\d+(?:\.\d+)?))/);
        if (jumpMatch) {
          entry.jump = jumpMatch[1] || parseFloat(jumpMatch[2]);
        }
        
        // 解析强制跳转信息
        const forcejumpMatch = line.match(/forcejump\s+(?:"([^"]+)"|(\d+(?:\.\d+)?))/);
        if (forcejumpMatch) {
          entry.forcejump = forcejumpMatch[1] || parseFloat(forcejumpMatch[2]);
        }
        
        // 解析持续时间
        const durationMatch = line.match(/duration\s+(\d+(?:\.\d+)?)/);
        if (durationMatch) {
          entry.duration = parseFloat(durationMatch[1]);
        }
        
        entries.push(entry);
      }
    }
    
    return entries;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('请选择一个文件');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const entries = parseTimeline(content);
      onTimelineParsed(entries);
    } catch (err) {
      setError('解析时间轴文件失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="timeline-parser">
      <h2>导入时间轴文件</h2>
      <div className="file-upload">
        <input 
          type="file" 
          accept=".txt"
          onChange={handleFileChange}
          disabled={loading}
        />
        <button onClick={handleImport} disabled={!file || loading}>
          {loading ? '导入中...' : '导入'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {file && <div className="file-info">已选择文件: {file.name}</div>}
      
      <div className="timeline-format-info">
        <h3>时间轴格式说明</h3>
        <p>导入txt的cactbot时间轴文件</p>
        
      </div>
    </div>
  );
};

export default TimelineParser; 