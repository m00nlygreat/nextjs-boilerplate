const elementColorMap: Record<string, string> = {
  목: "bg-emerald-400 text-white",
  화: "bg-rose-400 text-white",
  토: "bg-amber-200 text-stone-800",
  금: "bg-slate-100 text-gray-700",
  수: "bg-sky-500 text-white",
};

const elementByChar: Record<string, string> = {
  甲: "목",
  乙: "목",
  丙: "화",
  丁: "화",
  戊: "토",
  己: "토",
  庚: "금",
  辛: "금",
  壬: "수",
  癸: "수",
  子: "수",
  丑: "토",
  寅: "목",
  卯: "목",
  辰: "토",
  巳: "화",
  午: "화",
  未: "토",
  申: "금",
  酉: "금",
  戌: "토",
  亥: "수",
};

const branchAnimalMap: Record<string, string> = {
  子: "🐭",
  丑: "🐮",
  寅: "🐯",
  卯: "🐰",
  辰: "🐲",
  巳: "🐍",
  午: "🐴",
  未: "🐑",
  申: "🐒",
  酉: "🐔",
  戌: "🐶",
  亥: "🐷",
};

export function getElement(char: string): string | undefined {
  return elementByChar[char];
}

export function getElementColorClasses(char: string): string {
  const element = getElement(char);
  return element ? elementColorMap[element] ?? "" : "";
}

export function getBranchAnimalEmoji(branch: string): string {
  return branchAnimalMap[branch] ?? "";
}

export function getDayProfileVisuals(day: string) {
  const stem = day.charAt(0);
  const branch = day.charAt(1);
  return {
    colorClasses: getElementColorClasses(stem),
    animalEmoji: getBranchAnimalEmoji(branch),
  };
}
