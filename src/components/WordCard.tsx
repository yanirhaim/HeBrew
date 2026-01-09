import { Word } from "@/lib/types";

interface WordCardProps {
  word: Word;
}

export default function WordCard({ word }: WordCardProps) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="mb-2 text-xl font-semibold text-slate-800" dir="rtl">
        {word.hebrew}
      </div>
      <div className="text-sm text-slate-600">{word.translation}</div>
    </div>
  );
}
