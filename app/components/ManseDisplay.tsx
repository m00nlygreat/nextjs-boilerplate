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

  const colors: [string, string][] = [
    ["bg-rose-200", "bg-rose-100"],
    ["bg-orange-200", "bg-orange-100"],
    ["bg-emerald-200", "bg-emerald-100"],
    ["bg-sky-200", "bg-sky-100"],
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 text-gray-800">
        {parts.map((part, idx) => {
          const stem = part.value.charAt(0);
          const branch = part.value.charAt(1);
          const [topColor, bottomColor] = colors[idx];
          return (
            <div
              key={part.label}
              className="flex flex-col items-stretch text-center space-y-1"
            >
              <div className={`${topColor} w-full rounded-md p-2 text-3xl sm:text-4xl font-bold aspect-square flex items-center justify-center`}>
                {stem}
              </div>
              <div className={`${bottomColor} w-full rounded-md p-2 text-3xl sm:text-4xl font-bold aspect-square flex items-center justify-center`}>
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

