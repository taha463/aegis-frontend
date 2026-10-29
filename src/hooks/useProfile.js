import { useState, useEffect } from "react";
import { auth } from "../firebaseconfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { resolveUserProfile, FALLBACK_PROFILE } from "../services/profileService.js";
import { STATUS } from "../utils/cache.js";

// Fast synchronous reader for 0ms initial render
function getInitialProfile() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem("aegis_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.fullName || parsed.displayName || parsed.email)) {
          return {
            ...FALLBACK_PROFILE,
            ...parsed,
            fullName: parsed.fullName || parsed.displayName || "Citizen",
          };
        }
      }
    }
    if (auth?.currentUser) {
      return {
        ...FALLBACK_PROFILE,
        fullName: auth.currentUser.displayName || "Citizen",
        email: auth.currentUser.email || "",
        uid: auth.currentUser.uid,
      };
    }
  } catch (e) {}
  return FALLBACK_PROFILE;
}

/**
 * Domain Hook: useProfile
 * Manages user profile independently with 0ms instant cached render and silent background sync.
 */
export function useProfile() {
  const [profile, setProfile] = useState(getInitialProfile);
  const [status, setStatus] = useState(STATUS.FRESH);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (isMounted) {
          const cached = getInitialProfile();
          if (cached && cached.fullName !== "Citizen") {
            setProfile(cached);
          } else {
            setProfile(FALLBACK_PROFILE);
          }
          setLoading(false);
        }
        return;
      }

      // If we already have displayName in the active Firebase session, populate immediately (0ms)
      if (firebaseUser.displayName && isMounted) {
        setProfile((prev) => ({
          ...prev,
          fullName: firebaseUser.displayName,
          email: firebaseUser.email || prev.email,
          uid: firebaseUser.uid,
        }));
      }

      try {
        const result = await resolveUserProfile(firebaseUser);
        if (isMounted && result?.profile) {
          setProfile(result.profile);
          setStatus(result.status);
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem("aegis_user_profile", JSON.stringify(result.profile));
          }
        }
      } catch (err) {
        console.warn("[useProfile] Error resolving profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { profile, status, loading };
}

