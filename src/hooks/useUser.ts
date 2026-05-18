"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";
import { getUserProfile } from "@/services/auth.service";
import type { UserProfile } from "@/types";

interface UseUserResult {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setStoreUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadProfile(currentUser: User | null) {
      if (!currentUser) {
        if (!isMounted) return;
        setProfile(null);
        setStoreUser(null);
        return;
      }

      const { profile: loaded } = await getUserProfile(currentUser.id);
      if (!isMounted) return;
      setProfile(loaded ?? null);
      setStoreUser(loaded ?? null);
    }

    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(data.user);
      await loadProfile(data.user);
      if (isMounted) setIsLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      if (!isMounted) return;
      setUser(nextUser);
      await loadProfile(nextUser);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setStoreUser]);

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
  };
}
