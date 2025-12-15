import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const model = searchParams.get("model") || "gpt-5-mini";
    const search = searchParams.get("search") === "true";
    const {
      birthInfo,
      catMode,
      question,
      inquiryType = "luck",
      luckCycles = [],
      systemPrompt,
      userPrompt,
    } = await req.json();
    if (!birthInfo) {
      return NextResponse.json({ error: "Missing birthInfo" }, { status: 400 });
    }

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

    const userContent =
      typeof userPrompt === "string" && userPrompt.trim()
        ? userPrompt.trim()
        : inquiryType === "question"
          ? `${birthInfo}\n추가 질문: ${question || "추가 질문 없음"}`
          : `${birthInfo}\n대운(10년) 정보:\n${formattedLuckCycles || "대운 정보 없음"}`;

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

    const systemContent =
      typeof systemPrompt === "string" && systemPrompt.trim()
        ? systemPrompt.trim()
        : inquiryType === "question"
          ? `${baseSystemPrompt} 추가 질문에 대해 답변을 마지막에 덧붙이세요. 마크다운 형식으로 답할 것. 답변은 이것으로 끝이므로 후속조치 등에 대한 안내는 하지 말 것`
          : `${baseSystemPrompt} 마크다운 형식으로 답할 것. 답변은 이것으로 끝이므로 후속조치 등에 대한 안내는 하지 말 것. 제공된 대운 정보가 있다면 각 10년 운의 성향과 조언을 간략히 정리하는 섹션을 추가하세요.`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [
      {
        role: "system",
        content: systemContent,
      },
      {
        role: "user",
        content: userContent,
      },
    ];
    const response = await client.responses.stream(
      {
        model,
        ...(search ? { tools: [{ type: "web_search_preview" }] } : {}),
        input: messages,
      } as any
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response as any) {
            const payload = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamErr) {
          controller.error(streamErr);
        }
      },
    });
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        Connection: "keep-alive",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
