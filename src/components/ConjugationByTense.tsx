import { Conjugation } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface ConjugationByTenseProps {
  conjugations: Conjugation[];
}

const TenseTable = ({
  title,
  tenseKey,
  conjugations,
  colorClass = "text-feather-blue",
  bgColorClass = "bg-blue-50",
  borderColorClass = "border-blue-100",
  iconColor = "#1cb0f6"
}: {
  title: string;
  tenseKey: "past" | "present" | "future";
  conjugations: Conjugation[];
  colorClass?: string;
  bgColorClass?: string;
  borderColorClass?: string;
  iconColor?: string;
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
    <Card className="mb-8 p-0 overflow-hidden border-2">
      <div className={`flex items-center gap-3 border-b-2 border-feather-gray ${bgColorClass} px-5 py-4`}>
        <h3 className={`text-lg font-extrabold uppercase tracking-wide ${colorClass}`}>{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-feather-gray bg-white">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-feather-text-light">
                Person
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-feather-text-light">
                Hebrew
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-feather-text-light">
                Transliteration
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-feather-text-light">
                Example
              </th>
            </tr>
          </thead>
          <tbody>
            {conjugations.map((conjugation, index) => {
              const tenseData = getTenseData(conjugation);
              return (
                <tr
                  key={index}
                  className="border-b border-feather-gray last:border-b-0 hover:bg-feather-gray/10 transition-colors"
                >
                  <td className="px-4 py-4 text-sm font-bold text-feather-text">
                    {conjugation.pronoun}
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-bold text-feather-text hebrew-text" dir="rtl">
                    {tenseData.hebrew}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-feather-text-light">
                    {tenseData.transliteration}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-feather-text-light" dir="rtl">
                    {tenseData.example}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default function ConjugationByTense({ conjugations }: ConjugationByTenseProps) {
  return (
    <div className="space-y-6">
      <TenseTable 
        title="Past Tense (עבר)" 
        tenseKey="past" 
        conjugations={conjugations}
        colorClass="text-feather-blue"
        bgColorClass="bg-blue-50" 
      />
      <TenseTable 
        title="Present Tense (הווה)" 
        tenseKey="present" 
        conjugations={conjugations} 
        colorClass="text-feather-green"
        bgColorClass="bg-green-50"
      />
      <TenseTable 
        title="Future Tense (עתיד)" 
        tenseKey="future" 
        conjugations={conjugations} 
        colorClass="text-feather-red"
        bgColorClass="bg-red-50"
      />
    </div>
  );
}
