"use client";

import { useEffect, useMemo, useState } from "react";
import { getClient } from "@/lib/contract";
import { Addr, DataTable, Hero, Icon, IncomeFilter, IncomeFilters, PageTitle, Panel, RankBadge, RequireWallet, Tabs, Tag, inRange } from "../ui";
import { EXPLORER, useDashboard, useDirectIncome, useEmission, useGenerationIncome, useRank, useStakeTimers } from "@/lib/data";
import { claimRoi } from "@/lib/contract/services/writeProtocol";
import { useWallet } from "../WalletProvider";
import { fmtUS, money, usd } from "@/lib/format";

/* ---------- helpers for the claim countdown ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
const countdown = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

/** Ticks every second; `offsetMs` keeps it in sync with the blockchain clock. */
function useNow(offsetMs = 0) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now + offsetMs;
}

function claimError(e: any): string {
  const rejected = (x: any) => x?.code === 4001 || x?.name === "UserRejectedRequestError";
  if (rejected(e) || (typeof e?.walk === "function" && e.walk(rejected))) return "You rejected the request in your wallet.";
  const m: string = e?.shortMessage ?? e?.message ?? "Claim failed.";
  if (/NothingToWithdraw/i.test(m)) return "Nothing to claim yet. Wait for the timer to finish.";
  if (/MaxPayoutReached/i.test(m)) return "You have reached your maximum payout, so no more ROI can be claimed.";
  if (/NotActive|NotRegistered/i.test(m)) return "Your account must be active to claim.";
  if (/EnforcedPause/i.test(m)) return "The protocol is paused right now.";
  if (/insufficient funds/i.test(m)) return "You need BNB in your wallet to pay network fees.";
  return m;
}

