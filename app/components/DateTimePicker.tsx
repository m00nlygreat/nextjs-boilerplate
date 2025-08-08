"use client";

import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function DateTimePicker({ value = "", onChange }: DateTimePickerProps) {
  const [inputValue, setInputValue] = useState<string>(() => {
    return value ? dayjs(value).format("YYYY-MM-DD") : "";
  });
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(() => {
    return value ? dayjs(value) : null;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(() => {
    return value ? dayjs(value) : dayjs();
  });

  useEffect(() => {
    if (selectedDate) {
      const formatted = selectedDate.format("YYYY-MM-DD");
      setInputValue(formatted);
      setCalendarMonth(selectedDate);
      onChange?.(formatted);
    }
  }, [selectedDate, onChange]);

  useEffect(() => {
    if (value) {
      const parsed = dayjs(value);
      if (parsed.isValid()) {
        setSelectedDate(parsed);
        setInputValue(parsed.format("YYYY-MM-DD"));
        setCalendarMonth(parsed);
      }
    }
  }, [value]);

  const parseAndSet = (raw: string) => {
    const digits = raw.replace(/-/g, "");
    if (digits.length === 8) {
      const parsed = dayjs(digits, "YYYYMMDD", true);
      if (parsed.isValid()) {
        setSelectedDate(parsed);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    parseAndSet(val);
  };

  const handleInputBlur = () => {
    const digits = inputValue.replace(/-/g, "");
    const parsed = dayjs(digits, "YYYYMMDD", true);
    if (parsed.isValid()) {
      setSelectedDate(parsed);
    } else if (selectedDate) {
      setInputValue(selectedDate.format("YYYY-MM-DD"));
    } else {
      setInputValue("");
    }
  };

  const selectDay = (date: Dayjs) => {
    setSelectedDate(date);
    setIsOpen(false);
  };

  const daysInMonth = calendarMonth.daysInMonth();
  const firstDay = calendarMonth.startOf("month").day();
  const calendarDays: (Dayjs | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(calendarMonth.date(d));
  }

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="relative inline-block w-full text-black">
      <div className="flex gap-2">
        <input
          className="w-full rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="yyyy-mm-dd"
        />
        <button
          type="button"
          className="rounded bg-gray-200 px-3 py-2"
          onClick={() => setIsOpen((o) => !o)}
        >
          📅
        </button>
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-2 rounded border bg-white p-2 shadow">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="px-2"
              onClick={() => setCalendarMonth(calendarMonth.subtract(1, "month"))}
            >
              ‹
            </button>
            <span>{calendarMonth.format("YYYY-MM")}</span>
            <button
              type="button"
              className="px-2"
              onClick={() => setCalendarMonth(calendarMonth.add(1, "month"))}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((d) => (
              <div key={d} className="text-sm font-semibold">
                {d}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const isSelected = day && selectedDate && day.isSame(selectedDate, "day");
              return (
                <button
                  key={idx}
                  type="button"
                  className={`h-8 w-8 rounded text-sm ${
                    isSelected ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                  }`}
                  onClick={() => day && selectDay(day)}
                >
                  {day ? day.date() : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

