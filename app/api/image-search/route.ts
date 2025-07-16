// image-search/route.ts
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateText";
const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";

type GeminiResponse = {
  candidates: { content: string }[];
};

type UnsplashPhoto = {
  id: string;
  urls: { small: string };
  alt_description: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();

    // ❶ Gemini APIでキーワード抽出
    const geminiRes = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: {
            text: `次の文章から英語の検索キーワードを3つ、カンマ区切りで返してください。: ${prompt}`,
          },
          maxOutputTokens: 50, // ← ここを修正
          temperature: 0.2, // 任意で追加
        }),
      }
    );

    if (!geminiRes.ok) {
      console.error("Gemini API Error", await geminiRes.text());
      return NextResponse.json({ error: "Gemini API failed" }, { status: 500 });
    }

    const geminiData: GeminiResponse = await geminiRes.json();

    // Geminiのレスポンス例: candidates[0].content = "beach, ocean, relaxation"
    const keywordString = geminiData.candidates?.[0]?.content || "";

    // カンマ区切りをスペース区切りにして検索用キーワードに変換
    const keywords = keywordString
      .split(",")
      .map((k) => k.trim())
      .join(" ");

    // ❷ 抽出キーワードでUnsplash画像検索
    const unsplashRes = await fetch(
      `${UNSPLASH_API_URL}?query=${encodeURIComponent(keywords)}&per_page=5`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!unsplashRes.ok) {
      console.error("Unsplash API Error", await unsplashRes.text());
      return NextResponse.json(
        { error: "Unsplash API failed" },
        { status: 500 }
      );
    }

    const unsplashData: { results: UnsplashPhoto[] } = await unsplashRes.json();

    const images = unsplashData.results.map((photo) => ({
      url: photo.urls.small,
      alt: photo.alt_description || "Image",
    }));

    return NextResponse.json({ images });
  } catch (err) {
    console.error("API Error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
