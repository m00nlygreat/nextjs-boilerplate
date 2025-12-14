"use client";

interface ManseDisplayProps {
  manse: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  gender: string;
}

export default function ManseDisplay({ manse, gender }: ManseDisplayProps) {
  const parts = [
    { label: "시", value: manse.hour },
    { label: "일", value: manse.day },
    { label: "월", value: manse.month },
    { label: "년", value: manse.year },
  ];

  const elementColorMap: Record<string, string> = {
    목: "bg-emerald-400 text-white",
    화: "bg-rose-400 text-white",
    토: "bg-amber-200 text-stone-800",
    금: "bg-slate-100 text-gray-700",
    수: "bg-sky-500 text-white",
  };

  function getElement(char: string): string | undefined {
    const map: Record<string, string> = {
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
    return map[char];
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 justify-items-center gap-3 text-gray-100">
        {parts.map((part) => {
          const stem = part.value.charAt(0);
          const branch = part.value.charAt(1);
          const stemClasses = elementColorMap[getElement(stem) || ""] || "";
          const branchClasses = elementColorMap[getElement(branch) || ""] || "";
          return (
            <div
              key={part.label}
              className="flex w-16 flex-col items-center space-y-2 text-center sm:w-20"
            >
              <div
                className={`${stemClasses} flex aspect-square w-full items-center justify-center rounded-xl p-1 text-2xl font-bold sm:text-3xl`}
              >
                {stem}
              </div>
              <div
                className={`${branchClasses} flex aspect-square w-full items-center justify-center rounded-xl p-1 text-2xl font-bold sm:text-3xl`}
              >
                {branch}
              </div>
              <span className="text-xs text-gray-100 sm:text-sm">{part.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-200">{gender}</p>
    </div>
  );
}

