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
          <div className="space-y-2 rounded-md bg-blue-50 p-4 text-sm text-blue-900">
            <p>
              사주 분석을 하기 위해서는 <strong>만세력</strong>이 필요해요. 만세력은 내 생년월일시를 입력하면 알 수 있습니다.{' '}
              <a
                href="https://pro.forceteller.com/profile/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                포스텔러 만세력
              </a>
              에서 내 만세력을 구해서 입력해주세요
            </p>
            <img
              src="/chatgpt-4pillars.png"
              alt="만세력 예시"
              className="w-full rounded-md"
            />
          </div>
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
