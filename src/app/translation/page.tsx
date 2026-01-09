"use client";

import { useState } from "react";
import HebrewInput from "@/components/HebrewInput";
import VerbConjugationCard from "@/components/VerbConjugationCard";
import { translateText } from "@/lib/openrouter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function TranslationPage() {
  const [inputValue, setInputValue] = useState("");
  const [translation, setTranslation] = useState("");
  const [direction, setDirection] = useState<"he-to-en" | "en-to-he">("he-to-en");
  const [isVerb, setIsVerb] = useState(false);
  const [verbForm, setVerbForm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) {
      setTranslation("");
      setIsVerb(false);
      setVerbForm(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await translateText(inputValue.trim(), direction);
      setTranslation(result.translation);
      setIsVerb(result.isVerb);
      setVerbForm(result.verbForm);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to translate text";
      setError(errorMessage);
      setTranslation("");
      setIsVerb(false);
      setVerbForm(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-32 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Translation
      </h1>

      <div className="mb-6 flex gap-3">
        <Button
          onClick={() => setDirection("he-to-en")}
          variant={direction === "he-to-en" ? "primary" : "outline"}
          className="flex-1"
          size="sm"
        >
          Hebrew → English
        </Button>
        <Button
          onClick={() => setDirection("en-to-he")}
          variant={direction === "en-to-he" ? "primary" : "outline"}
          className="flex-1"
          size="sm"
        >
          English → Hebrew
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <HebrewInput
          label={direction === "he-to-en" ? "Enter Hebrew text" : "Enter English text"}
          placeholder={direction === "he-to-en" ? "שלום" : "Hello"}
          dir={direction === "he-to-en" ? "rtl" : "ltr"}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!e.target.value.trim()) {
              setTranslation("");
            }
          }}
        />
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? "Translating..." : "Translate"}
        </Button>
      </form>

      {error && (
        <Card className="mb-6 border-feather-red bg-red-50 text-feather-red">
          <div className="font-bold">{error}</div>
        </Card>
      )}

      {isLoading && (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg font-bold text-feather-text-light">Translating...</div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-feather-blue border-t-transparent"></div>
        </div>
      )}

      {!isLoading && translation && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="mb-4 bg-blue-50 border-feather-blue">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-feather-blue">Translation</div>
            <div
              className="text-xl font-bold text-feather-text"
              dir={direction === "he-to-en" ? "ltr" : "rtl"}
            >
              {translation}
            </div>
          </Card>

          {isVerb && verbForm && (
            <VerbConjugationCard verb={verbForm} />
          )}
        </div>
      )}

      {!isLoading && inputValue.trim() && !translation && !error && (
        <div className="mt-12 text-center">
           <div className="text-6xl mb-4">🌍</div>
           <p className="text-lg font-bold text-feather-text-light">
            Ready to translate!
           </p>
        </div>
      )}
    </div>
  );
}
