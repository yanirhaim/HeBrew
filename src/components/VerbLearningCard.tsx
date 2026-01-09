import { Conjugation } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface VerbLearningCardProps {
  conjugation: Conjugation;
  tense: "past" | "present" | "future";
}

export default function VerbLearningCard({ conjugation, tense }: VerbLearningCardProps) {
  const getTenseData = () => {
    switch (tense) {
      case "past":
        return {
          hebrew: conjugation.past,
          transliteration: conjugation.pastTransliteration || "",
          example: conjugation.pastExample || "",
          title: "Past Tense (עבר)",
        };
      case "present":
        return {
          hebrew: conjugation.present,
          transliteration: conjugation.presentTransliteration || "",
          example: conjugation.presentExample || "",
          title: "Present Tense (הווה)",
        };
      case "future":
        return {
          hebrew: conjugation.future,
          transliteration: conjugation.futureTransliteration || "",
          example: conjugation.futureExample || "",
          title: "Future Tense (עתיד)",
        };
    }
  };

  const data = getTenseData();

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="mb-2 text-sm font-bold uppercase tracking-wide text-feather-text-light">
        {data.title}
      </div>
      <div className="mb-6 text-2xl font-bold text-feather-blue">
        {conjugation.pronoun}
      </div>
      
      <div className="mb-4 text-5xl font-extrabold text-feather-text" dir="rtl">
        {data.hebrew}
      </div>
      
      <div className="mb-8 text-xl font-medium text-feather-text-light">
        {data.transliteration}
      </div>

      <div className="w-full rounded-xl bg-feather-gray/10 p-4" dir="rtl">
        <p className="text-lg text-feather-text">{data.example}</p>
      </div>
    </Card>
  );
}
