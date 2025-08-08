"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import DateTimePicker from "@/app/components/DateTimePicker";
import ManseDisplay from "@/app/components/ManseDisplay";
import { manseCalc } from "@/lib/manse";

export default function Home() {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState("");
  const [manse, setManse] =
    useState<{ year: string; month: string; day: string; hour: string } | null>(
      null
    );
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");

  useEffect(() => {
    if (birthDate && birthTime && gender) {
      const [y, m, d] = birthDate.split("-").map(Number);
      const [hh, mm] = birthTime.split(":").map(Number);
      const result = manseCalc(y, m, d, hh, mm);
      setManse(result);
      setReport("");
    } else {
      setManse(null);
      setReport("");
    }
  }, [birthDate, birthTime, gender]);

  const handleConfirm = async () => {
    if (!manse || !gender) return;
    setLoading(true);
    const birthInfo = `${manse.hour}시 ${manse.day}일 ${manse.month}월 ${manse.year}년, 성별: ${gender}`;
    const res = await fetch("/api/saju", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthInfo }),
    });
    const data = await res.json();
    setReport(data.result || data.error);
    setLoading(false);
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
        <div className="space-y-4 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
          <DateTimePicker value={birthDate} onChange={setBirthDate} />
          <input
            type="time"
            className="block w-full min-w-0 appearance-none rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
          />
          <select
            className="w-full rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">성별을 선택하세요</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
          </select>
        </div>
        {manse && (
          <div className="space-y-4 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30 text-center">
            <ManseDisplay manse={manse} gender={gender} />
          </div>
        )}
        <button
          onClick={handleConfirm}
          className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 py-2 font-medium text-white shadow-lg transition-colors hover:from-fuchsia-600 hover:via-rose-600 hover:to-amber-500 disabled:opacity-50"
          disabled={!manse || loading}
        >
          {loading ? "분석 중..." : "분석"}
        </button>
        {report && (
          <div className="rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30 whitespace-pre-wrap leading-relaxed">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        )}
      </div>
    </main>
  );
}
