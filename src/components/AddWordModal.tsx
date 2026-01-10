"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { addWord } from "@/lib/firestore";
import { conjugateVerb } from "@/lib/openrouter";

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddWordModal({ isOpen, onClose }: AddWordModalProps) {
  const [hebrew, setHebrew] = useState("");
  const [translation, setTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hebrew || !translation) return;

    setIsLoading(true);
    setStatusMessage("CONJUGATING...");
    
    let conjugations = null;
    
    try {
      // 1. First fetch conjugations (Strict ordering requested)
      try {
        const result = await conjugateVerb(hebrew);
        if (result && result.conjugations && result.conjugations.length > 0) {
            conjugations = result.conjugations;
        }
      } catch (err) {
        console.warn("Could not fetch conjugations automatically:", err);
        // If strict requirement means "fail if no conjugation", we would throw here.
        // But usually "add once responded" implies "wait for it".
        // If it fails, we still probably want to save the word itself rather than blocking the user entirely?
        // User query: "add the word once the ai responded with the conjugation."
        // I'll assume if AI fails, we proceed with saving just the word so data isn't lost.
      }
      
      // 2. Then save to database
      setStatusMessage("SAVING...");
      await addWord(hebrew, translation, conjugations || undefined);
      
      setHebrew("");
      setTranslation("");
      setStatusMessage("");
      onClose();
    } catch (error) {
      console.error("Failed to add word:", error);
      setStatusMessage("ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-feather-blue px-6 py-4">
          <h2 className="text-xl font-bold text-white">Add New Word</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="hebrew" className="mb-1 block text-sm font-bold text-feather-text">
                Hebrew
              </label>
              <input
                id="hebrew"
                type="text"
                dir="rtl"
                value={hebrew}
                onChange={(e) => setHebrew(e.target.value)}
                className="w-full rounded-xl border-2 border-feather-gray bg-feather-gray/10 px-4 py-2 text-lg font-medium text-feather-text focus:border-feather-blue focus:bg-white focus:outline-none"
                placeholder="מילה"
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="translation" className="mb-1 block text-sm font-bold text-feather-text">
                Translation
              </label>
              <input
                id="translation"
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="w-full rounded-xl border-2 border-feather-gray bg-feather-gray/10 px-4 py-2 text-lg font-medium text-feather-text focus:border-feather-blue focus:bg-white focus:outline-none"
                placeholder="Word"
              />
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
              CANCEL
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading || !hebrew || !translation}
            >
              {isLoading ? statusMessage : "SAVE"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
