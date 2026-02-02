"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import HebrewInput from "@/components/HebrewInput";
import { Word, PracticeExercise } from "@/lib/types";
import { convexWordToWord } from "@/lib/convex-helpers";

interface DailyPracticeData {
  scenarioTitle: string;
  scenarioContext: string;
  exercises: PracticeExercise[];
}

type Phase = "loading" | "practice" | "summary";

export default function DailyPracticePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [words, setWords] = useState<Word[]>([]);
  const [practiceData, setPracticeData] = useState<DailyPracticeData | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  
  // Track if initialization has already happened to prevent re-initialization on Convex refetches
  const initializedRef = useRef(false);

  const dailyWordsData = useQuery(api.words.getDailyWords);
  const updateProgress = useMutation(api.words.updateProgress);

  useEffect(() => {
    // Only initialize once, even if dailyWordsData refetches
    if (initializedRef.current) return;
    
    async function init() {
      if (!dailyWordsData) return; // Still loading

      try {
        // Mark as initialized before starting to prevent race conditions
        initializedRef.current = true;
        
        // 1. Fetch Words
        const { newWords, reviewWords, weakWords } = dailyWordsData;
        // Convert Convex documents to Word type
        const newWordsConverted = newWords.map(convexWordToWord);
        const reviewWordsConverted = reviewWords.map(convexWordToWord);
        const weakWordsConverted = weakWords.map(convexWordToWord);
        
        // Combine (limit to ~20 words total for a session to include more flashcards)
        const combined = [...weakWordsConverted, ...reviewWordsConverted, ...newWordsConverted].slice(0, 20);
        
        console.log("Daily words fetched:", { 
          newWords: newWordsConverted.length, 
          reviewWords: reviewWordsConverted.length, 
          weakWords: weakWordsConverted.length,
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
        setPhase("practice");
      } catch (error) {
        console.error("Error initializing daily practice:", error);
        // Reset initialization flag on error so user can retry
        initializedRef.current = false;
        alert("Error loading practice. Please try again.");
        router.push("/practice");
      }
    }

    init();
  }, [router, dailyWordsData]);

  const handleCheck = async () => {
    if (!userInput.trim() || !practiceData?.exercises) return;

    const currentExercise = practiceData.exercises[currentExerciseIndex];
    if (!currentExercise) return;

    const correct = userInput.trim() === currentExercise.correctAnswer.trim();
    setIsCorrect(correct);
    setShowFeedback(true);

    // Update stats
    if (correct) {
      setStats(s => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
    } else {
      setStats(s => ({ ...s, total: s.total + 1 }));
    }

    // Update progress for words if we can match them
    // For flashcards, use wordId directly
    if (currentExercise.type === "flashcard" && currentExercise.wordId) {
      await updateProgress({ 
        id: currentExercise.wordId as Id<"words">, 
        isCorrect: correct 
      }).catch(err => console.warn("Failed to update progress", err));
    } else {
      // Try to find the word that matches the exercise
      const matchingWord = words.find(w => 
        currentExercise.sentence.includes(w.hebrew) || 
        currentExercise.correctAnswer === w.hebrew
      );
      if (matchingWord) {
        await updateProgress({ 
          id: matchingWord.id as Id<"words">, 
          isCorrect: correct 
        }).catch(err => console.warn("Failed to update progress", err));
      }
    }
  };

  const handleNextExercise = () => {
    // Reset exercise inputs
    setUserInput("");
    setShowFeedback(false);
    setIsCorrect(false);

    if (!practiceData?.exercises) return;

    if (currentExerciseIndex < practiceData.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      setPhase("summary");
    }
  };


  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-safe pb-32">
        <div className="text-center px-5">
          <div className="mb-4 text-6xl animate-bounce">🤖</div>
          <h2 className="text-xl font-bold text-gray-700">Preparando tu misión diaria...</h2>
          <p className="text-gray-500">Seleccionando palabras y generando escenario.</p>
        </div>
      </div>
    );
  }


  if (phase === "practice" && practiceData) {
    // Safety check: ensure currentExerciseIndex is valid
    if (!practiceData.exercises || currentExerciseIndex >= practiceData.exercises.length) {
      return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-5 pt-safe pb-32">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">Error: Ejercicio no encontrado</p>
            <Button variant="primary" onClick={() => router.push("/practice")}>
              Volver al Inicio
            </Button>
          </div>
        </div>
      );
    }
    
    const currentExercise = practiceData.exercises[currentExerciseIndex];
    const progress = ((currentExerciseIndex + 1) / practiceData.exercises.length) * 100;

    return (
      <div className="mx-auto grid h-[100svh] max-w-md grid-rows-[auto,1fr] overflow-hidden bg-white px-4 pt-safe pb-4">
        {/* Header with Progress */}
        <div className="mb-3 flex items-center gap-4 pt-2">
          <button 
            onClick={() => router.back()} 
            className="text-feather-gray hover:text-feather-text-light transition-colors"
          >
            ✕
          </button>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-feather-gray/20">
            <div 
              className="h-full bg-feather-green transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="min-h-0">
          <h1 className="mb-1 text-xl font-extrabold text-feather-text text-center">
            Práctica Diaria
          </h1>
          <p className="mb-3 text-center text-feather-text-light font-bold text-xs">
            {currentExercise.type === "flashcard" ? "Selecciona el significado" : "Completa la palabra faltante"}
          </p>

          {currentExercise.type === "flashcard" ? (
            // Flashcard style
            <div className="mb-3">
              <Card className="w-full flex flex-col items-center justify-center p-4 text-center">
                <div className="mb-4 text-xs font-bold uppercase tracking-wide text-feather-text-light">
                  ¿Cuál es el significado?
                </div>
                <div
                  className="mb-4 text-[clamp(2rem,7vw,3rem)] font-extrabold leading-tight text-feather-text"
                  dir="rtl"
                >
                  {currentExercise.sentence}
                </div>
                
                <div className="w-full grid grid-cols-2 gap-3">
                  {currentExercise.options?.map((option, idx) => {
                    const isSelected = userInput === option;
                    const isCorrectOption = option === currentExercise.correctAnswer;
                    
                    let variant: "primary" | "secondary" | "outline" | "danger" = "outline";
                    if (showFeedback) {
                      if (isCorrectOption) {
                        variant = "primary"; // Green for correct
                      } else if (isSelected && !isCorrectOption) {
                        variant = "danger"; // Red for wrong selection
                      }
                    } else if (isSelected) {
                      variant = "secondary"; // Blue for selected
                    }
                    
                    return (
                      <Button
                        key={idx}
                        variant={variant}
                        onClick={() => !showFeedback && setUserInput(option)}
                        fullWidth
                        className="h-12 text-sm"
                        disabled={showFeedback}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </Card>
            </div>
          ) : (
            <>
              {/* Question Bubble */}
              <div className="mb-3 flex gap-3">
                <div className="text-3xl self-end">🦉</div>
                <div className="relative rounded-2xl border-2 border-feather-gray p-3 flex-1">
                  <div 
                    className="absolute -left-2 bottom-6 h-4 w-4 rotate-45 border-b-2 border-l-2 border-feather-gray bg-white"
                  ></div>
                  <div className="text-lg font-bold text-feather-text text-right" dir="rtl">
                    {currentExercise.sentence.split("_____").map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="mx-1 inline-block w-16 border-b-2 border-feather-text border-dashed"></span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-xs font-medium text-feather-text-light">
                    {currentExercise.translation}
                  </div>
                </div>
              </div>

              {/* Interaction Area */}
              <div className="mb-3">
                {currentExercise.type === "multiple_choice" && currentExercise.options ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentExercise.options.map((option, idx) => (
                      <Button
                        key={idx}
                        variant={
                          showFeedback 
                            ? option === currentExercise.correctAnswer 
                              ? "primary" // Green for correct
                              : option === userInput && option !== currentExercise.correctAnswer
                                ? "danger" // Red for wrong selection
                                : "outline"
                            : userInput === option 
                              ? "secondary" // Blue for selected
                              : "outline"
                        }
                        onClick={() => !showFeedback && setUserInput(option)}
                        fullWidth
                        className="h-12 text-sm"
                        dir="rtl"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <HebrewInput
                    value={userInput}
                    onChange={(e) => !showFeedback && setUserInput(e.target.value)}
                    placeholder="Escribe la respuesta..."
                    className="text-center text-xl h-12"
                    disabled={showFeedback}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer / Feedback */}
        <div className={`fixed bottom-20 left-0 right-0 border-t-2 p-3 pb-3 z-[100] ${
          showFeedback 
            ? isCorrect 
              ? "bg-[#d7ffb8] border-[#b8f28b]" 
              : "bg-[#ffdfe0] border-[#ffc1c1]"
            : "bg-white border-feather-gray"
        }`}>
          <div className="mx-auto max-w-md flex justify-between items-center">
            {showFeedback ? (
              <div className="flex-1 mr-4">
                <div className={`text-xl font-extrabold mb-1 ${
                  isCorrect ? "text-feather-green" : "text-feather-red"
                }`}>
                  {isCorrect ? "¡Bien hecho!" : "Respuesta correcta:"}
                </div>
                {!isCorrect && (
                  <div className="text-feather-red font-bold text-lg">
                    {currentExercise.correctAnswer}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1"></div>
            )}
            
            <Button 
              variant={showFeedback ? (isCorrect ? "primary" : "danger") : "primary"}
              size="lg"
              className="min-w-[150px]"
              disabled={!userInput}
              onClick={showFeedback ? handleNextExercise : handleCheck}
            >
              {showFeedback 
                ? (currentExerciseIndex < practiceData.exercises.length - 1 ? "CONTINUAR" : "FINALIZAR")
                : "VERIFICAR"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "summary") {
      return (
          <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-5 text-center pt-safe pb-32">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-3xl font-extrabold text-feather-text mb-4">¡Misión Cumplida!</h1>
              <p className="text-lg text-gray-600 mb-8">
                  Completaste {stats.total} ejercicios hoy.
                  <br/>
                  {stats.correct > 0 && (
                    <>
                      Obtuviste {stats.correct} correctos.
                      <br/>
                    </>
                  )}
                  <span className="font-bold text-feather-blue">¡Sigue así!</span>
              </p>
              
              <div className="w-full space-y-4 mb-6">
                <Button variant="primary" size="lg" fullWidth onClick={() => router.push("/practice")}>
                    Volver al Inicio
                </Button>
              </div>
          </div>
      );
  }

  return null;
}
