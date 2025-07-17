// lib/auth.ts
import { auth } from "./firebase";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";

export async function signInAsGuest(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    console.log("Signed in anonymously:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("Anonymous sign-in failed", error);
    return null;
  }
}

export function onAuthReady(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
