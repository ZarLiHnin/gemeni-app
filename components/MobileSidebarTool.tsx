// components/MobileSidebarToggle.tsx
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import SessionSidebar from "./SessionSidebar";

export default function MobileSidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-3 text-gray-600 fixed top-4 left-4 z-50 bg-white shadow rounded"
      >
        <Menu />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        >
          <aside
            className="absolute top-0 left-0 w-64 h-full bg-white shadow-md p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">セッション</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <SessionSidebar />
          </aside>
        </div>
      )}
    </>
  );
}
