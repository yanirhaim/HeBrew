import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { PracticeExercise, Conjugation } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY environment variable is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { verb } = body;

    if (!verb || typeof verb !== "string" || verb.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid verb. Please provide a Hebrew verb." },
        { status: 400 }
      );
    }

    const prompt = `Generate practice content for the Hebrew verb "${verb.trim()}".

    1. Conjugate the Hebrew verb in past (עבר), present (הווה), and future (עתיד) tenses for all 10 pronouns.
    2. Generate 12-15 practice exercises (4-5 for each tense: past, present, future).
    
    Mix two types of exercises:
    1. "multiple_choice": Provide a sentence with a blank, 4 options (1 correct, 3 distractors), and the correct answer.
    2. "input": Provide a sentence with a blank and the correct answer. User must type the answer.

    Return the response as a JSON object with this structure:
    {
      "conjugations": [
        {
          "pronoun": "אני (I)",
          "past": "Hebrew past tense",
          "pastTransliteration": "Romanized transliteration",
          "pastExample": "Example sentence in Hebrew",
          "present": "Hebrew present tense",
          "presentTransliteration": "Romanized transliteration",
          "presentExample": "Example sentence in Hebrew",
          "future": "Hebrew future tense",
          "futureTransliteration": "Romanized transliteration",
          "futureExample": "Example sentence in Hebrew"
        },
        ... (all 10 pronouns)
      ],
      "exercises": [
        {
          "id": "unique_id_1",
          "type": "multiple_choice",
          "tense": "present", 
          "sentence": "Sentence with _____ blank",
          "correctAnswer": "word that fits",
          "options": ["word that fits", "distractor 1", "distractor 2", "distractor 3"],
          "translation": "Spanish translation of the full sentence",
          "hint": "Optional hint (e.g. tense, pronoun)"
        },
        {
          "id": "unique_id_2",
          "type": "input",
          "tense": "past",
          "sentence": "Sentence with _____ blank",
          "correctAnswer": "word that fits",
          "translation": "Spanish translation of the full sentence",
          "hint": "Optional hint"
        }
      ]
    }

    Important:
    - Ensure exercises are evenly distributed across tenses (past, present, future).
    - Tag each exercise with its "tense" ("past", "present", or "future").
    - Sentences should be natural and correct.
    - Distractors for multiple choice should be plausible.
    - Return ONLY valid JSON.
    `;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a Hebrew language expert. Always respond with valid JSON only, no markdown, no code blocks, just pure JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 4000,
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
    const firstBrace = cleanedContent.indexOf("{");
    const lastBrace = cleanedContent.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
    }

    let parsedResponse: { exercises: PracticeExercise[]; conjugations: Conjugation[] };
    try {
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Response content:", content);
      return NextResponse.json(
        { error: "Invalid response format from AI model" },
        { status: 500 }
      );
    }

    if (!parsedResponse.exercises || !Array.isArray(parsedResponse.exercises)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing exercises" },
        { status: 500 }
      );
    }

    if (!parsedResponse.conjugations || !Array.isArray(parsedResponse.conjugations)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing conjugations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exercises: parsedResponse.exercises,
      conjugations: parsedResponse.conjugations,
    });
  } catch (error: any) {
    console.error("Error generating practice exercises:", error);
    
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your OpenRouter API key." },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate exercises. Please try again.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
