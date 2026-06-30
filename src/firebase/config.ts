import { safeStorage } from "../utils/safeStorage";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export type User = { uid: string; email?: string | null };

export const onAuthStateChanged = (authInstance: any, callback: (user: User | null) => void) => {
  return fbOnAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      const u: User = { uid: fbUser.uid, email: fbUser.email };
      safeStorage.setItem('mock_user', JSON.stringify(u));
      callback(u);
    } else {
      safeStorage.removeItem('mock_user');
      callback(null);
    }
  });
};

export const signOut = async (authInstance: any) => {
  await fbSignOut(auth);
  safeStorage.removeItem('mock_user');
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const u = { uid: result.user.uid, email: result.user.email };
  safeStorage.setItem('mock_user', JSON.stringify(u));
  return u;
};

export const signInWithGoogleDrive = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const u = { uid: result.user.uid, email: result.user.email };
  safeStorage.setItem('mock_user', JSON.stringify(u));
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken || "dummy_token";
  return { user: u, accessToken };
};

export const signInWithEmail = async (email: string, pass: string) => {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  const u = { uid: result.user.uid, email: result.user.email };
  safeStorage.setItem('mock_user', JSON.stringify(u));
  return u;
};

export const signUpWithEmail = async (email: string, pass: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const u = { uid: result.user.uid, email: result.user.email };
  safeStorage.setItem('mock_user', JSON.stringify(u));
  return u;
};
