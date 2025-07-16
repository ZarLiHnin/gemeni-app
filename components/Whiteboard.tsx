"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
} from "@dnd-kit/core";
import { useStickyStore, Sticky } from "@/store/stickyStore";
import { LogOut } from "lucide-react";

export default function Whiteboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    router.push("/auth");
  };

  const stickies = useStickyStore((s) => s.stickies);
  const update = useStickyStore((s) => s.updateStickyPosition);
  const remove = useStickyStore((s) => s.removeSticky);

  const handleDragEnd = (event: DragEndEvent) => {
    const id = event.active.id as string;
    const x = event.delta.x;
    const y = event.delta.y;
    const target = stickies.find((s) => s.id === id);
    if (target) {
      update(id, target.x + x, target.y + y);
    }
  };

  // ✅ Mouse と Touch 両方のセンサー
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 100, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  if (loading) {
    return <p className="p-4 text-center">読み込み中...</p>;
  }

  if (!user) {
    return <p className="p-4 text-center text-red-600">ログインしてください</p>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex justify-between items-center px-4 md:px-6 py-3 border-b bg-white">
        <h1 className="text-lg font-semibold">ホワイトボード</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-700 truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px]">
            {user.displayName || user.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-gray-600 hover:underline"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">ログアウト</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-auto p-4 bg-yellow-50">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="relative min-h-[800px]">
            {stickies
              .filter((s) => s.userId === user.uid)
              .map((s) => (
                <StickyNote key={s.id} sticky={s} removeSticky={remove} />
              ))}
          </div>
        </DndContext>
      </main>
    </div>
  );
}

function StickyNote({
  sticky,
  removeSticky,
}: {
  sticky: Sticky;
  removeSticky: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: sticky.id,
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${transform.x + sticky.x}px, ${transform.y + sticky.y}px)`
      : `translate(${sticky.x}px, ${sticky.y}px)`,
    position: "absolute",
    width: 220,
    maxWidth: "90vw",
    top: 0,
    left: 0,
    padding: "12px 16px 16px",
    backgroundColor: "white",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    borderRadius: "12px",
    cursor: "grab",
    userSelect: "none",
    wordBreak: "break-word",
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="select-none relative"
    >
      <button
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 50,
          height: 30,
          backgroundColor: "#EF4444",
          color: "white",
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
          borderRadius: "6px",
          zIndex: 1000,
          pointerEvents: "auto",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          removeSticky(sticky.id);
        }}
      >
        削除
      </button>

      <div className="mt-4 whitespace-pre-wrap text-sm">{sticky.content}</div>
    </div>
  );
}