/* ---------- Emission Rewards (/income/roi) ---------- */
export function EmissionRewardsView() {
  const { address } = useWallet();
  const { data: em, reload: reloadEm } = useEmission(address);
  const stakes = em.stakes;

  const timersQ = useStakeTimers(address, stakes.length);
  const { timers, offsetMs } = timersQ.data;
  const now = useNow(offsetMs);
  const byIndex = useMemo(() => new Map(timers.map((t) => [t.index, t])), [timers]);
  const isReady = (i: number) => { const t = byIndex.get(i); return !!t && t.state === "active" && now >= t.nextClaimAt; };
  const readyCount = timers.filter((t) => isReady(t.index)).length;
  const readyAmount = timers.reduce((s, t) => s + (isReady(t.index) ? t.claimable : 0), 0);

  const [claiming, setClaiming] = useState<number | "all" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string; hash?: string } | null>(null);

  const claim = async (who: number | "all") => {
    if (claiming !== null) return;
    setClaiming(who);
    setMsg(null);
    try {
      const hash = await claimRoi();                       // claims every stake that is ready
      setMsg({ ok: true, t: "Claim submitted. Waiting for network confirmation…", hash });
      const receipt = await getClient().waitForTransactionReceipt({ hash, timeout: 180_000 });
      if (receipt.status !== "success") throw new Error("The transaction was reverted on-chain.");
      setMsg({ ok: true, t: "ROI claimed. All stakes that were ready have been paid.", hash });
      const refresh = () => { reloadEm(); timersQ.reload(); };
      refresh();
      setTimeout(refresh, 5000);                           // RPC nodes can lag a few seconds
    } catch (e) {
      setMsg({ ok: false, t: claimError(e) });
    } finally {
      setClaiming(null);
    }
  };

  return (
    <RequireWallet>
      <section className="hero" style={{ padding: 0, background: "linear-gradient(110deg, #8a6a16 0%, #6e5413 50%, #8f7020 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap", padding: "24px 26px" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span className="tile" style={{ width: 54, height: 54, padding: 0, display: "grid", placeItems: "center", borderRadius: 16, color: "#fff4d2" }}><Icon name="dollar" size={24} /></span>
            <div><div className="eyebrow">Reward Center</div><h2 style={{ marginTop: 0 }}>Daily Reward Stakes</h2></div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[["Stakes", String(stakes.length)], ["Claims", String(em.rows.length)], ["Claimed", usd(em.totalClaimed, 2)]].map(([l, v]) => (
              <div key={l} className="tile" style={{ padding: "10px 22px", textAlign: "center", borderRadius: 16 }}>
                <div style={{ fontSize: 10.5, letterSpacing: ".15em", fontWeight: 800, color: "rgba(255,244,214,.78)", textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 21, fontWeight: 700, color: "#fffaf0" }}>{v}</div>
              </div>
            ))}
            <button
              className="btn btn-gold"
              style={{ borderRadius: 16, padding: "0 24px" }}
              disabled={readyCount === 0 || claiming !== null}
              onClick={() => claim("all")}
              title={readyCount ? `About ${usd(readyAmount, 4)} ready to claim` : "No stake is ready yet"}
            >
              <Icon name="download" size={17} />
              {claiming === "all" ? "Claiming…" : readyCount ? `Claim All (${readyCount}) · ${usd(readyAmount, 2)}` : "Nothing to claim"}
            </button>
          </div>
        </div>
        <div style={{ background: "linear-gradient(180deg,#141417,#101013)", padding: "20px 26px 24px" }}>
          <p style={{ color: "var(--muted)", fontWeight: 500 }}>
            Each stake accrues on its own 1 day cycle. A claim pays every stake whose timer has finished, and restarts the 24h timer from the claim moment.
          </p>

          {msg && (
            <div className={`alert ${msg.ok ? "ok" : "warn"}`} style={{ marginTop: 14 }}>
              <span>
                {msg.t}
                {msg.hash && <> <a className="link" href={`${EXPLORER}/tx/${msg.hash}`} target="_blank" rel="noopener noreferrer">View transaction ↗</a></>}
              </span>
            </div>
          )}

          {stakes.length === 0 ? (
            <p style={{ marginTop: 18, fontWeight: 700 }}>No stakes found yet.</p>
          ) : (
            <div style={{ marginTop: 18 }}>
              <DataTable
                rows={stakes as any[]}
                columns={[
                  { key: "index", label: "#", render: (r) => r.index + 1 },
                  { key: "time", label: "Date", render: (r) => fmtUS(r.time.getTime()) },
                  { key: "usdt", label: "Staked", render: (r) => usd(r.usdt, 2) },
                  { key: "tokens", label: "Tokens", render: (r) => r.tokens.toFixed(4) },
                  { key: "claimed", label: "Claimed", render: (r) => usd(r.claimed, 4) },
                  { key: "claims", label: "Claims" },
                  {
                    key: "next", label: "Next Claim",
                    render: (r) => {
                      const t = byIndex.get(r.index);
                      if (!t) return <span style={{ color: "var(--muted)" }}>…</span>;
                      if (t.state === "done") return <span className="tag muted">Completed</span>;
                      if (now >= t.nextClaimAt) return <b className="up">Ready · {usd(t.claimable, 4)}</b>;
                      return <b className="gold-t" style={{ fontVariantNumeric: "tabular-nums" }}>{countdown(t.nextClaimAt - now)}</b>;
                    },
                  },
                  {
                    key: "act", label: "Action",
                    render: (r) => {
                      const t = byIndex.get(r.index);
                      if (t?.state === "done") return <button className="btn btn-sm" disabled>Completed</button>;
                      const ready = isReady(r.index);
                      return (
                        <button
                          className={`btn btn-sm ${ready ? "btn-gold" : ""}`}
                          disabled={!ready || claiming !== null}
                          onClick={() => claim(r.index)}
                        >
                          {claiming === r.index || (claiming === "all" && ready) ? "Claiming…" : ready ? "Claim" : "Locked"}
                        </button>
                      );
                    },
                  },
                ]}
              />
            </div>
          )}
        </div>
      </section>

      <Panel title="Daily Rewards History" sub="Recent reward allocations and completed claim records." badge={`Total Rewards Claimed ${usd(em.totalClaimed, 4)}`}>
        <DataTable
          rows={em.rows}
          empty="No Reward income records found."
          columns={[
            { key: "d", label: "Date", render: (r) => fmtUS(r.ts) }, { key: "a", label: "Reward Amount", render: (r) => usd(r.a, 4) }, { key: "p", label: "Percentage", render: (r) => `${r.p}%` }, { key: "t", label: "Txn Hash", render: (r) => <Addr text={r.hash} link /> }, { key: "c", label: "Comment" },
          ]}
        />
      </Panel>
    </RequireWallet>
  );
}

