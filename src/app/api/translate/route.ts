import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Conjugation } from "@/lib/types";

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
  spanishTranslation?: string; // Spanish translation (for verbs)
  conjugations?: Conjugation[]; // Conjugations (for verbs)
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

    if (direction !== "he-to-es" && direction !== "es-to-he") {
      return NextResponse.json(
        { error: "Invalid direction. Must be 'he-to-es' or 'es-to-he'." },
        { status: 400 }
      );
    }

    const isHebrewToSpanish = direction === "he-to-es";
    
    const prompt = isHebrewToSpanish
      ? `Translate the following Hebrew text to Spanish: "${text.trim()}"

If the Hebrew word is a verb, you must:
1. Translate it to Spanish (infinitive form)
2. Provide the Hebrew verb in its infinitive/base form
3. Conjugate the Hebrew verb in past (עבר), present (הווה), and future (עתיד) tenses for all 10 pronouns
4. Include Spanish translation of the verb in infinitive form

Return a JSON object with this structure:
{
  "translation": "Spanish translation",
  "isVerb": true/false,
  "verbForm": "Hebrew verb in infinitive/base form (only if isVerb is true, otherwise omit this field)",
  "spanishTranslation": "Spanish translation of the verb in infinitive form (only if isVerb is true, otherwise omit this field)",
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
    {
      "pronoun": "אתה (You m.)",
      ...
    },
    {
      "pronoun": "את (You f.)",
      ...
    },
    {
      "pronoun": "הוא (He)",
      ...
    },
    {
      "pronoun": "היא (She)",
      ...
    },
    {
      "pronoun": "אנחנו (We)",
      ...
    },
    {
      "pronoun": "אתם (You m. pl.)",
      ...
    },
    {
      "pronoun": "אתן (You f. pl.)",
      ...
    },
    {
      "pronoun": "הם (They m.)",
      ...
    },
    {
      "pronoun": "הן (They f.)",
      ...
    }
  ]
}

Important:
- If the Hebrew word is a verb, set "isVerb" to true and provide ALL fields including conjugations for all 10 pronouns
- If it's not a verb, set "isVerb" to false and omit "verbForm", "spanishTranslation", and "conjugations"
- Provide accurate Hebrew conjugations with transliterations and example sentences
- Return ONLY valid JSON, no additional text or markdown`
      : `Translate the following Spanish text to Hebrew: "${text.trim()}"

If the Spanish word is a verb and the Hebrew translation is also a verb, you must:
1. Translate it to Hebrew
2. Provide the Hebrew verb in its infinitive/base form
3. Conjugate the Hebrew verb in past (עבר), present (הווה), and future (עתיד) tenses for all 10 pronouns
4. Include Spanish translation of the verb in infinitive form

Return a JSON object with this structure:
{
  "translation": "Hebrew translation",
  "isVerb": true/false,
  "verbForm": "Hebrew verb in infinitive/base form (only if isVerb is true, otherwise omit this field)",
  "spanishTranslation": "Spanish translation of the verb in infinitive form (only if isVerb is true, otherwise omit this field)",
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
  ]
}

Important:
- If the Spanish word is a verb and the Hebrew translation is also a verb, set "isVerb" to true and provide ALL fields including conjugations for all 10 pronouns
- If it's not a verb, set "isVerb" to false and omit "verbForm", "spanishTranslation", and "conjugations"
- Provide accurate Hebrew conjugations with transliterations and example sentences
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

    // Validate conjugations if verb
    if (parsedResponse.isVerb) {
      if (
        !parsedResponse.verbForm ||
        !parsedResponse.spanishTranslation ||
        !parsedResponse.conjugations ||
        !Array.isArray(parsedResponse.conjugations) ||
        parsedResponse.conjugations.length !== 10
      ) {
        return NextResponse.json(
          { error: "Invalid response structure: verb conjugations are incomplete" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      translation: parsedResponse.translation,
      isVerb: parsedResponse.isVerb || false,
      verbForm: parsedResponse.verbForm || null,
      spanishTranslation: parsedResponse.spanishTranslation || null,
      conjugations: parsedResponse.conjugations || null,
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
