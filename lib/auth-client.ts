import { createAuthClient } from "better-auth/react";
import type { Session } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Extended session type with role
export type ExtendedSession = Session & {
  user: Session["user"] & {
    role: string;
  };
};
