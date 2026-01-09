import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { PracticeExercise } from "@/lib/types";

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

    const prompt = `Generate 5-10 practice exercises for the Hebrew verb "${verb.trim()}".
    
    Mix two types of exercises:
    1. "multiple_choice": Provide a sentence with a blank, 4 options (1 correct, 3 distractors), and the correct answer.
    2. "input": Provide a sentence with a blank and the correct answer. User must type the answer.

    Return the response as a JSON object with a key "exercises" containing an array of objects with this structure:
    {
      "exercises": [
        {
          "id": "unique_id_1",
          "type": "multiple_choice",
          "sentence": "Sentence with _____ blank",
          "correctAnswer": "word that fits",
          "options": ["word that fits", "distractor 1", "distractor 2", "distractor 3"],
          "translation": "Spanish translation of the full sentence",
          "hint": "Optional hint (e.g. tense, pronoun)"
        },
        {
          "id": "unique_id_2",
          "type": "input",
          "sentence": "Sentence with _____ blank",
          "correctAnswer": "word that fits",
          "translation": "Spanish translation of the full sentence",
          "hint": "Optional hint"
        }
      ]
    }

    Important:
    - Ensure exercises cover different tenses (past, present, future) and pronouns.
    - Sentences should be natural and correct.
    - Distractors for multiple choice should be plausible (e.g., same verb but wrong conjugation/pronoun).
    - Return ONLY valid JSON.
    `;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
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
      max_tokens: 3000,
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

    let parsedResponse: { exercises: PracticeExercise[] };
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
        { error: "Invalid response structure from AI model" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exercises: parsedResponse.exercises,
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
