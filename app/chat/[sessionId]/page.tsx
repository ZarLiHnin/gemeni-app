// app/chat/[sessionId]/page.tsx
"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import ChatUI from "@/components/ChatUI";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";
import { useChatStore } from "@/store/chatStore";
import { useStickyStore } from "@/store/stickyStore";
import { createSessionIfNotExists } from "@/lib/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ChatSessionPage() {
  const { sessionId } = useParams() as { sessionId: string };

  useEffect(() => {
    useChatStore.getState().setSessionId(sessionId);
    useStickyStore.getState().setSessionId(sessionId);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        createSessionIfNotExists(sessionId, {
          title: "New Chat",
          ownerId: user.uid,
        });
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  return (
    <LayoutWithSidebar title="チャット">
      <ChatUI />
    </LayoutWithSidebar>
  );
}
