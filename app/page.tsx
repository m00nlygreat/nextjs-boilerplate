"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkSqueezeParagraphs from "remark-squeeze-paragraphs";
import { useSearchParams } from "next/navigation";
import DateTimePicker from "@/app/components/DateTimePicker";
import ManseDisplay from "@/app/components/ManseDisplay";
import CatRain from "@/app/components/CatRain";
import { replaceMarkdownLinkText } from "@/lib/markdown";

function HomeContent() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState("");
  type LuckCycle = {
    start_age: number;
    start_date: string;
    ganzhi: string;
    ganzhi_kor: string;
  };

  type ManseResult = {
    year: string;
    month: string;
    day: string;
    hour: string;
    cycles?: LuckCycle[];
  };

  const [manse, setManse] = useState<ManseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [catMode, setCatMode] = useState(false);
  const [extraQuestion, setExtraQuestion] = useState("");
  const [inquiryType, setInquiryType] = useState<"luck" | "question">("luck");
  const reportRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const model = searchParams.get("model") || "gpt-5-mini";
  const search = searchParams.get("search") === "true";
  interface StoredResult {
    id: string;
    name: string;
    manse: ManseResult;
    gender: string;
    report: string;
    catMode: boolean;
    model: string;
    createdAt: string;
  }
  const [results, setResults] = useState<StoredResult[]>([]);
  const [selectedResult, setSelectedResult] =
    useState<StoredResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingReport, setStreamingReport] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("sajuResults");
    if (stored) {
      const parsed: StoredResult[] = JSON.parse(stored);
      const processed = parsed.map((r) => ({
        ...r,
        report: replaceMarkdownLinkText(r.report, r.catMode ? "🐾" : "📎"),
      }));
      setResults(processed);
    }
  }, []);

  useEffect(() => {
    if (!birthDate || !birthTime || !gender) {
      setManse(null);
      setSelectedResult(null);
      return;
    }

    setError(null);
    const controller = new AbortController();
    const fetchManse = async () => {
      try {
        const params = new URLSearchParams({
          date: birthDate,
          time: birthTime,
          [gender === "여성" ? "female" : "male"]: "true",
        });
        const response = await fetch(`/api/manse?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("사주 계산에 실패했습니다.");
        }
        const data = await response.json();
        const ganzhi = data?.verbose?.ganzhi;
        if (!ganzhi?.year || !ganzhi?.month || !ganzhi?.day || !ganzhi?.hour) {
          throw new Error("사주 결과를 불러오지 못했습니다.");
        }
        setManse({
          year: ganzhi.year,
          month: ganzhi.month,
          day: ganzhi.day,
          hour: ganzhi.hour,
          cycles: data?.cycles,
        });
        setSelectedResult(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("manse API 오류", err);
        setManse(null);
        setSelectedResult(null);
        setError(
          catMode
            ? "사주 계산에 문제가 생겼냥. 다시 시도해달라옹."
            : "사주 계산 중 오류가 발생했습니다. 다시 시도해 주세요."
        );
      }
    };

    fetchManse();
    return () => controller.abort();
  }, [birthDate, birthTime, gender, catMode]);

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

  const handleDelete = (id: string) => {
    setResults((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem("sajuResults", JSON.stringify(updated));
      return updated;
    });
    if (selectedResult?.id === id) {
      setSelectedResult(null);
    }
  };

  const handleConfirm = async () => {
    if (!manse || !gender || !name) return;
    setError(null);
    setLoading(true);
    setStreamingReport("");
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setSelectedResult(null);
    const birthInfo = `${manse.hour}시 ${manse.day}일 ${manse.month}월 ${manse.year}년, 성별: ${gender}`;
    const url = `/api/saju?model=${encodeURIComponent(model)}${
      search ? "&search=true" : ""
    }`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthInfo,
          catMode,
          question: extraQuestion,
          inquiryType,
          luckCycles: inquiryType === "luck" ? manse.cycles : undefined,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API 응답 오류:", res.status, errorText);
        setError(
          catMode
            ? "요청이 실패했냥... 다시 시도해달라옹."
            : "요청이 실패했습니다. 다시 시도해 주세요."
        );
        return;
      }
      if (!res.body) {
        setError(
          catMode
            ? "스트림이 연결되지 않았냥. 다시 시도해달라옹."
            : "응답 스트림을 열지 못했습니다. 다시 시도해 주세요."
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aggregated = "";
      let buffer = "";
      const appendText = (text: string) => {
        aggregated += text;
        setStreamingReport((prev) => prev + text);
      };
      const processBuffer = (dataChunk: string) => {
        buffer += dataChunk;
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        let parsedAny = false;
        events.forEach((event) => {
          const dataLine = event
            .split("\n")
            .find((line) => line.trim().startsWith("data:"));
          if (!dataLine) return;
          const data = dataLine.replace(/^data:\s*/, "").trim();
          if (!data || data === "[DONE]") return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "response.output_text.delta" && parsed.delta) {
              appendText(parsed.delta as string);
              parsedAny = true;
            } else if (parsed.type === "response.output_text.done" && parsed.output_text) {
              appendText(parsed.output_text as string);
              parsedAny = true;
            } else if (parsed.type === "error" && parsed.error?.message) {
              throw new Error(parsed.error.message as string);
            }
          } catch (parseError) {
            console.error("스트림 파싱 오류", parseError, data);
          }
        });
        if (!parsedAny && dataChunk.trim() && !/data:/i.test(dataChunk)) {
          appendText(dataChunk);
          buffer = "";
        }
      };
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          processBuffer(chunk);
        }
        if (buffer.trim()) {
          processBuffer("\n\n");
        }
      } finally {
        reader.releaseLock();
      }

      const emoji = catMode ? "🐾" : "📎";
      const processedText = replaceMarkdownLinkText(aggregated.trim(), emoji);
      const newResult: StoredResult = {
        id: Date.now().toString(),
        name,
        manse,
        gender,
        report: processedText,
        catMode,
        model,
        createdAt: new Date().toISOString(),
      };
      setResults((prev) => {
        const updated = [...prev, newResult];
        localStorage.setItem("sajuResults", JSON.stringify(updated));
        return updated;
      });
      setSelectedResult(newResult);
    } catch (err: any) {
      if (controller.signal.aborted) {
        setError(catMode ? "요청을 멈췄다냥." : "요청을 취소했습니다.");
      } else {
        console.error("API 요청 중 오류", err);
        setError(
          catMode ? "문제가 생겼냥. 다시 시도해달라옹." : "요청 중 오류가 발생했습니다."
        );
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 text-white">
      <CatRain active={catMode} />
      <div className="w-full max-w-[600px] space-y-6">
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
          <div className="space-y-3 rounded-2xl bg-white/20 p-4 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
            <div className="flex flex-col gap-2 text-sm text-white/90 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="inquiry"
                  value="luck"
                  checked={inquiryType === "luck"}
                  onChange={() => setInquiryType("luck")}
                  className="h-4 w-4 accent-fuchsia-500"
                />
                <span>대운 해석 받기 (디폴트)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="inquiry"
                  value="question"
                  checked={inquiryType === "question"}
                  onChange={() => setInquiryType("question")}
                  className="h-4 w-4 accent-fuchsia-500"
                />
                <span>추가 질문 입력</span>
              </label>
            </div>
            {inquiryType === "question" ? (
              <input
                type="text"
                className="w-full rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                value={extraQuestion}
                onChange={(e) => setExtraQuestion(e.target.value)}
                placeholder={
                  catMode
                    ? "추가로 궁금한게 있으면 적어보라옹😽"
                    : "혹시 추가로 궁금한 게 있으면 적어보세요"
                }
              />
            ) : (
              <div className="rounded-lg bg-white/10 p-3 text-sm text-white/80">
                {catMode
                  ? "10년마다 바뀌는 대운 흐름을 분석해서 운세 코멘트를 덧붙일게!"
                  : "10년 단위 대운 흐름을 분석해 운세 코멘트를 추가로 제공해요."}
              </div>
            )}
          </div>
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
        {error && (
          <div className="rounded-md bg-red-500/20 p-2 text-sm text-red-200" role="alert">
            {error}
          </div>
        )}
        {loading && (
          <div className="space-y-3 rounded-2xl bg-white/10 p-4 shadow-lg ring-1 ring-white/20" aria-live="polite">
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>{catMode ? "실시간으로 분석중이다냥..." : "실시간으로 분석 중입니다."}</span>
              <button
                onClick={handleCancel}
                className="rounded-md border border-white/30 px-2 py-1 text-xs hover:border-white/60"
              >
                {catMode ? "취소" : "중단"}
              </button>
            </div>
            <div className="markdown leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkSqueezeParagraphs]}>
                {streamingReport || (catMode ? "답변을 준비하고 있다냥..." : "답변을 준비하고 있어요...")}
              </ReactMarkdown>
            </div>
          </div>
        )}
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
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedResult(r);
                      setCatMode(r.catMode);
                    }}
                    className="flex w-full items-center justify-between rounded-md bg-white/10 px-4 py-2 hover:bg-white/20 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <span>{r.catMode ? "😺" : "📄"}</span>
                      <span>{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-white/70">
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                        className="rounded-md px-2 py-1 hover:bg-white/30"
                        aria-label="결과 삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div />}> 
      <HomeContent />
    </Suspense>
  );
}
