"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkSqueezeParagraphs from "remark-squeeze-paragraphs";
import DateTimePicker from "@/app/components/DateTimePicker";
import ManseDisplay from "@/app/components/ManseDisplay";
import CatRain from "@/app/components/CatRain";
import { manseCalc } from "@/lib/manse";

export default function Home() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState("");
  const [manse, setManse] =
    useState<{ year: string; month: string; day: string; hour: string } | null>(
      null
    );
  const [loading, setLoading] = useState(false);
  const [catMode, setCatMode] = useState(false);
  const [extraQuestion, setExtraQuestion] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  interface StoredResult {
    id: string;
    name: string;
    manse: { year: string; month: string; day: string; hour: string };
    gender: string;
    report: string;
    catMode: boolean;
    model: string;
    createdAt: string;
  }
  const [results, setResults] = useState<StoredResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<StoredResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("sajuResults");
    if (stored) {
      setResults(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (birthDate && birthTime && gender) {
      const [y, m, d] = birthDate.split("-").map(Number);
      const [hh, mm] = birthTime.split(":").map(Number);
      const result = manseCalc(y, m, d, hh, mm);
      setManse(result);
      setSelectedResult(null);
    } else {
      setManse(null);
      setSelectedResult(null);
    }
  }, [birthDate, birthTime, gender]);

  useEffect(() => {
    if (catMode) {
      document.body.classList.add("cat-mode-bg");
    } else {
      document.body.classList.remove("cat-mode-bg");
    }
    return () => {
      document.body.classList.remove("cat-mode-bg");
    };
  }, [catMode]);

  useEffect(() => {
    if (selectedResult) {
      reportRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedResult]);

  const handleConfirm = async () => {
    if (!manse || !gender || !name) return;
    setLoading(true);
    const birthInfo = `${manse.hour}시 ${manse.day}일 ${manse.month}월 ${manse.year}년, 성별: ${gender}`;
    const res = await fetch("/api/saju", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthInfo, catMode, question: extraQuestion }),
    });
    const data = await res.json();
    const resultText = (data.result || data.error).trim();
    const newResult: StoredResult = {
      id: Date.now().toString(),
      name,
      manse,
      gender,
      report: resultText,
      catMode,
      model: "gpt-5",
      createdAt: new Date().toISOString(),
    };
    setResults((prev) => {
      const updated = [...prev, newResult];
      localStorage.setItem("sajuResults", JSON.stringify(updated));
      return updated;
    });
    setSelectedResult(newResult);
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 text-white">
      <CatRain active={catMode} />
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <Image src="/fortune.svg" alt="사주 아이콘" width={64} height={64} />
          <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-yellow-200 via-pink-200 to-fuchsia-300 bg-clip-text text-transparent drop-shadow">
            꽤 잘맞는 AI 사주 분석
          </h1>
        </div>
        <div className="space-y-4 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
          <input
            type="text"
            className="w-full rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
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
        {manse && !selectedResult && (
          <div className="space-y-4 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30 text-center">
            <ManseDisplay manse={manse} gender={gender} />
          </div>
        )}
        {manse && !selectedResult && (
          <input
            type="text"
            className="w-full rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            value={extraQuestion}
            onChange={(e) => setExtraQuestion(e.target.value)}
            placeholder={catMode ? "추가로 궁금한게 있으면 적어보라옹😽" : "혹시 추가로 궁금한 게 있으면 적어보세요"}
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setCatMode((prev) => !prev)}
            aria-pressed={catMode}
            aria-label="냥냥체 인젝션"
            title="냥냥체 인젝션"
            className={`flex items-center gap-1 rounded-md border px-3 py-1 text-xs text-white/80 transition-colors ${
              catMode
                ? "border-white/40 bg-white/20"
                : "border-white/20 bg-white/10 hover:bg-white/20"
            }`}
          >
            <span
              className={`text-lg transition-all ${
                catMode
                  ? "scale-150 rotate-6 drop-shadow-[0_0_4px_#fff]"
                  : "opacity-50"
              }`}
            >
              😺
            </span>
            <span>냥냥체 인젝션</span>
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-lg bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 py-2 font-medium text-white shadow-lg transition-colors hover:from-fuchsia-600 hover:via-rose-600 hover:to-amber-500 disabled:opacity-50"
            disabled={!manse || !name || loading}
          >
            {loading ? (catMode ? "분석중이다냐~ 기다리라옹 😹" : "분석 중...조금 시간이 걸립니다") : (catMode ? "분석시작한다냥😽" : "분석 시작")}
          </button>
        </div>
        <div ref={reportRef}>
          {selectedResult ? (
            <div className="space-y-4 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
              <button
                onClick={() => {
                  setSelectedResult(null);
                  setCatMode(false);
                }}
                className="mb-4 text-sm text-fuchsia-200"
              >
                ← 뒤로가기
              </button>
              <ManseDisplay manse={selectedResult.manse} gender={selectedResult.gender} />
              <div className="markdown leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkSqueezeParagraphs]}>
                  {selectedResult.report}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            results.length > 0 && (
              <div className="space-y-2 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedResult(r);
                      setCatMode(r.catMode);
                    }}
                    className="flex w-full items-center justify-between rounded-md bg-white/10 px-4 py-2 text-left hover:bg-white/20"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <span>{r.catMode ? "😺" : "📄"}</span>
                      <span>{r.name}</span>
                    </div>
                    <div className="text-xs text-white/70">
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
