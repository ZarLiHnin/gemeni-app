"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSessionStore } from "@/store/sessionStore";
import { useChatStore } from "@/store/chatStore";

export type Session = {
  id: string;
  title: string;
  createdAt: Timestamp;
};

export default function SessionSidebar() {
  const router = useRouter();
  const { sessions, setSessions } = useSessionStore();
  const currentSessionId = useChatStore((state) => state.sessionId);

  useEffect(() => {
    const fetchSessions = async (uid: string) => {
      const q = query(collection(db, "sessions"), where("ownerId", "==", uid));
      const querySnapshot = await getDocs(q);
      const sessionList: Session[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        createdAt: doc.data().createdAt,
      }));

      // 新しい順にソート
      sessionList.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setSessions(sessionList);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSessions(user.uid);
      }
    });

    return () => unsubscribe();
  }, [setSessions]);

  return (
    <aside className="w-full">
      <h2 className="text-lg font-semibold mb-4">過去のセッション</h2>
      <ul className="space-y-2">
        {sessions.map((session) => (
          <li key={session.id}>
            <button
              onClick={() => router.push(`/chat/${session.id}`)}
              className={`text-left w-full p-2 rounded transition
    ${
      session.id === currentSessionId
        ? "bg-blue-100 text-blue-700 font-semibold"
        : "hover:bg-gray-200"
    }
  `}
            >
              {session.title || "無題のセッション"}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
