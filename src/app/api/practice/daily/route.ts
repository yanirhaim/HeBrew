import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { Word, PracticeExercise } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY environment variable is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { words } = body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: "Invalid words list. Please provide an array of words." },
        { status: 400 }
      );
    }

    const wordListString = words.map((w: Word) => `${w.hebrew} (${w.translation})`).join(", ");

    const prompt = `Generate a daily practice session for Hebrew learning based on these words: ${wordListString}.

1. **Daily Scenario**: Create a short, realistic scenario (e.g., "At the base", "Ordering falafel", "Asking for directions") that could naturally include these words.
2. **Context**: A 1-sentence description of the situation in Spanish.
3. **Exercises**: Generate 10-15 practice exercises using the provided words. Mix two types of exercises:
   - "multiple_choice": Provide a sentence with a blank, 4 options (1 correct, 3 distractors), and the correct answer.
   - "input": Provide a sentence with a blank and the correct answer. User must type the answer.
   
   Each exercise should:
   - Use one or more of the provided words naturally in context
   - Include a sentence with "_____" as the blank
   - Have a Spanish translation of the full sentence
   - For multiple choice: provide 4 options where 1 is correct and 3 are plausible distractors
4. **Flashcards**: Create flashcards for ALL the provided words. Each flashcard should have:
   - The Hebrew word
   - The Spanish translation (correct answer)
   - 3 plausible distractor translations (similar words but incorrect)
   - 4 total options: 1 correct translation + 3 distractors
   - These will be used for vocabulary review with multiple choice

Return ONLY valid JSON with this structure:
{
  "scenarioTitle": "Title in Spanish",
  "scenarioContext": "Context description in Spanish",
  "exercises": [
    {
      "id": "unique_id_1",
      "type": "multiple_choice",
      "tense": "present",
      "sentence": "Sentence with _____ blank",
      "correctAnswer": "word that fits",
      "options": ["word that fits", "distractor 1", "distractor 2", "distractor 3"],
      "translation": "Spanish translation of the full sentence",
      "hint": "Optional hint"
    },
    {
      "id": "unique_id_2",
      "type": "input",
      "tense": "present",
      "sentence": "Sentence with _____ blank",
      "correctAnswer": "word that fits",
      "translation": "Spanish translation of the full sentence",
      "hint": "Optional hint"
    }
  ],
  "flashcards": [
    {
      "hebrew": "Hebrew word",
      "translation": "Spanish translation (correct answer)",
      "options": ["Spanish translation (correct)", "distractor 1", "distractor 2", "distractor 3"]
    }
    // ... one flashcard for each word provided
  ]
}

Important:
- Hebrew should be natural, conversational (Israeli style).
- Spanish translations should be natural.
- Ensure exercises use the provided words naturally.
- Mix multiple_choice and input types evenly.
- Distractors for multiple choice should be plausible.
- Include ALL provided words in the flashcards array.
- Return ONLY valid JSON.
`;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a Hebrew language expert. Always respond with valid JSON only, no markdown, no code blocks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5, // Slightly higher for creativity in scenario
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 500 }
      );
    }

    // Clean and parse the JSON response
    let cleanedContent = content.trim();
    // Remove markdown code blocks if present (even though we asked not to)
    if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.replace(/^```\n/, "").replace(/\n```$/, "");
    }
    
    let parsedResponse: {
      scenarioTitle: string;
      scenarioContext: string;
      exercises: PracticeExercise[];
      flashcards: {
        hebrew: string;
        translation: string;
        options: string[];
        wordId?: string;
      }[];
    };
    try {
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Invalid response format from AI model" },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!parsedResponse.exercises || !Array.isArray(parsedResponse.exercises)) {
      return NextResponse.json(
        { error: "Invalid response: exercises array is missing or invalid" },
        { status: 500 }
      );
    }

    // Validate each exercise has required fields
    for (const exercise of parsedResponse.exercises) {
      if (!exercise.id || !exercise.type || !exercise.sentence || !exercise.correctAnswer || !exercise.translation) {
        return NextResponse.json(
          { error: "Invalid response: exercises missing required fields" },
          { status: 500 }
        );
      }
      if (exercise.type === "multiple_choice" && (!exercise.options || exercise.options.length !== 4)) {
        return NextResponse.json(
          { error: "Invalid response: multiple_choice exercises must have exactly 4 options" },
          { status: 500 }
        );
      }
    }

    // Validate flashcards array
    if (!parsedResponse.flashcards || !Array.isArray(parsedResponse.flashcards)) {
      return NextResponse.json(
        { error: "Invalid response: flashcards array is missing or invalid" },
        { status: 500 }
      );
    }

    // Validate each flashcard has required fields
    for (const flashcard of parsedResponse.flashcards) {
      if (!flashcard.hebrew || !flashcard.translation || !flashcard.options || !Array.isArray(flashcard.options)) {
        return NextResponse.json(
          { error: "Invalid response: flashcards missing required fields" },
          { status: 500 }
        );
      }
      if (flashcard.options.length !== 4) {
        return NextResponse.json(
          { error: "Invalid response: flashcards must have exactly 4 options" },
          { status: 500 }
        );
      }
      // Ensure correct answer is in options
      if (!flashcard.options.includes(flashcard.translation)) {
        return NextResponse.json(
          { error: "Invalid response: flashcard correct answer must be in options array" },
          { status: 500 }
        );
      }
    }

    // Helper function to shuffle array
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Shuffle options for multiple choice exercises
    const exercisesWithShuffledOptions = parsedResponse.exercises.map(exercise => {
      if (exercise.type === "multiple_choice" && exercise.options) {
        const correctAnswer = exercise.correctAnswer;
        const shuffledOptions = shuffleArray(exercise.options);
        return {
          ...exercise,
          options: shuffledOptions,
          correctAnswer: correctAnswer // Keep original correct answer
        };
      }
      return exercise;
    });

    // Add wordId to flashcards and shuffle their options
    const flashcardsWithIds = parsedResponse.flashcards.map(flashcard => {
      const matchingWord = words.find(w => w.hebrew === flashcard.hebrew);
      const correctAnswer = flashcard.translation;
      const shuffledOptions = shuffleArray(flashcard.options);
      return {
        ...flashcard,
        wordId: matchingWord?.id,
        options: shuffledOptions,
        translation: correctAnswer // Keep original correct answer
      };
    });

    // Convert flashcards to exercises and mix with regular exercises
    const flashcardExercises: PracticeExercise[] = flashcardsWithIds.map((flashcard, idx) => ({
      id: `flashcard_${idx}`,
      type: "flashcard" as any, // We'll handle this as a special type
      tense: "present" as const,
      sentence: flashcard.hebrew, // Hebrew word as the "sentence"
      correctAnswer: flashcard.translation,
      options: flashcard.options,
      translation: flashcard.translation,
      wordId: flashcard.wordId
    }));

    // Mix exercises and flashcards randomly
    const allExercises = [...exercisesWithShuffledOptions, ...flashcardExercises];
    const mixedExercises = shuffleArray(allExercises);

    return NextResponse.json({
      scenarioTitle: parsedResponse.scenarioTitle,
      scenarioContext: parsedResponse.scenarioContext,
      exercises: mixedExercises
    });
  } catch (error: any) {
    console.error("Error generating daily practice:", error);
    return NextResponse.json(
      { error: "Failed to generate daily practice" },
      { status: 500 }
    );
  }
}
