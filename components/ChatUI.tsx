"use client";

import React, { useEffect, useRef, useState } from "react";
import { useChatStore, type ChatMessage } from "@/store/chatStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useStickyStore } from "@/store/stickyStore";
import {
  createSessionIfNotExists,
  fetchMessages,
  saveChatMessage,
} from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type CodeComponentProps = {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export default function ChatUI() {
  const hasHydrated = useStickyStore((s) => s.hasHydrated);
  const isComposingRef = useRef(false);

  const [input, setInput] = useState("");
  const sessionId = useChatStore((state) => state.sessionId);
  const {
    messages,
    addMessage,
    updateLastAssistantMessage,
    systemPrompt,
    setSystemPrompt,
    resetMessages,
  } = useChatStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const [copyIndex, setCopyIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. sessionIdが変わったらFirestoreからメッセージを取得しzustandにセット
  useEffect(() => {
    if (!sessionId || sessionId === "default-session") return;

    async function loadMessages() {
      try {
        const msgs = await fetchMessages(sessionId);
        resetMessages(msgs);
      } catch (error) {
        console.error("メッセージの読み込みに失敗しました:", error);
      }
    }
    loadMessages();
  }, [sessionId, resetMessages]);

  // 2. 初回マウント時にURLからsessionIdを取得しzustandにセット、Firestoreにセッション作成（なければ）
  useEffect(() => {
    const sessionIdFromUrl = getSessionIdFromUrl();

    if (sessionIdFromUrl === "default-session") return;

    useChatStore.getState().setSessionId(sessionIdFromUrl);
    useStickyStore.getState().setSessionId(sessionIdFromUrl);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        createSessionIfNotExists(sessionIdFromUrl, {
          title: "New Chat",
          ownerId: user.uid,
        });
      }
    });

    return () => unsubscribe();
    scrollToBottom();
  }, []);

  function getSessionIdFromUrl(): string {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const sessionId = path.split("/").pop();
      return sessionId && sessionId !== "" ? sessionId : "default-session";
    }
    return "default-session";
  }

  // const sendMessage = async (prompt: string, isRegenerate = false) => {
  //   if (!prompt.trim()) return;

  //   if (!isRegenerate) {
  //     const userMessage: ChatMessage = { role: "user", content: prompt };
  //     addMessage(userMessage);
  //   } else {
  //     if (
  //       messages.length &&
  //       messages[messages.length - 1].role === "assistant"
  //     ) {
  //       resetMessages(messages.slice(0, -1));
  //     }
  //   }

  //   setIsStreaming(true);
  //   setErrorMessage(null);

  //   try {
  //     const res = await fetch("/api/chat", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         prompt,
  //         history: isRegenerate ? messages.slice(0, -1) : messages,
  //         systemPrompt,
  //       }),
  //     });

  //     if (!res.body) throw new Error("レスポンスボディがありません");

  //     addMessage({ role: "assistant", content: "" });

  //     const reader = res.body.getReader();
  //     const decoder = new TextDecoder();
  //     let done = false;

  //     while (!done) {
  //       const { value, done: doneReading } = await reader.read();
  //       done = doneReading;
  //       const chunk = decoder.decode(value);
  //       updateLastAssistantMessage(chunk);
  //     }
  //   } catch (err) {
  //     console.error("ストリーミングエラー:", err);
  //     setErrorMessage("通信エラーが発生しました。もう一度お試しください。");
  //     updateLastAssistantMessage("（エラーが発生しました）");
  //   } finally {
  //     setIsStreaming(false);
  //   }
  // };

  const sendMessage = async (prompt: string, isRegenerate = false) => {
    if (!prompt.trim()) return;

    const { messages, sessionId } = useChatStore.getState();

    if (!isRegenerate) {
      const userMessage: ChatMessage = { role: "user", content: prompt };
      addMessage(userMessage);
    } else {
      if (
        messages.length &&
        messages[messages.length - 1].role === "assistant"
      ) {
        resetMessages(messages.slice(0, -1));
      }
    }

    setIsStreaming(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history: isRegenerate ? messages.slice(0, -1) : messages,
          systemPrompt,
        }),
      });

      if (!res.body) throw new Error("レスポンスボディがありません");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullAssistantMessage = "";

      // assistantの仮メッセージを先に追加
      addMessage({ role: "assistant", content: "" });

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        fullAssistantMessage += chunk;
        updateLastAssistantMessage(chunk);
      }

      // fullAssistantMessageで messages を更新（最後の assistant を置き換え）
      const newMessages: ChatMessage[] = [
        ...useChatStore.getState().messages.slice(0, -1),
        { role: "assistant", content: fullAssistantMessage },
      ];
      resetMessages(newMessages);

      // Firestore には1件だけ保存
      if (sessionId) {
        await saveChatMessage(sessionId, {
          role: "assistant",
          content: fullAssistantMessage,
        });
      }
    } catch (err) {
      console.error("ストリーミングエラー:", err);
      setErrorMessage("通信エラーが発生しました。もう一度お試しください。");
      updateLastAssistantMessage("（エラーが発生しました）");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendClick = () => {
    sendMessage(input);
    setInput("");
  };

  const handleCopyClick = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyIndex(index);
      setTimeout(() => setCopyIndex(null), 2000);
    } catch {
      alert("コピーに失敗しました。");
    }
  };

  const handleRegenerateClick = () => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "user");
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content, true);
    }
  };

  const components = {
    code({ inline, className, children, ...props }: CodeComponentProps) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          className="bg-gray-200 rounded px-1 py-0.5 text-sm text-red-800"
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-100 font-sans">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-300 via-white to-blue-200 animate-pulse z-0" />

      <div className="relative z-10 max-w-2xl mx-auto p-6 flex flex-col h-screen">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Hello AI
        </h1>

        <div className="bg-white rounded-xl shadow-md flex-grow overflow-y-auto p-4 space-y-3">
          {messages
            .filter(
              (msg) => !(msg.role === "assistant" && msg.content.trim() === "")
            )
            .map((msg, i) => (
              <div
                key={i}
                className={`relative flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap shadow-sm prose prose-sm max-w-none ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={components}
                  >
                    {msg.content}
                  </ReactMarkdown>

                  {msg.role === "assistant" && (
                    <>
                      {hasHydrated ? (
                        <button
                          onClick={async () => {
                            const stored = localStorage.getItem("sticky-store");
                            if (stored) {
                              try {
                                const parsed = JSON.parse(stored);
                                useStickyStore.setState({
                                  stickies: parsed.state.stickies,
                                });
                              } catch (e) {
                                console.error(
                                  "Failed to parse localStorage sticky-store",
                                  e
                                );
                              }
                            }
                            const currentUser = auth.currentUser; // ←ここで取得
                            if (currentUser) {
                              useStickyStore
                                .getState()
                                .addSticky(
                                  msg.content,
                                  100,
                                  100,
                                  currentUser.uid
                                );
                            } else {
                              alert("ログインユーザーが取得できません。");
                            }
                          }}
                          className="mt-1 text-xs text-blue-600 hover:underline"
                          type="button"
                        >
                          📌 ホワイトボードへ送る
                        </button>
                      ) : (
                        <button
                          disabled
                          className="mt-1 text-xs text-gray-400 cursor-not-allowed"
                          onClick={() =>
                            alert("まだ準備中です。少し待ってください")
                          }
                          type="button"
                        >
                          📌 ホワイトボードへ送る
                        </button>
                      )}
                    </>
                  )}
                </div>

                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleCopyClick(msg.content, i)}
                    className="absolute top-1 right-1 text-xs text-gray-400 hover:text-indigo-600 transition"
                    aria-label="コピー"
                  >
                    {copyIndex === i ? "コピー済み" : "コピー"}
                  </button>
                )}
              </div>
            ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl text-sm shadow animate-pulse rounded-bl-none">
                <span className="animate-bounce">...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="mt-2 text-red-600 text-center font-semibold">
          {errorMessage}
        </div>

        <div className="flex gap-2 mt-4">
          <textarea
            className="flex-1 border rounded-xl p-3 resize-none shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            disabled={false}
            placeholder="メッセージを入力..."
          />

          <button
            onClick={handleSendClick}
            disabled={isStreaming}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            送信
          </button>
        </div>

        <div className="mt-3 text-center">
          <button
            onClick={handleRegenerateClick}
            disabled={
              isStreaming || !messages.some((msg) => msg.role === "user")
            }
            className="bg-yellow-400 text-white px-6 py-2 rounded-xl hover:bg-yellow-500 transition disabled:opacity-50"
          >
            再生成
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🧾 システムプロンプト
          </label>
          <textarea
            className="w-full border rounded-xl p-3 resize-none shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
            rows={2}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="例: あなたは関西弁で話すアシスタントです。"
            disabled={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}
