import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "HeBrew - Hebrew Learning App",
  },
});

interface TranslationResponse {
  translation: string;
  isVerb: boolean;
  verbForm?: string; // The verb in its base/infinitive form for conjugation
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, direction } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid text. Please provide text to translate." },
        { status: 400 }
      );
    }

    if (direction !== "he-to-en" && direction !== "en-to-he") {
      return NextResponse.json(
        { error: "Invalid direction. Must be 'he-to-en' or 'en-to-he'." },
        { status: 400 }
      );
    }

    const isHebrewToEnglish = direction === "he-to-en";
    
    const prompt = isHebrewToEnglish
      ? `Translate the following Hebrew text to English: "${text.trim()}"

Return a JSON object with this structure:
{
  "translation": "English translation",
  "isVerb": true/false,
  "verbForm": "Hebrew verb in infinitive/base form (only if isVerb is true, otherwise omit this field)"
}

Important:
- If the Hebrew word is a verb, set "isVerb" to true and provide the verb in its infinitive/base form in "verbForm"
- If it's not a verb, set "isVerb" to false and omit "verbForm"
- Return ONLY valid JSON, no additional text or markdown`
      : `Translate the following English text to Hebrew: "${text.trim()}"

Return a JSON object with this structure:
{
  "translation": "Hebrew translation",
  "isVerb": true/false,
  "verbForm": "Hebrew verb in infinitive/base form (only if isVerb is true, otherwise omit this field)"
}

Important:
- If the English word is a verb and the Hebrew translation is also a verb, set "isVerb" to true and provide the Hebrew verb in its infinitive/base form in "verbForm"
- If it's not a verb, set "isVerb" to false and omit "verbForm"
- Return ONLY valid JSON, no additional text or markdown`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a Hebrew-English translation expert. Always respond with valid JSON only, no markdown, no code blocks, just pure JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500,
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

    let parsedResponse: TranslationResponse;
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

    if (!parsedResponse.translation) {
      return NextResponse.json(
        { error: "Invalid response structure from AI model" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      translation: parsedResponse.translation,
      isVerb: parsedResponse.isVerb || false,
      verbForm: parsedResponse.verbForm || null,
    });
  } catch (error: any) {
    console.error("Error calling OpenRouter:", error);

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
        error: "Failed to translate. Please try again.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
