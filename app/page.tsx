"use client";

import { useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { manseCalc } from "@/lib/manse";
import DatePicker, { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale";

registerLocale("ko", ko);

export default function Home() {
  const [birthDateTime, setBirthDateTime] = useState<Date | null>(null);
  const [manse, setManse] =
    useState<{ year: string; month: string; day: string; hour: string } | null>(
      null
    );
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [buttonText, setButtonText] = useState("확인");

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDateTime) return;
    const y = birthDateTime.getFullYear();
    const m = birthDateTime.getMonth() + 1;
    const d = birthDateTime.getDate();
    const hh = birthDateTime.getHours();
    const mm = birthDateTime.getMinutes();
    const result = manseCalc(y, m, d, hh, mm);
    setManse(result);
    setReport("");
  };

  const handleConfirm = async () => {
    if (!manse) return;
    setLoading(true);
    setButtonText("상세한 분석을 위해 시간이 오래걸립니다.");
    setTimeout(() => setButtonText("분석 중..."), 1000);
    const birthInfo = `${manse.year}년 ${manse.month}월 ${manse.day}일 ${manse.hour}시`;
    const res = await fetch("/api/saju", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthInfo }),
    });
    const data = await res.json();
    setReport(data.result || data.error);
    setLoading(false);
    setButtonText("확인");
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <Image src="/fortune.svg" alt="사주 아이콘" width={64} height={64} />
          <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-yellow-200 via-pink-200 to-fuchsia-300 bg-clip-text text-transparent drop-shadow">
            사주 분석
          </h1>
        </div>
        <form
          onSubmit={handleCalculate}
          className="space-y-4 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30"
        >
          <DatePicker
            selected={birthDateTime}
            onChange={(date: Date | null) => setBirthDateTime(date)}
            showTimeSelect
            timeIntervals={30}
            timeFormat="HH:mm"
            dateFormat="MMMM/yy/dd HH:mm"
            locale="ko"
            className="w-full rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 py-2 font-medium text-white shadow-lg transition-colors hover:from-fuchsia-600 hover:via-rose-600 hover:to-amber-500"
          >
            만세력 보기
          </button>
        </form>
        {manse && (
          <div className="space-y-4 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30 text-center">
            <p>
              {manse.year}년 {manse.month}월 {manse.day}일 {manse.hour}시
            </p>
            <button
              onClick={handleConfirm}
              className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 py-2 font-medium text-white shadow-lg transition-colors hover:from-fuchsia-600 hover:via-rose-600 hover:to-amber-500 disabled:opacity-50"
              disabled={loading}
            >
              {buttonText}
            </button>
          </div>
        )}
        {report && (
          <div className="rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30 whitespace-pre-wrap leading-relaxed">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        )}
      </div>
    </main>
  );
}
