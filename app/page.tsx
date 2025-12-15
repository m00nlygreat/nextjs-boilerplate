"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkSqueezeParagraphs from "remark-squeeze-paragraphs";
import { useSearchParams } from "next/navigation";
import DateTimePicker from "@/app/components/DateTimePicker";
import ManseDisplay from "@/app/components/ManseDisplay";
import CatRain from "@/app/components/CatRain";
import { replaceMarkdownLinkText } from "@/lib/markdown";
import { getDayProfileVisuals } from "@/lib/ganzhi";

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

type InquiryType = "luck" | "question";

function buildSystemPrompt({
  catMode,
  inquiryType,
  search,
}: {
  catMode: boolean;
  inquiryType: InquiryType;
  search: boolean;
}) {
  const searchInstruction = search
    ? "웹 검색 프리뷰 도구가 활성화되어 있으니 최신 정보가 필요하면 활용하세요. "
    : "";
  const baseSystemPrompt =
    `당신은 전문 사주 명리학자입니다. ${searchInstruction}다음 사주 원국에 대해 ${
      search ? "한국어로 웹 전반을 검색해보고 " : ""
    }전반적 성격/직업/재물/연애/장점/단점/조언 등의 항목을 전문적으로 분석해주세요.` +
    (catMode
      ? `장난스럽고 애정 어린 말투로 모든 문장을 고양이가 말하는 것 같은 다음 말투들을 사용해 부드럽고 쉬운 말로 살살 설명해주세요. // 뭐 하고 있어? -> 뭐 하고 있냥~? 😺 안녕하세요.     안냥하냥~! 🐱✨ 잘 자. ->       잘 자라옹~ 꿈에서 만냐~ 🌙💤 지금 뭐 해? 지금 뭐 하는 거냥~? 궁금하다옹! 👀 뭘 도와줄까? -> 무엇을 도와줄까냐? ✨😸💕 자신있게 고백하는 거야 -> 자신있게 고백하는 고양😻 // 오행과 그에 어울리는 숲·바위·산 같은 자연 비유만 사용하고 다른 명리 용어는 쓰지 마.`
      : "");

  return inquiryType === "question"
    ? `${baseSystemPrompt} 추가 질문에 대해 답변을 마지막에 덧붙이세요. 마크다운 형식으로 답할 것. 답변은 이것으로 끝이므로 후속조치 등에 대한 안내는 하지 말 것`
    : `${baseSystemPrompt} 마크다운 형식으로 답할 것. 답변은 이것으로 끝이므로 후속조치 등에 대한 안내는 하지 말 것. 제공된 대운 정보가 있다면 각 10년 운의 성향과 조언을 간략히 정리하는 섹션을 추가하세요.`;
}

function buildUserPrompt({
  manse,
  gender,
  inquiryType,
  question,
  luckCycles = [],
}: {
  manse: ManseResult | null;
  gender: string;
  inquiryType: InquiryType;
  question: string;
  luckCycles?: LuckCycle[];
}) {
  if (!manse) return "";

  const formattedLuckCycles = Array.isArray(luckCycles)
    ? luckCycles
        .filter(
          (cycle) =>
            typeof cycle?.start_age === "number" &&
            typeof cycle?.ganzhi === "string" &&
            typeof cycle?.ganzhi_kor === "string"
        )
        .map(
          (cycle) =>
            {
              const startYear =
                typeof cycle.start_date === "string"
                  ? cycle.start_date.match(/\d{4}/)?.[0]
                  : undefined;
              const approxAge = Math.round(cycle.start_age);

              return `- ${startYear ? `${startYear}년` : "시작 연도 미상"} (약 ${approxAge}세), ${cycle.ganzhi} (${cycle.ganzhi_kor}) 대운`;
            }
        )
        .join("\n")
    : "";

  const birthInfo = `${manse.hour}시 ${manse.day}일 ${manse.month}월 ${manse.year}년, 성별: ${
    gender || "미입력"
  }`;

  return inquiryType === "question"
    ? `${birthInfo}\n추가 질문: ${question || "추가 질문 없음"}`
    : `${birthInfo}\n대운(10년) 정보:\n${formattedLuckCycles || "대운 정보 없음"}`;
}

