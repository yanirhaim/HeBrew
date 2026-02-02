import { NextRequest, NextResponse } from "next/server";
import { VocabularyWord } from "@/lib/types";
import { getOpenAIClient } from "@/lib/openai";
import { convexClient } from "@/lib/convex-server";
import { api } from "convex/_generated/api";
import { buildVocabFromText, DbWord } from "@/lib/news-vocab";

interface NewsSummaryResponse {
  headline: string;
  headlineTranslation?: string;
  summary: string;
  translation?: string;
  vocabularyWords: VocabularyWord[];
  usedWords?: Array<{
    hebrew: string;
    translation: string;
    id: string;
  }>;
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
    const { title, description, link, pubDate } = body || {};

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Invalid title" },
        { status: 400 }
      );
    }

    // Fetch all words from database
    let words: DbWord[] = [];
    try {
      const allWords = await convexClient.query(api.words.list);
      words = allWords.map((w) => ({
        hebrew: w.hebrew,
        translation: w.translation,
        id: w._id,
        conjugations: w.conjugations,
      }));
    } catch (error) {
      console.error("Error fetching words:", error);
    }

    const wordListText =
      words.length > 0
        ? `Here are some Hebrew words from the user's vocabulary (prefer using these when possible):
${words.map((w) => `- ${w.hebrew} (${w.translation})`).join("\n")}`
        : "The user has no words in their vocabulary yet.";

    const prompt = `You will summarize a news item based ONLY on the RSS item below. Do not add facts that are not in the item.

RSS item:
Title: ${title}
Description: ${description || "N/A"}
Date: ${pubDate || "N/A"}
Link: ${link || "N/A"}

${wordListText}

Instructions:
1. Write a VERY short Hebrew headline (3-8 words).
2. Write a VERY short Hebrew summary (1-3 short sentences, 40-70 words max).
3. Use simple words and short sentences for beginners.
4. Prefer words from the vocabulary list when possible.
5. Provide a Spanish translation of the Hebrew headline.
6. Provide a full Spanish translation of the summary.

Return a JSON object with this exact structure:
{
  "headline": "Hebrew headline",
  "headlineTranslation": "Spanish translation of the headline",
  "summary": "Hebrew summary",
  "translation": "Spanish translation of the summary"
}

Important:
- Return ONLY valid JSON, no additional text or markdown`;

    const openai = getOpenAIClient();
    const systemContent =
      "You are a Hebrew language expert and educational content creator. Always respond with valid JSON only, no markdown, no code blocks, just pure JSON.";

    const requestPayload = (useSystem: boolean) => ({
      model: "perplexity/sonar",
      messages: useSystem
        ? [
            { role: "system" as const, content: systemContent },
            { role: "user" as const, content: prompt },
          ]
        : [{ role: "user" as const, content: `${systemContent}\n\n${prompt}` }],
      temperature: 0.4,
      max_tokens: 2000,
    });

    let completion;
    try {
      completion = await openai.chat.completions.create(requestPayload(true));
    } catch (err: any) {
      if (err?.status === 400) {
        completion = await openai.chat.completions.create(requestPayload(false));
      } else {
        throw err;
      }
    }

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 500 }
      );
    }

    let cleanedContent = content.trim();
    const firstBrace = cleanedContent.indexOf("{");
    const lastBrace = cleanedContent.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
    }

    let parsedResponse: NewsSummaryResponse;
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

    if (!parsedResponse.headline || !parsedResponse.summary) {
      return NextResponse.json(
        { error: "Invalid response structure: missing headline or summary" },
        { status: 500 }
      );
    }

    const vocabSourceText = `${parsedResponse.headline} ${parsedResponse.summary}`;
    const { knownVocab, unknownTokens, usedWords } = buildVocabFromText(
      vocabSourceText,
      words
    );

    let generatedVocab: VocabularyWord[] = [];
    if (unknownTokens.length > 0) {
      const limitedTokens = unknownTokens.slice(0, 30);
      const vocabPrompt = `You will receive a list of Hebrew tokens taken from a short news summary.
For each token, return a JSON array of vocabulary entries with:
- "hebrew": the original token as given
- "infinitive": the verb infinitive if the token is a verb, otherwise omit
- "translation": Spanish translation of the token (or its base meaning)
- "phonetic": Spanish pronunciation phonetics
- "wordType": one of "verb", "noun", "adjective", "adverb", "other"

Tokens (do not add new tokens):
${limitedTokens.map((t) => `- ${t}`).join("\n")}

Return ONLY valid JSON with this exact structure:
{
  "vocabularyWords": [
    {
      "hebrew": "token",
      "translation": "traducción",
      "phonetic": "fonética",
      "wordType": "noun",
      "infinitive": "לכתוב"
    }
  ]
}`;

      let vocabCompletion;
      try {
        vocabCompletion = await openai.chat.completions.create({
          model: "perplexity/sonar",
          messages: [
            { role: "system" as const, content: systemContent },
            { role: "user" as const, content: vocabPrompt },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        });
      } catch (err: any) {
        if (err?.status === 400) {
          vocabCompletion = await openai.chat.completions.create({
            model: "perplexity/sonar",
            messages: [{ role: "user" as const, content: `${systemContent}\n\n${vocabPrompt}` }],
            temperature: 0.2,
            max_tokens: 1500,
          });
        } else {
          throw err;
        }
      }

      const vocabContent = vocabCompletion.choices[0]?.message?.content?.trim();
      if (vocabContent) {
        let cleanedVocab = vocabContent;
        const vocabStart = cleanedVocab.indexOf("{");
        const vocabEnd = cleanedVocab.lastIndexOf("}");
        if (vocabStart !== -1 && vocabEnd !== -1 && vocabEnd > vocabStart) {
          cleanedVocab = cleanedVocab.substring(vocabStart, vocabEnd + 1);
        }
        try {
          const parsedVocab = JSON.parse(cleanedVocab);
          if (Array.isArray(parsedVocab?.vocabularyWords)) {
            generatedVocab = parsedVocab.vocabularyWords.filter((word: VocabularyWord) => {
              return word?.hebrew && word?.translation && word?.wordType;
            });
          }
        } catch (vocabParseError) {
          console.error("Failed to parse vocab response:", vocabParseError);
        }
      }
    }

    const vocabMap = new Map<string, VocabularyWord>();
    for (const entry of [...knownVocab, ...generatedVocab]) {
      if (!vocabMap.has(entry.hebrew)) {
        vocabMap.set(entry.hebrew, entry);
      }
    }

    return NextResponse.json({
      headline: parsedResponse.headline,
      headlineTranslation: parsedResponse.headlineTranslation || undefined,
      summary: parsedResponse.summary,
      translation: parsedResponse.translation || undefined,
      vocabularyWords: Array.from(vocabMap.values()),
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
        error: "Failed to summarize news. Please try again.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
