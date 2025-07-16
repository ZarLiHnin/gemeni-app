import { create } from "zustand";

import { saveChatMessage } from "@/lib/firestore";

export type ChatMessage = {
  role: "user" | "assistant";

  content: string;
};

type State = {
  messages: ChatMessage[];

  systemPrompt: string;

  sessionId: string;

  setSessionId: (id: string) => void;

  addMessage: (msg: ChatMessage) => void;

  updateLastAssistantMessage: (content: string) => void;

  setSystemPrompt: (value: string) => void;

  resetMessages: (newMessages: ChatMessage[]) => void;

  reset: () => void; // ✅ ここが必要
};

export const useChatStore = create<State>((set, get) => ({
  messages: [],

  systemPrompt: "",

  sessionId: "",

  setSessionId: (id) => set({ sessionId: id }),

  addMessage: (msg) => {
    const { sessionId, messages } = get();

    set({ messages: [...messages, msg] });

    if (sessionId) saveChatMessage(sessionId, msg);
  },

  updateLastAssistantMessage: (text) => {
    const newMessages = [...get().messages];

    const last = newMessages[newMessages.length - 1];

    if (last?.role === "assistant") {
      last.content += text;
    }

    set({ messages: newMessages });
  },

  setSystemPrompt: (value) => set({ systemPrompt: value }),

  resetMessages: (newMessages) => set({ messages: newMessages }),

  // ✅ 必ず reset を実装する

  reset: () =>
    set({
      messages: [],

      systemPrompt: "",

      sessionId: "",
    }),
}));
