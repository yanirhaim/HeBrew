"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import VerbConjugationCard from "@/components/VerbConjugationCard";
import { Word } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function WordDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [word, setWord] = useState<Word | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWord = async () => {
      try {
        const docRef = doc(db, "words", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setWord({
            id: docSnap.id,
            hebrew: data.hebrew,
            translation: data.translation,
            createdAt: data.createdAt?.toDate() || new Date(),
            masteryLevel: data.masteryLevel || 0,
            conjugations: data.conjugations || []
          } as Word);
        } else {
          setError("Word not found");
        }
      } catch (err) {
        console.error("Error fetching word:", err);
        setError("Failed to load word details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWord();
  }, [id]);

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
          <div className="font-bold">{error || "Word not found"}</div>
        </Card>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-8 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="text-feather-gray hover:text-feather-text-light transition-colors"
        >
          ✕
        </button>
        <div className="text-sm font-bold uppercase tracking-wide text-feather-text-light">
          Word Details
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

        <Button 
          variant="primary" 
          fullWidth 
          size="lg"
          onClick={handlePractice}
          className="mb-8"
        >
          PRACTICE
        </Button>

        <div>
          <h3 className="text-lg font-bold text-feather-text mb-3">Conjugation Table</h3>
          {/* 
            Pass existing conjugations to avoid re-fetching.
            If conjugations were not saved (legacy words), the component handles fetching.
          */}
          <VerbConjugationCard 
            verb={word.hebrew} 
            spanishTranslation={word.translation}
            conjugations={word.conjugations}
          />
        </div>
      </div>
    </div>
  );
}
