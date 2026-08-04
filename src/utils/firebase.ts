import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { LessonSet } from '../types';
import { SAMPLE_LESSONS } from '../data/sampleLessons';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with database ID from config if present
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

let currentUser: User | null = null;

// Sign in anonymously to ensure auth rules pass
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
  } else {
    signInAnonymously(auth).catch((err) => {
      console.warn('Anonymous auth failed:', err);
    });
  }
});

const LESSONS_COLLECTION = 'lessons';
const LOCAL_STORAGE_KEY = 'vocab_review_lessons_v1';

/**
 * Merges Firestore/remote custom lessons with default sample lessons
 */

export function mergeLessonsWithSamples(remoteLessons: LessonSet[]): LessonSet[] {
  const mergedMap = new Map<string, LessonSet>();
  
  // 1. Default sample lessons
  SAMPLE_LESSONS.forEach(sample => {
    mergedMap.set(sample.id, sample);
  });

  // 2. Local storage custom lessons
  try {
    const rawLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (rawLocal) {
      const parsedLocal: LessonSet[] = JSON.parse(rawLocal);
      parsedLocal.forEach(l => {
        if (l && l.id) {
          mergedMap.set(l.id, l);
        }
      });
    }
  } catch (e) {
    console.warn('Failed reading local storage in merge:', e);
  }

  // 3. Remote Firestore lessons
  remoteLessons.forEach(l => {
    if (l && l.id) {
      mergedMap.set(l.id, l);
    }
  });

  return Array.from(mergedMap.values())
    .filter(l => l.id !== 'sample-business-1' && l.id !== 'sample-travel-2')
    .sort((a, b) => 
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );
}

/**
 * Subscribe to real-time lesson updates from Firestore
 */
export function subscribeToLessons(onUpdate: (lessons: LessonSet[]) => void): () => void {
  try {
    const colRef = collection(db, LESSONS_COLLECTION);
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const remoteLessons: LessonSet[] = [];
      snapshot.forEach(docSnap => {
        if (docSnap.exists()) {
          remoteLessons.push(docSnap.data() as LessonSet);
        }
      });

      const merged = mergeLessonsWithSamples(remoteLessons);
      // Cache to local storage for offline fallback
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {
        console.warn('Failed caching lessons to local storage:', e);
      }

      onUpdate(merged);
    }, (error) => {
      console.warn('Firestore subscription error, falling back to local storage:', error);
      // Fallback on error
      const cached = getLocalLessonsFallback();
      onUpdate(cached);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to setup Firestore listener:', err);
    const cached = getLocalLessonsFallback();
    onUpdate(cached);
    return () => {};
  }
}

/**
 * Save or update a lesson set in Firestore (and local storage)
 */
export async function saveLessonToCloud(lesson: LessonSet): Promise<void> {
  const lessonToSave: LessonSet & { authorId?: string } = {
    ...lesson,
    authorId: currentUser?.uid || 'anonymous'
  };

  // Local storage update first for instant responsiveness
  updateLocalLessonStorage(lessonToSave);

  try {
    const docRef = doc(db, LESSONS_COLLECTION, lesson.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(lessonToSave)), { merge: true });
  } catch (err) {
    console.error('Error saving lesson to cloud Firestore:', err);
  }
}

/**
 * Delete a lesson from Firestore (and local storage)
 */
export async function deleteLessonFromCloud(lessonId: string): Promise<void> {
  deleteLocalLessonStorage(lessonId);

  try {
    const docRef = doc(db, LESSONS_COLLECTION, lessonId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting lesson from cloud Firestore:', err);
  }
}

function getLocalLessonsFallback(): LessonSet[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed: LessonSet[] = JSON.parse(data);
      return mergeLessonsWithSamples(parsed);
    }
  } catch {}
  return SAMPLE_LESSONS;
}

function updateLocalLessonStorage(lesson: LessonSet): void {
  try {
    const current = getLocalLessonsFallback();
    const idx = current.findIndex(l => l.id === lesson.id);
    if (idx >= 0) {
      current[idx] = lesson;
    } else {
      current.unshift(lesson);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Local storage update failed:', e);
  }
}

function deleteLocalLessonStorage(lessonId: string): void {
  try {
    const current = getLocalLessonsFallback().filter(l => l.id !== lessonId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Local storage delete failed:', e);
  }
}
