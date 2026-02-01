import { Word } from "./types";
import { Doc } from "convex/_generated/dataModel";

/**
 * Convert a Convex word document to the Word type used by components
 */
export function convexWordToWord(convexWord: Doc<"words">): Word {
  return {
    id: convexWord._id,
    hebrew: convexWord.hebrew,
    translation: convexWord.translation,
    createdAt: new Date(convexWord.createdAt),
    masteryLevel: convexWord.masteryLevel,
    mastery: convexWord.mastery || undefined,
    conjugations: convexWord.conjugations || undefined,
    nextReviewDate: convexWord.nextReviewDate ? new Date(convexWord.nextReviewDate) : undefined,
    consecutiveCorrect: convexWord.consecutiveCorrect,
    errorCount: convexWord.errorCount,
  };
}