function HomeContent() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState("");

  const [manse, setManse] = useState<ManseResult | null>(null);
  const [manseSignature, setManseSignature] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "manse" | "debug">(
    "input"
  );
  const [manseLoading, setManseLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catMode, setCatMode] = useState(false);
  const [extraQuestion, setExtraQuestion] = useState("");
  const [inquiryType, setInquiryType] = useState<InquiryType>("luck");
  const reportRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debug") === "true";
  const initialModel = searchParams.get("model") || "gpt-5-mini";
  const initialSearchEnabled = searchParams.get("search") === "true";
  const [model, setModel] = useState(initialModel);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [systemPromptDirty, setSystemPromptDirty] = useState(false);
  const [userPromptDirty, setUserPromptDirty] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(initialSearchEnabled);
  interface StoredResult {
    id: string;
    name: string;
    manse: ManseResult;
    gender: string;
    birthDate: string;
    birthTime: string;
    report: string;
    catMode: boolean;
    model: string;
    createdAt: string;
  }
  const [results, setResults] = useState<StoredResult[]>([]);
  const [selectedResult, setSelectedResult] =
    useState<StoredResult | null>(null);
  interface StoredUser {
    id: string;
    name: string;
    birthDate: string;
    birthTime: string;
    gender: string;
    manse: ManseResult;
  }
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [streamingReport, setStreamingReport] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const defaultSystemPrompt = useMemo(
    () => buildSystemPrompt({ catMode, inquiryType, search: searchEnabled }),
    [catMode, inquiryType, searchEnabled]
  );

  const defaultUserPrompt = useMemo(
    () =>
      buildUserPrompt({
        manse,
        gender,
        inquiryType,
        question: extraQuestion,
        luckCycles: manse?.cycles,
      }),
    [manse, gender, inquiryType, extraQuestion]
  );

  useEffect(() => {
    const stored = localStorage.getItem("sajuResults");
    if (stored) {
      const parsed: StoredResult[] = JSON.parse(stored);
      const processed = parsed.map((r) => ({
        ...r,
        birthDate: r.birthDate ?? "",
        birthTime: r.birthTime ?? "",
        report: replaceMarkdownLinkText(r.report, r.catMode ? "🐾" : "📎"),
      }));
      setResults(processed);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("sajuUsers");
    if (stored) {
      setStoredUsers(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (!systemPromptDirty) {
      setSystemPrompt(defaultSystemPrompt);
    }
  }, [defaultSystemPrompt, systemPromptDirty]);

  useEffect(() => {
    if (!userPromptDirty) {
      setUserPrompt(defaultUserPrompt);
    }
  }, [defaultUserPrompt, userPromptDirty]);

  useEffect(() => {
    const signature =
      birthDate && birthTime && gender
        ? `${birthDate}|${birthTime}|${gender}`
        : null;

    if (!signature) {
      setManse(null);
      setManseSignature(null);
      setSelectedResult(null);
      return;
    }

    if (manseSignature && signature !== manseSignature) {
      setManse(null);
      setSelectedResult(null);
    }
  }, [birthDate, birthTime, gender, manseSignature]);

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

  const handleUserDelete = (id: string) => {
    setStoredUsers((prev) => {
      const updated = prev.filter((user) => user.id !== id);
      localStorage.setItem("sajuUsers", JSON.stringify(updated));
      return updated;
    });
    if (selectedResult?.id === id) {
      setSelectedResult(null);
    }
  };

  const handleUserSelect = (user: StoredUser) => {
    setName(user.name);
    setBirthDate(user.birthDate);
    setBirthTime(user.birthTime);
    setGender(user.gender);
    setManse(user.manse);
    setManseSignature(`${user.birthDate}|${user.birthTime}|${user.gender}`);
    setActiveTab("manse");
    setSelectedResult(null);
    setError(null);
  };

  const renderManseProfile = (
    displayManse: ManseResult,
    profileName: string,
    profileGender: string,
    profileBirthDate?: string,
    profileBirthTime?: string
  ) => {
    const { colorClasses, animalEmoji } = getDayProfileVisuals(displayManse.day);
    const genderIcon = profileGender === "여성" ? "♀" : "♂";
    const genderColor =
      profileGender === "여성" ? "text-pink-200" : "text-sky-200";
    const hasBirthInfo = Boolean(profileBirthDate && profileBirthTime);

    return (
      <div className="flex items-center justify-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-white shadow-inner ring-1 ring-white/10">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full text-xl shadow ${
            colorClasses || "bg-white/30 text-gray-900"
          }`}
        >
          {animalEmoji || "👤"}
        </span>
        <div className="flex flex-wrap items-baseline gap-2 text-left">
          <span className="text-lg font-semibold">{profileName || "이름 미입력"}</span>
          <span className={`${genderColor}`} aria-label={profileGender || "성별"}>
            {profileGender ? genderIcon : "?"}
          </span>
          <span className="text-sm text-white/70">
            {hasBirthInfo
              ? `${profileBirthDate} ${profileBirthTime}`
              : "생년월일시 미입력"}
          </span>
        </div>
      </div>
    );
  };

  const handleManseLookup = async () => {
    if (!birthDate || !birthTime || !gender) {
      setError(
        catMode
          ? "생년월일시와 성별을 모두 입력해달라옹."
          : "생년월일시와 성별을 모두 입력해 주세요."
      );
      return;
    }

    setError(null);
    setManseLoading(true);
    setActiveTab("manse");
    const controller = new AbortController();

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
      setManseSignature(`${birthDate}|${birthTime}|${gender}`);
      setSelectedResult(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("manse API 오류", err);
      setManse(null);
      setSelectedResult(null);
      setManseSignature(null);
      setError(
        catMode
          ? "사주 계산에 문제가 생겼냥. 다시 시도해달라옹."
          : "사주 계산 중 오류가 발생했습니다. 다시 시도해 주세요."
      );
    } finally {
      setManseLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!manse || !gender || !name) return;
    if (birthDate && birthTime) {
      setStoredUsers((prev) => {
        const exists = prev.some(
          (user) =>
            user.name === name &&
            user.birthDate === birthDate &&
            user.birthTime === birthTime
        );
        if (exists) return prev;
        const newUser: StoredUser = {
          id: Date.now().toString(),
          name,
          birthDate,
          birthTime,
          gender,
          manse,
        };
        const updated = [...prev, newUser];
        localStorage.setItem("sajuUsers", JSON.stringify(updated));
        return updated;
      });
    }
    setError(null);
    setLoading(true);
    setStreamingReport("");
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setSelectedResult(null);
    const birthInfo = `${manse.hour}시 ${manse.day}일 ${manse.month}월 ${manse.year}년, 성별: ${gender}`;
    const url = `/api/saju?model=${encodeURIComponent(model)}${
      searchEnabled ? "&search=true" : ""
    }`;
    const finalSystemPrompt = systemPrompt.trim() || defaultSystemPrompt;
    const finalUserPrompt = userPrompt.trim() || defaultUserPrompt;
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
          systemPrompt: finalSystemPrompt,
          userPrompt: finalUserPrompt,
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
      const storedBirthDate = birthDate || manseSignature?.split("|")[0] || "";
      const storedBirthTime = birthTime || manseSignature?.split("|")[1] || "";
      const newResult: StoredResult = {
        id: Date.now().toString(),
        name,
        manse,
        gender,
        birthDate: storedBirthDate,
        birthTime: storedBirthTime,
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
        {storedUsers.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {storedUsers.map((user) => {
                const { colorClasses, animalEmoji } = getDayProfileVisuals(
                  user.manse.day
                );
                const genderIcon = user.gender === "여성" ? "♀" : "♂";
                const genderColor = user.gender === "여성" ? "text-pink-300" : "text-sky-300";
                return (
                  <div
                    key={user.id}
                    className="relative flex shrink-0 flex-col items-center"
                  >
                    <button
                      onClick={() => handleUserSelect(user)}
                      className="flex flex-col items-center rounded-xl p-1 transition hover:bg-white/10"
                      aria-label={`${user.name} 프로필 선택`}
                    >
                      <span
                        className={`relative flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-md ${
                          colorClasses || "bg-white/30 text-gray-900"
                        }`}
                      >
                        {animalEmoji || "👤"}
                      </span>
                      <span className="mt-1 flex w-16 items-center justify-center gap-1 truncate text-center text-xs text-white/80">
                        <span className="truncate">{user.name}</span>
                        <span className={`${genderColor}`}>{genderIcon}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleUserDelete(user.id);
                      }}
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-600 shadow-md ring-1 ring-red-300"
                      aria-label={`${user.name} 프로필 삭제`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="space-y-4 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
          <div className="flex rounded-xl bg-white/10 p-1 text-sm text-white/90 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("input")}
              className={`flex flex-1 items-center justify-center rounded-lg px-3 py-2 font-medium transition-colors ${
                activeTab === "input"
                  ? "bg-white text-fuchsia-700 shadow-md"
                  : "text-white/80 hover:bg-white/5"
              }`}
            >
              생년월일 입력
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manse")}
              className={`flex flex-1 items-center justify-center rounded-lg px-3 py-2 font-medium transition-colors ${
                activeTab === "manse"
                  ? "bg-white text-fuchsia-700 shadow-md"
                  : "text-white/80 hover:bg-white/5"
              }`}
            >
              만세력 보기
            </button>
            {debugMode && (
              <button
                type="button"
                onClick={() => setActiveTab("debug")}
                className={`flex flex-1 items-center justify-center rounded-lg px-3 py-2 font-medium transition-colors ${
                  activeTab === "debug"
                    ? "bg-white text-fuchsia-700 shadow-md"
                    : "text-white/80 hover:bg-white/5"
                }`}
              >
                디버그
              </button>
            )}
          </div>

          {activeTab === "input" && (
            <div className="space-y-4">
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
              <button
                type="button"
                onClick={handleManseLookup}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 py-2 font-medium text-white shadow-lg transition-colors hover:from-fuchsia-600 hover:via-rose-600 hover:to-amber-500 disabled:opacity-50"
                disabled={manseLoading}
              >
                {manseLoading
                  ? catMode
                    ? "만세력 계산 중이다냥..."
                    : "만세력 계산 중입니다..."
                  : catMode
                    ? "만세력 조회"
                    : "만세력 조회"}
              </button>
            </div>
          )}

          {activeTab === "manse" && (
            <div className="space-y-4 text-center">
              {manse ? (
                <>
                  {renderManseProfile(
                    manse,
                    name,
                    gender,
                    birthDate,
                    birthTime
                  )}
                  <ManseDisplay manse={manse} />
                </>
              ) : (
                <div className="rounded-lg bg-white/10 p-4 text-sm text-white/80">
                  {catMode
                    ? "만세력을 보려면 생년월일시를 입력하고 조회 버튼을 눌러달라옹."
                    : "생년월일시를 입력한 뒤 만세력 조회 버튼을 눌러주세요."}
                </div>
              )}
            </div>
          )}
          {activeTab === "debug" && debugMode && (
            <div className="space-y-4">
              <div className="space-y-1 rounded-lg bg-white/10 px-4 py-3 text-sm text-white/80 ring-1 ring-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/70">검색 도구</p>
                    <p className="font-medium">
                      {searchEnabled ? "웹 검색 도구 활성화" : "웹 검색 도구 미사용"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={searchEnabled}
                    onClick={() => setSearchEnabled((prev) => !prev)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                      searchEnabled
                        ? "bg-emerald-500/20 text-emerald-100 ring-emerald-400/40 hover:bg-emerald-500/30"
                        : "bg-white/5 text-white/70 ring-white/30 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-10 items-center rounded-full bg-white/20 p-[2px] transition ${
                        searchEnabled ? "justify-end bg-emerald-500/50" : "justify-start"
                      }`}
                    >
                      <span className="h-4 w-4 rounded-full bg-white shadow-sm"></span>
                    </span>
                    {searchEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <p className="text-[11px] text-white/60">
                  토글을 켜면 웹 검색 프리뷰 도구를 요청에 추가하고, 시스템 프롬프트에 최신 정보 검색 지침을 포함합니다. URL에 <code>search=true</code>를 넣으면 초기값을 바로 ON으로 설정할 수 있습니다.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-left text-xs uppercase tracking-wide text-white/70">
                  모델
                </label>
                <input
                  type="text"
                  list="model-options"
                  className="w-full rounded-lg border-none bg-white/90 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="사용할 모델을 입력하거나 선택하세요"
                />
                <datalist id="model-options">
                  <option value="gpt-4.1" />
                  <option value="gpt-4.1-mini" />
                  <option value="gpt-4o-mini" />
                  <option value="gpt-4o" />
                  <option value="gpt-3.5-turbo" />
                  <option value="gpt-5-mini" />
                </datalist>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <label className="uppercase tracking-wide">시스템 프롬프트</label>
                  <button
                    type="button"
                    onClick={() => {
                      setSystemPrompt(defaultSystemPrompt);
                      setSystemPromptDirty(false);
                    }}
                    className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/20"
                  >
                    기본값으로 재설정
                  </button>
                </div>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border-none bg-white/90 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  value={systemPrompt}
                  onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    setSystemPromptDirty(true);
                  }}
                  placeholder="분석에 사용할 시스템 프롬프트"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <label className="uppercase tracking-wide">유저 프롬프트</label>
                  <button
                    type="button"
                    onClick={() => {
                      setUserPrompt(defaultUserPrompt);
                      setUserPromptDirty(false);
                    }}
                    className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/20"
                  >
                    기본값으로 재설정
                  </button>
                </div>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border-none bg-white/90 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  value={userPrompt}
                  onChange={(e) => {
                    setUserPrompt(e.target.value);
                    setUserPromptDirty(true);
                  }}
                  placeholder="만세력 조회결과를 기반으로 전송할 유저 프롬프트"
                />
                {!manse && (
                  <p className="text-xs text-white/70">
                    만세력 조회 후 자동으로 기본 프롬프트가 채워집니다.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {manse && !selectedResult && (
          <div className="space-y-3 rounded-2xl bg-white/20 p-4 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
            <div className="flex rounded-xl bg-white/10 p-1 text-sm text-white/90 shadow-inner">
              <label
                className={`flex flex-1 cursor-pointer flex-col items-center rounded-lg px-3 py-2 text-center font-medium transition-colors ${
                  inquiryType === "luck"
                    ? "bg-white text-fuchsia-700 shadow-md"
                    : "text-white/80 hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  name="inquiry"
                  value="luck"
                  checked={inquiryType === "luck"}
                  onChange={() => setInquiryType("luck")}
                  className="sr-only"
                />
                <span>대운 해석</span>
              </label>
              <label
                className={`flex flex-1 cursor-pointer flex-col items-center rounded-lg px-3 py-2 text-center font-medium transition-colors ${
                  inquiryType === "question"
                    ? "bg-white text-fuchsia-700 shadow-md"
                    : "text-white/80 hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  name="inquiry"
                  value="question"
                  checked={inquiryType === "question"}
                  onChange={() => setInquiryType("question")}
                  className="sr-only"
                />
                <span>추가 질문</span>
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
                  {streamingReport || ""}
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
              {renderManseProfile(
                selectedResult.manse,
                selectedResult.name,
                selectedResult.gender,
                selectedResult.birthDate,
                selectedResult.birthTime
              )}
              <ManseDisplay manse={selectedResult.manse} />
              <div className="markdown leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkSqueezeParagraphs]}>
                  {selectedResult.report}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            results.length > 0 && (
              <div className="space-y-2 rounded-2xl bg-white/20 p-6 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
                {results.map((r) => {
                  const { colorClasses, animalEmoji } = getDayProfileVisuals(
                    r.manse.day
                  );
                  const genderIcon = r.gender === "여성" ? "♀" : "♂";
                  const genderColor =
                    r.gender === "여성" ? "text-pink-300" : "text-sky-300";
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedResult(r);
                        setCatMode(r.catMode);
                      }}
                      className="flex w-full items-center justify-between rounded-md bg-white/10 px-4 py-2 hover:bg-white/20 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-base shadow ${
                            colorClasses || "bg-white/30 text-gray-900"
                          }`}
                        >
                          {animalEmoji || "👤"}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <span>{r.name}</span>
                          <span className={`${genderColor}`}>{genderIcon}</span>
                          {r.catMode && <span aria-hidden>🐱</span>}
                        </span>
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
                  );
                })}
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
