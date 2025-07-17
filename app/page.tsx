"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";
import ChatUI from "@/components/ChatUI";
import { saveUserData } from "@/lib/saveUserData"; // 追加

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("匿名ログイン失敗", e);
          router.replace("/auth");
        }
      } else {
        // ✅ Firestore にユーザーデータを保存
        await saveUserData(user.uid, "your-app-id", {
          email: user.email || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        ロード中...
      </div>
    );
  }

  return (
    <LayoutWithSidebar title="チャット">
      <ChatUI />
    </LayoutWithSidebar>
  );
}
