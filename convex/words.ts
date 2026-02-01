import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get all words ordered by creation date (descending)
export const list = query({
  handler: async (ctx) => {
    const words = await ctx.db
      .query("words")
      .order("desc")
      .collect();
    return words;
  },
});

// Query: Get a single word by ID
export const getById = query({
  args: { id: v.id("words") },
  handler: async (ctx, args) => {
    const word = await ctx.db.get(args.id);
    return word;
  },
});

// Query: Find word by Hebrew text
export const getByHebrew = query({
  args: { hebrew: v.string() },
  handler: async (ctx, args) => {
    const words = await ctx.db
      .query("words")
      .withIndex("by_hebrew", (q) => q.eq("hebrew", args.hebrew))
      .collect();
    return words.length > 0 ? words[0] : null;
  },
});

// Query: Get words for daily practice (new, review, weak)
export const getDailyWords = query({
  handler: async (ctx) => {
    const allWords = await ctx.db
      .query("words")
      .order("desc")
      .collect();

    const now = Date.now();
    const reviewWords: typeof allWords = [];
    const weakWords: typeof allWords = [];
    const newWords: typeof allWords = [];
    const usedIds = new Set<string>();

    // Categorize words
    for (const word of allWords) {
      const nextReview = word.nextReviewDate || 0;
      const errorCount = word.errorCount || 0;
      const consecutiveCorrect = word.consecutiveCorrect || 0;

      // Weak words: high error count
      if (errorCount > 2 && weakWords.length < 5 && !usedIds.has(word._id)) {
        weakWords.push(word);
        usedIds.add(word._id);
      }

      // Review words: due for review
      if (nextReview <= now && reviewWords.length < 15 && !usedIds.has(word._id)) {
        reviewWords.push(word);
        usedIds.add(word._id);
      }

      // New words: never reviewed or low mastery
      if (consecutiveCorrect === 0 && newWords.length < 7 && !usedIds.has(word._id)) {
        newWords.push(word);
        usedIds.add(word._id);
      }
    }

    // Fill remaining slots if needed
    const remaining = allWords.filter((w) => !usedIds.has(w._id));

    while (reviewWords.length < 8 && remaining.length > 0) {
      const word = remaining.shift()!;
      reviewWords.push(word);
      usedIds.add(word._id);
    }

    while (newWords.length < 3 && remaining.length > 0) {
      const word = remaining.shift()!;
      newWords.push(word);
      usedIds.add(word._id);
    }

    return {
      reviewWords,
      weakWords,
      newWords,
    };
  },
});

// Mutation: Add a new word
export const add = mutation({
  args: {
    hebrew: v.string(),
    translation: v.string(),
    conjugations: v.optional(
      v.array(
        v.object({
          pronoun: v.string(),
          pronounCode: v.optional(v.string()),
          past: v.string(),
          pastTransliteration: v.optional(v.string()),
          pastExample: v.optional(v.string()),
          present: v.string(),
          presentTransliteration: v.optional(v.string()),
          presentExample: v.optional(v.string()),
          future: v.string(),
          futureTransliteration: v.optional(v.string()),
          futureExample: v.optional(v.string()),
        })
      )
    ),
    mastery: v.optional(
      v.object({
        past: v.optional(v.record(v.string(), v.number())),
        present: v.optional(v.record(v.string(), v.number())),
        future: v.optional(v.record(v.string(), v.number())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const wordId = await ctx.db.insert("words", {
      hebrew: args.hebrew,
      translation: args.translation,
      createdAt: Date.now(),
      masteryLevel: 0,
      conjugations: args.conjugations || undefined,
      mastery: args.mastery || undefined,
      nextReviewDate: Date.now(),
      consecutiveCorrect: 0,
      errorCount: 0,
    });
    return wordId;
  },
});

// Mutation: Update word mastery level
export const updateMastery = mutation({
  args: {
    id: v.id("words"),
    level: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      masteryLevel: args.level,
    });
  },
});

// Mutation: Update pronoun mastery for specific tense
export const updatePronounMastery = mutation({
  args: {
    id: v.id("words"),
    tense: v.union(v.literal("past"), v.literal("present"), v.literal("future")),
    pronounCode: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const word = await ctx.db.get(args.id);
    if (!word) {
      throw new Error("Word not found");
    }

    const mastery = word.mastery || {
      past: {},
      present: {},
      future: {},
    };

    const tenseMastery = mastery[args.tense] || {};
    const updatedTenseMastery = {
      ...tenseMastery,
      [args.pronounCode]: Math.max(0, Math.min(100, args.score)),
    };

    await ctx.db.patch(args.id, {
      mastery: {
        ...mastery,
        [args.tense]: updatedTenseMastery,
      },
    });
  },
});

// Mutation: Update word progress (for spaced repetition)
export const updateProgress = mutation({
  args: {
    id: v.id("words"),
    isCorrect: v.boolean(),
  },
  handler: async (ctx, args) => {
    const word = await ctx.db.get(args.id);
    if (!word) {
      return;
    }

    let consecutiveCorrect = word.consecutiveCorrect || 0;
    let nextReviewDate = word.nextReviewDate || Date.now();
    let errorCount = word.errorCount || 0;

    if (args.isCorrect) {
      consecutiveCorrect += 1;
      // Exponential backoff: 1 day, 2 days, 4 days, 8 days...
      const daysToAdd = Math.pow(2, consecutiveCorrect - 1);
      nextReviewDate = Date.now() + daysToAdd * 24 * 60 * 60 * 1000;
    } else {
      consecutiveCorrect = 0;
      errorCount += 1;
      nextReviewDate = Date.now(); // Review immediately/tomorrow
    }

    await ctx.db.patch(args.id, {
      consecutiveCorrect,
      nextReviewDate,
      errorCount,
    });
  },
});

// Mutation: Delete a word
export const deleteWord = mutation({
  args: { id: v.id("words") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
