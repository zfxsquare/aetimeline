import { useState, useEffect, useMemo } from 'react';
import { Skill, skills } from '../data/skills';

export interface CooldownStatus {
  isCooldown: boolean;
  nextAvailableTime: number | null;
  cooldownInfo: string;
}

/**
 * 计算技能冷却状态的核心逻辑
 * @param skill - 技能信息
 * @param usageTimes - 该技能所有已记录的使用时间点（已排序）
 * @param actionTime - 当前动作的执行时间点
 * @returns CooldownStatus - 冷却状态
 */
const calculateCooldown = (skill: Skill, usageTimes: number[], actionTime: number): CooldownStatus => {
  const { recast, maxcharge } = skill;

  // 如果没有冷却时间，直接返回可用
  if (recast <= 0) {
    return { isCooldown: false, nextAvailableTime: null, cooldownInfo: '此技能没有冷却时间' };
  }

  // 筛选出在当前动作之前的使用记录
  const pastUsages = usageTimes.filter(time => time < actionTime);

  // 如果没有过去的使用记录，技能是可用的
  if (pastUsages.length === 0) {
    const chargesInfo = maxcharge > 0 ? ` (${maxcharge}/${maxcharge}充能)` : '';
    return { isCooldown: false, nextAvailableTime: null, cooldownInfo: `技能可用${chargesInfo}` };
  }

  // --- 充能技能计算 ---
  if (maxcharge > 0) {
    // 充能计算逻辑简化和修正
    // 找到所有在当前动作时间点之前，并且会影响充能计算的使用记录
    // const relevantPastUsages = pastUsages.slice(-(maxcharge > 0 ? maxcharge : 1));
    
    // let availableCharges = maxcharge;
    let nextChargeTime: number | null = null;

    const chargeRecoveryTimes: number[] = [];
    for(let i = 0; i < maxcharge; i++) {
        chargeRecoveryTimes.push(0);
    }

    for(const usageTime of pastUsages) {
        // let recovered = false;
        for(let i = 0; i < maxcharge; i++) {
            if(usageTime >= chargeRecoveryTimes[i]) {
                chargeRecoveryTimes[i] = usageTime + recast;
                // recovered = true;
                break;
            }
        }
    }

    let currentCharges = 0;
    for(let i = 0; i < maxcharge; i++) {
        if(actionTime >= chargeRecoveryTimes[i]) {
            currentCharges++;
        }
    }
    
    chargeRecoveryTimes.sort((a,b) => a-b);
    if(currentCharges < maxcharge) {
        nextChargeTime = chargeRecoveryTimes[0];
    }


    if (currentCharges > 0) {
      return {
        isCooldown: false,
        nextAvailableTime: nextChargeTime,
        cooldownInfo: `技能可用 (${currentCharges}/${maxcharge}充能)`,
      };
    } else {
      const remainingTime = nextChargeTime ? nextChargeTime - actionTime : 0;
      return {
        isCooldown: true,
        nextAvailableTime: nextChargeTime,
        cooldownInfo: `技能在冷却中 (还需 ${remainingTime.toFixed(1)} 秒)`,
      };
    }
  }
  // --- 普通技能计算 ---
  else {
    const lastUsedTime = pastUsages[pastUsages.length - 1];
    const cooldownEndTime = lastUsedTime + recast;
    const isCooldown = cooldownEndTime > actionTime;

    if (isCooldown) {
      const remainingTime = (cooldownEndTime - actionTime).toFixed(1);
      return {
        isCooldown: true,
        nextAvailableTime: cooldownEndTime,
        cooldownInfo: `技能在冷却中 (还需 ${remainingTime} 秒)`,
      };
    } else {
      return {
        isCooldown: false,
        nextAvailableTime: null,
        cooldownInfo: '技能可用',
      };
    }
  }
};


/**
 * 自定义Hook，用于检查技能的冷却状态
 * @param skillId - 要检查的技能ID
 * @param actionTime - 动作的计划执行时间
 * @param skillUsageMap - 预先计算好的技能使用时间表
 * @param otherUsagesInCurrentAction - 在当前操作中（例如同一组内）的其他相关技能使用时间点
 */
export const useSkillCooldown = (
  skillId: string | null,
  actionTime: number,
  skillUsageMap: Map<string, number[]>,
  otherUsagesInCurrentAction: number[] = []
): CooldownStatus | null => {
  const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus | null>(null);

  const allUsageTimes = useMemo(() => {
    if (!skillId) return [];
    const timelineUsages = skillUsageMap.get(skillId) || [];
    // 合并并排序所有使用时间
    const combined = [...timelineUsages, ...otherUsagesInCurrentAction];
    combined.sort((a, b) => a - b);
    // 去重
    return combined.filter((value, index, self) => self.indexOf(value) === index);
  }, [skillId, skillUsageMap, otherUsagesInCurrentAction]);

  useEffect(() => {
    if (!skillId) {
      setCooldownStatus(null);
      return;
    }

    const skill = skills.find(s => s.id === skillId);
    if (!skill) {
      setCooldownStatus({ isCooldown: false, nextAvailableTime: null, cooldownInfo: '未找到技能信息' });
      return;
    }

    const status = calculateCooldown(skill, allUsageTimes, actionTime);
    setCooldownStatus(status);

  }, [skillId, actionTime, allUsageTimes]);

  return cooldownStatus;
};
