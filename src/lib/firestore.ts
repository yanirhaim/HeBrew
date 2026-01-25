import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  getDocs,
  where,
  limit,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { MasteryByTense, Word } from "./types";

const COLLECTION_NAME = "words";

export const addWord = async (
  hebrew: string,
  translation: string,
  conjugations?: any[],
  mastery?: MasteryByTense
) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      hebrew,
      translation,
      createdAt: Timestamp.now(),
      masteryLevel: 0,
      conjugations: conjugations || null,
      mastery: mastery || null,
      nextReviewDate: Timestamp.now(),
      consecutiveCorrect: 0,
      errorCount: 0
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding word: ", error);
    throw error;
  }
};

export const updateWordMastery = async (id: string, level: number) => {
  try {
    const wordRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(wordRef, {
      masteryLevel: level
    });
  } catch (error) {
    console.error("Error updating mastery level: ", error);
    throw error;
  }
};

export const deleteWord = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting word: ", error);
    throw error;
  }
};

export const subscribeToWords = (
  callback: (words: Word[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const words = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          hebrew: data.hebrew,
          translation: data.translation,
          createdAt: data.createdAt?.toDate() || new Date(),
          masteryLevel: data.masteryLevel || 0,
          mastery: data.mastery || null,
          conjugations: data.conjugations || [],
          nextReviewDate: data.nextReviewDate?.toDate() || new Date(),
          consecutiveCorrect: data.consecutiveCorrect || 0,
          errorCount: data.errorCount || 0
        } as Word;
      });
      callback(words);
    },
    (error) => {
      console.error("Error fetching words:", error);
      if (onError) onError(error);
    }
  );
};

export const findWordByHebrew = async (hebrew: string): Promise<Word | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("hebrew", "==", hebrew),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      hebrew: data.hebrew,
      translation: data.translation,
      createdAt: data.createdAt?.toDate() || new Date(),
      masteryLevel: data.masteryLevel || 0,
      mastery: data.mastery || null,
      conjugations: data.conjugations || [],
      nextReviewDate: data.nextReviewDate?.toDate() || new Date(),
      consecutiveCorrect: data.consecutiveCorrect || 0,
      errorCount: data.errorCount || 0
    } as Word;
  } catch (error) {
    console.error("Error finding word:", error);
    return null;
  }
};

export const updatePronounMastery = async (
  id: string,
  tense: "past" | "present" | "future",
  pronounCode: string,
  score: number
) => {
  try {
    const wordRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(wordRef, {
      [`mastery.${tense}.${pronounCode}`]: Math.max(0, Math.min(100, score))
    });
  } catch (error) {
    console.error("Error updating pronoun mastery:", error);
    throw error;
  }
};

export const getAllWords = async (): Promise<Word[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        hebrew: data.hebrew,
        translation: data.translation,
        createdAt: data.createdAt?.toDate() || new Date(),
        masteryLevel: data.masteryLevel || 0,
        mastery: data.mastery || null,
        conjugations: data.conjugations || [],
        nextReviewDate: data.nextReviewDate?.toDate() || new Date(),
        consecutiveCorrect: data.consecutiveCorrect || 0,
        errorCount: data.errorCount || 0
      } as Word;
    });
  } catch (error) {
    console.error("Error fetching all words:", error);
    throw error;
  }
};

export const updateWordProgress = async (id: string, isCorrect: boolean) => {
  try {
    const wordRef = doc(db, COLLECTION_NAME, id);
    const wordSnap = await getDoc(wordRef);
    
    if (!wordSnap.exists()) return;
    
    const data = wordSnap.data();
    let consecutiveCorrect = data.consecutiveCorrect || 0;
    let nextReviewDate = data.nextReviewDate?.toDate() || new Date();
    let errorCount = data.errorCount || 0;
    
    if (isCorrect) {
      consecutiveCorrect += 1;
      // Exponential backoff: 1 day, 2 days, 4 days, 8 days...
      const daysToAdd = Math.pow(2, consecutiveCorrect - 1);
      nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
    } else {
      consecutiveCorrect = 0;
      errorCount += 1;
      nextReviewDate = new Date(); // Review immediately/tomorrow
    }
    
    await updateDoc(wordRef, {
      consecutiveCorrect,
      nextReviewDate: Timestamp.fromDate(nextReviewDate),
      errorCount
    });
    
  } catch (error) {
    console.error("Error updating word progress:", error);
    throw error;
  }
};

export const getDailyWords = async (): Promise<{ newWords: Word[], reviewWords: Word[], weakWords: Word[] }> => {
  try {
    // First, get ALL words as fallback
    const allWords = await getAllWords();
    
    if (allWords.length === 0) {
      return { newWords: [], reviewWords: [], weakWords: [] };
    }

    const now = new Date();
    const reviewWords: Word[] = [];
    const weakWords: Word[] = [];
    const newWords: Word[] = [];
    const usedIds = new Set<string>();

    // Categorize words from the full list (more reliable than queries that might fail)
    for (const word of allWords) {
      const nextReview = word.nextReviewDate || new Date();
      const errorCount = word.errorCount || 0;
      const consecutiveCorrect = word.consecutiveCorrect || 0;

      // Weak words: high error count
      if (errorCount > 2 && weakWords.length < 5 && !usedIds.has(word.id)) {
        weakWords.push(word);
        usedIds.add(word.id);
      }
      
      // Review words: due for review
      if (nextReview <= now && reviewWords.length < 15 && !usedIds.has(word.id)) {
        reviewWords.push(word);
        usedIds.add(word.id);
      }
      
      // New words: never reviewed or low mastery
      if (consecutiveCorrect === 0 && newWords.length < 7 && !usedIds.has(word.id)) {
        newWords.push(word);
        usedIds.add(word.id);
      }
    }

    // If we still don't have enough words, fill from remaining words
    const remaining = allWords.filter(w => !usedIds.has(w.id));
    
    // Fill review words if needed
    while (reviewWords.length < 8 && remaining.length > 0) {
      const word = remaining.shift()!;
      reviewWords.push(word);
      usedIds.add(word.id);
    }
    
    // Fill new words if needed
    while (newWords.length < 3 && remaining.length > 0) {
      const word = remaining.shift()!;
      newWords.push(word);
      usedIds.add(word.id);
    }

    return {
      reviewWords,
      weakWords,
      newWords
    };
    
  } catch (error) {
    console.error("Error fetching daily words:", error);
    // Fallback: try to get all words and return them as "new words"
    try {
      const allWords = await getAllWords();
      return {
        newWords: allWords.slice(0, 10),
        reviewWords: [],
        weakWords: []
      };
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return { newWords: [], reviewWords: [], weakWords: [] };
    }
  }
};
