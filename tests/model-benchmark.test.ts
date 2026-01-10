import dotenv from "dotenv";
import OpenAI from "openai";
import { Conjugation, PracticeExercise } from "../src/lib/types";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Models to test
const MODELS = [
  "google/gemini-2.5-flash",
  "x-ai/grok-4.1-fast",
];

// Test verbs
const TEST_VERBS = ["לכתוב", "לקרוא", "ללמוד", "לשחק", "לאכול"];

// Expected pronouns for conjugation validation
const EXPECTED_PRONOUNS = [
  "אני (I)",
  "אתה (You m.)",
  "את (You f.)",
  "הוא (He)",
  "היא (She)",
  "אנחנו (We)",
  "אתם (You m. pl.)",
  "אתן (You f. pl.)",
  "הם (They m.)",
  "הן (They f.)",
];

interface ConjugationResponse {
  spanishTranslation: string;
  conjugations: Conjugation[];
}

interface PracticeResponse {
  conjugations: Conjugation[];
  exercises: PracticeExercise[];
}

interface TestResult {
  model: string;
  verb: string;
  success: boolean;
  responseTime: number;
  errors: string[];
  validationDetails?: {
    hasSpanishTranslation?: boolean;
    conjugationCount?: number;
    exerciseCount?: number;
    missingFields?: string[];
    invalidExercises?: string[];
  };
}

interface ModelSummary {
  model: string;
  testType: "conjugation" | "practice";
  averageResponseTime: number;
  successRate: number;
  totalTests: number;
  successfulTests: number;
  results: TestResult[];
}

function getOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "HeBrew - Hebrew Learning App",
    },
  });
}

function getConjugationPrompt(verb: string): string {
  return `You are an expert in Hebrew grammar and conjugation. Conjugate the Hebrew verb "${verb.trim()}" in past (עבר), present (הווה), and future (עתיד) tenses for all 10 pronouns.

Return the response as a JSON object with this exact structure:
{
  "spanishTranslation": "Spanish translation of the verb (infinitive form)",
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
- Provide accurate Hebrew conjugations
- Include transliterations using standard Romanization
- Create natural example sentences in Hebrew for each form
- Return ONLY valid JSON, no additional text or markdown
- Ensure all 10 pronouns are included`;
}

function getPracticePrompt(verb: string): string {
  return `Generate practice content for the Hebrew verb "${verb.trim()}".

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
}

function validateConjugationResponse(
  response: any,
  verb: string
): { valid: boolean; errors: string[]; details: any } {
  const errors: string[] = [];
  const details: any = {};

  if (!response || typeof response !== "object") {
    return { valid: false, errors: ["Response is not an object"], details };
  }

  // Check spanishTranslation
  if (!response.spanishTranslation || typeof response.spanishTranslation !== "string" || response.spanishTranslation.trim().length === 0) {
    errors.push("Missing or invalid spanishTranslation");
    details.hasSpanishTranslation = false;
  } else {
    details.hasSpanishTranslation = true;
  }

  // Check conjugations array
  if (!response.conjugations || !Array.isArray(response.conjugations)) {
    errors.push("Missing or invalid conjugations array");
    details.conjugationCount = 0;
  } else {
    details.conjugationCount = response.conjugations.length;

    if (response.conjugations.length !== 10) {
      errors.push(`Expected 10 conjugations, got ${response.conjugations.length}`);
    }

    // Validate each conjugation
    const missingFields: string[] = [];
    response.conjugations.forEach((conj: any, index: number) => {
      if (!conj.pronoun) missingFields.push(`conjugation[${index}].pronoun`);
      if (!conj.past) missingFields.push(`conjugation[${index}].past`);
      if (!conj.present) missingFields.push(`conjugation[${index}].present`);
      if (!conj.future) missingFields.push(`conjugation[${index}].future`);
    });

    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.slice(0, 5).join(", ")}${missingFields.length > 5 ? "..." : ""}`);
      details.missingFields = missingFields;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    details,
  };
}

