"use client";

import { useMemo, useState } from "react";
import { Addr, DataTable, Icon, Mini, Panel, Pill, RequireWallet, Seg, Tabs, Tag } from "../ui";
import type { Row } from "@/lib/data";
import { useCycleSummary, useCycles, useDaoMembers, useDaoOverview, useMyDaoStatus, useMyPayouts } from "@/lib/data";
import { useWallet } from "../WalletProvider";
import { fmtDay, usd } from "@/lib/format";

type TabId = "q" | "prev" | "mine";
const m0 = (n: number) => "$" + n.toLocaleString("en-US");

const GROWTH = [
  { icon: "usercheck", v: "$2,500", s: "Matching Business", g: "1 Shares" },
  { icon: "users", v: "$5,000", s: "Matching Business", g: "2 Shares" },
  { icon: "users", v: "$7,500", s: "Matching Business", g: "3 Shares" },
  { icon: "network", v: "$10,000", s: "Matching Business", g: "4 Shares" },
  { icon: "plus", v: "+$2,500", s: "Additional Matching", g: "+1 Share" },
];

function Breakdown({ onClose, DAO, members }: { onClose: () => void; DAO: { pool: number; totalShares: number; valuePerShare: number }; members: Row[] }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide" role="dialog" aria-modal="true" aria-label="Weekly pool and share calculation">
        <div className="modal-head"><h3>Weekly Pool &amp; Share Calculation</h3><button className="modal-x" onClick={onClose} aria-label="Close">×</button></div>
        <p className="sub">How the current cycle&apos;s share value and partner rewards are worked out.</p>
        <div className="kv"><span>5% of contract deposits (pool)</span><b>{m0(DAO.pool)}</b></div>
        <div className="kv"><span>Total active qualified shares</span><b>{DAO.totalShares}</b></div>
        <div className="kv"><span>Value per share = pool ÷ shares</span><b className="gold-t">{usd(DAO.valuePerShare, 4)}</b></div>
        <div className="alert gold" style={{ margin: "16px 0" }}><Icon name="info" size={17} /><span>Every $2,500 of weekly matching business earns one extra share. A partner with 3 shares receives 3 × {usd(DAO.valuePerShare, 4)} = <b>{usd(3 * DAO.valuePerShare, 4)}</b>.</span></div>
        <div className="tbl-wrap"><table style={{ minWidth: 0 }}><thead><tr><th>Partner</th><th>Shares</th><th className="ta-r">Reward</th></tr></thead><tbody>
          {members.slice(0, 4).map((m) => (<tr key={m.wallet}><td>{m.wallet}</td><td>{m.shares}</td><td className="ta-r">{usd(m.reward, 4)}</td></tr>))}
        </tbody></table></div>
      </div>
    </div>
  );
}

