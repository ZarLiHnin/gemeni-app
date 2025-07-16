"use client";

import { useState } from "react";
import Image from "next/image";

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateImage = async () => {
    setLoading(true);
    setImageUrl("");
    setError("");

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (res.ok && data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        setError(data.error || "画像生成に失敗しました");
      }
    } catch (err) {
      setError("ネットワークエラー");
      console.log(err);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center">🎨 AI画像生成</h1>

      <textarea
        className="w-full border p-3 rounded"
        rows={3}
        placeholder="例: 雲の上に浮かぶ未来都市、デジタルアート風"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={generateImage}
        disabled={loading || !prompt.trim()}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "生成中..." : "画像を生成"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {imageUrl && (
        <div className="mt-6">
          {/* Base64 画像は <img> の方が簡単に動きます */}
          <Image
            src={imageUrl}
            alt="生成された画像"
            className="w-full rounded-lg shadow"
          />
        </div>
      )}
    </div>
  );
}
