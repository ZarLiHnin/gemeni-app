// lib/firestore.ts
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  query,
  orderBy,
  setDoc,
  getDoc,
  where,
} from "firebase/firestore";
import { ChatMessage } from "@/store/chatStore";
import { Sticky } from "@/store/stickyStore";

export async function saveChatMessage(sessionId: string, message: ChatMessage) {
  const ref = collection(db, "sessions", sessionId, "messages");
  await addDoc(ref, {
    ...message,
    createdAt: serverTimestamp(),
  });
}

export async function saveSticky(sessionId: string, sticky: Sticky) {
  const ref = doc(db, "sessions", sessionId, "notes", sticky.id);
  await setDoc(ref, {
    ...sticky,
    updatedAt: Date.now(),
  });
}

// チャットメッセージをセッションIDから取得
export async function fetchMessages(sessionId: string): Promise<ChatMessage[]> {
  const q = query(
    collection(db, "sessions", sessionId, "messages"),
    orderBy("createdAt", "asc")
  );
  const querySnapshot = await getDocs(q);
  const messages: ChatMessage[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    messages.push({
      role: data.role,
      content: data.content,
    });
  });
  return messages;
}

// 付箋をセッションIDから取得
export async function fetchStickies(sessionId: string): Promise<Sticky[]> {
  const q = collection(db, "sessions", sessionId, "notes");
  const querySnapshot = await getDocs(q);
  const stickies: Sticky[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    stickies.push({
      id: doc.id,
      content: data.content,
      x: data.x,
      y: data.y,
      userId: data.userId,
    });
  });
  return stickies;
}
export async function createSessionIfNotExists(
  sessionId: string,
  { title, ownerId }: { title: string; ownerId: string }
) {
  const sessionRef = doc(db, "sessions", sessionId);
  const docSnap = await getDoc(sessionRef);
  if (!docSnap.exists()) {
    await setDoc(sessionRef, {
      title,
      ownerId,
      createdAt: serverTimestamp(),
    });
  }
}

// 新規セッション作成時に重複をチェックし、なければ作成
export async function createNewSession(
  ownerId: string,
  baseTitle: string
): Promise<{ id: string; title: string }> {
  // 1. FirestoreでownerIdかつタイトルがbaseTitleもしくは類似のセッションがあるか検索
  const sessionsRef = collection(db, "sessions");
  const q = query(sessionsRef, where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);

  // 日付付きタイトルを作成
  const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
  const titleWithDate = `${baseTitle} - ${nowStr}`;

  // 2. 重複タイトルの判定（単純に同じタイトルがあれば重複とみなす）
  const exists = snapshot.docs.some(
    (doc) => doc.data().title === titleWithDate
  );

  if (exists) {
    throw new Error("同じタイトルのセッションが既に存在します");
  }

  // 3. 新規作成（IDはaddDocで自動生成）
  const docRef = await addDoc(sessionsRef, {
    ownerId,
    title: titleWithDate,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, title: titleWithDate };
}
