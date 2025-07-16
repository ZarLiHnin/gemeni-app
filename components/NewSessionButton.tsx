"use client";

import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function NewSessionButton() {
  const router = useRouter();

  const handleClick = () => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        alert("ログインしてください");
        return;
      }

      // ✅ セッションIDを一括生成
      const sessionId = `${user.uid}-${uuidv4()}-main`;

      // ✅ チャットページにリダイレクト（そこで1回だけcreateSessionIfNotExistsする）
      router.push(`/chat/${sessionId}`);
    });
  };

  return (
    <button
      onClick={handleClick}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
      新規セッション作成
    </button>
  );
}