function validatePracticeResponse(
  response: any,
  verb: string
): { valid: boolean; errors: string[]; details: any } {
  const errors: string[] = [];
  const details: any = {};

  if (!response || typeof response !== "object") {
    return { valid: false, errors: ["Response is not an object"], details };
  }

  // Check conjugations array
  if (!response.conjugations || !Array.isArray(response.conjugations)) {
    errors.push("Missing or invalid conjugations array");
    details.conjugationCount = 0;
  } else {
    details.conjugationCount = response.conjugations.length;

    if (response.conjugations.length !== 10) {
      errors.push(`Expected 10 conjugations, got ${response.conjugations.length}`);
    }
  }

  // Check exercises array
  if (!response.exercises || !Array.isArray(response.exercises)) {
    errors.push("Missing or invalid exercises array");
    details.exerciseCount = 0;
  } else {
    details.exerciseCount = response.exercises.length;

    if (response.exercises.length < 12 || response.exercises.length > 15) {
      errors.push(`Expected 12-15 exercises, got ${response.exercises.length}`);
    }

    // Validate each exercise
    const invalidExercises: string[] = [];
    const tenseCount = { past: 0, present: 0, future: 0 };

    response.exercises.forEach((exercise: any, index: number) => {
      const exerciseErrors: string[] = [];

      if (!exercise.id) exerciseErrors.push("missing id");
      if (!exercise.type || !["multiple_choice", "input"].includes(exercise.type)) {
        exerciseErrors.push(`invalid type: ${exercise.type}`);
      }
      if (!exercise.tense || !["past", "present", "future"].includes(exercise.tense)) {
        exerciseErrors.push(`invalid tense: ${exercise.tense}`);
      } else {
        tenseCount[exercise.tense as keyof typeof tenseCount]++;
      }
      if (!exercise.sentence) exerciseErrors.push("missing sentence");
      if (!exercise.correctAnswer) exerciseErrors.push("missing correctAnswer");

      if (exercise.type === "multiple_choice") {
        if (!exercise.options || !Array.isArray(exercise.options) || exercise.options.length !== 4) {
          exerciseErrors.push(`invalid options: expected array of 4, got ${exercise.options?.length || 0}`);
        }
      }

      if (exerciseErrors.length > 0) {
        invalidExercises.push(`exercise[${index}]: ${exerciseErrors.join(", ")}`);
      }
    });

    if (invalidExercises.length > 0) {
      errors.push(`Invalid exercises: ${invalidExercises.slice(0, 3).join("; ")}${invalidExercises.length > 3 ? "..." : ""}`);
      details.invalidExercises = invalidExercises;
    }

    // Check tense distribution (should have at least 3 exercises per tense)
    if (tenseCount.past < 3 || tenseCount.present < 3 || tenseCount.future < 3) {
      errors.push(`Uneven tense distribution: past=${tenseCount.past}, present=${tenseCount.present}, future=${tenseCount.future}`);
    }
    details.tenseDistribution = tenseCount;
  }

  return {
    valid: errors.length === 0,
    errors,
    details,
  };
}

async function testConjugation(
  model: string,
  verb: string,
  client: OpenAI
): Promise<TestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let validationDetails: any = undefined;

  try {
    const prompt = getConjugationPrompt(verb);
    
    // Disable reasoning for Grok models
    const isGrokModel = model.startsWith("x-ai/grok");
    const requestParams: any = {
      model,
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
    };
    
    // Disable reasoning for Grok models
    if (isGrokModel) {
      requestParams.extra_body = {
        reasoning: {
          effort: "none",
          exclude: true
        }
      };
    }
    
    const completion = await client.chat.completions.create(requestParams);

    const content = completion.choices[0]?.message?.content;
    const responseTime = Date.now() - startTime;

    if (!content) {
      return {
        model,
        verb,
        success: false,
        responseTime,
        errors: ["No response content from model"],
      };
    }

    // Parse JSON
    let parsedResponse: ConjugationResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError: any) {
      return {
        model,
        verb,
        success: false,
        responseTime,
        errors: [`JSON parse error: ${parseError.message}`],
      };
    }

    // Validate response
    const validation = validateConjugationResponse(parsedResponse, verb);
    validationDetails = validation.details;

    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    return {
      model,
      verb,
      success: validation.valid,
      responseTime,
      errors,
      validationDetails,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error.status === 429
        ? "Rate limit exceeded"
        : error.status === 401 || error.status === 403
        ? "Authentication error"
        : error.message || "Unknown error";

    return {
      model,
      verb,
      success: false,
      responseTime,
      errors: [`API error: ${errorMessage}`],
    };
  }
}

async function testPractice(
  model: string,
  verb: string,
  client: OpenAI
): Promise<TestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let validationDetails: any = undefined;

  try {
    const prompt = getPracticePrompt(verb);
    
    // Disable reasoning for Grok models
    const isGrokModel = model.startsWith("x-ai/grok");
    const requestParams: any = {
      model,
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
    };
    
    // Disable reasoning for Grok models
    if (isGrokModel) {
      requestParams.extra_body = {
        reasoning: {
          effort: "none",
          exclude: true
        }
      };
    }
    
    const completion = await client.chat.completions.create(requestParams);

    const content = completion.choices[0]?.message?.content;
    const responseTime = Date.now() - startTime;

    if (!content) {
      return {
        model,
        verb,
        success: false,
        responseTime,
        errors: ["No response content from model"],
      };
    }

    // Clean and parse JSON (similar to practice route)
    let cleanedContent = content.trim();
    const firstBrace = cleanedContent.indexOf("{");
    const lastBrace = cleanedContent.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
    }

    let parsedResponse: PracticeResponse;
    try {
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError: any) {
      return {
        model,
        verb,
        success: false,
        responseTime,
        errors: [`JSON parse error: ${parseError.message}`],
      };
    }

    // Validate response
    const validation = validatePracticeResponse(parsedResponse, verb);
    validationDetails = validation.details;

    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    return {
      model,
      verb,
      success: validation.valid,
      responseTime,
      errors,
      validationDetails,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error.status === 429
        ? "Rate limit exceeded"
        : error.status === 401 || error.status === 403
        ? "Authentication error"
        : error.message || "Unknown error";

    return {
      model,
      verb,
      success: false,
      responseTime,
      errors: [`API error: ${errorMessage}`],
    };
  }
}

