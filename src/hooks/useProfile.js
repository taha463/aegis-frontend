import { useState, useEffect } from "react";
import { auth } from "../firebaseconfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { resolveUserProfile, FALLBACK_PROFILE } from "../services/profileService.js";
import { STATUS } from "../utils/cache.js";

/**
 * Domain Hook: useProfile
 * Manages user profile independently of weather or flood intelligence.
 */
export function useProfile() {
  const [profile, setProfile] = useState(FALLBACK_PROFILE);
  const [status, setStatus] = useState(STATUS.FRESH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        const result = await resolveUserProfile(firebaseUser);
        setProfile(result.profile);
        setStatus(result.status);
      } catch (err) {
        console.warn("[useProfile] Error resolving profile:", err);
        setProfile(FALLBACK_PROFILE);
        setStatus(STATUS.DEGRADED);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { profile, status, loading };
}

