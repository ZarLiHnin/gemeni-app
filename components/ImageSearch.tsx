"use client";

import Image from "next/image";
import { useState } from "react";

export default function ImageSearch() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<{ url: string; alt: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const res = await fetch("/api/image-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setImages(data.images);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">画像検索AI</h2>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="例: 海でゆったりした休日"
        className="w-full border p-2 mb-2"
      />
      <button
        onClick={handleSearch}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        検索
      </button>

      {loading && <p className="mt-4">検索中...</p>}

      <div className="grid grid-cols-2 gap-4 mt-4">
        {images?.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {images.map((img, idx) => (
              <Image
                key={idx}
                src={img.url}
                alt={img.alt}
                width={300}
                height={200}
                className="rounded shadow"
              />
            ))}
          </div>
        ) : (
          <p>画像がまだありません。</p>
        )}
      </div>
    </div>
  );
}
