"use client";

import Link from "next/link";
import { useState } from "react";
import { useWallet } from "../WalletProvider";
import { CopyBtn, Donut, Icon, Mini, Panel, Pill, PriceChart, RequireWallet, PageTitle } from "../ui";
import { EXPLORER, useBalances, useCap, useContracts, useDashboard, useMarket } from "@/lib/data";
import { BRAND, DEMO_ADDRESS } from "@/lib/brand";
import { usd, money, num } from "@/lib/format";
import { getClient } from "@/lib/contract";

import { sellTokens, approveARITOHEM } from "@/lib/contract/services/writeProtocol";

function SellCard({ price, walletToken, sellLeft }: { price: number; walletToken: number; sellLeft: number }) {
  const PRICE = price;
  const [amt, setAmt] = useState("");
  const [open, setOpen] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const a = parseFloat(amt) || 0;
  const total = a * PRICE;
  const receive = total * 0.85;

    const [isSubmitting, setIsSubmitting] = useState(false);
  
    const submit = async () => {
      
      if (a <= 0) return setMsg({ok: false, t: "Enter an amount to sell."});
      if (a > walletToken) return setMsg({ok: false, t: `Insufficient ${BRAND.token} balance.`});
      if (total > sellLeft) return setMsg({ok: false, t: "Amount exceeds your 24 hour limit."});
  
      try {
        setIsSubmitting(true);
        setMsg({ ok: true, t: "Please confirm the ARITOHAM approval in your wallet." });
  
        // Replace this with the actual decimals of your deployed Aritoham token.
        const ARITOHAM_DECIMALS = 18;
  
        const approvalHash = await approveARITOHEM(String(a), ARITOHAM_DECIMALS);
  
        setMsg({  ok: true,  t: `Approval submitted: ${approvalHash}. Confirm it before staking.`,});

        setMsg({ ok: true, t: `Transaction submitted. Waiting for network confirmation… ${approvalHash}` });
        const receipt = await getClient().waitForTransactionReceipt({ hash: approvalHash, timeout: 180_000 });
        if (receipt.status !== "success") throw new Error("The transaction was reverted on-chain.");
        setMsg({ ok: true, t: `Transaction Confirmed.` });
          
  
        // IMPORTANT: Wait for the approval transaction receipt here
        // before submitting the sellToken transaction.
  
        setMsg({ ok: true, t: `Please confirm ARI sell transaction…` });
        const sellTokenHash = await sellTokens(String(a), ARITOHAM_DECIMALS);

        setMsg({ ok: true, t: `Transaction submitted. Waiting for network confirmation… ${sellTokenHash}` });
        const receipt_1 = await getClient().waitForTransactionReceipt({ hash: sellTokenHash, timeout: 180_000 });
        if (receipt_1.status !== "success") throw new Error("The transaction was reverted on-chain.");
        setMsg({ ok: true, t: `Transaction Confirmed.` });
  
        setMsg({ ok: true, t: `Token Sold : ${sellTokenHash}` });
      } catch (error) {
        setMsg({  ok: false,  t: error instanceof Error ? error.message : "Transaction failed.",});
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <Panel title="Sell Token" sub="Preview token sale and estimated payout." badge={<>Wallet Value: <b style={{ color: "var(--green)" }}>$0</b></>} tone="green">
      <div className="cols-3">
        <Mini flat label="Rate" value={<span style={{ fontSize: 17 }}>{usd(PRICE, 6)}</span>} />
        <Mini flat label={`Wallet ${BRAND.token}`} value={<span style={{ fontSize: 17 }}>{num(walletToken)}</span>} />
        <Mini flat label="Daily Limit Left" value={<span style={{ fontSize: 17 }}>{money(sellLeft, 0).replace(/(\d)(?=(\d{3})+$)/g, "$1,")}</span>} />
      </div>
      <label className="field-l" htmlFor="sell-amt" style={{ marginTop: 18 }}>Enter amount {BRAND.token}</label>
      <input id="sell-amt" className="inp" type="number" inputMode="decimal" placeholder="0.00" value={amt} onChange={(e) => { setAmt(e.target.value); setMsg(null); }} />
      <div style={{ marginTop: 14, borderRadius: 16, border: "1px solid var(--line)", background: "#0e0e11", padding: "14px 16px" }}>
        <button onClick={() => setOpen(!open)} style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", background: "transparent", border: 0, fontSize: 11.5, fontWeight: 800, letterSpacing: ".12em", color: "var(--muted)", textTransform: "uppercase" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>Estimated receive <span style={{ transform: open ? "none" : "rotate(180deg)" }}><Icon name="down" size={14} /></span></span>
          <b style={{ color: "var(--text)", fontSize: 15 }}>{usd(receive, 4)}</b>
        </button>
        {open && (
          <div style={{ marginTop: 10 }}>
            <div className="kv"><span>TOKEN PRICE</span><b>{usd(PRICE, 6)}</b></div>
            <div className="kv"><span>TOTAL VALUE</span><b>{usd(total, 4)}</b></div>
            <div className="kv"><span>TOKEN BURN</span><b>100%</b></div>
            <div className="kv"><span>YOU RECEIVE (85%)</span><b className="gold-t">{usd(receive, 4)}</b></div>
            <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 8, fontWeight: 600 }}>Calculated from live {BRAND.token} price. Max $3000 per 24 hours.</div>
          </div>
        )}
      </div>
      {msg && <div className={`alert ${msg.ok ? "ok" : "warn"}`} style={{ marginTop: 14 }}>{msg.t}</div>}
      <button
        className="btn btn-gold btn-block"
        style={{ marginTop: 16 }}
        onClick={submit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing Transaction..." : "Sell Token"}
      </button>
    </Panel>
  );
}

