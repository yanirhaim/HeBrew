"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { generatePracticeExercises } from "@/lib/openrouter";
import { PracticeExercise, Conjugation } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import HebrewInput from "@/components/HebrewInput";
import VerbLearningFlow from "@/components/VerbLearningFlow";

type Tense = "present" | "past" | "future";
type Mode = "learn" | "quiz";

const TENSE_ORDER: Tense[] = ["present", "past", "future"];

export default function VerbPracticePage({ params }: { params: Promise<{ verb: string }> }) {
  const router = useRouter();
  const { verb: encodedVerb } = use(params);
  const verb = decodeURIComponent(encodedVerb);

  const [isLoading, setIsLoading] = useState(true);
  const [exercises, setExercises] = useState<PracticeExercise[]>([]);
  const [conjugations, setConjugations] = useState<Conjugation[]>([]);
  
  // Session State
  const [currentTenseIndex, setCurrentTenseIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<Mode>("learn");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  // Quiz State
  const [userInput, setUserInput] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentTense = TENSE_ORDER[currentTenseIndex];

  // Filter exercises for the current tense
  const currentTenseExercises = useMemo(() => {
    return exercises.filter(ex => ex.tense === currentTense);
  }, [exercises, currentTense]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const result = await generatePracticeExercises(verb);
        setExercises(result.exercises);
        setConjugations(result.conjugations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load exercises");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [verb]);

  const handleLearnComplete = () => {
    setCurrentMode("quiz");
    setCurrentExerciseIndex(0);
  };

  const handleCheck = () => {
    if (!userInput.trim()) return;

    const currentExercise = currentTenseExercises[currentExerciseIndex];
    const correct = userInput.trim() === currentExercise.correctAnswer.trim();
    
    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 1);
    }
    setShowFeedback(true);
  };

  const handleNextExercise = () => {
    // Reset quiz inputs
    setUserInput("");
    setShowFeedback(false);
    setIsCorrect(false);

    if (currentExerciseIndex < currentTenseExercises.length - 1) {
      // Next exercise in current tense
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      // Finished current tense quiz
      if (currentTenseIndex < TENSE_ORDER.length - 1) {
        // Move to next tense
        setCurrentTenseIndex((prev) => prev + 1);
        setCurrentMode("learn");
      } else {
        // Finished all tenses
        setSessionComplete(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-5">
        <div className="mb-4 text-lg font-bold text-feather-text-light">Preparing your lesson...</div>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-feather-blue border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-5">
        <Card className="border-feather-red bg-red-50 text-feather-red mb-6">
          <div className="font-bold">{error}</div>
        </Card>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-5">
        <Card className="w-full text-center py-8 mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold text-feather-text mb-2">Practice Complete!</h2>
          <p className="text-feather-text-light font-bold mb-6">
            You scored {score} out of {exercises.length}
          </p>
          <div className="space-y-3">
            <Button fullWidth onClick={() => window.location.reload()}>Practice Again</Button>
            <Button fullWidth variant="secondary" onClick={() => router.push("/conjugation")}>
              Back to Conjugation
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- LEARN MODE ---
  if (currentMode === "learn") {
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
                      Learn: {currentTense}
                  </div>
                  <div className="w-6"></div> {/* Spacer for center alignment */}
              </div>
              
              <div className="flex-1 pb-8">
                  <VerbLearningFlow 
                      conjugations={conjugations} 
                      tense={currentTense}
                      onComplete={handleLearnComplete} 
                  />
              </div>
        </div>
    );
  }

  // --- QUIZ MODE ---
  const currentExercise = currentTenseExercises[currentExerciseIndex];
  
  // Calculate total progress: 
  // Each tense has 2 phases (Learn, Quiz). We can simplify by just tracking quiz progress overall or within tense.
  // Or: (Completed Exercises / Total Exercises) ?
  // Let's track overall exercise progress.
  // We need to know how many exercises were in previous tenses.
  // Simplification: just show progress within current tense quiz?
  // User asked for staged flow.
  
  const currentTenseProgress = ((currentExerciseIndex + 1) / currentTenseExercises.length) * 100;

  if (!currentExercise) {
      // Fallback if no exercises for this tense (shouldn't happen if API works)
      return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-5">
           <div className="text-center">
               <p className="mb-4">No exercises found for {currentTense} tense.</p>
               <Button onClick={handleNextExercise}>Skip to Next</Button>
           </div>
        </div>
      );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-6">
      {/* Header with Progress */}
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="text-feather-gray hover:text-feather-text-light transition-colors"
        >
          ✕
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-feather-gray/20">
          <div 
            className="h-full bg-feather-green transition-all duration-500 ease-out"
            style={{ width: `${currentTenseProgress}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-extrabold text-feather-text text-center capitalize">
          {currentTense} Quiz
        </h1>
        <p className="mb-8 text-center text-feather-text-light font-bold text-sm">
          Fill in the missing word
        </p>

        {/* Question Bubble */}
        <div className="mb-8 flex gap-4">
            <div className="text-4xl self-end">🦉</div>
            <div className="relative rounded-2xl border-2 border-feather-gray p-4 flex-1">
                <div 
                    className="absolute -left-2 bottom-6 h-4 w-4 rotate-45 border-b-2 border-l-2 border-feather-gray bg-white"
                ></div>
                <div className="text-xl font-bold text-feather-text text-right" dir="rtl">
                    {currentExercise.sentence.split("_____").map((part, i, arr) => (
                        <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                                <span className="mx-1 inline-block w-16 border-b-2 border-feather-text border-dashed"></span>
                            )}
                        </span>
                    ))}
                </div>
                <div className="mt-2 text-sm font-medium text-feather-text-light">
                    {currentExercise.translation}
                </div>
            </div>
        </div>

        {/* Interaction Area */}
        <div className="mb-8">
            {currentExercise.type === "multiple_choice" && currentExercise.options ? (
                <div className="grid grid-cols-1 gap-3">
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
                            className="h-16 text-lg"
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
                    placeholder="Type the answer..."
                    className="text-center text-2xl h-16"
                    disabled={showFeedback}
                />
            )}
        </div>
      </div>

      {/* Footer / Feedback */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 border-t-2 z-[100] ${
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
                        {isCorrect ? "Nicely done!" : "Correct answer:"}
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
                variant={showFeedback ? (isCorrect ? "primary" : "danger") : "primary"} // "Check" is usually green (primary)
                size="lg"
                className="min-w-[150px]"
                disabled={!userInput}
                onClick={showFeedback ? handleNextExercise : handleCheck}
            >
                {showFeedback ? "CONTINUE" : "CHECK"}
            </Button>
        </div>
      </div>
    </div>
  );
}
