"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      status === "unauthenticated" &&
      pathname !== "/login" &&
      pathname !== "/signup"
    ) {
      router.replace("/login");
    }
  }, [status, pathname, router]);

  if (
    status === "loading" &&
    pathname !== "/login" &&
    pathname !== "/signup"
  ) {
    return <div>Loading...</div>;
  }
  return <>{children}</>;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
} 