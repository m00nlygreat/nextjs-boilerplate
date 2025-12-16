import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildSystemPrompt, buildUserPrompt, type InquiryType } from "@/lib/prompts";

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
    const inquiryTypeValue: InquiryType = inquiryType === "question" ? "question" : "luck";

    const userContent = buildUserPrompt({
      inquiryType: inquiryTypeValue,
      question: typeof question === "string" ? question : "",
      luckCycles: Array.isArray(luckCycles) ? luckCycles : undefined,
      birthInfo,
      userPromptOverride:
        typeof userPrompt === "string" && userPrompt.trim()
          ? userPrompt
          : undefined,
    });

    const systemContent = buildSystemPrompt({
      catMode: Boolean(catMode),
      inquiryType: inquiryTypeValue,
      search,
      systemPromptOverride:
        typeof systemPrompt === "string" && systemPrompt.trim()
          ? systemPrompt
          : undefined,
    });

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
