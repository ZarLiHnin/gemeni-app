export const useImageSearch = () => {
  const searchImages = async (prompt: string) => {
    const res = await fetch("/api/image-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error("検索失敗");
    const data = await res.json();
    return data.images;
  };

  return { searchImages };
};
