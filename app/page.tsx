"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";
import ChatUI from "@/components/ChatUI";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth");
      } else {
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