/* ---------- Direct Income ---------- */
export function DirectIncomeView() {
  const { address } = useWallet();
  const { data: DIRECT_INCOME, total: directTotal } = useDirectIncome(address);
  const { data: dash } = useDashboard(address);
  const [f, setF] = useState<IncomeFilter>({ from: "", to: "", txn: "", user: "" });
  const rows = useMemo(
    () => DIRECT_INCOME.filter((r) => inRange(r.ts, f.from, f.to) && String(r.hash).toLowerCase().includes(f.txn.trim().toLowerCase()) && (!f.user.trim() || r.uid.toLowerCase().includes(f.user.trim().toLowerCase()))),
    [DIRECT_INCOME, f]
  );
  return (
    <>
      <PageTitle title="Direct Income" sub="Track commission earned from your direct referrals when they mint." />
      <RequireWallet>
        <Hero
          eyebrow="Referral Earnings"
          title="Direct Income Overview"
          desc="Overview of your recorded direct income from network participation."
          tiles={[
            { icon: "trend", label: "Total Income", value: usd(directTotal, 4), hint: `${DIRECT_INCOME.length} total records` },
            { icon: "users", label: "Active Directs", value: String(dash.business.activeDirects), hint: "Qualified direct referrals" },
            { icon: "check", label: "Minimum Qualification", value: "$50+", hint: "Commission starts from $50 participation" },
            { icon: "briefcase", label: "Direct Business", value: usd(dash.business.directBusiness, 2), hint: "Total direct mint volume" },
          ]}
        />
        <IncomeFilters onApply={setF} />
        <Panel title="Direct Income" sub="Review your direct income details." badge={`${rows.length} Records`}>
          <DataTable
            rows={rows}
            columns={[
              { key: "ts", label: "Date", render: (r) => fmtUS(r.ts) },
              { key: "uid", label: "From User", render: (r) => <div className="cell-2"><span>{r.uid}</span><span className="a">{r.wallet}</span></div> },
              { key: "minted", label: "Minted Amount", render: (r) => usd(r.minted, 4) },
              { key: "income", label: "Income", render: (r) => usd(r.income, 4) },
              { key: "commission", label: "Commission" },
              { key: "hash", label: "Txn Hash", render: (r) => <Addr text={r.hash} link /> },
              { key: "note", label: "Note" },
            ]}
          />
        </Panel>
      </RequireWallet>
    </>
  );
}

/* ---------- Generation Income ---------- */
export function GenerationIncomeView() {
  const { address } = useWallet();
  const { data: GENERATION, total: genTotal } = useGenerationIncome(address);
  const { data: dash } = useDashboard(address);
  const [f, setF] = useState<IncomeFilter>({ from: "", to: "", txn: "", user: "" });
  const rows = useMemo(
    () => GENERATION.filter((r) => inRange(r.ts, f.from, f.to) && String(r.hash).toLowerCase().includes(f.txn.trim().toLowerCase()) && (!f.user.trim() || r.uid.toLowerCase().includes(f.user.trim().toLowerCase()))),
    [GENERATION, f]
  );
  return (
    <>
      <PageTitle title="Generation Income" sub="Track your bonus reward generation income dynamically with paginated records." />
      <RequireWallet>
        <Hero
          eyebrow="Bonus Reward"
          title="Generation Income Overview"
          desc="Overview of your recorded generation income from network participation."
          tiles={[
            { icon: "users", label: "Total Income", value: usd(genTotal, 4), hint: `${GENERATION.length} total records` },
            { icon: "layers", label: "Open Levels", value: `${dash.business.levelEligibility}/20`, hint: "Levels unlocked" },
            { icon: "usercheck", label: "Active Directs", value: String(dash.business.activeDirects), hint: "Generation qualifiers" },
          ]}
        />
        <IncomeFilters onApply={setF} />
        <Panel title="Generation Income" sub="Review your generation income details." badge={`${rows.length.toLocaleString("en-US")} Records`}>
          <DataTable
            rows={rows}
            columns={[
              { key: "ts", label: "Date", render: (r) => fmtUS(r.ts) },
              { key: "uid", label: "From User", render: (r) => <div className="cell-2"><span>{r.uid}</span><span className="a">{r.wallet}</span></div> },
              { key: "level", label: "Level", render: (r) => `Level ${r.level}` },
              { key: "base", label: "Base Reward Amount", render: (r) => usd(r.base, 4) },
              { key: "income", label: "Income", render: (r) => usd(r.income, 4) },
              { key: "pct", label: "Percentage" },
              { key: "hash", label: "Txn Hash", render: (r) => <Addr text={r.hash} link /> },
              { key: "comment", label: "Comment", render: (r) => <span style={{ display: "block", minWidth: 280, whiteSpace: "normal", color: "var(--text-2)", lineHeight: 1.45 }}>{r.comment}</span> },
            ]}
          />
        </Panel>
      </RequireWallet>
    </>
  );
}

