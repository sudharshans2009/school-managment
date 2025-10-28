"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SmartboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.push("/smartboard/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-600 flex items-center justify-center">
      <div className="text-white text-2xl">Redirecting to login...</div>
    </div>
  );
}
