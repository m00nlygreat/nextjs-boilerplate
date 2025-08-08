import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { birthInfo, catMode } = await req.json();
    if (!birthInfo) {
      return NextResponse.json({ error: "Missing birthInfo" }, { status: 400 });
    }

    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(birthInfo + " 사주팔자")}&format=json&no_redirect=1&no_html=1`;
    const searchData = await fetch(searchUrl).then((r) => r.json());
    let snippets = "";
    if (searchData?.RelatedTopics) {
      snippets = searchData.RelatedTopics.map((t: any) => t.Text).slice(0, 3).join("\n");
    } else if (searchData?.Abstract) {
      snippets = searchData.Abstract;
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [
      {
        role: "system",
        content:
          "당신은 전문 사주 명리학자입니다." +
          (catMode
            ? " 어려운 사주 용어 대신 쉽고 친절한 설명과 함께 '냥'의 어미를 추가하여 답변하세요. '너는 푸른 숲 속의 고요한 호수의 기운을 가졌다냥'과 같은 표현을 사용합니다."
            : ""),
      },
      {
        role: "user",
        content: `다음 사주팔자를 분석해 주세요: ${birthInfo}\n웹 검색 결과:\n${snippets}`,
      },
    ];
    const response = await client.responses.create({
      model: "gpt-5",
      input: messages,
    } as any);

    const output = response.output_text;
    return NextResponse.json({ result: output });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
