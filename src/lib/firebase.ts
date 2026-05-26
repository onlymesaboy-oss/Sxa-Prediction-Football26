import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MatchSession, OperationType } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Checks if the user is signed in
 */
export async function ensureAuth(): Promise<User | null> {
  return auth.currentUser;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function savePrediction(session: MatchSession) {
  const user = await ensureAuth();
  if (!user) throw new Error('Authentication failed');

  const path = 'predictions';
  try {
    const docData = {
      userId: user.uid,
      match: {
        teamA: session.teamA,
        teamB: session.teamB,
        league: session.league
      },
      prediction: session.prediction,
      stats: session.stats,
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, path), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getPredictionHistory(maxCount = 10) {
  const user = await ensureAuth();
  if (!user) return [];

  const path = 'predictions';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
