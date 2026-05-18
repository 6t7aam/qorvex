"use client";

import { useUser } from "@/hooks/useUser";

export function UserProvider() {
  useUser();
  return null;
}