/* ---------- Rank Rewards ---------- */
export function RankRewardsView() {
  const [tab, setTab] = useState<"inc" | "rew">("inc");
  const [rank, setRank] = useState("All Ranks");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { address } = useWallet();
  const { data: dash } = useDashboard(address);
  const { roadmap, incentive, reward } = useRank(address);
  const next = roadmap.find((k) => k.isNext) ?? roadmap[roadmap.length - 1] ?? { rank: 0, name: "—", selfMinted: 0, directs: 0, matching: 0, incentivePct: 0, incomeAmount: 0, achieved: false, isNext: false };
  const fmt0 = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
  const pctOf = (a: number, b: number) => (b > 0 ? Math.min(100, Math.floor((a / b) * 100)) : 100);
  const need = (a: number, b: number, unit = "") => (a >= b ? "Requirement completed" : `Still needed: ${unit === "$" ? fmt0(b - a) : `${b - a} Directs`}`);
  const selfNow = dash.totalMinted, directsNow = dash.business.activeDirects, matchNow = dash.rank.matchingNow;
  const reqs = [
    { icon: "wallet", t: "Self Investment", s: need(selfNow, next.selfMinted, "$"), pct: pctOf(selfNow, next.selfMinted), a: fmt0(selfNow), b: `/ ${fmt0(next.selfMinted)}`, done: selfNow >= next.selfMinted },
    { icon: "users", t: "Active Directs", s: need(directsNow, next.directs), pct: pctOf(directsNow, next.directs), a: `${directsNow} Directs`, b: `/ ${next.directs} Directs`, done: directsNow >= next.directs },
    { icon: "target", t: "Matching Business", s: need(matchNow, next.matching, "$"), pct: pctOf(matchNow, next.matching), a: fmt0(matchNow), b: `/ ${fmt0(next.matching)}`, done: matchNow >= next.matching },
  ];
  const sel = tab === "inc" ? incentive : reward;
  const hist = sel
    .map((r) => ({ ...r, ts: r.time.getTime() }))
    .filter((r) => inRange(r.ts, from, to) && (rank === "All Ranks" || r.rankName === rank));
  const sumInc = incentive.reduce((s, r) => s + r.amount, 0), sumRew = reward.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <PageTitle title="Rank Income & Achievements" sub="Track rank rewards, recurring incentives, requirements, and payout history." />
      <RequireWallet>
        <div className="cols-4" style={{ marginBottom: 20 }}>
          <div className="mini flat"><div className="lbl">Total Rank Income</div><div className="val">{usd(sumInc + sumRew, 2)}</div><div className="hint">Rank reward + incentive</div></div>
          <div className="mini flat"><div className="lbl">Rank Reward Total</div><div className="val">{usd(sumRew, 2)}</div><div className="hint">One-time achievement payouts</div></div>
          <div className="mini flat"><div className="lbl">Rank Incentive Total</div><div className="val">{usd(sumInc, 2)}</div><div className="hint">Recurring incentive payouts</div></div>
          <div className="mini flat"><div className="lbl">Achieved Rank</div><div className="val">{dash.rank.currentName}</div><div className="hint">{dash.rank.current ? "Current rank" : "Not achieved yet"}</div></div>
        </div>

        <div className="stack">
          <Panel title="Upcoming Rank Requirements" sub={`Pending conditions for ${next.name}.`} badge={reqs.every((q) => q.done) ? "Ready" : "Pending"}>
            <div className="cols-3">
              {reqs.map((q) => (
                <div key={q.t} className={`req ${q.done ? "done" : ""}`}>
                  <div className="t">
                    <div className="n"><span className="ico"><Icon name={q.icon} size={18} /></span><div><b className="t1">{q.t}</b><small>{q.s}</small></div></div>
                    <span className={`tag ${q.done ? "green" : "muted"}`}>{q.done && <Icon name="check" size={11} />} {q.pct}%</span>
                  </div>
                  <div className="nums"><span>{q.a}</span><span>{q.b}</span></div>
                  <div className={`prog thin ${q.done ? "green" : ""}`}><i style={{ width: `${q.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Rank Incentive Roadmap" sub="Qualification requirements and rank income rewards." badge={`${roadmap.length} Ranks`}>
            <div className="rrow head"><span>Rank</span><span>Self Minted</span><span>Direct Team</span><span>Matching Business</span><span>Incentive %</span><span>Income Amount</span><span /></div>
            {roadmap.map((k, i) => (
              <div className={`rrow ${k.isNext ? "cur" : ""}`} key={k.name}>
                <div className="rname"><RankBadge n={i + 1} locked={!k.achieved} /><div><b>{k.name}</b><span>{k.achieved ? "ACHIEVED" : k.isNext ? "NEXT TARGET" : "LOCKED"}</span></div></div>
                <span>${k.selfMinted.toLocaleString("en-US")}</span>
                <span>{k.directs} Directs<small>$50 and above</small></span>
                <span>${k.matching.toLocaleString("en-US")}</span>
                <span>{k.incentivePct}%</span>
                <span><span className="amt-pill">{money(k.incomeAmount, 0).replace(/(\d)(?=(\d{3})+$)/g, "$1,")}</span></span>
                <span style={{ textAlign: "right" }}>{k.achieved ? <span className="tag green"><Icon name="check" size={11} /> ACHIEVED</span> : k.isNext ? <span className="tag" style={{ color: "var(--blue)", background: "rgba(134,183,255,.12)", border: "1px solid rgba(134,183,255,.3)" }}>IN PROGRESS</span> : <span className="tag muted" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Icon name="lock" size={11} /> LOCKED</span>}</span>
              </div>
            ))}
          </Panel>

          <form className="filters three" onSubmit={(e) => e.preventDefault()}>
            <div><label className="field-l" htmlFor="rf-from">From Date</label><input id="rf-from" className="inp" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="field-l" htmlFor="rf-to">To Date</label><input id="rf-to" className="inp" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <div><label className="field-l" htmlFor="rf-rank">Rank Name</label>
              <select id="rf-rank" className="sel" value={rank} onChange={(e) => setRank(e.target.value)}><option>All Ranks</option>{roadmap.map((k) => <option key={k.name}>{k.name}</option>)}</select>
            </div>
            <button className="btn btn-gold" type="submit" style={{ padding: "13px 22px" }}><Icon name="search" size={15} /> Apply</button>
          </form>

          <Panel title="Rank Income History" sub={`Total: ${usd(hist.reduce((s, r) => s + r.amount, 0), 4)}`} badge={`${hist.length} Records`}>
            <Tabs line tabs={[{ id: "inc", label: "Rank Incentive" }, { id: "rew", label: "Rank Reward" }]} value={tab} onChange={setTab} />
            <DataTable
              rows={hist}
              empty={tab === "inc" ? "No rank incentive records found." : "No rank reward records found."}
              columns={[
                { key: "ts", label: "Date", render: (r) => fmtUS(r.ts) },
                { key: "rankName", label: "Rank" },
                { key: "amount", label: "Amount", render: (r) => usd(r.amount, 4) },
                { key: "refId", label: "Reference", render: (r) => r.refId },
              ]}
            />
          </Panel>
        </div>
      </RequireWallet>
    </>
  );
}