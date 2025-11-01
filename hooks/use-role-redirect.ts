import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

type UserRole = "admin" | "teacher" | "student" | "parent";

export function useRoleRedirect(allowedRoles: UserRole[]) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session) {
      const userRole = (session.user as { role?: string }).role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        switch (userRole) {
          case "admin":
            router.push("/admin");
            break;
          case "teacher":
            router.push("/teacher");
            break;
          case "student":
            router.push("/student");
            break;
          default:
            router.push("/dashboard");
        }
      }
    } else if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router, allowedRoles]);

  return { session, isPending };
}