async function runConjugationTests(): Promise<ModelSummary[]> {
  const client = getOpenRouterClient();
  const summaries: ModelSummary[] = [];

  console.log("\n" + "=".repeat(80));
  console.log("CONJUGATION TESTS");
  console.log("=".repeat(80) + "\n");

  for (const model of MODELS) {
    console.log(`Testing model: ${model}`);
    const results: TestResult[] = [];

    for (const verb of TEST_VERBS) {
      process.stdout.write(`  Testing verb "${verb}"... `);
      const result = await testConjugation(model, verb, client);
      results.push(result);

      if (result.success) {
        console.log(`✓ (${result.responseTime}ms)`);
      } else {
        console.log(`✗ (${result.responseTime}ms) - ${result.errors[0]}`);
      }

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const successfulTests = results.filter((r) => r.success).length;
    const averageResponseTime =
      results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    summaries.push({
      model,
      testType: "conjugation",
      averageResponseTime,
      successRate: (successfulTests / results.length) * 100,
      totalTests: results.length,
      successfulTests,
      results,
    });

    console.log(`  Average: ${averageResponseTime.toFixed(0)}ms | Success: ${successfulTests}/${results.length} (${((successfulTests / results.length) * 100).toFixed(1)}%)\n`);
  }

  return summaries;
}

async function runPracticeTests(): Promise<ModelSummary[]> {
  const client = getOpenRouterClient();
  const summaries: ModelSummary[] = [];

  console.log("\n" + "=".repeat(80));
  console.log("PRACTICE EXERCISE TESTS");
  console.log("=".repeat(80) + "\n");

  for (const model of MODELS) {
    console.log(`Testing model: ${model}`);
    const results: TestResult[] = [];

    for (const verb of TEST_VERBS) {
      process.stdout.write(`  Testing verb "${verb}"... `);
      const result = await testPractice(model, verb, client);
      results.push(result);

      if (result.success) {
        console.log(`✓ (${result.responseTime}ms)`);
      } else {
        console.log(`✗ (${result.responseTime}ms) - ${result.errors[0]}`);
      }

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const successfulTests = results.filter((r) => r.success).length;
    const averageResponseTime =
      results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    summaries.push({
      model,
      testType: "practice",
      averageResponseTime,
      successRate: (successfulTests / results.length) * 100,
      totalTests: results.length,
      successfulTests,
      results,
    });

    console.log(`  Average: ${averageResponseTime.toFixed(0)}ms | Success: ${successfulTests}/${results.length} (${((successfulTests / results.length) * 100).toFixed(1)}%)\n`);
  }

  return summaries;
}

function displayResults(conjugationSummaries: ModelSummary[], practiceSummaries: ModelSummary[]) {
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY RESULTS");
  console.log("=".repeat(80) + "\n");

  // Conjugation Summary Table
  console.log("CONJUGATION TEST RESULTS");
  console.log("-".repeat(80));
  console.log(
    `${"Model".padEnd(35)} ${"Avg Time (ms)".padEnd(15)} ${"Success Rate".padEnd(15)} ${"Success/Total"}`
  );
  console.log("-".repeat(80));

  const sortedConjugation = [...conjugationSummaries].sort(
    (a, b) => a.averageResponseTime - b.averageResponseTime
  );

  sortedConjugation.forEach((summary) => {
    const modelName = summary.model.length > 34 ? summary.model.substring(0, 31) + "..." : summary.model;
    console.log(
      `${modelName.padEnd(35)} ${summary.averageResponseTime.toFixed(0).padStart(15)} ${summary.successRate.toFixed(1).padStart(14)}% ${summary.successfulTests}/${summary.totalTests}`
    );
  });

  console.log("\n" + "-".repeat(80));
  console.log("Ranking by Speed (Fastest First):");
  sortedConjugation.forEach((summary, index) => {
    console.log(`  ${index + 1}. ${summary.model} - ${summary.averageResponseTime.toFixed(0)}ms (${summary.successRate.toFixed(1)}% success)`);
  });

  // Practice Summary Table
  console.log("\n" + "=".repeat(80));
  console.log("PRACTICE EXERCISE TEST RESULTS");
  console.log("-".repeat(80));
  console.log(
    `${"Model".padEnd(35)} ${"Avg Time (ms)".padEnd(15)} ${"Success Rate".padEnd(15)} ${"Success/Total"}`
  );
  console.log("-".repeat(80));

  const sortedPractice = [...practiceSummaries].sort(
    (a, b) => a.averageResponseTime - b.averageResponseTime
  );

  sortedPractice.forEach((summary) => {
    const modelName = summary.model.length > 34 ? summary.model.substring(0, 31) + "..." : summary.model;
    console.log(
      `${modelName.padEnd(35)} ${summary.averageResponseTime.toFixed(0).padStart(15)} ${summary.successRate.toFixed(1).padStart(14)}% ${summary.successfulTests}/${summary.totalTests}`
    );
  });

  console.log("\n" + "-".repeat(80));
  console.log("Ranking by Speed (Fastest First):");
  sortedPractice.forEach((summary, index) => {
    console.log(`  ${index + 1}. ${summary.model} - ${summary.averageResponseTime.toFixed(0)}ms (${summary.successRate.toFixed(1)}% success)`);
  });

  // Combined Quality Ranking (sorted by success rate first, then speed)
  console.log("\n" + "=".repeat(80));
  console.log("OVERALL QUALITY RANKING (Success Rate + Speed)");
  console.log("-".repeat(80));

  // Conjugation Quality Ranking
  const conjugationQuality = [...conjugationSummaries].sort((a, b) => {
    if (Math.abs(a.successRate - b.successRate) > 1) {
      return b.successRate - a.successRate; // Sort by success rate first
    }
    return a.averageResponseTime - b.averageResponseTime; // Then by speed
  });

  console.log("\nConjugation:");
  conjugationQuality.forEach((summary, index) => {
    console.log(`  ${index + 1}. ${summary.model} - ${summary.successRate.toFixed(1)}% success, ${summary.averageResponseTime.toFixed(0)}ms avg`);
  });

  // Practice Quality Ranking
  const practiceQuality = [...practiceSummaries].sort((a, b) => {
    if (Math.abs(a.successRate - b.successRate) > 1) {
      return b.successRate - a.successRate; // Sort by success rate first
    }
    return a.averageResponseTime - b.averageResponseTime; // Then by speed
  });

  console.log("\nPractice Exercises:");
  practiceQuality.forEach((summary, index) => {
    console.log(`  ${index + 1}. ${summary.model} - ${summary.successRate.toFixed(1)}% success, ${summary.averageResponseTime.toFixed(0)}ms avg`);
  });

  // Detailed errors for failed tests
  console.log("\n" + "=".repeat(80));
  console.log("DETAILED ERROR INFORMATION");
  console.log("=".repeat(80));

  const failedConjugation = conjugationSummaries.flatMap((s) =>
    s.results.filter((r) => !r.success).map((r) => ({ ...r, testType: "conjugation" as const }))
  );
  const failedPractice = practiceSummaries.flatMap((s) =>
    s.results.filter((r) => !r.success).map((r) => ({ ...r, testType: "practice" as const }))
  );
  const allFailedResults = [...failedConjugation, ...failedPractice];

  if (allFailedResults.length > 0) {
    console.log(`\nTotal failed tests: ${allFailedResults.length}\n`);
    allFailedResults.forEach((result) => {
      console.log(`\n[${result.testType}] ${result.model} - "${result.verb}"`);
      console.log(`  Response Time: ${result.responseTime}ms`);
      console.log(`  Errors:`);
      result.errors.forEach((error) => {
        console.log(`    - ${error}`);
      });
      if (result.validationDetails) {
        console.log(`  Validation Details:`, JSON.stringify(result.validationDetails, null, 2));
      }
    });
  } else {
    console.log("\n✓ All tests passed successfully!");
  }
}

// Main execution
async function main() {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("ERROR: OPENROUTER_API_KEY environment variable is not set");
      console.error("Please create a .env.local file with your OpenRouter API key");
      process.exit(1);
    }

    console.log("Starting OpenRouter Model Benchmark Tests");
    console.log(`Testing ${MODELS.length} models with ${TEST_VERBS.length} verbs`);
    console.log(`Total tests: ${MODELS.length * TEST_VERBS.length * 2} (conjugation + practice)`);

    const conjugationSummaries = await runConjugationTests();
    const practiceSummaries = await runPracticeTests();

    displayResults(conjugationSummaries, practiceSummaries);

    console.log("\n" + "=".repeat(80));
    console.log("Testing completed!");
    console.log("=".repeat(80) + "\n");
  } catch (error: any) {
    console.error("\nFatal error:", error.message);
    process.exit(1);
  }
}

// Run the tests
main();
