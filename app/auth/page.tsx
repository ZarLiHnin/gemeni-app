"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    setError(null);

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/"); // ログイン後はトップページへ
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push("/"); // 新規登録後はホワイトボードへ
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        const message =
          err.code === "auth/invalid-email"
            ? "メールアドレスの形式が正しくありません。"
            : err.code === "auth/user-not-found"
            ? "ユーザーが見つかりません。"
            : err.code === "auth/wrong-password"
            ? "パスワードが間違っています。"
            : err.code === "auth/email-already-in-use"
            ? "このメールアドレスは既に登録されています。"
            : "エラーが発生しました。もう一度お試しください。";

        setError(message);
      } else {
        setError("予期しないエラーが発生しました。");
        console.error("Unexpected error:", err);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" ? "ログイン" : "新規登録"}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          {mode === "login" ? "ログイン" : "登録"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          {mode === "login"
            ? "アカウントをお持ちでないですか？"
            : "既にアカウントをお持ちですか？"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-blue-600 hover:underline ml-1"
          >
            {mode === "login" ? "新規登録" : "ログイン"}
          </button>
        </p>
      </div>
    </div>
  );
}
