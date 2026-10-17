import { useEffect, useState } from "react";
import { ensureSession, hasSession, subscribeAuth } from "../api/client";

export default function useSession() {
  const [session, setSession] = useState({ ready: false, signedIn: false });
  useEffect(() => {
    let active = true;
    async function sync() {
      const signedIn = await ensureSession();
      if (active) setSession({ ready: true, signedIn });
    }
    // Storage notifications must update React even when a token is still valid.
    const unsubscribe = subscribeAuth(() => {
      if (active) setSession({ ready: true, signedIn: hasSession() });
    });
    sync();
    const timer = setInterval(sync, 1000);
    return () => { active = false; unsubscribe(); clearInterval(timer); };
  }, []);
  return session;
}
