import { Conjugation } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface ConjugationByTenseProps {
  conjugations: Conjugation[];
}

const TenseGroup = ({
  title,
  tenseKey,
  conjugations,
  colorClass = "text-feather-blue",
  bgColorClass = "bg-blue-50",
}: {
  title: string;
  tenseKey: "past" | "present" | "future";
  conjugations: Conjugation[];
  colorClass?: string;
  bgColorClass?: string;
}) => {
  const getTenseData = (conjugation: Conjugation) => {
    switch (tenseKey) {
      case "past":
        return {
          hebrew: conjugation.past,
          transliteration: conjugation.pastTransliteration || "",
          example: conjugation.pastExample || "",
        };
      case "present":
        return {
          hebrew: conjugation.present,
          transliteration: conjugation.presentTransliteration || "",
          example: conjugation.presentExample || "",
        };
      case "future":
        return {
          hebrew: conjugation.future,
          transliteration: conjugation.futureTransliteration || "",
          example: conjugation.futureExample || "",
        };
    }
  };

  return (
    <Card className="mb-8 p-0 overflow-hidden border-2 border-b-4 border-feather-gray">
      <div className={`flex items-center gap-3 border-b-2 border-feather-gray ${bgColorClass} px-5 py-4`}>
        <h3 className={`text-lg font-extrabold uppercase tracking-wide ${colorClass}`}>{title}</h3>
      </div>
      <div className="divide-y-2 divide-feather-gray">
        {conjugations.map((conjugation, index) => {
          const tenseData = getTenseData(conjugation);
          return (
            <div
              key={index}
              className="flex flex-col p-4 hover:bg-feather-gray/5 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase text-feather-text-light mt-1.5 tracking-wider">
                  {conjugation.pronoun}
                </span>
                <div className="text-right">
                  <div className="text-xl font-bold text-feather-text mb-1" dir="rtl">
                    {tenseData.hebrew}
                  </div>
                  <div className="text-sm font-medium text-feather-text-light">
                    {tenseData.transliteration}
                  </div>
                </div>
              </div>
              {tenseData.example && (
                <div className="mt-2 text-sm text-feather-text-light bg-feather-gray/10 p-3 rounded-xl leading-relaxed" dir="rtl">
                  {tenseData.example}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default function ConjugationByTense({ conjugations }: ConjugationByTenseProps) {
  return (
    <div className="space-y-6">
      <TenseGroup 
        title="Tiempo Pasado (עבר)" 
        tenseKey="past" 
        conjugations={conjugations}
        colorClass="text-feather-blue"
        bgColorClass="bg-blue-50" 
      />
      <TenseGroup 
        title="Tiempo Presente (הווה)" 
        tenseKey="present" 
        conjugations={conjugations} 
        colorClass="text-feather-green"
        bgColorClass="bg-green-50"
      />
      <TenseGroup 
        title="Tiempo Futuro (עתיד)" 
        tenseKey="future" 
        conjugations={conjugations} 
        colorClass="text-feather-red"
        bgColorClass="bg-red-50"
      />
    </div>
  );
}