export default function DashboardView() {
  const { address } = useWallet();
  const addr = address || DEMO_ADDRESS;
  const ref = `https://${BRAND.domain}/register/${addr}`;
  const { data: d } = useDashboard(address);
  const { data: mk } = useMarket();
  const { data: bal } = useBalances(address);
  const PRICE = mk.price;
  const inc = d.income, biz = d.business, rk = d.rank, lim = d.limits, dao = d.dao;
  const chg = `${mk.changePct >= 0 ? "+" : ""}${mk.changePct.toFixed(2)}%`;
  const { data: cap } = useCap(address);
  const { data: ca } = useContracts();
  const capEarned = cap.caEarned, capTotal = cap.totalCap, capLeft = cap.remaining, capPct = cap.usedPct;


  const chartSeries = (mk.series ?? []).map((v: unknown) => Number(v)).filter((v: number) => Number.isFinite(v));
  const chartLabels = (mk.labels ?? []).slice(0, chartSeries.length);
  const chartReady = chartSeries.length >= 2;

  return (
    <>
      <PageTitle
        title="Dashboard Overview"
        sub="Wallet balance, token price, contracts and protocol market snapshot."
        right={
          <>
            <Link href="/price-calculator" className="btn btn-gold">
              <Icon name="calculator" size={16} /> Calculator
            </Link>
            <Pill tone="green" dot>
              Live Dashboard
            </Pill>
          </>
        }
      />
      <RequireWallet>
        <div className="stack">
          <div className="grid g-dash">
            <div className="stack">
              <section className="wallet-hero">
                <div className="wh-top">
                  <div>
                    <div
                      className="eyebrow"
                      style={{ color: "rgba(255,244,214,.78)" }}
                    >
                      {BRAND.name} Protocol Wallet
                    </div>
                    <h2
                      className="dashboard_protocol_overview_heading"
                      style={{
                        fontFamily: "var(--display)",
                        fontSize: 27,
                        fontWeight: 700,
                        color: "#fff8e4",
                        marginTop: 4,
                      }}
                    >
                      Wallet &amp; Protocol Overview
                    </h2>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,244,214,.82)",
                        fontWeight: 600,
                        marginTop: 4,
                      }}
                    >
                      Live wallet, rewards, token price, liquidity and supply
                      snapshot.
                    </p>
                  </div>
                  <div className="price-pill">
                    <i />
                    {usd(PRICE, 6)} <small>({chg})</small>
                  </div>
                </div>
                <div className="wh-box">
                  <div>
                    <div className="l">Wallet Balance</div>
                    <div className="v">{usd(d.limits.availableEstimate)}</div>
                    <div className="s">
                      Total Withdrawal: {usd(lim.totalWithdrawn, 4)}
                    </div>
                  </div>
                  <div className="r">
                    <div className="l">Total Income</div>
                    <div className="v">{usd(inc.total, 4)}</div>
                    <div className="s">
                      Today&apos;s Income: {usd(inc.today, 4)}
                    </div>
                  </div>
                </div>
                <div className="contract">
                  <div>
                    <div className="k">Protocol Contract</div>
                    <ContractRow value={ca.protocol} />
                    <div className="k">Token Contract</div>
                    <ContractRow value={ca.token} last />
                  </div>
                  <div className="tm">
                    <div
                      className="k"
                      style={{ fontSize: 13, fontWeight: 800 }}
                    >
                      Total Minting Contribution
                    </div>
                    <div className="v">{usd(d.totalMinted, 0)}</div>
                  </div>
                </div>
              </section>

              <Panel
                eyebrow="Financial Overview"
                title="Income command center"
                sub="All income and rewards-claimed buckets shown separately for quick reading."
                badge="Live Summary"
              >
                <div className="cols-3">
                  <Mini
                    icon="link"
                    label="Direct Income"
                    value={usd(inc.direct, 4)}
                    hint="Referral commission"
                  />
                  <Mini
                    icon="bars"
                    label="Reward Income"
                    value={usd(inc.reward, 4)}
                    hint="Rewards claimed so far"
                  />
                  <Mini
                    icon="network"
                    label="Generation Income"
                    value={usd(inc.generation, 4)}
                    hint="Level-based allocations"
                  />
                  <Mini
                    icon="users"
                    label="DAO Income"
                    value={usd(inc.dao, 4)}
                    hint="DAO Partner Reward"
                  />
                  <Mini
                    icon="crown"
                    label="Rank Income"
                    value={usd(inc.rankIncome, 4)}
                    hint="Unlocked rank allocations"
                  />
                  <Mini
                    icon="crown"
                    label="Rank Incentive Income"
                    value={usd(inc.rankIncentive, 4)}
                    hint="From unlimited depth"
                  />
                </div>
              </Panel>

              <Panel
                eyebrow="Today Performance"
                title="Daily activity monitor"
                sub="Today's business, team movement and member activity."
                badge="Live Report"
                tone="green"
              >
                <div className="cols-3">
                  <Mini
                    icon="dollar"
                    label="Direct Business"
                    value={usd(biz.todayDirectBusiness, 4)}
                  />
                  <Mini
                    icon="bars"
                    label="Team Business"
                    value={usd(biz.todayTeamBusiness, 4)}
                  />
                  <Mini
                    icon="user"
                    label="New Members"
                    value={String(biz.todayNewMembers)}
                  />
                </div>
              </Panel>
            </div>

            <div className="stack">
              <Panel
                eyebrow="Rank Tracker"
                title="Matching Journey"
                sub={`Current status toward ${rk.nextName} rank.`}
                badge={rk.nextName}
              >
                <div className="rank-card">
                  <span className="rank-ico">
                    <Icon name="crown" size={24} />
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: ".15em",
                        color: "var(--muted)",
                        fontWeight: 800,
                      }}
                    >
                      CURRENT RANK
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--display)",
                        fontSize: 22,
                        fontWeight: 700,
                      }}
                    >
                      {rk.currentName}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--muted)",
                        fontWeight: 600,
                      }}
                    >
                      {rk.progressPct.toFixed(0)}% matching volume toward{" "}
                      {rk.nextName}
                    </div>
                  </div>
                </div>
                <div className="mini flat" style={{ marginTop: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span className="lbl">Matching Volume Progress</span>
                    <b style={{ fontFamily: "var(--display)", fontSize: 22 }}>
                      {rk.progressPct.toFixed(0)}%
                    </b>
                  </div>
                  <div className="prog" style={{ margin: "10px 0 6px" }}>
                    <i style={{ width: `${Math.min(100, rk.progressPct)}%` }} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "var(--muted)",
                      fontWeight: 700,
                    }}
                  >
                    <span>0%</span>
                    <span>
                      {money(rk.matchingNow, 0)} /{" "}
                      {money(rk.matchingTarget, 0).replace(
                        /(\d)(?=(\d{3})+$)/g,
                        "$1,"
                      )}{" "}
                      Volume
                    </span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="cols-2" style={{ marginTop: 14 }}>
                  <Mini
                    flat
                    label="Next Target"
                    value={rk.nextName}
                    hint={`${money(
                      Math.max(0, rk.matchingTarget - rk.matchingNow),
                      0
                    )} remaining volume`}
                  />
                  <Mini
                    flat
                    label="Rank Reward"
                    value={money(rk.rewardOnCompletion, 0)}
                    hint="Unlocked after target completion"
                  />
                </div>
              </Panel>

              <section className="funds">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <span className="badge">
                    <Icon name="hand" size={28} />
                  </span>
                  <div>
                    <div className="af-l">AVAILABLE FUNDS</div>
                    <div className="af-v">{usd(dao.pool, 4)}</div>
                  </div>
                </div>
                <h4>DAO Partner Funds</h4>
                <span className="chip">5% DEPOSIT ALLOCATION</span>
                <div className="row">
                  <p>Auto-added from every contract deposit.</p>
                  <Link href="/income/leadership-pool" className="lnk">
                    View Qualified Members →
                  </Link>
                </div>
                <div className="two">
                  <div>
                    <span className="c">
                      <Icon name="users" size={18} />
                    </span>
                    <span>
                      <small>QUALIFIED MEMBERS</small>
                      <b>{dao.lifetimeHolders}</b>
                    </span>
                  </div>
                  <div>
                    <span className="c">
                      <Icon name="dollar" size={18} />
                    </span>
                    <span>
                      <small>VALUE PER SHARE</small>
                      <b>{usd(dao.valuePerShare, 2)}</b>
                    </span>
                  </div>
                </div>
              </section>

              <Panel
                title="Working Cap Limit"
                sub="Track your total working cap usage."
                badge="Active Cap"
              >
                <div className="donut-row">
                  <Donut pct={capPct} />
                  <div style={{ flex: 1, display: "grid", gap: 8 }}>
                    <div className="caprow">
                      <span>Total Cap</span>
                      <b>{money(capTotal, 0)}</b>
                    </div>
                    <div className="caprow">
                      <span>Earned</span>
                      <b>{money(capEarned, 0)}</b>
                    </div>
                    <div className="caprow">
                      <span>Remaining</span>
                      <b>{money(capLeft, 0)}</b>
                    </div>
                  </div>
                </div>
                {capPct >= 90 && (
                  <div className="alert warn" style={{ marginTop: 16 }}>
                    <Icon name="info" size={18} />
                    <div>
                      <b style={{ color: "#ffb4a8" }}>Approaching Cap Limit</b>
                      <div style={{ marginTop: 2, fontWeight: 500 }}>
                        You have consumed {capPct.toFixed(0)}% of your capping
                        limit. Once reached, you will need to restake to
                        continue earning rewards.
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </div>

          <Panel
            eyebrow="Performance Overview"
            title="Business & team snapshot"
            sub="Team size and business movement are separated from income metrics."
            badge="Team Live"
            tone="green"
          >
            <div className="cols-5">
              <Mini
                icon="briefcase"
                label="Direct Business"
                value={usd(biz.directBusiness, 4)}
                hint="Direct business volume"
              />
              <Mini
                icon="bars"
                label="Team Business"
                value={usd(biz.teamBusiness, 4)}
                hint="Total team volume"
              />
              <Mini
                icon="userplus"
                label="Direct Members"
                value={String(biz.directMembers)}
                hint="Personally invited"
              />
              <Mini
                icon="users"
                label="Total Members"
                value={String(biz.totalMembers)}
                hint="Total network members"
              />
              <Mini
                icon="layers"
                label="Level Eligibility"
                value={`${biz.levelEligibility} Levels`}
                hint={`Generation income active up to Level ${biz.levelEligibility}`}
              />
            </div>
          </Panel>

          <Panel
            eyebrow="Invite Members"
            title={`Grow your ${BRAND.token} Network`}
            sub="Share your referral link and build your direct team."
            badge="Referral"
          >
            <div className="ref-row">
              <div className="ref-box">
                <div className="k">REFERRAL LINK</div>
                <div className="v">{ref}</div>
              </div>
              <CopyInvite text={ref} />
            </div>
          </Panel>

          <div className="grid g-sell">
            <SellCard
              price={PRICE}
              walletToken={bal.aritoham}
              sellLeft={lim.sellLeft}
            />
            <section className="mkt">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3>Market Analytics</h3>
                  <div className="sub">Last 24 hours, shown hourly.</div>
                </div>
                <span className="price-pill" style={{ fontSize: 13 }}>
                  {usd(PRICE, 6)} ({chg})
                </span>
              </div>
              <div className="cols-2" style={{ marginTop: 16 }}>
                <div className="mkt-tile">
                  <small>TOTAL LIQUIDITY</small>
                  <b>{usd(mk.liquidity, 3)}</b>
                </div>
                <div className="mkt-tile">
                  <small>TOTAL BURN TOKEN</small>
                  <b>{num(mk.burn, 3)}</b>
                </div>
                <div className="mkt-tile">
                  <small>POOLED USDT</small>
                  <b>{usd(mk.pooledUsdt, 4)}</b>
                </div>
                <div className="mkt-tile">
                  <small>POOLED {BRAND.token} (TOTAL SUPPLY)</small>
                  <b>{num(mk.supply, 3)}</b>
                </div>
              </div>
              <div className="chart-box">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h5>{BRAND.token} Price Movement</h5>
                    <div className="s">24-hour live market trend</div>
                  </div>
                  <span className="pill green">
                    <i className="dot" />
                    Live
                  </span>
                </div>
                {/* <PriceChart data={mk.series} labels={mk.labels} /> */}

                {chartReady ? (
                    <PriceChart data={chartSeries} labels={chartLabels} />
                  ) : (
                    <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12.5, fontWeight: 700, color: "#7a6320" }}>
                      Price data is loading…
                    </div>
                )}

              </div>
            </section>
          </div>
        </div>
      </RequireWallet>
    </>
  );
}

function ContractRow({ value, last }: { value: string; last?: boolean }) {
  const shown = value && value.length > 24 ? `${value.slice(0, 10)}...${value.slice(-10)}` : value || "—";
  return (
    <div className="a" style={last ? { marginBottom: 0 } : undefined}>
      <span title={value}>{shown}</span>
      <button aria-label="Copy" onClick={() => { try { navigator.clipboard?.writeText(value).catch(() => {}); } catch {} }}><Icon name="copy" size={15} /></button>
      <a aria-label="Open in explorer" href={`${EXPLORER}/address/${value}`} target="_blank" rel="noopener noreferrer" style={{ display: "grid", color: "inherit" }}><Icon name="ext" size={15} /></a>
    </div>
  );
}

function CopyInvite({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="btn btn-gold" style={{ padding: "0 28px", borderRadius: 16, minHeight: 56 }} onClick={() => { try { navigator.clipboard?.writeText(text).catch(() => {}); } catch {} setOk(true); setTimeout(() => setOk(false), 1400); }}>
      {ok ? "Copied" : "Copy Invite Link"}
    </button>
  );
}
