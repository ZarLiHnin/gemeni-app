import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    const {
      prompt,
      history,
      systemPrompt,
    }: {
      prompt: string;
      history: ChatMessage[];
      systemPrompt: string;
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY が設定されていません");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // 👇 最初に systemPrompt を user メッセージとして履歴に追加
    const historyWithSystem: ChatMessage[] = [
      {
        role: "user",
        content: systemPrompt?.trim() || "あなたは優秀なアシスタントです。",
      },
      ...history,
    ];

    // Gemini用に履歴を整形
    const formattedHistory = historyWithSystem.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chatSession = model.startChat({
      history: formattedHistory,
    });

    const result = await chatSession.sendMessageStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          const text = chunk.text();
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "内部サーバーエラー" }, { status: 500 });
  }
}
