"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Word } from "@/lib/types";
import { convexWordToWord } from "@/lib/convex-helpers";
import MasteryGrid from "@/components/MasteryGrid";
import ConjugationByTense from "@/components/ConjugationByTense";

export default function WordDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const convexWord = useQuery(api.words.getById, { id: id as Id<"words"> });
  const isLoading = convexWord === undefined;
  const error = convexWord === null ? "Palabra no encontrada" : null;
  const word: Word | null = convexWord ? convexWordToWord(convexWord) : null;

  const handlePractice = () => {
    if (word) {
      router.push(`/practice/${encodeURIComponent(word.hebrew)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-5">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-feather-gray/30 border-t-feather-blue"></div>
      </div>
    );
  }

  if (error || !word) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-5">
        <Card className="border-feather-red bg-red-50 text-feather-red mb-6">
          <div className="font-bold">{error || "Palabra no encontrada"}</div>
        </Card>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="text-feather-gray hover:text-feather-text-light transition-colors"
        >
          ✕
        </button>
        <div className="text-sm font-bold uppercase tracking-wide text-feather-text-light">
          Detalles de la Palabra
        </div>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 space-y-6">
        <div className="text-center mb-8">
          <div className="text-4xl font-extrabold text-feather-text hebrew-text mb-2" dir="rtl">
            {word.hebrew}
          </div>
          <div className="text-xl font-bold text-feather-text-light">
            {word.translation}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-feather-text mb-3">Dominio</h3>
          <MasteryGrid mastery={word.mastery} conjugations={word.conjugations} />
        </div>

        <Button 
          variant="primary" 
          fullWidth 
          size="lg"
          onClick={handlePractice}
          className="mb-8"
        >
          PRACTICAR
        </Button>

        {word.conjugations && word.conjugations.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-feather-text mb-3">Tabla de Conjugación</h3>
            <ConjugationByTense conjugations={word.conjugations} />
          </div>
        )}
      </div>
    </div>
  );
}
