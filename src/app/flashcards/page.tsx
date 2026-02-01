"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { convexWordToWord } from "@/lib/convex-helpers";
import { Word, Conjugation } from "@/lib/types";
import Link from "next/link";

// --- Types ---
type ChallengeType = "translation" | "conjugation";

interface GameCard {
    id: string; // unique ID for key
    type: ChallengeType;
    prompt: string; // The main big text to display (e.g. Spanish word)
    subPrompt?: string; // e.g. "Yo / Pasado" or "Translation"
    answer: string; // The correct Hebrew answer
    hint: string; // First letter or root
    originalWord: Word;
}

// --- Icons ---
const LightbulbIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
    </svg>
);

const FlameIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-orange-500"
    >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.246-5.318-2-7.25.155-1.22 1.154-2.142 1.583-2.527C12.446 2.025 14.49 4.393 15 9c1.67-.17 3.902 1.47 3.344 4.372C17.747 16.357 15.655 18 12 18c-3.125 0-4.666-1.503-3.5-3.5Z" />
        <path d="M10 22h4" />
    </svg>
);

// --- Helper Functions ---
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export default function FlashcardsPage() {
    // --- State ---
    const [words, setWords] = useState<Word[]>([]);
    const [gameCards, setGameCards] = useState<GameCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gameState, setGameState] = useState<"loading" | "start" | "playing" | "finished">("loading");

    const [input, setInput] = useState("");
    const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [hintRevealed, setHintRevealed] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // --- Initialize ---
    const convexWords = useQuery(api.words.list);
    
    useEffect(() => {
        if (convexWords !== undefined) {
            const fetchedWords = convexWords.map(convexWordToWord);
            const validWords = fetchedWords.filter(w => w.hebrew && w.translation);
            setWords(validWords);
            setGameState("start");
        }
    }, [convexWords]);

    // --- Game Logic ---
    const generateCards = (sourceWords: Word[]): GameCard[] => {
        const cards: GameCard[] = [];

        sourceWords.forEach(word => {
            // 1. Basic Translation Card
            cards.push({
                id: `${word.id}-trans`,
                type: "translation",
                prompt: word.translation,
                subPrompt: "Vocabulario",
                answer: word.hebrew,
                hint: word.hebrew[0], // First letter
                originalWord: word,
            });

            // 2. Conjugation Cards (if available)
            if (word.conjugations && word.conjugations.length > 0) {
                word.conjugations.forEach((conj, idx) => {
                    // Simplified: Add Past, Present, Future specific cards
                    // Use pronounLabel if available (from types? no, simpler)
                    // We'll construct a prompt like "Yo (Pasado)"

                    // Assuming 'pronoun' string is like "ani" or "StartWithUppercase"
                    // Let's format it simply.

                    if (conj.past) {
                        cards.push({
                            id: `${word.id}-past-${idx}`,
                            type: "conjugation",
                            prompt: `${word.translation}`,
                            subPrompt: `${conj.pronoun} (Pasado)`,
                            answer: conj.past,
                            hint: conj.past[0],
                            originalWord: word,
                        });
                    }
                    if (conj.present) {
                        cards.push({
                            id: `${word.id}-pres-${idx}`,
                            type: "conjugation",
                            prompt: `${word.translation}`,
                            subPrompt: `${conj.pronoun} (Presente)`,
                            answer: conj.present,
                            hint: conj.present[0],
                            originalWord: word,
                        });
                    }
                    if (conj.future) {
                        cards.push({
                            id: `${word.id}-fut-${idx}`,
                            type: "conjugation",
                            prompt: `${word.translation}`,
                            subPrompt: `${conj.pronoun} (Futuro)`,
                            answer: conj.future,
                            hint: conj.future[0],
                            originalWord: word,
                        });
                    }
                });
            }
        });

        return shuffleArray(cards).slice(0, 10); // Standard 10 card session
    };

    const startGame = () => {
        const cards = generateCards(words);
        if (cards.length === 0) {
            // Handle empty state better?
            alert("Agrega palabras primero!");
            return;
        }
        setGameCards(cards);
        setCurrentIndex(0);
        setScore(0);
        setStreak(0);
        setGameState("playing");
        setFeedback(null);
        setInput("");
        setHintRevealed(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const checkAnswer = () => {
        if (!gameCards[currentIndex]) return;

        const correct = gameCards[currentIndex].answer.trim();
        const user = input.trim();

        // Normalize: remove case differences. 
        // Ideally we should remove niqqud for looser matching, but straightforward for now.
        if (user.toLowerCase() === correct.toLowerCase()) {
            setFeedback("correct");
            // Bonus for streak? 
            // Base score 10, Streak adds multiplier? Let's verify score simple first.
            setScore(s => s + 10 + (streak * 2));
            setStreak(s => s + 1);
        } else {
            setFeedback("incorrect");
            setStreak(0);
        }
    };

    const nextCard = () => {
        if (currentIndex < gameCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setFeedback(null);
            setInput("");
            setHintRevealed(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setGameState("finished");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if (feedback) {
                nextCard();
            } else {
                checkAnswer();
            }
        }
    };

    const revealHint = () => {
        setHintRevealed(true);
        // Optional: Penalty for hint?
    }

    // --- Render ---
    if (gameState === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    const currentCard = gameCards[currentIndex];
    const progress = ((currentIndex) / gameCards.length) * 100;

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 pb-24 pt-4">
            <div className="mx-auto w-full max-w-md px-4">

                {/* --- Top Bar (In Game) --- */}
                {gameState === "playing" && (
                    <div className="mb-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
                                <span className="font-bold text-slate-400 text-sm">Score</span>
                                <span className="font-black text-blue-500">{score}</span>
                            </div>
                            {streak > 1 && (
                                <div className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 shadow-sm border border-orange-200 animate-pulse">
                                    <FlameIcon />
                                    <span className="font-black text-orange-600">Streak x{streak}</span>
                                </div>
                            )}
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full bg-blue-400 transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* --- Start Screen --- */}
                {gameState === "start" && (
                    <div className="flex flex-col items-center justify-center space-y-8 py-20">
                        <div className="text-center">
                            <h1 className="text-4xl font-black text-slate-800">Flashcards 2.0</h1>
                            <p className="mt-2 text-lg text-slate-600">Domina conjugaciones y vocabulario</p>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-blue-200 opacity-20 duration-1000"></div>
                            <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-xl rotate-3 transform transition-transform hover:rotate-6 text-white">
                                <span className="text-7xl">🧠</span>
                            </div>
                        </div>

                        <button
                            onClick={startGame}
                            className="w-full rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2563eb] active:translate-y-1 active:shadow-none transition-all hover:bg-blue-400"
                        >
                            Comenzar Desafío
                        </button>

                        <p className="text-sm text-slate-400 text-center max-w-[200px]">
                            Incluye verbos en pasado, presente y futuro.
                        </p>
                    </div>
                )}

                {/* --- Gameplay --- */}
                {gameState === "playing" && currentCard && (
                    <div className="flex flex-col space-y-6">

                        {/* Card */}
                        <div className="relative flex min-h-[220px] flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-lg text-center border-b-4 border-slate-200">

                            {/* Badge */}
                            <div className={`absolute top-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider
                ${currentCard.type === "conjugation" ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"}
              `}>
                                {currentCard.subPrompt}
                            </div>

                            <h2 className="mt-6 text-4xl font-black text-slate-800 break-words w-full">
                                {currentCard.prompt}
                            </h2>
                        </div>

                        {/* Input Area */}
                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Escribe en hebreo..."
                                    dir="rtl"
                                    disabled={!!feedback}
                                    className={`w-full rounded-2xl border-2 px-12 py-4 text-center text-2xl font-bold outline-none transition-all shadow-sm
                      ${feedback === "correct" ? "border-green-500 bg-green-50 text-green-700 placeholder-green-300" :
                                            feedback === "incorrect" ? "border-red-500 bg-red-50 text-red-700 placeholder-red-300" :
                                                "border-slate-300 focus:border-blue-400 focus:bg-white text-slate-700"}`}
                                    autoComplete="off"
                                />

                                {/* Hint Button */}
                                {!feedback && !hintRevealed && (
                                    <button
                                        onClick={revealHint}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-500 transition-colors"
                                        title="Obtener pista"
                                    >
                                        <LightbulbIcon />
                                    </button>
                                )}
                                {hintRevealed && !feedback && (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">
                                        {currentCard.hint}...
                                    </span>
                                )}
                            </div>

                            {!feedback ? (
                                <button
                                    onClick={checkAnswer}
                                    className="w-full rounded-2xl bg-green-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#16a34a] active:translate-y-1 active:shadow-none transition-all hover:bg-green-400"
                                >
                                    Comprobar
                                </button>
                            ) : (
                                <div className={`rounded-2xl p-4 ${feedback === "correct" ? "bg-green-100 border border-green-200" : "bg-red-100 border border-red-200"} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${feedback === "correct" ? "bg-green-500" : "bg-red-500"} text-white font-bold text-2xl shadow-sm`}>
                                            {feedback === "correct" ? "✓" : "✕"}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`font-black text-xl ${feedback === "correct" ? "text-green-700" : "text-red-700"}`}>
                                                {feedback === "correct" ? "¡Excelente!" : "Incorrecto"}
                                            </span>
                                            {feedback === "incorrect" && (
                                                <div className="flex flex-col text-sm mt-1">
                                                    <span className="text-red-500 font-semibold opacity-80">Respuesta correcta:</span>
                                                    <span className="text-red-700 font-bold text-lg">{currentCard.answer}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={nextCard}
                                        className={`w-full rounded-xl px-6 py-3 text-lg font-bold text-white shadow-sm active:translate-y-0.5 active:shadow-none transition-all
                        ${feedback === "correct" ? "bg-green-500 hover:bg-green-600 shadow-[0_4px_0_#15803d]" : "bg-red-500 hover:bg-red-600 shadow-[0_4px_0_#b91c1c]"}
                    `}
                                    >
                                        Continuar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- End Screen --- */}
                {gameState === "finished" && (
                    <div className="flex flex-col items-center justify-center space-y-8 py-10">
                        <div className="text-center">
                            <h2 className="text-4xl font-black text-slate-800">¡Sesión Completada!</h2>
                            <p className="mt-2 text-xl text-slate-600">Mira cuánto has aprendido</p>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-xl w-full border-b-4 border-slate-200">
                            <div className="mb-2 text-6xl animate-bounce">
                                {score > 50 ? "🏆" : "🎯"}
                            </div>
                            <div className="text-sm font-bold uppercase tracking-wider text-slate-400">Puntuación Total</div>
                            <div className="mt-2 text-6xl font-black text-blue-500">{score}</div>

                            <div className="mt-6 flex gap-8 w-full justify-center border-t pt-6 border-slate-100">
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl font-black text-slate-700">{gameCards.length}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Cartas</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl font-black text-orange-500">{streak}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Max Streak</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full space-y-3">
                            <button
                                onClick={startGame}
                                className="w-full rounded-2xl bg-blue-500 px-8 py-4 text-xl font-bold text-white shadow-[0_4px_0_#2563eb] active:translate-y-1 active:shadow-none transition-all hover:bg-blue-400"
                            >
                                Jugar de Nuevo
                            </button>

                            <Link href="/practice" className="block w-full text-center py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest text-sm">
                                Volver al inicio
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
