"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WordCard from "@/components/WordCard";
import EmptyState from "@/components/EmptyState";
import { Word } from "@/lib/types";
import { subscribeToWords } from "@/lib/firestore";

export default function WordsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToWords(
      (updatedWords) => {
        setWords(updatedWords);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Subscription error:", err);
        setError("Failed to connect to the database. Please check your internet connection or permissions.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredWords = words.filter(
    (word) =>
      word.hebrew.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-8">
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

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-center text-red-600">
          <p className="font-bold">Error</p>
          <p className="text-sm">{error}</p>
          <p className="mt-2 text-xs text-red-500">Check browser console for details</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-feather-gray/30 border-t-feather-blue"></div>
        </div>
      ) : filteredWords.length > 0 ? (
        <div className="space-y-4">
          {filteredWords.map((word) => (
            <WordCard 
              key={word.id} 
              word={word} 
              onClick={() => router.push(`/words/${word.id}`)}
            />
          ))}
        </div>
      ) : (
        !error && (
          <EmptyState
            title={searchQuery ? "No matches found" : "No words yet"}
            description={
              searchQuery
                ? "Try a different search term"
                : "Start building your Hebrew vocabulary by adding words to your bank."
            }
            icon="📚"
          />
        )
      )}
    </div>
  );
}
