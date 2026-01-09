import { Conjugation } from "@/lib/types";

interface ConjugationCardProps {
  conjugation: Conjugation;
}

export default function ConjugationCard({ conjugation }: ConjugationCardProps) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="mb-3 text-lg font-semibold text-slate-800">
        {conjugation.pronoun}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Past:</span>
          <span className="text-right font-medium text-slate-800" dir="rtl">
            {conjugation.past}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Present:</span>
          <span className="text-right font-medium text-slate-800" dir="rtl">
            {conjugation.present}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Future:</span>
          <span className="text-right font-medium text-slate-800" dir="rtl">
            {conjugation.future}
          </span>
        </div>
      </div>
    </div>
  );
}
