"use client";

import { useState } from "react";
import TileGrid from "./TileGrid";
import ChatBot from "./ChatBot";

type Tab = "browse" | "chat";

export default function GiftAppDemo() {
  const [tab, setTab] = useState<Tab>("browse");

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-stone-200 shrink-0">
        {(["browse", "chat"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            {t === "browse" ? "Browse" : "Ask"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-5">
        {tab === "browse" && <TileGrid />}
        {tab === "chat" && <ChatBot />}
      </div>
    </div>
  );
}
