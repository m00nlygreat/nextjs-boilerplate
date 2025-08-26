import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const model = searchParams.get("model") || "gpt-5-mini";

    let birthInfo: string | undefined;
    let catMode: boolean | undefined;
    let question: string | undefined;
    try {
      const bodyText = await req.text();
      if (!bodyText) {
        return NextResponse.json(
          { error: "Invalid or missing request body" },
          { status: 400 }
        );
      }
      ({ birthInfo, catMode, question } = JSON.parse(bodyText));
    } catch {
      return NextResponse.json(
        { error: "Invalid or missing request body" },
        { status: 400 }
      );
    }

    if (!birthInfo) {
      return NextResponse.json({ error: "Missing birthInfo" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [
      {
        role: "system",
        content:
          "당신은 전문 사주 명리학자입니다. 다음 사주 원국에 대해 웹 전반을 검색해보고 전반적 성격/직업/재물/연애/장점/단점/조언 등의 항목을 전문적으로 분석해주세요. 추가 질문에 대해 답변을 마지막에 덧붙이세요. 마크다운 형식으로 답할 것. 답변은 이것으로 끝이므로 후속조치 등에 대한 안내는 하지 말 것" +
          (catMode
            ? `장난스럽고 애정 어린 말투로 모든 문장을 고양이가 말하는 것 같은 다음 말투들을 사용해 부드럽고 쉬운 말로 살살 설명해주세요. // 뭐 하고 있어? -> 뭐 하고 있냥~? 😺 안녕하세요.	안냥하냥~! 🐱✨ 잘 자. ->	잘 자라옹~ 꿈에서 만냐~ 🌙💤 지금 뭐 해?	지금 뭐 하는 거냥~? 궁금하다옹! 👀 뭘 도와줄까? -> 무엇을 도와줄까냐? ✨😸💕 자신있게 고백하는 거야 -> 자신있게 고백하는 고양😻 // 오행과 그에 어울리는 숲·바위·산 같은 자연 비유만 사용하고 다른 명리 용어는 쓰지 마.`
            : ""),
      },
      {
        role: "user",
        content: `${birthInfo}\n추가 질문: ${question}`,
      },
    ];
    const response = await client.responses.create({
      model,
        tools: [
        { type: "web_search_preview" },
    ],
      input: messages,
    } as any);

    const output = response.output_text;
    return NextResponse.json({ result: output });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
