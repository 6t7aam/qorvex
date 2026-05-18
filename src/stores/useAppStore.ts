import { create } from "zustand";
import type { UserProfile, Subscription } from "@/types";

interface AppState {
  user: UserProfile | null;
  subscription: Subscription | null;
  selectedLanguage: string;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setLanguage: (language: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  subscription: null,
  selectedLanguage: "en",
  isLoading: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setUser: (user) => set({ user }),
  setSubscription: (subscription) => set({ subscription }),
  setLanguage: (selectedLanguage) => set({ selectedLanguage }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}));
