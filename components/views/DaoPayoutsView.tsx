"use client";

import { useMemo, useState } from "react";
import { Addr, DataTable, Hero, Icon, PageTitle, RequireWallet, Tabs, Tag, Panel } from "../ui";
import { useCyclePayouts, useCycleSummary, useCycles, useMyPayouts } from "@/lib/data";
import { useWallet } from "../WalletProvider";
import { fmtDay, usd } from "@/lib/format";

export default function DaoPayoutsView() {
  const [tab, setTab] = useState<"prev" | "mine">("prev");
  const { address } = useWallet();
  const { data: CYCLES } = useCycles();
  const [picked, setCycle] = useState(0);
  const cycle = picked || CYCLES[0] || 0;
  const [q, setQ] = useState("");
  const { data: s } = useCycleSummary(cycle);
  const { data: all } = useCyclePayouts(cycle);
  const { data: MY_PAYOUTS } = useMyPayouts(address);
  const rows = useMemo(() => all.filter((r) => String(r.wallet).toLowerCase().includes(q.trim().toLowerCase())), [all, q]);

  return (
    <>
      <PageTitle title="DAO Payouts" sub="Cycle-wise pool and member payout records." />
      <RequireWallet>
        <Tabs value={tab} onChange={setTab} tabs={[{ id: "prev", label: "Previous Distributions", icon: "history" }, { id: "mine", label: "My Payouts", icon: "wallet" }]} />
        {tab === "prev" ? (
          <>
            <Hero
              eyebrow="DAO Payouts Overview"
              title="Cycle Summary"
              desc="Cycle-wise pool and member payout records."
              right={
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div className="search" style={{ width: 280 }}><Icon name="search" size={16} /><input className="inp" style={{ background: "#fffaf0", color: "#2a2109", borderColor: "transparent" }} placeholder="Search by wallet address..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
                  <select className="sel" style={{ width: 150, background: "#fffaf0", color: "#2a2109", borderColor: "transparent" }} value={cycle} onChange={(e) => setCycle(Number(e.target.value))} aria-label="Cycle">
                    {CYCLES.map((c) => <option key={c} value={c}>Cycle #{c}</option>)}
                  </select>
                </div>
              }
              tiles={[
                { icon: "history", label: "Total Cycle Deposit", value: "$" + s.deposit.toLocaleString("en-US"), hint: `Cycle #${cycle} Deposits` },
                { icon: "link", label: "Total Pool", value: "$" + s.pool.toLocaleString("en-US"), hint: "Distributed pool amount" },
                { icon: "users", label: "Qualified Members", value: String(s.members), hint: "Total eligible partners" },
                { icon: "gem", label: "Total Shares", value: String(s.shares), hint: "Combined active shares" },
                { icon: "dollar", label: "Value Per Share", value: usd(s.vps, 4), hint: "Estimated per share" },
              ]}
            />
            <Panel>
              <DataTable
                rows={rows}
                columns={[
                  { key: "i", label: "#", render: (_r, i) => i + 1 },
                  { key: "wallet", label: "Wallet Address", render: (r) => <Addr text={r.wallet} link /> },
                  { key: "matching", label: "Weekly Matching", render: (r) => "$" + r.matching },
                  { key: "shares", label: "Qualified Shares" },
                  { key: "value", label: "Share Value", render: (r) => usd(r.value, 4) },
                  { key: "payout", label: "Payout Amount", render: (r) => usd(r.payout, 4) },
                  { key: "ts", label: "Date", render: (r) => fmtDay(r.ts) },
                  { key: "st", label: "Status", render: () => <Tag>RECEIVED</Tag> },
                ]}
              />
            </Panel>
          </>
        ) : (
          <Panel title="My Payouts" sub="Your DAO partner payouts, cycle by cycle.">
            <DataTable
              rows={MY_PAYOUTS}
              columns={[
                { key: "cycle", label: "Cycle", render: (r) => `Cycle #${r.cycle}` },
                { key: "ts", label: "Date", render: (r) => fmtDay(r.ts) },
                { key: "shares", label: "Qualified Shares" },
                { key: "value", label: "Share Value", render: (r) => usd(r.value, 4) },
                { key: "payout", label: "Payout Amount", render: (r) => usd(r.payout, 4) },
                { key: "hash", label: "Txn Hash", render: (r) => (r.hash === "—" ? "—" : <Addr text={r.hash} link />) },
                { key: "status", label: "Status", render: (r) => <Tag tone={r.status === "RECEIVED" ? "green" : "red"}>{r.status}</Tag> },
              ]}
            />
          </Panel>
        )}
      </RequireWallet>
    </>
  );
}
