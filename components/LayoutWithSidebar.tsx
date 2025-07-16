// LayoutWithSidebar.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { Menu, X, LogOut, Plus, Clipboard, Apple } from "lucide-react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { Timestamp, setDoc, doc } from "firebase/firestore";
import SessionSidebar from "./SessionSidebar";
import { useSessionStore } from "@/store/sessionStore";
import { useChatStore } from "@/store/chatStore"; // chatStoreをインポート

type Props = {
  children: ReactNode;
  title?: string;
};

export default function LayoutWithSidebar({
  children,
  title = "チャット",
}: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // chatStoreとsessionStoreのアクションを取得
  const resetChatMessages = useChatStore((state) => state.resetMessages);
  const setChatSessionId = useChatStore((state) => state.setSessionId);
  const setSessions = useSessionStore((state) => state.setSessions);
  const setSessionStoreSessionId = useSessionStore(
    (state) => state.setSessionId
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      // ユーザーがログアウトした、または認証状態が変更されたことを検出
      if (user && !currentUser) {
        // ユーザーがログアウトした場合
        console.log("User logged out. Clearing state.");
        // ここでZustandストアとLocalStorageの状態をクリア
        localStorage.removeItem("lastSessionId"); // LocalStorageから前回のセッションIDをクリア
        resetChatMessages([]); // chatStoreのメッセージをクリア
        setSessions([]); // sessionStoreのセッションリストをクリア
      }
      setUser(currentUser);
      if (!currentUser) {
        router.push("/auth"); // ログインしていなければリダイレクト
      }
    });
    return () => unsub();
  }, [
    router,
    user,
    resetChatMessages,
    setChatSessionId,
    setSessions,
    setSessionStoreSessionId,
  ]); // 依存配列にZustandのアクションを追加

  const handleLogout = async () => {
    await signOut(auth);
    // ログアウト時にZustandストアとLocalStorageの状態をクリア
    localStorage.removeItem("lastSessionId"); // LocalStorageから前回のセッションIDをクリア
    resetChatMessages([]); // chatStoreのメッセージをクリア
    setSessions([]); // sessionStoreのセッションリストをクリア

    setUser(null);
    router.push("/auth");
  };

  const handleNewSession = async () => {
    const newId = crypto.randomUUID();
    const now = new Date();
    const title = now.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!user) return;

    await setDoc(doc(db, "sessions", newId), {
      title,
      ownerId: user.uid,
      createdAt: Timestamp.fromDate(now),
    });

    useSessionStore.getState().addSession({
      id: newId,
      title,
      createdAt: Timestamp.fromDate(now),
    });

    router.push(`/chat/${newId}`);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen relative">
      {/* ==== Desktop Sidebar ==== */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-100 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <button
            onClick={handleNewSession}
            className="flex items-center gap-2 w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            <Plus size={16} />
            新しいセッション
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SessionSidebar />
        </div>
      </aside>

      {/* ==== Mobile Sidebar ==== */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute left-0 top-0 w-64 h-full bg-white shadow-lg overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">メニュー</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded hover:bg-gray-200"
              >
                <X />
              </button>
            </div>
            <div className="p-4">
              <button
                onClick={handleNewSession}
                className="flex items-center gap-2 w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 mb-4"
              >
                <Plus size={16} />
                新しいセッション
              </button>

              <SessionSidebar />

              <div className="mt-6 border-t pt-4 text-sm text-gray-700 space-y-2">
                <button
                  onClick={() => {
                    router.push("/image-search");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Apple size={16} />
                  画像検索
                </button>
                <button
                  onClick={() => {
                    router.push("/whiteboard");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Clipboard size={16} />
                  ホワイトボード
                </button>

                {user ? (
                  <>
                    <div className="text-gray-800 font-medium">
                      {user.displayName || user.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-gray-600 hover:underline"
                    >
                      <LogOut size={16} />
                      ログアウト
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      router.push("/auth");
                      setIsSidebarOpen(false);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    ログイン
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==== Main Content ==== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* モバイルヘッダー */}
        <div className="md:hidden p-4 border-b flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="w-6 h-6" />
        </div>

        {/* PCヘッダー */}
        <div className="hidden md:flex justify-between items-center px-6 py-2 border-b bg-white">
          <h1 className="text-lg font-bold">{title}</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                router.push("/image-search");
                setIsSidebarOpen(false);
              }}
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Apple size={16} />
              画像検索
            </button>
            <button
              onClick={() => router.push("/whiteboard")}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <Clipboard size={16} />
              ホワイトボード
            </button>

            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:underline"
                >
                  <LogOut size={16} />
                  ログアウト
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="text-sm text-blue-600 hover:underline"
              >
                ログイン
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
