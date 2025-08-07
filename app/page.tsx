"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

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
    <main className="max-w-xl mx-auto p-4 flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          className="border p-2"
          value={birthInfo}
          onChange={(e) => setBirthInfo(e.target.value)}
          placeholder="정묘년 계축월 신사일 계사시 / 남성"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "분석 중..." : "분석하기"}
        </button>
      </form>
      {report && (
        <div className="border p-4 rounded bg-gray-50">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{report}</ReactMarkdown>
        </div>
      )}
    </main>
  );
}
