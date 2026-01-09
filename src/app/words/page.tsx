"use client";

import { useState } from "react";
import WordCard from "@/components/WordCard";
import EmptyState from "@/components/EmptyState";
import { Word } from "@/lib/types";

// Mockup: empty word bank initially
const mockWords: Word[] = [];

export default function WordsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [words] = useState<Word[]>(mockWords);

  const filteredWords = words.filter(
    (word) =>
      word.hebrew.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-4 pb-24 pt-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Words Bank
      </h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search words..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <button className="mb-6 w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100">
        + Add New Word
      </button>

      {filteredWords.length > 0 ? (
        <div className="space-y-3">
          {filteredWords.map((word) => (
            <WordCard key={word.id} word={word} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No words yet"
          description="Start building your Hebrew vocabulary by adding words to your bank."
          icon="📚"
        />
      )}
    </div>
  );
}
