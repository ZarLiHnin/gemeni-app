// app/api/image/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  try {
    const res = await fetch("https://api.deepai.org/api/text2img", {
      method: "POST",
      headers: {
        "Api-Key": process.env.DEEPAI_API_KEY!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ text: prompt }),
    });

    const data = await res.json();
    console.log("DeepAI Response:", data);

    if (data.output_url) {
      return NextResponse.json({ imageUrl: data.output_url });
    } else {
      return NextResponse.json(
        { error: "画像生成に失敗しました (DeepAI)" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("DeepAI error:", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
