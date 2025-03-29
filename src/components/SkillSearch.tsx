import React, { useState, useEffect, useRef } from 'react';
import './SkillSearch.css';
import { skills } from '../data/skills';

interface SkillSearchProps {
  onChange?: (value: string) => void;
  onSelect?: (skillId: string) => void;
}

export const SkillSearch: React.FC<SkillSearchProps> = ({ onChange, onSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState(skills);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    onChange?.(value);

    // 过滤技能列表
    const filtered = skills.filter(skill => 
      skill.id.includes(value) || skill.name.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 10); // 限制显示前10个结果

    setFilteredSkills(filtered);
    setShowDropdown(true);
  };

  const handleSkillSelect = (skillId: string) => {
    setSearchText(skillId);
    setShowDropdown(false);
    onSelect?.(skillId);
  };

  return (
    <div className="skill-search">
      <input
        type="text"
        className="skill-search-input"
        value={searchText}
        onChange={handleSearchChange}
        placeholder="输入技能ID或名称搜索"
      />
      {showDropdown && filteredSkills.length > 0 && (
        <div className="skill-dropdown" ref={dropdownRef}>
          {filteredSkills.map(skill => (
            <div
              key={skill.id}
              className="skill-option"
              onClick={() => handleSkillSelect(skill.id)}
            >
              {skill.id} - {skill.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillSearch; 