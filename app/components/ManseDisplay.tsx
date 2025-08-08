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
    { label: "년", value: manse.year },
    { label: "월", value: manse.month },
    { label: "일", value: manse.day },
    { label: "시", value: manse.hour },
  ];

  const elementColorMap: Record<string, string> = {
    목: "bg-green-500 text-white",
    화: "bg-red-500 text-white",
    토: "bg-yellow-300 text-black",
    금: "bg-white text-black",
    수: "bg-blue-800 text-white",
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
      <div className="grid grid-cols-4 gap-3 text-gray-800">
        {parts.map((part) => {
          const stem = part.value.charAt(0);
          const branch = part.value.charAt(1);
          const stemClasses = elementColorMap[getElement(stem) || ""] || "";
          const branchClasses = elementColorMap[getElement(branch) || ""] || "";
          return (
            <div
              key={part.label}
              className="flex flex-col items-stretch text-center space-y-2"
            >
              <div
                className={`${stemClasses} w-full rounded-xl p-1 text-3xl sm:text-4xl font-bold aspect-square flex items-center justify-center`}
              >
                {stem}
              </div>
              <div
                className={`${branchClasses} w-full rounded-xl p-1 text-3xl sm:text-4xl font-bold aspect-square flex items-center justify-center`}
              >
                {branch}
              </div>
              <span className="text-xs text-gray-500 sm:text-sm">{part.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-200">{gender}</p>
    </div>
  );
}

