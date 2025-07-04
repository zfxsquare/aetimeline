interface TimelineEntry {
  time: number;
  text: string;
  groups?: ConditionActionGroup[];
}

interface ConditionActionGroup {
  id: string;
  enabled: boolean;
  actions: Action[];
}

interface Action {
  type: string;
  enabled: boolean;
}

interface SkillAction extends Action {
  type: 'skill';
  skillId: string;
  timeOffset: number;
}

export type SkillUsageMap = Map<string, number[]>;

export class SkillUsageService {
  /**
   * 构建技能使用时间表
   * @param timelineEntries - 整个时间轴的条目
   * @returns SkillUsageMap - 一个Map，键是skillId，值是该技能所有使用时间点（已排序）的数组
   */
  public static buildSkillUsageMap(timelineEntries: TimelineEntry[]): SkillUsageMap {
    const usageMap: SkillUsageMap = new Map();

    for (const entry of timelineEntries) {
      if (!entry.groups) continue;

      for (const group of entry.groups) {
        if (!group.enabled) continue;

        for (const action of group.actions) {
          if (action.type === 'skill' && action.enabled) {
            const skillAction = action as SkillAction;
            const skillId = skillAction.skillId;
            const executionTime = entry.time + skillAction.timeOffset;

            if (!usageMap.has(skillId)) {
              usageMap.set(skillId, []);
            }
            usageMap.get(skillId)!.push(executionTime);
          }
        }
      }
    }

    // 对每个技能的使用时间进行排序
    usageMap.forEach(times => times.sort((a, b) => a - b));

    return usageMap;
  }
}
