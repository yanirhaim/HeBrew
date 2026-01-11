import { NextRequest, NextResponse } from "next/server";
import { VocabularyWord } from "@/lib/types";
import { getOpenAIClient } from "@/lib/openai";
import { getAllWords } from "@/lib/firestore";

interface ReadingResponse {
  text: string;
  translation?: string;
  vocabularyWords: VocabularyWord[];
  usedWords?: Array<{
    hebrew: string;
    translation: string;
    id: string;
  }>;
}

const LENGTH_GUIDELINES = {
  short: "50-100 words",
  medium: "100-200 words",
  long: "200-300 words"
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY environment variable is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { length } = body;

    if (!length || typeof length !== "string" || !["short", "medium", "long"].includes(length)) {
      return NextResponse.json(
        { error: "Invalid length. Must be 'short', 'medium', or 'long'." },
        { status: 400 }
      );
    }

    // Fetch all words from database
    let words: Array<{ hebrew: string; translation: string; id: string }> = [];
    try {
      const allWords = await getAllWords();
      words = allWords.map(w => ({
        hebrew: w.hebrew,
        translation: w.translation,
        id: w.id
      }));
    } catch (error) {
      console.error("Error fetching words:", error);
      // Continue even if fetching words fails - we can still generate reading with new words
    }

    const wordListText = words.length > 0
      ? `Here are some Hebrew words from the user's vocabulary (prefer using these when possible):
${words.map(w => `- ${w.hebrew} (${w.translation})`).join("\n")}`
      : "The user has no words in their vocabulary yet.";

    const wordCount = LENGTH_GUIDELINES[length as keyof typeof LENGTH_GUIDELINES];

    const prompt = `Create a natural Hebrew reading text for language practice.

${wordListText}

Instructions:
1. Create a natural, engaging Hebrew text (story, article, dialogue, or narrative)
2. The text should be approximately ${wordCount} long
3. Prefer using words from the vocabulary list above when possible, but feel free to add NEW words to make the text natural and educational
4. The text should be appropriate for language learning (clear, well-structured, contextually rich)

After creating the text, extract ALL vocabulary words from it (verbs, nouns, adjectives, adverbs, and other important words).

For each vocabulary word, identify:
- For verbs: Extract the infinitive/base form of the Hebrew verb (e.g., לכתב, לאכול)
- For all words: Provide Hebrew text, Spanish translation, phonetic transliteration using Spanish pronunciation rules, and word type

Return a JSON object with this exact structure:
{
  "text": "The Hebrew reading text",
  "translation": "Full Spanish translation of the entire text",
  "vocabularyWords": [
    {
      "hebrew": "לכתב",
      "translation": "escribir",
      "phonetic": "lijtov",
      "wordType": "verb",
      "infinitive": "לכתב"
    },
    {
      "hebrew": "יפה",
      "translation": "hermoso",
      "phonetic": "iafe",
      "wordType": "adjective"
    },
    {
      "hebrew": "בית",
      "translation": "casa",
      "phonetic": "bait",
      "wordType": "noun"
    }
  ]
}

Important:
- Extract ALL important vocabulary words (verbs in infinitive form, nouns, adjectives, adverbs, etc.)
- For verbs, the "hebrew" field should be the infinitive form (with למ prefix when appropriate)
- For verbs, the "infinitive" field should be the same as "hebrew"
- Use Spanish pronunciation phonetics (e.g., 'j' as in Spanish 'juego', 'ch' as in Spanish 'chico', vowels pronounced as in Spanish, 'r' and 'rr' follow Spanish pronunciation rules)
- Word types must be one of: "verb", "noun", "adjective", "adverb", "other"
- Include only words that are useful for vocabulary learning (skip common words like articles, prepositions unless they're important)
- Return ONLY valid JSON, no additional text or markdown`;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a Hebrew language expert and educational content creator. Always respond with valid JSON only, no markdown, no code blocks, just pure JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
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

    let parsedResponse: {
      text: string;
      translation?: string;
      vocabularyWords: VocabularyWord[];
    };
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

    if (!parsedResponse.text) {
      return NextResponse.json(
        { error: "Invalid response structure: missing 'text' field" },
        { status: 500 }
      );
    }

    // Validate vocabularyWords array
    if (!parsedResponse.vocabularyWords || !Array.isArray(parsedResponse.vocabularyWords)) {
      return NextResponse.json(
        { error: "Invalid response structure: vocabularyWords must be an array" },
        { status: 500 }
      );
    }

    // Validate each vocabulary word has required fields
    for (const word of parsedResponse.vocabularyWords) {
      if (!word.hebrew || !word.translation || !word.wordType) {
        return NextResponse.json(
          { error: "Invalid response structure: vocabulary word missing required fields (hebrew, translation, wordType)" },
          { status: 500 }
        );
      }
      
      if (!["verb", "noun", "adjective", "adverb", "other"].includes(word.wordType)) {
        return NextResponse.json(
          { error: `Invalid response structure: invalid wordType "${word.wordType}"` },
          { status: 500 }
        );
      }
    }

    // Identify which words from vocabularyWords were already in the database
    const usedWords = words.filter(w => 
      parsedResponse.vocabularyWords.some(vw => vw.hebrew === w.hebrew)
    );

    return NextResponse.json({
      text: parsedResponse.text,
      translation: parsedResponse.translation || undefined,
      vocabularyWords: parsedResponse.vocabularyWords || [],
      usedWords: usedWords.length > 0 ? usedWords : undefined,
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
        error: "Failed to generate reading. Please try again.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
