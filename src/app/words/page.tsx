"use client";

import { useState } from "react";
import WordCard from "@/components/WordCard";
import EmptyState from "@/components/EmptyState";
import { Word } from "@/lib/types";
import { Button } from "@/components/ui/Button";

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
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-32 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Words Bank
      </h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search words..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border-2 border-feather-gray bg-feather-gray/10 px-4 py-3 text-base font-bold text-feather-text placeholder-feather-text-light transition-all focus:border-feather-blue focus:bg-white focus:outline-none"
        />
      </div>

      <Button
        variant="primary"
        fullWidth
        className="mb-8"
      >
        ADD NEW WORD
      </Button>

      {filteredWords.length > 0 ? (
        <div className="space-y-4">
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
