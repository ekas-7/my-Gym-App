import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // Always use the Firebase-hosted auth domain so sign-in works on any
  // Vercel URL without that URL needing to be in the authorized-domains list.
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "mygymapp-tracker.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

export const googleProvider = (() => {
  const provider = new GoogleAuthProvider();
  // Request profile + email scopes
  provider.addScope("profile");
  provider.addScope("email");
  // Prefer account chooser on every sign-in (better UX on mobile)
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
})();

export const db = getFirestore(app);
export default app;
