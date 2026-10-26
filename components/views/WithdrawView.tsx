"use client";

import { useMemo, useState } from "react";
import { Addr, DataTable, Hero, Icon, Mini, PageTitle, Panel, Pill, RequireWallet, inRange } from "../ui";
import { useDashboard, useMarket, useRules, useWithdrawals } from "@/lib/data";
import { useWallet } from "../WalletProvider";
import { fmtUS, usd } from "@/lib/format";
import { BRAND } from "@/lib/brand";

import { withdraw } from "@/lib/contract/services/writeProtocol";
import { getError } from "@/lib/helper/getError";

const RULES = [
  { icon: "shield", t: "On-Chain Processing", d: `All withdrawals are processed securely on-chain. The final ${BRAND.token} token amount is calculated using the live token price at the exact time of the transaction.` },
  { icon: "percent", t: "Dynamic Fee Structure", d: "A 5% fee is automatically deducted from each withdrawal request to support the protocol ecosystem and sustain liquidity pools." },
  { icon: "dollar", t: "Strict Limits", d: "The minimum withdrawal amount is $10. For security purposes, your maximum daily withdrawal limit is strictly capped at $3,000." },
  { icon: "clock", t: "Network Times", d: "Depending on current blockchain congestion, it may take a few moments for the funds to be fully confirmed and arrive in your connected wallet." },
];

