"use client";

import { useEffect, useState } from "react";
import { getClient } from "@/lib/contract";
import { RequireWallet } from "../ui";
import { EXPLORER, useRegistered } from "@/lib/data";
import { useWallet } from "../WalletProvider";
import { readProtocol } from "@/lib/contract/core/contracts";
import { registerUser } from "@/lib/contract/services/writeProtocol";
import RegisterDesign, { type RefCheck, type SubmitMsg } from "./RegisterDesign";

import { markRegistered } from "../RegistrationGuard";

const ADDR = /^0x[0-9a-fA-F]{40}$/;

/** Checks the referrer on-chain: must be registered AND active (same rules register() enforces). */
async function checkReferrer(referrer: string, me?: string | null): Promise<RefCheck> {
  const ref = referrer.trim().toLowerCase() as `0x${string}`;
  if (!ADDR.test(ref)) return "bad";
  if (me && me.toLowerCase() === ref) return "self";
  const [registered, active] = await Promise.all([
    readProtocol("isUserRegistered", [ref]) as Promise<boolean>,
    readProtocol("isUserActive", [ref]) as Promise<boolean>,
  ]);
  if (!registered) return "not-registered";
  if (!active) return "not-active";
  return "ok";
}

/** Turns wallet / contract errors into a readable sentence. */
function errorText(e: any): string {
  const rejected = (x: any) => x?.code === 4001 || x?.name === "UserRejectedRequestError";
  if (rejected(e) || (typeof e?.walk === "function" && e.walk(rejected))) return "You rejected the request in your wallet.";
  const m: string = e?.shortMessage ?? e?.message ?? "Registration failed.";
  if (/AlreadyRegistered/i.test(m)) return "This wallet is already registered.";
  if (/ReferrerNotRegistered/i.test(m)) return "The referrer wallet is not registered in the protocol.";
  if (/ReferrerNotActive/i.test(m)) return "The referrer has not participated yet, so they cannot sponsor new members.";
  if (/EnforcedPause/i.test(m)) return "The protocol is paused right now.";
  if (/insufficient funds/i.test(m)) return "You need BNB in your wallet to pay network fees.";
  return m;
}

/** Used by /register and /register/[ref]. `initialRef` comes from the URL. */
export default function RegisterView({ initialRef = "" }: { initialRef?: string }) {
  const { address } = useWallet();

  /* ── is this wallet already registered? ── */
  const reg = useRegistered(address);
  const checking = !!address && reg.loading;
  const registered = reg.data === true;

  /* ── referrer check (runs while typing / when the link opens) ── */
  const [referrer, setReferrer] = useState(initialRef);
  const [check, setCheck] = useState<RefCheck>("idle");

  useEffect(() => {
    const r = referrer.trim();
    if (!r) return setCheck("idle");
    if (!ADDR.test(r)) return setCheck("bad");
    let live = true;
    setCheck("checking");
    checkReferrer(r, address)
      .then((s) => live && setCheck(s))
      .catch(() => live && setCheck("offline"));
    return () => { live = false; };
  }, [referrer, address]);

  useEffect(() => { if (registered) markRegistered(address); }, [registered, address]);

  /* ── submit ── */
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("Confirm in your wallet…");
  const [msg, setMsg] = useState<SubmitMsg>(null);

  const onSubmit = async () => {
    if (!address) return setMsg({ type: "error", text: "Please connect your wallet first." });
    const r = referrer.trim();

    try {
      setBusy(true);
      setMsg(null);

      // 1. re-check the referrer right now (nothing goes to the wallet unless this is "ok")
      setLabel("Checking referrer…");
      const status = await checkReferrer(r, address);
      setCheck(status);
      if (status !== "ok") {
        setMsg({
          type: "error",
          text:
            status === "self" ? "You cannot use your own wallet as the referrer." :
            status === "not-registered" ? "This referrer wallet is not registered in the protocol." :
            status === "not-active" ? "This referrer has not participated yet, so they cannot sponsor new members." :
            "Enter a valid referrer wallet address.",
        });
        return;
      }

      // 2. registration transaction (opens the wallet)
      setLabel("Confirm in your wallet…");
      const hash = await registerUser(r);

      // 3. wait until it is mined
      setLabel("Confirming…");
      setMsg({ type: "pending", text: "Transaction submitted. Waiting for network confirmation…", hash });
      const receipt = await getClient().waitForTransactionReceipt({ hash, timeout: 180_000 });
      if (receipt.status !== "success") throw new Error("The transaction was reverted on-chain.");

      // 4. done -> re-check registration (shows the success card)
      setMsg({ type: "ok", text: "Registration confirmed on-chain.", hash });
      markRegistered(address);          // ← add this line
      reg.reload();
      setTimeout(reg.reload, 5000); // RPC nodes can lag a few seconds behind the receipt
    } catch (e) {
      setMsg({ type: "error", text: errorText(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <RequireWallet>
      {checking ? (
        <div className="panel" style={{ padding: 28, textAlign: "center", color: "var(--muted)", fontWeight: 700 }}>
          Checking your registration…
        </div>
      ) : reg.error ? (
        <div className="alert warn" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span>Could not check your registration.</span>
          <button className="btn btn-sm" onClick={reg.reload}>Retry</button>
        </div>
      ) : (
        <RegisterDesign
          address={address ?? ""}
          referrer={referrer}
          onReferrerChange={(v) => { setReferrer(v); setMsg(null); }}
          check={check}
          msg={msg}
          busy={busy}
          busyLabel={label}
          registered={registered}
          explorer={EXPLORER}
          onSubmit={onSubmit}
        />
      )}
    </RequireWallet>
  );
}