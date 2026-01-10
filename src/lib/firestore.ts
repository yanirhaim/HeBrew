import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { Word } from "./types";

const COLLECTION_NAME = "words";

export const addWord = async (hebrew: string, translation: string, conjugations?: any[]) => {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      hebrew,
      translation,
      createdAt: Timestamp.now(),
      masteryLevel: 0,
      conjugations: conjugations || null
    });
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