export default function WithdrawView() {
  const { address } = useWallet();
  const { data: WITHDRAWALS } = useWithdrawals(address);
  const { data: d } = useDashboard(address);
  const { data: mk } = useMarket();
  const { data: rules } = useRules();
  const PRICE = mk.price;
  const lim = d.limits;
  const [amt, setAmt] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const a = parseFloat(amt) || 0;
  const fee = a * 0.05;
  const net = a - fee;

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return WITHDRAWALS.filter((r) => inRange(r.ts, from, to) && (!s || [r.hash, r.wallet, String(r.amount)].some((v) => String(v).toLowerCase().includes(s))));
  }, [WITHDRAWALS, q, from, to]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submit = async () => {

    if (a < rules.minWithdraw) return setMsg({ ok: false, t: `Minimum withdrawal is $${rules.minWithdraw}.` });
    if (a > lim.withdrawLeft) return setMsg({ ok: false, t: "Amount exceeds your 24 hour limit." });
    if (a > lim.availableEstimate) return setMsg({ ok: false, t: "Amount exceeds your available balance." });

    try {
      setIsSubmitting(true);
      setMsg({ ok: true, t: "Withdrawal request ready. Confirm it in your wallet." });

      // Replace this with the actual decimals of your deployed USDT token.
      const USDT_DECIMALS = 18;

      const withdrawlHash = await withdraw(String(a), USDT_DECIMALS);

      setMsg({  ok: true,  t: `Withdraw submitted: ${withdrawlHash}. Confirm it.`,});

    } catch (error) {
      let errMsg = getError(error) as string;
      if (errMsg === "InsufficientTokens") {
        errMsg = "The contract does not have enough ARI tokens available for withdrawal. Please try again later.";
      }
      setMsg({  ok: false,  t: error instanceof Error ? errMsg : "Transaction failed.",});
    } finally {
      setIsSubmitting(false);
    }

  };

  return (
    <>
      <PageTitle
        title="Withdraw Funds"
        sub="Minimum withdrawal $10. Daily limit $3000 with a 5% fee."
        right={
          <Pill tone="green" dot>
            On-chain Payout
          </Pill>
        }
      />
      <RequireWallet>
        <Hero
          eyebrow="Claim Overview"
          title="Claim Rewards Center"
          desc="Check available rewards, 24-hour claim room and protocol fee before making a claim request."
          tiles={[
            {
              icon: "wallet",
              label: "Available Rewards",
              value: usd(lim.availableEstimate, 2),
              hint: "Ready for claim request",
            },
            {
              icon: "clock",
              label: "24H Limit Left",
              value: usd(lim.withdrawLeft),
              hint: "Remaining daily claim limit",
            },
            {
              icon: "percent",
              label: "Claim Fee",
              value: "5%",
              hint: "Deducted from each request",
            },
            {
              icon: "dollar",
              label: "Minimum Claim",
              value: "$10",
              hint: "Smallest allowed request",
            },
          ]}
        />
        <div className="grid g-main" style={{ marginBottom: 20 }}>
          <Panel
            title="Create withdrawal"
            sub="Withdraw from your on-chain available balance to your wallet."
            badge="5% Fee"
          >
            <div className="cols-2">
              <Mini
                flat
                label="Available Balance"
                value={usd(lim.availableEstimate, 2)}
              />
              <Mini flat label="24H Limit Left" value={usd(lim.withdrawLeft)} />
            </div>
            <label
              className="field-l"
              htmlFor="w-amt"
              style={{ marginTop: 18 }}
            >
              Amount USD
            </label>
            <input
              id="w-amt"
              className="inp"
              type="number"
              inputMode="decimal"
              placeholder="Min $10"
              value={amt}
              onChange={(e) => {
                setAmt(e.target.value);
                setMsg(null);
              }}
            />
            <div
              style={{
                marginTop: 14,
                borderRadius: 16,
                border: "1px solid var(--line)",
                background: "#0e0e11",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div className="field-l" style={{ marginBottom: 0 }}>
                    Payout Breakdown
                  </div>
                  <div
                    style={{ fontWeight: 800, fontSize: 13.5, marginTop: 4 }}
                  >
                    Payout preview
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    Enter amount to preview fee and {BRAND.token} payout.
                  </div>
                </div>
                <Pill tone="muted">Live</Pill>
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="kv">
                  <span>Requested amount</span>
                  <b>{a ? usd(a, 4) : "—"}</b>
                </div>
                <div className="kv">
                  <span>Withdrawal fee (5%)</span>
                  <b>{a ? usd(fee, 4) : "—"}</b>
                </div>
                <div className="kv">
                  <span>Net USD value</span>
                  <b>{a ? usd(net, 4) : "—"}</b>
                </div>
                <div className="kv">
                  <span>Live token price</span>
                  <b>{usd(PRICE, 6)}</b>
                </div>
                <div className="kv">
                  <span>You receive</span>
                  <b className="gold-t">
                    {a
                      ? `${(net / PRICE).toLocaleString("en-US", {
                          maximumFractionDigits: 4,
                        })} ${BRAND.token}`
                      : "—"}
                  </b>
                </div>
              </div>
            </div>
            <div className="alert ok" style={{ marginTop: 14 }}>
              <Icon name="shield" size={17} />
              <span>
                Withdrawals are processed on-chain. The final {BRAND.token}{" "}
                amount uses the live token price at transaction time.
              </span>
            </div>
            {msg && (
              <div
                className={`alert ${msg.ok ? "ok" : "warn"}`}
                style={{ marginTop: 12 }}
              >
                {msg.t}
              </div>
            )}
            <button
              className="btn btn-gold btn-block"
              style={{ marginTop: 16 }}
              onClick={submit}
              disabled={isSubmitting}
            >
               {isSubmitting ? "Processing Transaction..." : "Confirm Withdrawal"}
            </button>
          </Panel>

          <Panel
            title="Withdrawal Rules"
            sub="Please review the following policies before requesting a withdrawal."
          >
            {RULES.map((r) => (
              <div className="rule" key={r.t}>
                <span className="ico">
                  <Icon name={r.icon} size={19} />
                </span>
                <div>
                  <h4>{r.t}</h4>
                  <p>{r.d}</p>
                </div>
              </div>
            ))}
          </Panel>
        </div>

        <Panel
          title="Withdraw History"
          badge={`${WITHDRAWALS.length} Requests`}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 190px 190px auto",
              gap: 12,
              marginBottom: 20,
            }}
            className="hist-filters"
          >
            <div className="search">
              <Icon name="search" size={16} />
              <input
                className="inp"
                placeholder="Search by transaction hash, wallet, or amount..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <input
              className="inp"
              type="date"
              aria-label="From date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              className="inp"
              type="date"
              aria-label="To date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <button
              className="btn"
              onClick={() => {
                setQ("");
                setFrom("");
                setTo("");
              }}
            >
              <Icon name="refresh" size={15} /> Reset
            </button>
          </div>
          <DataTable
            rows={rows}
            columns={[
              { key: "ts", label: "Date & Time", render: (r) => fmtUS(r.ts) },
              {
                key: "hash",
                label: "Txn Hash",
                render: (r) => <Addr text={r.hash} link />,
              },
              {
                key: "amount",
                label: "Amount",
                render: (r) => usd(r.amount, 4),
              },
              { key: "wallet", label: "Wallet" },
              { key: "fee", label: "Fee", 
                render: (r) => `${r.fee.toFixed(4)} ${BRAND.token}`,
              },
              {
                key: "tokens",
                label: `Received (${BRAND.token})`,
                render: (r) => `${r.tokens.toFixed(4)} ${BRAND.token}`,
              },
              {
                key: "a",
                label: "Actions",
                render: () => (
                  <button className="btn btn-sm">
                    <Icon name="ext" size={13} /> View
                  </button>
                ),
              },
            ]}
          />
        </Panel>
      </RequireWallet>
    </>
  );
}
