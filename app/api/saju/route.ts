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
            ? " 장난스럽고 애정 어린 말투로 모든 문장을 '냥'으로 끝내며, 부드럽고 쉬운 말로 살살 설명해 줘. 오행과 그에 어울리는 숲·바위·산 같은 자연 비유만 사용하고 다른 명리 용어는 쓰지 마."
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
