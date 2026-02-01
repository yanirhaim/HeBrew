import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  words: defineTable({
    hebrew: v.string(),
    translation: v.string(),
    createdAt: v.number(), // milliseconds since epoch
    masteryLevel: v.optional(v.number()),
    mastery: v.optional(
      v.object({
        past: v.optional(v.record(v.string(), v.number())),
        present: v.optional(v.record(v.string(), v.number())),
        future: v.optional(v.record(v.string(), v.number())),
      })
    ),
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
    nextReviewDate: v.optional(v.number()), // milliseconds since epoch
    consecutiveCorrect: v.optional(v.number()),
    errorCount: v.optional(v.number()),
  })
    .index("by_hebrew", ["hebrew"])
    .index("by_nextReviewDate", ["nextReviewDate"])
    .index("by_errorCount", ["errorCount"])
    .index("by_consecutiveCorrect", ["consecutiveCorrect"]),
});
