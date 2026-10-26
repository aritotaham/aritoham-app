"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isRegistered } from "@/lib/contract";
import { LIVE } from "@/lib/data";
import { useWallet } from "./WalletProvider";

/** Wallets already confirmed as registered in this browser tab (skips re-checking on every page). */
const verified = new Set<string>();

/** Call this right after a successful registration so the guard doesn't bounce the user back. */
export function markRegistered(address?: string | null) {
  if (address) verified.add(address.toLowerCase());
}

const isRegisterPath = (p: string) => p === "/register" || p.startsWith("/register/");

/**
 * Wrap the pages. On every connection (and account switch) it asks the contract
 * whether the wallet is registered; if not, it redirects to /register.
 */
export default function RegistrationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { address } = useWallet();

  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [, force] = useState(0);

  const me = address?.toLowerCase() ?? "";
  const onRegister = isRegisterPath(pathname);
  const passed = !LIVE || !me || onRegister || verified.has(me);

  useEffect(() => {
    if (passed) return;
    let live = true;
    setError(false);
    isRegistered(me)
      .then((ok) => {
        if (!live) return;
        if (ok) { verified.add(me); force((n) => n + 1); }
        else router.replace("/register");
      })
      .catch(() => live && setError(true));
    return () => { live = false; };
  }, [passed, me, attempt, router]);

  if (passed) return <>{children}</>;

  // checking, or redirecting to /register
  return (
    <div className="panel" style={{ padding: 28, textAlign: "center", color: "var(--muted)", fontWeight: 700 }}>
      {error ? (
        <>
          Could not check your registration.{" "}
          <button className="btn btn-sm" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
        </>
      ) : (
        "Checking your registration…"
      )}
    </div>
  );
}