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
  limit
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
      mastery: mastery || null
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
          conjugations: data.conjugations || []
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
      conjugations: data.conjugations || []
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
        conjugations: data.conjugations || []
      } as Word;
    });
  } catch (error) {
    console.error("Error fetching all words:", error);
    throw error;
  }
};
