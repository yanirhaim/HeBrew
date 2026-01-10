import { Conjugation, MasteryByTense } from "@/lib/types";

const PRONOUN_ORDER = [
  "ani",
  "ata_m",
  "at_f",
  "hu_m",
  "hi_f",
  "anachnu",
  "atem_m",
  "aten_f",
  "hem_m",
  "hen_f",
];

const PRONOUN_LABELS: Record<string, string> = {
  ani: "אני (I)",
  ata_m: "אתה (You m.)",
  at_f: "את (You f.)",
  hu_m: "הוא (He)",
  hi_f: "היא (She)",
  anachnu: "אנחנו (We)",
  atem_m: "אתם (You m. pl.)",
  aten_f: "אתן (You f. pl.)",
  hem_m: "הם (They m.)",
  hen_f: "הן (They f.)",
};

interface MasteryGridProps {
  mastery?: MasteryByTense | null;
  conjugations?: Conjugation[] | null;
}

const getPronounLabel = (code: string, conjugations?: Conjugation[] | null) => {
  if (conjugations && conjugations.length > 0) {
    const match = conjugations.find((c) => c.pronounCode === code);
    if (match?.pronoun) return match.pronoun;
  }
  return PRONOUN_LABELS[code] || code;
};

const Bar = ({ value }: { value: number }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-feather-gray/30">
      <div
        className="h-full rounded-full bg-feather-blue transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export default function MasteryGrid({ mastery, conjugations }: MasteryGridProps) {
  if (!mastery) {
    return (
      <div className="rounded-xl border-2 border-feather-gray bg-feather-gray/10 px-4 py-3 text-sm text-feather-text-light">
        Los datos de dominio aparecerán después de que practiques este verbo.
      </div>
    );
  }

  const pronounCodes = PRONOUN_ORDER.filter(
    (code) =>
      mastery.past?.[code] !== undefined ||
      mastery.present?.[code] !== undefined ||
      mastery.future?.[code] !== undefined
  );

  return (
    <div className="overflow-hidden rounded-xl border-2 border-feather-gray">
      <div className="border-b-2 border-feather-gray bg-feather-gray/10 px-4 py-3 text-sm font-bold uppercase tracking-wide text-feather-text-light">
        Dominio por pronombre y tiempo
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white text-feather-text-light">
              <th className="px-4 py-3 font-bold">Pronombre</th>
              <th className="px-4 py-3 font-bold">Pasado</th>
              <th className="px-4 py-3 font-bold">Presente</th>
              <th className="px-4 py-3 font-bold">Futuro</th>
            </tr>
          </thead>
          <tbody>
            {pronounCodes.map((code) => (
              <tr key={code} className="border-t border-feather-gray/40">
                <td className="px-4 py-3 font-bold text-feather-text">
                  {getPronounLabel(code, conjugations)}
                </td>
                <td className="px-4 py-3">
                  <div className="mb-1 text-xs font-bold text-feather-text-light">
                    {mastery.past?.[code] ?? 0}%
                  </div>
                  <Bar value={mastery.past?.[code] ?? 0} />
                </td>
                <td className="px-4 py-3">
                  <div className="mb-1 text-xs font-bold text-feather-text-light">
                    {mastery.present?.[code] ?? 0}%
                  </div>
                  <Bar value={mastery.present?.[code] ?? 0} />
                </td>
                <td className="px-4 py-3">
                  <div className="mb-1 text-xs font-bold text-feather-text-light">
                    {mastery.future?.[code] ?? 0}%
                  </div>
                  <Bar value={mastery.future?.[code] ?? 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
