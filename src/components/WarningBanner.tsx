import React from 'react';
import { setCookie } from '../utils/timelineUtils';

interface WarningBannerProps {
  onClose: () => void;
}

const WarningBanner: React.FC<WarningBannerProps> = ({ onClose }) => {
  const handleClose = () => {
    onClose();
    setCookie('timeline_warning_closed', 'true');
  };

  return (
    <div className="warning-banner">
      ⚠️ 警告：不要导入旧时间轴！新版本不兼容旧格式 ⚠️
      <button className="close-warning-button" onClick={handleClose}>
        我已知晓
      </button>
    </div>
  );
};

export default WarningBanner; 