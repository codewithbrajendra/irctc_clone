import { useEffect, useState } from "react";
import { ensureSession, getAccessToken, hasSession, subscribeAuth } from "../api/client";

export default function useSession() {
  const [session, setSession] = useState({ ready: false, signedIn: false });
  useEffect(() => {
    let active = true;
    let timer;
    function scheduleCheck() {
      clearTimeout(timer);
      try {
        const part = getAccessToken().split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const { exp } = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")));
        if (exp * 1000 > Date.now()) timer = setTimeout(sync, Math.min(exp * 1000 - Date.now() + 50, 2147483647));
      } catch { /* No token means no background refresh loop. */ }
    }
    async function sync() {
      const signedIn = await ensureSession();
      if (active) { setSession({ ready: true, signedIn }); scheduleCheck(); }
    }
    const unsubscribe = subscribeAuth(() => {
      if (active) { setSession({ ready: true, signedIn: hasSession() }); scheduleCheck(); }
    });
    sync();
    window.addEventListener("focus", sync);
    return () => { active = false; unsubscribe(); clearTimeout(timer); window.removeEventListener("focus", sync); };
  }, []);
  return session;
}
