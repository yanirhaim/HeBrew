"use client";

import { Word } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

interface WordCardProps {
  word: Word;
  onClick?: () => void;
}

export default function WordCard({ word, onClick }: WordCardProps) {
  const updateMastery = useMutation(api.words.updateMastery);

  const handleStarClick = async (e: React.MouseEvent, level: number) => {
    e.stopPropagation();
    try {
      await updateMastery({
        id: word.id as Id<"words">,
        level,
      });
    } catch (error) {
      console.error("Failed to update mastery:", error);
    }
  };

  const averageForTense = (tense: "past" | "present" | "future") => {
    const scores = word.mastery ? Object.values(word.mastery[tense] || {}) : [];
    if (!scores.length) return null;
    const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    return Math.round(avg);
  };

  const pastAvg = averageForTense("past");
  const presentAvg = averageForTense("present");
  const futureAvg = averageForTense("future");

  return (
    <Card 
      onClick={onClick}
      className="flex flex-col items-center justify-center py-6 text-center hover:border-feather-blue transition-colors cursor-pointer active:scale-[0.98]"
    >
      <div className="mb-2 text-2xl font-bold text-feather-text hebrew-text" dir="rtl">
        {word.hebrew}
      </div>
      <div className="text-base font-bold text-feather-text-light mb-4">{word.translation}</div>

      {(pastAvg !== null || presentAvg !== null || futureAvg !== null) && (
        <div className="mb-4 flex w-full justify-around px-4 text-xs font-bold text-feather-text-light">
          <div className="flex flex-col items-center gap-1">
            <span>Pasado</span>
            <div className="h-2 w-12 overflow-hidden rounded-full bg-feather-gray/30">
              <div
                className="h-full rounded-full bg-feather-blue"
                style={{ width: `${pastAvg ?? 0}%` }}
              />
            </div>
            <span>{pastAvg ?? 0}%</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span>Presente</span>
            <div className="h-2 w-12 overflow-hidden rounded-full bg-feather-gray/30">
              <div
                className="h-full rounded-full bg-feather-green"
                style={{ width: `${presentAvg ?? 0}%` }}
              />
            </div>
            <span>{presentAvg ?? 0}%</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span>Futuro</span>
            <div className="h-2 w-12 overflow-hidden rounded-full bg-feather-gray/30">
              <div
                className="h-full rounded-full bg-feather-red"
                style={{ width: `${futureAvg ?? 0}%` }}
              />
            </div>
            <span>{futureAvg ?? 0}%</span>
          </div>
        </div>
      )}
      
      <div className="flex gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={(e) => handleStarClick(e, level)}
            className="focus:outline-none transition-transform active:scale-125 hover:scale-110"
            aria-label={`Establecer dominio en ${level}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={level <= (word.masteryLevel || 0) ? "#FFC800" : "none"}
              stroke={level <= (word.masteryLevel || 0) ? "#FFC800" : "#D6D9DE"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>
    </Card>
  );
}
