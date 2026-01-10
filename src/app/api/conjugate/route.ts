import { NextRequest, NextResponse } from "next/server";
import { Conjugation } from "@/lib/types";
import { getOpenAIClient } from "@/lib/openai";


interface ConjugationResponse {
  infinitive: string; // Hebrew infinitive form
  spanishTranslation: string; // Spanish infinitive translation
  conjugations: Conjugation[];
}

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

    const prompt = `You are an expert in Hebrew grammar and conjugation. Conjugate the Hebrew verb "${verb.trim()}" in past (עבר), present (הווה), and future (עתיד) tenses for all 10 pronouns. Also return the verb in its infinitive (dictionary) form.

Return ONLY valid JSON with this exact structure:
{
  "infinitive": "Hebrew infinitive form",
  "spanishTranslation": "Spanish translation of the infinitive",
  "conjugations": [
    {
      "pronounCode": "ani",
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
      "pronounCode": "ata_m",
      "pronoun": "אתה (You m.)",
      ...
    },
    {
      "pronounCode": "at_f",
      "pronoun": "את (You f.)",
      ...
    },
    {
      "pronounCode": "hu_m",
      "pronoun": "הוא (He)",
      ...
    },
    {
      "pronounCode": "hi_f",
      "pronoun": "היא (She)",
      ...
    },
    {
      "pronounCode": "anachnu",
      "pronoun": "אנחנו (We)",
      ...
    },
    {
      "pronounCode": "atem_m",
      "pronoun": "אתם (You m. pl.)",
      ...
    },
    {
      "pronounCode": "aten_f",
      "pronoun": "אתן (You f. pl.)",
      ...
    },
    {
      "pronounCode": "hem_m",
      "pronoun": "הם (They m.)",
      ...
    },
    {
      "pronounCode": "hen_f",
      "pronoun": "הן (They f.)",
      ...
    }
  ]
}

Important:
- Provide accurate Hebrew conjugations
- Include transliterations using standard Romanization
- Create natural example sentences in Hebrew for each form
- Always include pronounCode values exactly from the provided list
- Return ONLY valid JSON, no additional text or markdown
- Ensure all 10 pronouns are included`;

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

    // Parse the JSON response
    let parsedResponse: ConjugationResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Response content:", content);
      return NextResponse.json(
        { error: "Invalid response format from AI model" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (
      !parsedResponse.infinitive ||
      !parsedResponse.spanishTranslation ||
      !parsedResponse.conjugations ||
      !Array.isArray(parsedResponse.conjugations) ||
      parsedResponse.conjugations.length !== 10
    ) {
      return NextResponse.json(
        { error: "Invalid response structure from AI model" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      infinitive: parsedResponse.infinitive,
      spanishTranslation: parsedResponse.spanishTranslation,
      conjugations: parsedResponse.conjugations,
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
        error: "Failed to conjugate verb. Please try again.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
