"use client";

import Link from "next/link";
import { PageTitle, Panel, Pill } from "../ui";

export type RefCheck = "idle" | "checking" | "ok" | "bad" | "offline" | "self" | "not-registered" | "not-active";

/** The message shown after pressing Register. Set it from your own code. */
export type SubmitMsg = { type: "ok" | "error" | "pending"; text: string; hash?: string } | null;

const CHECK_TEXT: Record<Exclude<RefCheck, "idle">, string> = {
  checking: "Checking referrer…",
  ok: "Valid referrer",
  bad: "Enter a valid wallet address (0x…).",
  offline: "Could not verify the referrer right now. Check your connection and retry.",
  self: "You cannot use your own wallet as the referrer.",
  "not-registered": "This referrer wallet is not registered in the protocol.",
  "not-active": "This referrer has not participated yet, so they cannot sponsor new members.",
};

type Props = {
  address: string;                       // connected wallet
  referrer: string;
  onReferrerChange: (v: string) => void;
  check: RefCheck;                       // referrer validation state
  msg: SubmitMsg;                        // submit message
  busy: boolean;                         // true while wallet / network is working
  busyLabel?: string;                    // e.g. "Confirm in your wallet…"
  registered: boolean;                   // show the success card instead of the form
  explorer: string;                      // e.g. https://testnet.bscscan.com
  onSubmit: () => void;
};

export default function RegisterDesign(p: Props) {
  const tone = p.check === "ok" ? "ok" : p.check === "checking" || p.check === "idle" ? "muted" : "bad";
  const canSubmit = p.check === "ok" && !p.busy;

  return (
    <>
      <PageTitle title="Register" sub="Join with your sponsor's referral link." right={<Pill tone="green" dot>Verified Smart Contract</Pill>} />

      <div className="grid g-main">
        <Panel title="Create Your Account" sub="Registration is one wallet transaction. It only costs network gas.">
          {p.registered ? (
            <div className="reg-done">
              <div className="reg-done-ico">✓</div>
              <h3>You&apos;re registered</h3>
              <p>Your wallet is now part of the protocol. Make your first participation to activate your account.</p>
              {p.msg?.hash && (
                <a className="link" href={`${p.explorer}/tx/${p.msg.hash}`} target="_blank" rel="noopener noreferrer">View transaction ↗</a>
              )}
              <Link href="/staking" className="btn btn-gold btn-block">Continue to Protocol Participation</Link>
            </div>
          ) : (
            <>
              <label className="field-l" htmlFor="r-me">Your wallet</label>
              <div className="reg-field reg-readonly">
                <span className="reg-dot" />
                <input id="r-me" className="inp" readOnly value={p.address} />
              </div>

              <label className="field-l" htmlFor="r-ref" style={{ marginTop: 18 }}>Referrer wallet</label>
              <div className={`reg-field reg-${tone}`}>
                <input id="r-ref" className="inp" placeholder="0x..." value={p.referrer} onChange={(e) => p.onReferrerChange(e.target.value)} />
                {p.check === "ok" && <span className="reg-badge ok">✓</span>}
                {p.check === "checking" && <span className="reg-spin" />}
                {["bad", "offline", "self", "not-registered", "not-active"].includes(p.check) && <span className="reg-badge bad">!</span>}
              </div>
              {p.check !== "idle" && <div className={`reg-hint ${tone}`}>{CHECK_TEXT[p.check]}</div>}

              {/* ── submit message ── */}
              {p.msg && (
                <div className={`reg-msg ${p.msg.type}`} role={p.msg.type === "error" ? "alert" : "status"}>
                  <span className="reg-msg-ico">{p.msg.type === "ok" ? "✓" : p.msg.type === "error" ? "!" : <i className="reg-spin" />}</span>
                  <div>
                    <div>{p.msg.text}</div>
                    {p.msg.hash && (
                      <a className="link" href={`${p.explorer}/tx/${p.msg.hash}`} target="_blank" rel="noopener noreferrer">View on explorer ↗</a>
                    )}
                  </div>
                </div>
              )}

              <button className="btn btn-gold btn-block" style={{ marginTop: 18 }} disabled={!canSubmit} onClick={p.onSubmit}>
                {p.busy ? p.busyLabel ?? "Please wait…" : "Register"}
              </button>
            </>
          )}
        </Panel>

        <Panel title="How it works">
          <ol className="reg-steps">
            <li><b>1</b><div><strong>Find a sponsor</strong><span>Open their referral link or paste their wallet address.</span></div></li>
            <li><b>2</b><div><strong>Confirm in your wallet</strong><span>One transaction on BSC Testnet. Only network gas is charged.</span></div></li>
            <li><b>3</b><div><strong>Activate your account</strong><span>Make your first participation to start earning.</span></div></li>
          </ol>
        </Panel>
      </div>
    </>
  );
}