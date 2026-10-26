"use client";

import { useMemo, useState } from "react";
import { Addr, DataTable, Hero, Icon, Mini, PageTitle, Panel, Pill, RequireWallet, inRange } from "../ui";
import { useBalances, useDashboard, useMarket, useParticipation, useRules } from "@/lib/data";
import { useWallet } from "../WalletProvider";
import { fmtUS, usd } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { getClient } from "@/lib/contract";

import { approveUSDT, stakeTokens } from "@/lib/contract/services/writeProtocol";

export default function ParticipationView() {
  const { address } = useWallet();
  const { data: PARTICIPATION } = useParticipation(address);
  const { data: d } = useDashboard(address);
  const { data: mk } = useMarket();
  const { data: bal } = useBalances(address);
  const { data: rules } = useRules();
  const PRICE = mk.price;
  const maxBuy = rules.maxBuy, minBuy = rules.minBuy, step = rules.buyStep;
  const [amt, setAmt] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const a = parseFloat(amt) || 0;
  const valid = a >= minBuy && a <= maxBuy && a % step === 0;
  const rows = useMemo(
    () => PARTICIPATION.filter((r) => String(r.hash).toLowerCase().includes(q.trim().toLowerCase()) && inRange(r.ts, from, to)),
    [PARTICIPATION, q, from, to]
  );
 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!valid) {
      setMsg({  ok: false,  t: `Enter an amount between $${minBuy} and $${maxBuy} in multiples of $${step}.`,});
      return;
    }

    if (a > bal.usdt) {
      setMsg({  ok: false,  t: "Insufficient USDT balance in your wallet.",});
      return;
    }

    if (!address) {
      setMsg({ ok: false, t: "Please connect your wallet first." });
      return;
    }

    try {
      setIsSubmitting(true);
      setMsg({ ok: true, t: "Please confirm the USDT approval in your wallet." });

      // Replace this with the actual decimals of your deployed USDT token.
      const USDT_DECIMALS = 18;

      const approvalHash = await approveUSDT(String(a), USDT_DECIMALS);

      setMsg({  ok: true,  t: `Approval submitted: ${approvalHash}. Confirm it before staking.`,});

      setMsg({ ok: true, t: `Transaction submitted. Waiting for network confirmation… ${approvalHash}` });
      const receipt = await getClient().waitForTransactionReceipt({ hash: approvalHash, timeout: 180_000 });
      if (receipt.status !== "success") throw new Error("The transaction was reverted on-chain.");
      setMsg({ ok: true, t: `Transaction Confirmed.` });
      

      // IMPORTANT: Wait for the approval transaction receipt here
      // before submitting the stake transaction.


      setMsg({ ok: true, t: `Please confirm protocol participate transaction…` });
      const stakeHash = await stakeTokens(String(a), USDT_DECIMALS);
      setMsg({ ok: true, t: `Transaction submitted. Waiting for network confirmation… ${stakeHash}` });
      const receipt_1 = await getClient().waitForTransactionReceipt({ hash: stakeHash, timeout: 180_000 });
      if (receipt_1.status !== "success") throw new Error("The transaction was reverted on-chain.");

      setMsg({  ok: true,  t: `Participation transaction confirmed: ${stakeHash}`,});
    } catch (error) {
      setMsg({  ok: false,  t: error instanceof Error ? error.message : "Transaction failed.",});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Protocol Participation"
        sub={`Participate with between $${minBuy} and $${maxBuy} in multiples of $${step}.`}
        right={<Pill tone="green" dot>Verified Smart Contract</Pill>}
      />
      <RequireWallet>
        <Hero
          eyebrow="Participation Overview"
          title="Protocol Participation Control"
          desc="Quick summary of contribution power, wallet liquidity and daily emission rewards before you confirm participation."
          tiles={[
            { icon: "wallet", label: "Available USDT", value: usd(bal.usdt, 2), hint: "Wallet ready to participate" },
            { icon: "link", label: "Total Minted", value: usd(d.totalMinted, 0), hint: "Active protocol contribution" },
            { icon: "spark", label: "Reward Income", value: usd(d.income.reward, 4), hint: "Current daily reward amount" },
            { icon: "shield", label: "Maximum Contribution", value: usd(maxBuy, 0), hint: "Per user maximum limit" },
          ]}
        />

        <div className="grid g-main">
          <Panel title="Create Participation" sub="Preview and confirm your contribution amount." badge="Live Preview">
            <div className="cols-2" style={{ gridTemplateColumns: "auto auto 1fr", justifyContent: "start" }}>
              <Mini flat label="Available USDT" value={usd(bal.usdt, 2)} />
              <Mini flat label="Maximum Contribution" value={usd(maxBuy, 0)} />
            </div>
            <label className="field-l" htmlFor="p-amt" style={{ marginTop: 20 }}>Contribution Amount</label>
            <input id="p-amt" className="inp" type="number" inputMode="numeric" placeholder={`$${minBuy} - $${maxBuy}`} value={amt} onChange={(e) => { setAmt(e.target.value); setMsg(null); }} />
            <div className="quick">
              {[100, 500, 1000].map((v) => (<button key={v} onClick={() => setAmt(String(v))}>${v.toLocaleString("en-US")}</button>))}
            </div>
            <div style={{ marginTop: 14, borderRadius: 16, border: "1px solid var(--line)", background: "#0e0e11", padding: "14px 16px" }}>
              <div className="field-l" style={{ marginBottom: 2 }}>Participation Breakdown</div>
              {valid ? (
                <div style={{ marginTop: 6 }}>
                  <div className="kv"><span>Contribution</span><b>{usd(a)}</b></div>
                  <div className="kv"><span>Token price</span><b>{usd(PRICE, 6)}</b></div>
                  <div className="kv"><span>Tokens minted</span><b>{(a / PRICE).toLocaleString("en-US", { maximumFractionDigits: 4 })} {BRAND.token}</b></div>
                  <div className="kv"><span>Est. daily reward</span><b className="gold-t">{usd(a * 0.01253, 4)}</b></div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Enter amount to preview fees, minted tokens and reward cap.</div>
              )}
            </div>
            {msg && <div className={`alert ${msg.ok ? "ok" : "warn"}`} style={{ marginTop: 14 }}>{msg.t}</div>}
            
            <button
              className="btn btn-gold btn-block"
              style={{ marginTop: 16 }}
              onClick={submit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing Transaction..." : "Confirm Participation"}
            </button>

          </Panel>

          <Panel title="Participation Summary">
            <div className="stack" style={{ gap: 14 }}>
              <Mini label="Total Minted" value={usd(d.totalMinted, 0)} />
              <Mini label="Daily Reward" value={usd(d.income.reward, 4)} />
              <Mini label="Token Price" value={usd(PRICE, 6)} />
            </div>
          </Panel>
        </div>

        <Panel title="Participation History" badge="All Transactions" className="" >
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 190px 190px", gap: 12, marginBottom: 20 }} className="hist-filters">
            <div className="search"><Icon name="search" size={16} /><input className="inp" placeholder="Search by transaction hash..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <input className="inp" type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input className="inp" type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <DataTable
            rows={rows}
            variant="page"
            columns={[
              { key: "ts", label: "Date & Time", render: (r) => fmtUS(r.ts) },
              { key: "hash", label: "Txn Hash", render: (r) => <Addr text={r.hash} link /> },
              { key: "minted", label: "Minted Amount", render: (r) => usd(r.minted, 4) },
              { key: "price", label: "Token Price", render: (r) => usd(r.price, 6) },
              { key: "tokens", label: "Tokens Minted", render: (r) => r.tokens.toFixed(4) },
              { key: "reward", label: "Reward Amount", render: (r) => usd(r.reward, 4) },
              { key: "a", label: "Actions", render: () => <button className="btn btn-sm"><Icon name="ext" size={13} /> View</button> },
            ]}
          />
        </Panel>
      </RequireWallet>
    </>
  );
}
