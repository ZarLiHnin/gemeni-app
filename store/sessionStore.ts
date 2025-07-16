// store/sessionStore.ts
import { create } from "zustand";
import { Session } from "@/components/SessionSidebar";

type State = {
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  sessionId: string | null;
  setSessionId: (id: string) => void;
};

export const useSessionStore = create<State>((set) => ({
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions.filter((s) => s.id !== session.id)],
    })),
}));
