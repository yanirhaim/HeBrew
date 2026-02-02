import assert from "node:assert/strict";
import { tokenizeHebrewText, generateCandidateForms } from "../src/lib/hebrew-text";
import { buildVocabFromText } from "../src/lib/news-vocab";

const tokens = tokenizeHebrewText("והילד הלך לבית הגדול.");
assert.deepEqual(tokens, ["והילד", "הלך", "לבית", "הגדול"]);

const variants = generateCandidateForms("והילד");
assert(variants.includes("והילד"));
assert(variants.includes("הילד"));
assert(variants.includes("ילד"));

const dbWords = [
  { hebrew: "ילד", translation: "niño", id: "1" },
  { hebrew: "גדול", translation: "grande", id: "2" },
  { hebrew: "ללכת", translation: "caminar", id: "3", conjugations: [{}, {}] },
];

const result = buildVocabFromText("והילד הלך לבית הגדול.", dbWords);
assert(result.knownVocab.find((w) => w.hebrew === "והילד")?.translation === "niño");
assert(result.knownVocab.find((w) => w.hebrew === "הגדול")?.translation === "grande");
assert(result.knownVocab.find((w) => w.hebrew === "הלך") === undefined);
assert(result.unknownTokens.includes("הלך"));
assert(result.usedWords.length === 2);

console.log("news-vocab.test.ts passed");
