import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { Word } from "@/lib/types";

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
3. **Word Practice**: For EACH word provided, generate:
   - A useful short sentence using the word in Hebrew.
   - The Spanish translation of that sentence.
   - A "mini-dialogue line" (a question or statement someone might say to you that requires using this word to answer, or a response to this word).
4. **Dialogue**: Create a short 4-line dialogue (2 exchanges) that fits the scenario and uses at least 2-3 of the target words.

Return ONLY valid JSON with this structure:
{
  "scenarioTitle": "Title in Spanish",
  "scenarioContext": "Context description in Spanish",
  "wordPractice": [
    {
      "wordId": "id_if_available_or_hebrew_word", 
      "hebrewWord": "the word",
      "sentence": "Hebrew sentence",
      "sentenceTranslation": "Spanish translation",
      "dialoguePrompt": "Hebrew prompt (e.g. question) that elicits the word/sentence",
      "dialoguePromptTranslation": "Spanish translation of the prompt"
    }
  ],
  "dialogueScript": [
    {
      "speaker": "A",
      "hebrew": "Line in Hebrew",
      "translation": "Line in Spanish"
    },
    {
      "speaker": "B",
      "hebrew": "Line in Hebrew",
      "translation": "Line in Spanish"
    }
    // ... total 4 lines
  ]
}

Important:
- Hebrew should be natural, conversational (Israeli style).
- Spanish translations should be natural.
- Ensure ALL input words are included in the "wordPractice" array.
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
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Invalid response format from AI model" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse);
  } catch (error: any) {
    console.error("Error generating daily practice:", error);
    return NextResponse.json(
      { error: "Failed to generate daily practice" },
      { status: 500 }
    );
  }
}
