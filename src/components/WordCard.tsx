import { Word } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { updateWordMastery } from "@/lib/firestore";

interface WordCardProps {
  word: Word;
  onClick?: () => void;
}

export default function WordCard({ word, onClick }: WordCardProps) {
  const handleStarClick = async (e: React.MouseEvent, level: number) => {
    e.stopPropagation();
    try {
      await updateWordMastery(word.id, level);
    } catch (error) {
      console.error("Failed to update mastery:", error);
    }
  };

  return (
    <Card 
      onClick={onClick}
      className="flex flex-col items-center justify-center py-6 text-center hover:border-feather-blue transition-colors cursor-pointer active:scale-[0.98]"
    >
      <div className="mb-2 text-2xl font-bold text-feather-text hebrew-text" dir="rtl">
        {word.hebrew}
      </div>
      <div className="text-base font-bold text-feather-text-light mb-4">{word.translation}</div>
      
      <div className="flex gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={(e) => handleStarClick(e, level)}
            className="focus:outline-none transition-transform active:scale-125 hover:scale-110"
            aria-label={`Set mastery to ${level}`}
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
