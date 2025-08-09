"use client";

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function DateTimePicker({ value = "", onChange }: DateTimePickerProps) {
  return (
    <input
      type="date"
      className="block w-full min-w-0 appearance-none rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
      max="9999-12-31"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
