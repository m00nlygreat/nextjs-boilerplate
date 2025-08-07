"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [birthInfo, setBirthInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setReport("");
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
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-semibold text-center">사주 분석</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur"
        >
          <input
            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={birthInfo}
            onChange={(e) => setBirthInfo(e.target.value)}
            placeholder="정묘년 계축월 신사일 계사시 / 남성"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "분석 중..." : "분석하기"}
          </button>
        </form>
        {report && (
          <div className="rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur whitespace-pre-wrap leading-relaxed">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        )}
      </div>
    </main>
  );
}
