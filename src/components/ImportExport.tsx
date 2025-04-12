import React, { useRef } from 'react';
import { TimelineConfig } from '../types/timeline';

interface ImportExportProps {
  name: string;
  onImport: (config: TimelineConfig) => void;
  onExport: () => void;
}

const ImportExport: React.FC<ImportExportProps> = ({ name, onImport, onExport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config: TimelineConfig = JSON.parse(content);
        onImport(config);
      } catch (error) {
        alert('导入失败：文件格式错误');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="import-export-buttons">
      <button 
        className="import-button" 
        onClick={triggerFileInput}
        title="导入整个时间轴配置，包括所有条目和动作"
      >
        导入时间轴
      </button>
      <button 
        className="export-button" 
        onClick={onExport}
        disabled={!name}
        title="导出整个时间轴配置，包括所有条目和动作"
      >
        导出时间轴
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleImport}
      />
    </div>
  );
};

export default ImportExport; 