"use client";

import { useState } from "react";
import { DataTable, Hero, Icon, PageTitle, Panel, RequireWallet, Toggle } from "../ui";
import { RANKS } from "@/lib/mock";
import { useTeam, useTeamSummary } from "@/lib/data";
import { useWallet } from "../WalletProvider";
import { usd } from "@/lib/format";

const PAGE = 50;

/** The contract pages the tree server-side, so the table gets one page at a time. */
function Pager({ page, setPage, total, loading }: { page: number; setPage: (n: number) => void; total: number; loading: boolean }) {
  const pages = Math.max(1, Math.ceil(total / PAGE));
  if (total <= PAGE) return null;
  return (
    <div className="pager">
      <span>Page <b>{page}</b> of {pages} · <b>{total.toLocaleString("en-US")}</b> members{loading ? " · loading…" : ""}</span>
      <div className="btns">
        <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <button className="btn btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

const rankIndex = (name: string) => (name === "All Ranks" ? 0 : RANKS.findIndex((r) => r.name === name) + 1);
const match = (rows: any[], q: string) => {
  const s = q.trim().toLowerCase();
  return s ? rows.filter((r) => [r.id, r.wallet].some((v) => String(v).toLowerCase().includes(s))) : rows;
};

function RankSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="sel" style={{ width: 150 }} aria-label="Rank" value={value} onChange={(e) => onChange(e.target.value)}>
      <option>All Ranks</option>
      {RANKS.map((r) => <option key={r.name}>{r.name}</option>)}
    </select>
  );
}

export function DirectTeamView() {
  const { address } = useWallet();
  const [q, setQ] = useState("");
  const [rank, setRank] = useState("All Ranks");
  const [dao, setDao] = useState(false);
  const [page, setPage] = useState(1);
  const { data: sum } = useTeamSummary(address);
  const team = useTeam(address, { level: 1, rank: rankIndex(rank), daoOnly: dao }, page, PAGE);
  const reset = () => { setQ(""); setRank("All Ranks"); setDao(false); setPage(1); };
  return (
    <>
      <PageTitle title="My Direct Team" sub="View direct members and drill into each member's team." />
      <RequireWallet>
        <Hero
          eyebrow="Direct Team Overview"
          title="Direct Team Control"
          desc="Monitor personally invited members, direct contribution and network business from one top card."
          tiles={[
            { icon: "userplus", label: "Total Directs", value: String(sum.directs), hint: "Personally invited members" },
            { icon: "wallet", label: "Direct Contribution", value: usd(sum.directContribution, 2), hint: "Total direct contribution" },
            { icon: "users", label: "Total Team Members", value: String(sum.totalMembers), hint: "Network members under directs" },
            { icon: "bars", label: "Team Business", value: usd(sum.teamBusiness, 2), hint: "Current total team volume" },
          ]}
        />
        <Panel title="My Direct Team" right={
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input className="inp" style={{ width: 260 }} placeholder="Search unique ID, wallet" value={q} onChange={(e) => setQ(e.target.value)} />
            <RankSelect value={rank} onChange={(v) => { setRank(v); setPage(1); }} />
            <Toggle on={dao} onChange={(v) => { setDao(v); setPage(1); }} label="DAO Partner" />
            <button className="btn btn-sm" onClick={reset}>Reset</button>
          </div>
        }>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 14, background: "#0e0e11", border: "1px solid var(--line)", marginBottom: 14 }}>
            <button className="cbtn" aria-label="Back"><Icon name="left" size={14} /></button>
            <span className="pill gold" style={{ marginRight: "auto", marginLeft: 12 }}><Icon name="users" size={13} /> My Team</span>
            <button className="cbtn" aria-label="Forward"><Icon name="right" size={14} /></button>
          </div>
          <DataTable
            rows={match(team.data.items, q)}
            pageSize={PAGE}
            empty={team.loading ? "Loading team…" : "No direct members found."}
            emptyHint="Use the breadcrumb above to return to a previous team."
            columns={[{ key: "id", label: "User ID" }, { key: "wallet", label: "Wallet" }, { key: "rank", label: "Rank" }, { key: "minted", label: "Minted" }, { key: "joined", label: "Joined" }]}
          />
          <Pager page={page} setPage={setPage} total={team.data.total} loading={team.loading} />
        </Panel>
      </RequireWallet>
    </>
  );
}

export function ContributingTeamView() {
  const { address } = useWallet();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("All My Levels");
  const [rank, setRank] = useState("All Ranks");
  const [dao, setDao] = useState(false);
  const [page, setPage] = useState(1);
  const { data: sum } = useTeamSummary(address);
  const lvl = level === "All My Levels" ? 0 : Number(level.replace("Level ", ""));
  const team = useTeam(address, { level: lvl, onlyInvested: true, rank: rankIndex(rank), daoOnly: dao }, page, PAGE);
  const reset = () => { setQ(""); setLevel("All My Levels"); setRank("All Ranks"); setDao(false); setPage(1); };
  return (
    <>
      <PageTitle title="My Contributing Team Members" sub="Shows only members from your team who have protocol participation activity." />
      <RequireWallet>
        <Hero
          eyebrow="Contributing Team Overview"
          title="Contributing Team Center"
          desc="Scan active contributors, total team business and level spread across your active network."
          tiles={[
            { icon: "users", label: "Total Team Members", value: String(sum.totalMembers), hint: "Total active team size" },
            { icon: "network", label: "Contributing Members", value: String(sum.contributing), hint: "Members with protocol participation" },
            { icon: "briefcase", label: "Team Business", value: usd(sum.teamBusiness, 2), hint: "Total Minted volume" },
            { icon: "layers", label: "Visible Levels", value: String(sum.visibleLevels), hint: "Max Opened Levels" },
          ]}
        />
        <Panel title="Invested Team" right={
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input className="inp" style={{ width: 260 }} placeholder="Search unique ID, wallet" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="sel" style={{ width: 160 }} aria-label="Level" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
              <option>All My Levels</option>{Array.from({ length: 20 }, (_, i) => <option key={i}>Level {i + 1}</option>)}
            </select>
            <RankSelect value={rank} onChange={(v) => { setRank(v); setPage(1); }} />
            <Toggle on={dao} onChange={(v) => { setDao(v); setPage(1); }} label="DAO Partner" />
            <button className="btn btn-sm" onClick={reset}>Reset</button>
          </div>
        }>
          <DataTable
            rows={match(team.data.items, q)}
            pageSize={PAGE}
            empty={team.loading ? "Loading team…" : "No invested team members found."}
            columns={[{ key: "id", label: "User ID" }, { key: "wallet", label: "Wallet" }, { key: "level", label: "Level" }, { key: "rank", label: "Rank" }, { key: "minted", label: "Minted" }]}
          />
          <Pager page={page} setPage={setPage} total={team.data.total} loading={team.loading} />
        </Panel>
      </RequireWallet>
    </>
  );
}
