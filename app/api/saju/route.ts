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
            ? " 어려운 명리 용어(물·불·나무·금속·땅 제외)는 쓰지 말고, 초보도 이해할 수 있게 귀엽고 친절한 말투로 설명하며 문장 끝에 '냥'을 붙이세요."
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
