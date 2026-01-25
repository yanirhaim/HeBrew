"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import VoiceInput from "@/components/VoiceInput";
import { getDailyWords, updateWordProgress } from "@/lib/firestore";
import { Word } from "@/lib/types";

interface DailyPracticeData {
  scenarioTitle: string;
  scenarioContext: string;
  wordPractice: {
    wordId: string;
    hebrewWord: string;
    sentence: string;
    sentenceTranslation: string;
    dialoguePrompt: string;
    dialoguePromptTranslation: string;
  }[];
  dialogueScript: {
    speaker: string;
    hebrew: string;
    translation: string;
  }[];
}

type Phase = "loading" | "intro" | "practice" | "dialogue" | "summary";

export default function DailyPracticePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [words, setWords] = useState<Word[]>([]);
  const [practiceData, setPracticeData] = useState<DailyPracticeData | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [feedback, setFeedback] = useState<"none" | "correct" | "incorrect">("none");
  const [userTranscript, setUserTranscript] = useState("");
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    async function init() {
      try {
        // 1. Fetch Words
        const { newWords, reviewWords, weakWords } = await getDailyWords();
        // Combine (limit to ~10 words total for a session to keep it manageable)
        const combined = [...weakWords, ...reviewWords, ...newWords].slice(0, 10);
        
        console.log("Daily words fetched:", { 
          newWords: newWords.length, 
          reviewWords: reviewWords.length, 
          weakWords: weakWords.length,
          combined: combined.length 
        });
        
        if (combined.length === 0) {
            // Handle case with no words - maybe redirect or show message
            alert("No hay palabras para practicar todavía. Por favor, agrega algunas palabras primero desde la página principal.");
            router.push("/words");
            return;
        }

        setWords(combined);

        // 2. Generate Content
        const response = await fetch("/api/practice/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words: combined }),
        });

        if (!response.ok) throw new Error("Failed to generate practice");
        
        const data = await response.json();
        setPracticeData(data);
        setPhase("intro");
      } catch (error) {
        console.error("Error initializing daily practice:", error);
        alert("Error loading practice. Please try again.");
        router.push("/practice");
      }
    }

    init();
  }, [router]);

  const handleVoiceResult = (text: string) => {
    setUserTranscript(text);
    // Simple verification logic (can be improved with fuzzy matching)
    // We check if the target word is in the transcript
    const currentItem = practiceData?.wordPractice[currentWordIndex];
    if (!currentItem) return;

    // Normalize: remove vowels/punctuation for check if possible, but for now simple check
    // This is a naive check. A better one would use an edit distance or checking for the root.
    if (text.includes(currentItem.hebrewWord) || text.length > 5) { // Assuming length > 5 implies they said something substantive
       // Ideally we'd compare against currentItem.sentence, but that might be too hard.
       // Let's assume if they speak and it's somewhat long, we accept it for prototype, 
       // or match specific keywords.
       // Better: Check if the *target word* is present.
       const targetWord = currentItem.hebrewWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
       const spoken = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
       
       if (spoken.includes(targetWord)) {
           setFeedback("correct");
       } else {
           // Allow manual override or "close enough"
           // For now, let's just show what they said and let them proceed if they think it's right?
           // Or just mark incorrect but allow retry.
           setFeedback("incorrect");
       }
    }
  };

  const handleNextWord = async () => {
    // Update progress
    const currentWord = words[currentWordIndex];
    if (currentWord && feedback === "correct") {
       await updateWordProgress(currentWord.id, true);
       setStats(s => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
    } else if (currentWord) {
       await updateWordProgress(currentWord.id, false);
       setStats(s => ({ ...s, total: s.total + 1 }));
    }

    setFeedback("none");
    setUserTranscript("");

    if (currentWordIndex < (practiceData?.wordPractice.length || 0) - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setPhase("dialogue");
    }
  };

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl animate-bounce">🤖</div>
          <h2 className="text-xl font-bold text-gray-700">Preparando tu misión diaria...</h2>
          <p className="text-gray-500">Seleccionando palabras y generando escenario.</p>
        </div>
      </div>
    );
  }

  if (phase === "intro" && practiceData) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pt-8 pb-10">
        <h1 className="text-3xl font-extrabold text-feather-text mb-2 text-center">Misión Diaria</h1>
        <Card className="p-6 bg-blue-50 border-blue-100 mb-8">
            <h2 className="text-xl font-bold text-blue-800 mb-2">{practiceData.scenarioTitle}</h2>
            <p className="text-blue-600 text-lg">{practiceData.scenarioContext}</p>
        </Card>
        
        <div className="space-y-4">
            <p className="text-center text-gray-600">Palabras clave de hoy:</p>
            <div className="flex flex-wrap gap-2 justify-center">
                {words.map(w => (
                    <span key={w.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-bold text-gray-700">
                        {w.hebrew}
                    </span>
                ))}
            </div>
        </div>

        <div className="mt-auto">
            <Button variant="primary" size="lg" fullWidth onClick={() => setPhase("practice")}>
                Comenzar Entrenamiento
            </Button>
        </div>
      </div>
    );
  }

  if (phase === "practice" && practiceData) {
    const item = practiceData.wordPractice[currentWordIndex];
    const progress = ((currentWordIndex + 1) / practiceData.wordPractice.length) * 100;

    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pt-8 pb-10">
        {/* Progress Bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div 
            className="h-full bg-feather-blue transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Prompt Card */}
        <div className="mb-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Situación</p>
            <div className="text-xl font-medium text-right mb-2" dir="rtl">
                {item.dialoguePrompt}
            </div>
            <p className="text-sm text-gray-500 text-right">{item.dialoguePromptTranslation}</p>
        </div>

        {/* Target Word */}
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-8 text-center">
            <p className="text-xs text-yellow-600 font-bold uppercase mb-1">Tu objetivo</p>
            <h3 className="text-3xl font-black text-feather-text mb-2">{item.hebrewWord}</h3>
            <p className="text-gray-600 mb-4">Usa esta palabra en una oración.</p>
            
            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-400 mb-1">Ejemplo sugerido:</p>
                <p className="text-lg font-bold text-feather-blue mb-1" dir="rtl">{item.sentence}</p>
                <p className="text-xs text-gray-400">{item.sentenceTranslation}</p>
            </div>
        </div>

        {/* Voice Input */}
        <div className="flex-1 flex flex-col justify-end">
            <VoiceInput 
                onResult={handleVoiceResult} 
                placeholder="Di tu frase aquí..."
            />
            
            {userTranscript && (
                <div className={`mt-4 p-3 rounded-lg text-center ${
                    feedback === "correct" ? "bg-green-100 text-green-800" : "bg-red-50 text-red-800"
                }`}>
                    <p className="font-bold mb-1">Escuché:</p>
                    <p className="text-lg" dir="rtl">{userTranscript}</p>
                    {feedback === "incorrect" && <p className="text-xs mt-1">Intenta mencionar: {item.hebrewWord}</p>}
                </div>
            )}

            <div className="mt-6">
                {feedback === "correct" ? (
                    <Button variant="primary" size="lg" fullWidth onClick={handleNextWord}>
                        ¡Excelente! Siguiente
                    </Button>
                ) : (
                    <Button variant="secondary" size="lg" fullWidth onClick={() => {
                        // Allow skipping or manually marking as done for now to not block user
                        handleNextWord();
                    }}>
                        Saltar / Continuar
                    </Button>
                )}
            </div>
        </div>
      </div>
    );
  }

  if (phase === "dialogue" && practiceData) {
      return (
          <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pt-8 pb-10">
              <h1 className="text-2xl font-bold text-center mb-6">Escenario Final</h1>
              <p className="text-center text-gray-500 mb-8">Lee este diálogo en voz alta.</p>
              
              <div className="space-y-6 flex-1">
                  {practiceData.dialogueScript.map((line, idx) => (
                      <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl ${
                              idx % 2 === 0 
                                ? "bg-feather-blue text-white rounded-tr-none" 
                                : "bg-gray-100 text-gray-800 rounded-tl-none"
                          }`}>
                              <p className="text-lg font-bold mb-1" dir="rtl">{line.hebrew}</p>
                              <p className={`text-xs ${idx % 2 === 0 ? "text-blue-100" : "text-gray-500"}`}>
                                  {line.translation}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={() => setPhase("summary")}>
                  Terminar Entrenamiento
              </Button>
          </div>
      );
  }

  if (phase === "summary") {
      return (
          <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-5 text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-3xl font-extrabold text-feather-text mb-4">¡Misión Cumplida!</h1>
              <p className="text-lg text-gray-600 mb-8">
                  Practicaste {stats.total} palabras hoy.
                  <br/>
                  <span className="font-bold text-feather-blue">¡Sigue así!</span>
              </p>
              
              <div className="w-full space-y-4">
                <Button variant="primary" size="lg" fullWidth onClick={() => router.push("/practice")}>
                    Volver al Inicio
                </Button>
              </div>
          </div>
      );
  }

  return null;
}
