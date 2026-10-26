"use client";

import { useMemo, useState } from "react";
import { Addr, DataTable, Hero, Icon, PageTitle, Panel, RequireWallet, inRange } from "../ui";
import { useDashboard, useSellSummary, useSells } from "@/lib/data";
import { useWallet } from "../WalletProvider";
import { fmtUS, usd } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export default function SellReportView() {
  const { address } = useWallet();
  const { data: SELLS } = useSells(address);
  const { data: sum } = useSellSummary(address);
  const { data: d } = useDashboard(address);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return SELLS.filter((r) => inRange(r.ts, from, to) && (!s || [String(r.hash), String(r.sold), String(r.usdt)].some((v) => v.toLowerCase().includes(s))));
  }, [SELLS, q, from, to]);

  return (
    <>
      <PageTitle title="Sell Token Report" sub={`${BRAND.token} sales converted to USDT. Daily sell limit is $3000 per 24 hours.`} />
      <RequireWallet>
        <Hero
          eyebrow="Token Sales"
          title="Sale Summary"
          desc="Overview of your recorded token sales."
          tiles={[
            { icon: "link", label: `${BRAND.token} Sold`, value: `${sum.aritohamSold.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${BRAND.token}`, hint: `${sum.sales} total transactions` },
            { icon: "dollar", label: "USDT Received", value: usd(sum.usdtReceived, 4), hint: "Completed sales on this page" },
            { icon: "calculator", label: "24H Limit Remaining", value: usd(d.limits.sellLeft, 0), hint: `$${d.limits.sellLimit} daily cap` },
          ]}
        />
        <Panel title="Sell History" sub={`Review ${BRAND.token} sold, USDT received, and transaction details.`} badge={`${SELLS.length} Sales`}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 190px 190px auto", gap: 12, marginBottom: 20 }} className="hist-filters">
            <div className="search"><Icon name="search" size={16} /><input className="inp" placeholder="Search by transaction hash, wallet, or amount..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <input className="inp" type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input className="inp" type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} />
            <button className="btn" onClick={() => { setQ(""); setFrom(""); setTo(""); }}><Icon name="refresh" size={15} /> Reset</button>
          </div>
          <DataTable
            rows={rows}
            columns={[
              { key: "ts", label: "Date & Time", render: (r) => fmtUS(r.ts) },
              { key: "hash", label: "Txn Hash", render: (r) => <Addr text={r.hash} link /> },
              { key: "sold", label: `${BRAND.token} Sold`, render: (r) => `${r.sold.toFixed(4)} ${BRAND.token}` },
              { key: "usdt", label: "USDT Received", render: (r) => usd(r.usdt, 4) },
              { key: "price", label: "Token Price", render: (r) => usd(r.price, 6) },
            ]}
          />
        </Panel>
      </RequireWallet>
    </>
  );
}
