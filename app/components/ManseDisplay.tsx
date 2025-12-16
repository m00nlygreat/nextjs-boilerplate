"use client";

import { getElementColorClasses } from "@/lib/ganzhi";

interface ManseDisplayProps {
  manse: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
}

export default function ManseDisplay({ manse }: ManseDisplayProps) {
  const parts = [
    { label: "시", value: manse.hour },
    { label: "일", value: manse.day },
    { label: "월", value: manse.month },
    { label: "년", value: manse.year },
  ];

  return (
    <div className="space-y-2">
      <div className="mx-auto grid w-fit grid-cols-4 justify-items-center gap-2 text-gray-100">
        {parts.map((part) => {
          const stem = part.value.charAt(0);
          const branch = part.value.charAt(1);
          const stemClasses = getElementColorClasses(stem);
          const branchClasses = getElementColorClasses(branch);
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
    </div>
  );
}

