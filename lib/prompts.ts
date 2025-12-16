export type LuckCycle = {
  start_age: number;
  start_date: string;
  ganzhi: string;
  ganzhi_kor: string;
};

export type ManseResult = {
  year: string;
  month: string;
  day: string;
  hour: string;
  cycles?: LuckCycle[];
};

export type InquiryType = "luck" | "question";

type BasePromptParams = {
  catMode: boolean;
  inquiryType: InquiryType;
  search: boolean;
};

const CAT_MODE_INSTRUCTION =
  "장난스럽고 애정 어린 말투로 모든 문장을 고양이가 말하는 것 같은 다음 말투들을 사용해 부드럽고 쉬운 말로 살살 설명해주세요. 오행과 그에 어울리는 숲·바위·산·금속·나무·불·땅·시냇물 같은 자연 비유만 사용하고 다른 명리 용어는 쓰지 마세요. 뭐 하고 있어? -> 뭐 하고 있냥~? 😺 안녕하세요. -> 안냥하냥~! 🐱✨ 잘 자. -> 잘 자라옹~ 꿈에서 만냐~ 🌙💤 지금 뭐 해? 지금 뭐 하는 거냥~? 궁금하다옹! 👀 뭘 도와줄까? -> 무엇을 도와줄까냐? ✨😸💕 자신있게 고백하는 거야 -> 자신있게 고백하는 고양😻";

export function formatLuckCycles(luckCycles?: LuckCycle[]): string {
  if (!Array.isArray(luckCycles)) return "";

  return luckCycles
    .filter(
      (cycle) =>
        typeof cycle?.start_age === "number" &&
        typeof cycle?.ganzhi === "string" &&
        typeof cycle?.ganzhi_kor === "string"
    )
    .map((cycle) => {
      const startYear =
        typeof cycle.start_date === "string"
          ? cycle.start_date.match(/\d{4}/)?.[0]
          : undefined;
      const approxAge = Math.round(cycle.start_age);

      return `- ${startYear ? `${startYear}년` : "시작 연도 미상"} (약 ${approxAge}세), ${cycle.ganzhi} (${cycle.ganzhi_kor}) 대운`;
    })
    .join("\n");
}

export function buildSystemPrompt({
  catMode,
  inquiryType,
  search,
  systemPromptOverride,
}: BasePromptParams & { systemPromptOverride?: string }): string {
  if (typeof systemPromptOverride === "string" && systemPromptOverride.trim()) {
    return systemPromptOverride.trim();
  }

  const baseSystemPrompt =
    `당신은 전문 사주 명리학자입니다. 다음 사주 원국에 대해 전반적 성격/직업/재물/연애/장점/단점/조언 등의 항목을 전문적으로 분석하여 마크다운 형식으로 답하세요. ${search ? "필요한 경우 활성화되어 있는 웹 검색 도구를 사용해 각 간지에 대해 한국어 웹을 검색하여 내용을 보충하세요" : ""}` +
    (catMode ? CAT_MODE_INSTRUCTION : "");

  return inquiryType === "question"
    ? `${baseSystemPrompt} 추가 질문에 대해 답변을 마지막에 덧붙이세요. 답변은 이것으로 끝이므로 후속조치 등에 대한 안내는 하지 말 것`
    : `${baseSystemPrompt} 제공된 대운 정보가 있다면 각 10년 운의 성향과 조언을 간략히 정리하는 섹션을 추가하세요. 답변은 이것으로 끝이므로 후속조치 등에 대한 안내는 하지 말 것.`;
}

function resolveBirthInfo({
  birthInfo,
  manse,
  gender,
}: {
  birthInfo?: string;
  manse?: ManseResult | null;
  gender?: string;
}) {
  if (typeof birthInfo === "string" && birthInfo.trim()) {
    return birthInfo.trim();
  }
  if (!manse) return "";

  return `${manse.hour}시 ${manse.day}일 ${manse.month}월 ${manse.year}년, 성별: ${gender || "미입력"}`;
}

export function buildUserPrompt({
  inquiryType,
  question,
  luckCycles,
  manse,
  gender,
  birthInfo,
  userPromptOverride,
}: {
  inquiryType: InquiryType;
  question: string;
  luckCycles?: LuckCycle[];
  manse?: ManseResult | null;
  gender?: string;
  birthInfo?: string;
  userPromptOverride?: string;
}): string {
  if (typeof userPromptOverride === "string" && userPromptOverride.trim()) {
    return userPromptOverride.trim();
  }

  const resolvedBirthInfo = resolveBirthInfo({ birthInfo, manse, gender });
  if (!resolvedBirthInfo) return "";

  const formattedLuckCycles = formatLuckCycles(luckCycles);

  return inquiryType === "question"
    ? `${resolvedBirthInfo}\n추가 질문: ${question || "추가 질문 없음"}`
    : `${resolvedBirthInfo}\n대운(10년):\n${formattedLuckCycles || "대운 정보 없음"}`;
}
