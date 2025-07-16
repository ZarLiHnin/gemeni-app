// types/session.ts
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StickyNote = {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  updatedAt: number;
};