function Qualification() {
  const { address } = useWallet();
  const { data: DAO } = useDaoOverview();
  const { data: st } = useMyDaoStatus(address);
  const { data: DAO_MEMBERS } = useDaoMembers(address, DAO.cycle);
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [calc, setCalc] = useState(false);
  const [spin, setSpin] = useState(0);
  const rows = useMemo(() => DAO_MEMBERS.filter((m) => scope === "all" || m.mine), [DAO_MEMBERS, scope, spin]);

  return (
    <div className="stack">
      <Panel eyebrow="Global Pool Metrics" title="Current DAO Pool Summary" badge="Live Pool Stats" tone="green">
        <div className="cols-6">
          <Mini icon="link" label="Current DAO Pool" value={m0(DAO.pool)} hint="Global Deposit Pool" />
          <Mini icon="history" label="Contract Deposit" value={m0(DAO.contractDeposit)} hint="Active Cycle Period" />
          <Mini icon="users" label="Lifetime Share Holders" value={String(DAO.lifetimeHolders)} hint="Lifetime Share Holders" />
          <Mini icon="usercheck" label="Weekly Eligible" value={String(DAO.weeklyEligible)} hint="Eligible Partners" />
          <Mini icon="gem" label="Total Shares" value={String(DAO.totalShares)} hint="Active Qualified Shares" />
          <Mini icon="dollar" label="Value Per Share" value={usd(DAO.valuePerShare, 2)} hint="Est. Share Value" />
        </div>
      </Panel>

      <div className="grid g-half" style={{ alignItems: "stretch" }}>
        <Panel eyebrow="Lifetime Qualification" title="Qualify Once. Stay a DAO Partner." badge={st.lifetime ? "Lifetime Partner" : st.windowOpen ? "Window Open" : "Window Expired"} tone={st.lifetime || st.windowOpen ? "green" : "red"}>
          <div className="alert warn" style={{ display: "block", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span className="eyebrow" style={{ color: "var(--red)" }}>20-Day Qualification Window Timer</span>
              <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>Activated: {st.activatedAt ? fmtDay(st.activatedAt.getTime()) : "—"}</span>
            </div>
            <div style={{ marginTop: 6, fontWeight: 800, color: st.windowOpen || st.lifetime ? "var(--green)" : "#ffb4a8" }}>{st.lifetime ? "Lifetime DAO Partner" : st.windowOpen ? `20-Day Window open until ${st.windowEnd ? fmtDay(st.windowEnd.getTime()) : "—"}` : "20-Day Qualification Window Expired"}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }} className="or-grid">
            <div className="mini">
              <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--gold-hi)" }}><Icon name="users" size={26} /><div><div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--text)" }}>{m0(st.directTarget)}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>Direct Business</div></div></div>
              <div className="prog thin" style={{ margin: "16px 0 8px" }}><i style={{ width: `${Math.min(100, st.directTarget ? (st.windowDirect / st.directTarget) * 100 : 0)}%` }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700 }}><span style={{ color: "var(--muted)" }}>{m0(st.windowDirect)} done</span><span className="down">{m0(Math.max(0, st.directTarget - st.windowDirect))} pending</span></div>
            </div>
            <span className="rank-ico" style={{ width: 38, height: 38, borderRadius: "50%", fontSize: 11, fontWeight: 900 }}>OR</span>
            <div className="mini">
              <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--gold-hi)" }}><Icon name="swap" size={26} /><div><div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--text)" }}>{m0(st.matchingTarget)}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>Matching Business</div></div></div>
              <div className="prog thin" style={{ margin: "16px 0 8px" }}><i style={{ width: `${Math.min(100, st.matchingTarget ? (st.windowMatching / st.matchingTarget) * 100 : 0)}%` }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700 }}><span style={{ color: "var(--muted)" }}>{m0(st.windowMatching)} done</span><span className="down">{m0(Math.max(0, st.matchingTarget - st.windowMatching))} pending</span></div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13, fontWeight: 600 }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)" }}><Icon name="shield" size={17} /> Status: <b className={st.lifetime || st.windowOpen ? "up" : "down"}>{st.lifetime ? "Lifetime DAO Partner" : st.windowOpen ? "Qualification Window Open" : "20-Day Qualification Window Expired"}</b></span>
            <span style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)" }}><Icon name="award" size={17} /> Shares: <b className={st.qualifiedShares ? "up" : "down"}>{st.qualifiedShares ? `${st.qualifiedShares} DAO Share${st.qualifiedShares > 1 ? "s" : ""}` : "Receive 1 DAO Share"}</b></span>
          </div>
        </Panel>

        <Panel eyebrow="Current Week" title="Your Weekly Share Status" badge={st.qualifiedShares ? "Qualified This Week" : "Missed This Week"} tone={st.qualifiedShares ? "green" : "red"}>
          <div className="cols-5" style={{ gap: 10 }}>
            {[["Lifetime Status", st.lifetime ? "Lifetime Holder" : "Pending Activation"], ["Weekly Matching", m0(st.weeklyMatching)], ["Qualified Shares", String(st.qualifiedShares)], ["Shortfall", m0(st.shortfall)], ["Weekly Payout", usd(st.estWeeklyPayout, 2)]].map(([l, v]) => (
              <div className="mini flat" key={l} style={{ textAlign: "center", padding: "12px 8px" }}><div className="lbl" style={{ fontSize: 9.5, letterSpacing: ".06em" }}>{l}</div><div className="val" style={{ fontSize: l === "Lifetime Status" ? 14 : 18, marginTop: 6 }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--muted)", fontWeight: 600, margin: "18px 0 8px" }}><span>Weekly Target Progress ({st.weeklyProgressPct.toFixed(0)}%): {m0(st.weeklyMatching)} completed</span><span>$2,500 required</span></div>
          <div className="prog"><i style={{ width: `${Math.min(100, st.weeklyProgressPct)}%` }} /></div>
          {st.shortfall > 0 && <div className="down" style={{ fontSize: 12, fontWeight: 800, marginTop: 10 }}>{m0(st.shortfall)} matching needed to qualify for payout shares.</div>}
          <div className="alert gold" style={{ marginTop: 22, alignItems: "center" }}>
            <span className="cbtn" style={{ width: 34, height: 34, borderRadius: "50%" }}><Icon name="award" size={16} /></span>
            <div><b>Weekly Share Multiplier Rule</b><div style={{ fontWeight: 500, marginTop: 2 }}>Every additional $2,500 of matching volume earned during the active cycle unlocks +1 extra DAO share payout.</div></div>
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Weekly Share Growth" title="More Matching Business = More DAO Shares" badge="Every $2,500 = 1 Share" tone="green">
        <div className="step-row">
          {GROWTH.map((g) => (
            <div className="step" key={g.v}><span className="ico"><Icon name={g.icon} size={30} /></span><div className="v">{g.v}</div><div className="m">{g.s}</div><div className="g">{g.g}</div></div>
          ))}
        </div>
        <div className="alert gold" style={{ marginTop: 20 }}><Icon name="info" size={16} /><span><b>Important:</b> Maintain at least $2,500 weekly matching business to participate in that week&apos;s 5% DAO Partner Pool distribution. Missing one week does not cancel lifetime membership.</span></div>
      </Panel>

      <Panel eyebrow="Distribution Breakdown" title="Weekly Pool & Share Calculation" sub="View the sample calculation, share-value formula and partner-wise weekly reward breakdown." right={<button className="btn btn-gold" onClick={() => setCalc(true)}><Icon name="bars" size={16} /> View Breakdown <Icon name="right" size={14} /></button>} />

      <Panel eyebrow="Qualified Partners" title="Current Cycle Member List" right={
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Seg value={scope} onChange={setScope} items={[{ id: "all", label: "All Members", icon: "users" }, { id: "mine", label: "My Team Only", icon: "user" }]} />
          <button className="btn" onClick={() => setSpin((s) => s + 1)}><Icon name="refresh" size={15} /> Refresh</button>
        </div>
      }>
        <DataTable
          variant="showing"
          rows={rows}
          columns={[
            { key: "i", label: "#", render: (_r, i) => i + 1 },
            { key: "wallet", label: "Wallet Address", render: (r) => <Addr text={r.wallet} /> },
            { key: "s", label: "Lifetime Status", render: (r) => <Tag tone={r.lifetime === false ? "muted" : "green"}>{r.lifetime === false ? "Weekly Partner" : "Lifetime Share Holder"}</Tag> },
            { key: "m", label: "Weekly Matching", render: (r) => (
              <div className="wm">
                <div className="top"><span>{m0(r.matching)}</span><span>{m0(r.target)}</span></div>
                <div className="prog thin"><i style={{ width: `${Math.max(2, ((r.matching % 2500) / 2500) * 100 + (r.tiers > 0 ? 0 : 0))}%` }} /></div>
                <div className="bot">{r.tiers > 0 ? `${r.tiers} tier${r.tiers > 1 ? "s" : ""} done · ` : ""}{m0(r.toNext)} to next</div>
              </div>
            ) },
            { key: "sh", label: "Shares", render: (r) => r.shares },
            { key: "rw", label: "Estimated Reward", render: (r) => usd(r.reward, 4) },
            { key: "tw", label: "This Week", render: () => <Tag>Eligible</Tag> },
          ]}
        />
      </Panel>
      {calc && <Breakdown onClose={() => setCalc(false)} DAO={DAO} members={DAO_MEMBERS} />}
    </div>
  );
}

function Previous() {
  const { data: CYCLES } = useCycles();
  const [c, setC] = useState(0);
  const cur = c || CYCLES[0] || 0;
  const { data: s } = useCycleSummary(cur);
  return (
    <Panel title="Previous Distributions" sub="Weekly pool, shares and value per share for completed cycles." right={
      <select className="sel" style={{ width: 150 }} value={cur} onChange={(e) => setC(Number(e.target.value))} aria-label="Cycle">{CYCLES.map((x) => <option key={x} value={x}>Cycle #{x}</option>)}</select>
    }>
      <div className="cols-4">
        <Mini icon="history" label="Cycle Deposit" value={m0(s.deposit)} hint={`Cycle #${cur} deposits`} />
        <Mini icon="link" label="Pool Distributed" value={usd(s.pool, 1)} hint="5% DAO pool" />
        <Mini icon="gem" label="Total Shares" value={String(s.shares)} hint="Combined active shares" />
        <Mini icon="dollar" label="Value Per Share" value={usd(s.vps, 4)} hint={s.ts ? fmtDay(s.ts) : "—"} />
      </div>
    </Panel>
  );
}

function Mine() {
  const { address } = useWallet();
  const { data: MY_PAYOUTS } = useMyPayouts(address);
  return (
    <Panel title="My Payout History" sub="Weekly DAO partner payouts credited to your wallet.">
      <DataTable
        rows={MY_PAYOUTS}
        columns={[
          { key: "cycle", label: "Cycle", render: (r) => `Cycle #${r.cycle}` },
          { key: "ts", label: "Date", render: (r) => fmtDay(r.ts) },
          { key: "shares", label: "Shares" },
          { key: "value", label: "Share Value", render: (r) => usd(r.value, 4) },
          { key: "payout", label: "Payout", render: (r) => usd(r.payout, 4) },
          { key: "hash", label: "Txn Hash", render: (r) => (r.hash === "—" ? "—" : <Addr text={r.hash} link />) },
          { key: "status", label: "Status", render: (r) => <Tag tone={r.status === "RECEIVED" ? "green" : "red"}>{r.status}</Tag> },
        ]}
      />
    </Panel>
  );
}

export default function DaoProgramView() {
  const [tab, setTab] = useState<TabId>("q");
  return (
    <RequireWallet>
      <section className="hero" style={{ background: "radial-gradient(520px 260px at 6% 0%, rgba(243,217,139,.3), transparent 70%), linear-gradient(118deg, #1b1608 0%, #14110a 60%, #0e0d09 100%)" }}>
        <div className="hero-head" style={{ alignItems: "center" }}>
          <div style={{ maxWidth: 760 }}>
            <div className="eyebrow" style={{ color: "var(--gold)" }}>5% Turnover Benefits</div>
            <h2 style={{ fontSize: 32 }}>DAO Partner Program</h2>
            <p className="desc" style={{ color: "var(--muted)", fontWeight: 500, fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>5% of every smart contract deposit is allocated to the DAO Partner Pool and distributed among qualified DAO Partners according to their total qualified shares.</p>
          </div>
          <div style={{ padding: "20px 30px", borderRadius: 22, textAlign: "center", background: "linear-gradient(135deg,#f6e08c,#c79c25 50%,#8a6d1a)", color: "#1a1405", boxShadow: "0 20px 44px rgba(212,175,55,.28)" }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 56, fontWeight: 800, lineHeight: 1 }}>5%</div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".15em", marginTop: 8 }}>GLOBAL DEPOSIT POOL</div>
          </div>
        </div>
      </section>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "q", label: "Qualification Details", icon: "check" }, { id: "prev", label: "Previous Distributions", icon: "history" }, { id: "mine", label: "My Payout History", icon: "file" }]} />
      {tab === "q" && <Qualification />}
      {tab === "prev" && <Previous />}
      {tab === "mine" && <Mine />}
    </RequireWallet>
  );
}
