// lib/saveUserData.ts
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

// まずはユーザーデータの型を定義
export type UserProfile = {
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
  // 必要に応じて他のフィールドを追加
};

export async function saveUserData(
  uid: string,
  appId: string,
  data: UserProfile
) {
  const path = `artifacts/${appId}/users/${uid}/userData/profile`;
  const ref = doc(db, path);

  try {
    await setDoc(ref, data, { merge: true });
  } catch (e) {
    console.error("Failed to save user data:", e);
  }
}
