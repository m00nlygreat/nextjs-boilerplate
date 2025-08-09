"use client";

import { useRef } from "react";

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function DateTimePicker({ value = "", onChange }: DateTimePickerProps) {
  const [year = "", month = "", day = ""] = value.split("-");
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        maxLength={4}
        className="w-20 rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
        value={year}
        onChange={(e) => {
          const newYear = e.currentTarget.value.slice(0, 4);
          if (newYear.length === 4) {
            monthRef.current?.focus();
          }
          onChange?.([newYear, month, day].filter(Boolean).join("-"));
        }}
      />
      <span>-</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        className="w-12 rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
        value={month}
        onChange={(e) => {
          const newMonth = e.currentTarget.value.slice(0, 2);
          if (newMonth.length === 2) {
            dayRef.current?.focus();
          }
          onChange?.([year, newMonth, day].filter(Boolean).join("-"));
        }}
      />
      <span>-</span>
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        className="w-12 rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
        value={day}
        onChange={(e) => {
          const newDay = e.currentTarget.value.slice(0, 2);
          onChange?.([year, month, newDay].filter(Boolean).join("-"));
        }}
      />
    </div>
  );
}

