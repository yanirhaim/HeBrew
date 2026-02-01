"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { conjugateVerb, translateText } from "@/lib/openrouter";

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddWordModal({ isOpen, onClose }: AddWordModalProps) {
  const [hebrew, setHebrew] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const addWord = useMutation(api.words.add);

  if (!isOpen) return null;

  const processWord = async (hebrewWord: string): Promise<void> => {
    let conjugations = null;
    let translation = "";
    
    // 1. First try to fetch conjugations (for verbs)
    try {
      const result = await conjugateVerb(hebrewWord);
      if (result && result.conjugations && result.conjugations.length > 0) {
        conjugations = result.conjugations;
        translation = result.spanishTranslation || "";
      }
    } catch (err) {
      console.warn("Could not fetch conjugations automatically:", err);
    }
    
    // 2. If no translation from conjugation, try to translate
    if (!translation) {
      try {
        const translationResult = await translateText(hebrewWord, "he-to-es");
        translation = translationResult.translation || hebrewWord;
      } catch (err) {
        console.warn("Could not translate word:", err);
        translation = hebrewWord; // Fallback to Hebrew text if translation fails
      }
    }
    
    // 3. Save to database
    await addWord({
      hebrew: hebrewWord,
      translation,
      conjugations: conjugations || undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hebrew) return;

    setIsLoading(true);
    setStatusMessage("PROCESANDO...");
    
    try {
      // Split by comma and trim whitespace
      const hebrewWords = hebrew.split(",").map(w => w.trim()).filter(w => w.length > 0);
      
      // Process all words
      const results = await Promise.allSettled(
        hebrewWords.map(word => processWord(word))
      );
      
      // Check if any failed
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) {
        console.error("Some words failed to add:", failures);
        setStatusMessage(`ERROR: ${failures.length} palabra(s) fallaron`);
      } else {
        setStatusMessage("");
        setHebrew("");
        onClose();
      }
    } catch (error) {
      console.error("Failed to add words:", error);
      setStatusMessage("ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-feather-blue px-6 py-4">
          <h2 className="text-xl font-bold !text-white">Agregar Nueva Palabra</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="hebrew" className="mb-1 block text-sm font-bold text-feather-text">
                Hebreo
              </label>
              <input
                id="hebrew"
                type="text"
                dir="rtl"
                value={hebrew}
                onChange={(e) => setHebrew(e.target.value)}
                className="w-full rounded-xl border-2 border-feather-gray bg-feather-gray/10 px-4 py-2 text-lg font-medium text-feather-text focus:border-feather-blue focus:bg-white focus:outline-none"
                placeholder="מילה, מילה שנייה"
                autoFocus
              />
              <p className="mt-2 text-xs text-feather-text-light">
                Puedes agregar múltiples palabras separadas por comas
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading || !hebrew}
            >
              {isLoading ? statusMessage : "GUARDAR"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
