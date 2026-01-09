import { Conjugation } from "@/lib/types";

interface ConjugationByTenseProps {
  conjugations: Conjugation[];
}

const TenseTable = ({
  title,
  tenseKey,
  conjugations,
}: {
  title: string;
  tenseKey: "past" | "present" | "future";
  conjugations: Conjugation[];
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
    <div className="mb-8 overflow-hidden rounded-lg border border-blue-100 bg-white">
      <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 4C4 2.89543 4.89543 2 6 2H14C15.1046 2 16 2.89543 16 4V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V4Z"
            fill="#3B82F6"
          />
          <path
            d="M6 6H14M6 9H14M6 12H10"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-blue-100 bg-blue-50/50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                Person
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                Hebrew
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                Transliteration
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
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
                  className="border-b border-blue-50 last:border-b-0 hover:bg-blue-50/30"
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">
                    {conjugation.pronoun}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-800" dir="rtl">
                    {tenseData.hebrew}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {tenseData.transliteration}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600" dir="rtl">
                    {tenseData.example}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function ConjugationByTense({ conjugations }: ConjugationByTenseProps) {
  return (
    <div className="space-y-6">
      <TenseTable title="Past Tense (עבר)" tenseKey="past" conjugations={conjugations} />
      <TenseTable title="Present Tense (הווה)" tenseKey="present" conjugations={conjugations} />
      <TenseTable title="Future Tense (עתיד)" tenseKey="future" conjugations={conjugations} />
    </div>
  );
}
