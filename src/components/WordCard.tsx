import { Word } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface WordCardProps {
  word: Word;
}

export default function WordCard({ word }: WordCardProps) {
  return (
    <Card className="flex flex-col items-center justify-center py-6 text-center hover:border-feather-blue transition-colors cursor-pointer active:scale-[0.98]">
      <div className="mb-2 text-2xl font-bold text-feather-text hebrew-text" dir="rtl">
        {word.hebrew}
      </div>
      <div className="text-base font-bold text-feather-text-light">{word.translation}</div>
    </Card>
  );
}
