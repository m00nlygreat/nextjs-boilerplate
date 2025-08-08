"use client";

import { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (val: string) => void;
  onTimeChange: (val: string) => void;
}

const format = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

export default function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
}: DateTimePickerProps) {
  const selected = date
    ? (() => {
        const [y, m, d] = date.split("-").map(Number);
        const [hh, mm] = time ? time.split(":").map(Number) : [0, 0];
        return new Date(y, m - 1, d, hh, mm);
      })()
    : null;

  const handleChange = (val: Date | null) => {
    if (!val) {
      onDateChange("");
      onTimeChange("");
      return;
    }
    const [datePart, timePart] = format(val).split(" ");
    onDateChange(datePart);
    onTimeChange(timePart);
  };

  const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, onChange }, ref) => (
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      onChange={onChange}
      placeholder="YYYY-MM-DD HH:mm"
      className="w-full rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
    />
  ));
  CustomInput.displayName = "CustomDateInput";

  const handleChangeRaw = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const [datePart, timePart] = val.split(" ");
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      onDateChange(datePart);
      if (/^\d{2}:\d{2}$/.test(timePart)) {
        onTimeChange(timePart);
      } else {
        onTimeChange("");
      }
    } else {
      onDateChange("");
      onTimeChange("");
    }
  };

  const inputValue = [date, time].filter(Boolean).join(" ");

  return (
    <DatePicker
      selected={selected}
      onChange={handleChange}
      onChangeRaw={handleChangeRaw}
      showTimeSelect
      timeIntervals={30}
      dateFormat="yyyy-MM-dd HH:mm"
      customInput={<CustomInput value={inputValue} />}
      showYearDropdown
      dropdownMode="select"
    />
  );
}

