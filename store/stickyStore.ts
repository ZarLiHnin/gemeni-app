// stickyStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import debounce from "lodash.debounce";
import { saveSticky } from "@/lib/firestore";

export type Sticky = {
  id: string;
  content: string;
  x: number;
  y: number;
  userId: string;
};

type StickyStore = {
  stickies: Sticky[];
  sessionId: string;
  setSessionId: (id: string) => void;
  addSticky: (content: string, x: number, y: number, userId: string) => void;
  updateStickyPosition: (id: string, x: number, y: number) => void;
  removeSticky: (id: string) => void;
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
};

export const useStickyStore = create<StickyStore>()(
  persist(
    (set, get) => ({
      stickies: [],
      sessionId: "",
      setSessionId: (id) => set({ sessionId: id }),
      hasHydrated: false,
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),

      addSticky: (content, x, y, userId) => {
        const sticky: Sticky = {
          id: crypto.randomUUID(),
          content,
          x,
          y,
          userId,
        };
        const sessionId = get().sessionId;
        set((state) => ({ stickies: [...state.stickies, sticky] }));
        if (sessionId) debouncedSaveSticky(sticky);
      },

      updateStickyPosition: (id, x, y) => {
        const updated = get().stickies.map((s) =>
          s.id === id ? { ...s, x, y } : s
        );
        set({ stickies: updated });
      },

      removeSticky: (id) => {
        const updated = get().stickies.filter((s) => s.id !== id);
        set({ stickies: updated });
      },
    }),
    {
      name: "sticky-store",
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn("❌ StickyStore rehydration failed:", error);
          } else {
            console.log("✅ StickyStore rehydrated.");
          }
          useStickyStore.getState().setHasHydrated(true);
        };
      },
    }
  )
);

// stickyStore.tsのdebouncedSaveStickyをこう変える
const debouncedSaveSticky = debounce((sticky: Sticky) => {
  const sessionId = useStickyStore.getState().sessionId;
  if (sessionId) {
    saveSticky(sessionId, sticky);
  }
}, 1000);
