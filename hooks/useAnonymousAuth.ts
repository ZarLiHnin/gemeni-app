// hooks/useAnonymousAuth.ts
import { useEffect, useState } from "react";
import { signInAsGuest, onAuthReady } from "@/lib/auth";
import { User } from "firebase/auth";

export function useAnonymousAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthReady((firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });

    // 初回サインインを実行
    signInAsGuest();

    return () => unsubscribe();
  }, []);

  return { user, authReady };
}
