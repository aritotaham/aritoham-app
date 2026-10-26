"use client";

import { useEffect, useId, useState } from "react";
import { useWallet } from "./WalletProvider";

const P: Record<string, string> = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  link: "M9 17H7A5 5 0 0 1 7 7h2 M15 7h2a5 5 0 1 1 0 10h-2 M8 12h8",
  calculator: "M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M8 7h8 M8 12h.01 M12 12h.01 M16 12h.01 M8 16h.01 M12 16h.01 M16 16h.01",
  download: "M12 3v12 M7 10l5 5 5-5 M5 21h14",
  file: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z M14 3v5h5 M9 13h6 M9 17h6",
  dollar: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M14.6 9.6c-.5-1-1.5-1.6-2.6-1.6-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.1 0-2.1-.6-2.6-1.6 M12 6.5V8 M12 16v1.5",
  trend: "M3 17l6-6 4 4 8-8 M15 7h6v6",
  crown: "M3 8l4 4 5-7 5 7 4-4-2 11H5z",
  network: "M9 3h6v5H9z M2 16h6v5H2z M16 16h6v5h-6z M12 8v4 M5 16v-4h14v4",
  gem: "M6 3h12l4 6-10 12L2 9z M2 9h20 M10 3l-2 6 4 12 4-12-2-6",
  hand: "M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16 M7 21l-4-4 M14 15l4.2-.9a2 2 0 0 1 2.3 2.5L19 20l-6 1-3-1 M16 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  userplus: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M19 8v6 M22 11h-6",
  usercheck: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M16 11l2 2 4-4",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3",
  refresh: "M21 12a9 9 0 0 1-15.5 6.2L3 16 M3 12a9 9 0 0 1 15.5-6.2L21 8 M21 3v5h-5 M3 21v-5h5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
  percent: "M19 5L5 19 M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  briefcase: "M3 8h18v12H3z M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3 M3 13h18",
  layers: "M12 2l10 5-10 5L2 7z M2 12l10 5 10-5 M2 17l10 5 10-5",
  bars: "M5 21V10 M12 21V4 M19 21v-8",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16v-4 M12 8h.01",
  check: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8.5 12.5l2.5 2.5 4.5-5",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5 M12 7v5l3 2",
  lock: "M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12h.01",
  award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M8.2 13.9L7 23l5-3 5 3-1.2-9.1",
  ext: "M15 3h6v6 M10 14L21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  down: "M6 9l6 6 6-6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  arrowleft: "M19 12H5 M12 19l-7-7 7-7",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  calendar: "M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4",
  copy: "M9 9h11v11H9z M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4 M3 7v10a2 2 0 0 0 2 2h16V9H5a2 2 0 0 1-2-2z M17 14h.01",
  coins: "M9 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M18.1 10.4A6 6 0 1 1 10.4 18.1 M7 6h2v4",
  swap: "M7 7h13l-4-4 M17 17H4l4 4",
  menu: "M3 6h18M3 12h18M3 18h18",
  plus: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 8v8 M8 12h8",
  flame: "M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z",
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || P.grid} />
    </svg>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right && <div className="right">{right}</div>}
    </div>
  );
}

export type TileData = { icon: string; label: string; value: string; hint?: string };

export function Hero({ eyebrow, title, desc, tiles, right }: { eyebrow: string; title: string; desc?: string; tiles?: TileData[]; right?: React.ReactNode }) {
  return (
    <section className="hero">
      <div className="hero-head">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
          {desc && <p className="desc">{desc}</p>}
        </div>
        {right}
      </div>
      {tiles && (
        <div className="tiles" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${tiles.length > 4 ? 190 : 220}px, 1fr))` }}>
          {tiles.map((t) => (
            <div className="tile" key={t.label}>
              <span className="ico"><Icon name={t.icon} size={18} /></span>
              <div className="lbl">{t.label}</div>
              <div className="val">{t.value}</div>
              {t.hint && <div className="hint">{t.hint}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Mini({ icon, label, value, hint, flat }: { icon?: string; label: string; value: React.ReactNode; hint?: string; flat?: boolean }) {
  return (
    <div className={`mini ${flat ? "flat" : ""}`}>
      {icon && <span className="ico"><Icon name={icon} size={17} /></span>}
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export type Tone = "gold" | "green" | "red" | "blue" | "muted";
export function Pill({ children, tone = "gold", dot }: { children: React.ReactNode; tone?: Tone; dot?: boolean }) {
  return <span className={`pill ${tone}`}>{dot && <i className="dot" />}{children}</span>;
}

export function Panel({ eyebrow, title, sub, badge, tone = "gold", right, children, className = "" }: {
  eyebrow?: string; title?: string; sub?: string; badge?: React.ReactNode; tone?: Tone; right?: React.ReactNode; children?: React.ReactNode; className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || eyebrow) && (
        <div className="panel-head">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h3>{title}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {right}
          {badge && <Pill tone={tone}>{badge}</Pill>}
        </div>
      )}
      {children}
    </section>
  );
}

export function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className={`cbtn ${ok ? "ok" : ""}`}
      aria-label="Copy"
      onClick={() => {
        try { navigator.clipboard?.writeText(text).catch(() => {}); } catch {}
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
    >
      <Icon name={ok ? "check" : "copy"} size={14} />
    </button>
  );
}

export function Addr({ text, link }: { text: string; link?: boolean }) {
  if (!text || text === "—") return <span>—</span>;
  // Live data carries full 42/66-char values: show them shortened, copy the full value.
  const shown = text.length > 22 ? `${text.slice(0, 8)}...${text.slice(-6)}` : text;
  return (
    <span className="addr">
      <span className={link ? "link" : ""} title={text}>{shown}</span>
      <CopyBtn text={text} />
    </span>
  );
}

export function Tag({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "gold" | "red" | "muted" }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button className={`toggle ${on ? "on" : ""}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <i />{label}
    </button>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, line }: { tabs: { id: T; label: string; icon?: string }[]; value: T; onChange: (v: T) => void; line?: boolean }) {
  return (
    <div className={`tabs ${line ? "line" : ""}`} role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? "on" : ""} onClick={() => onChange(t.id)}>
          {t.icon && <Icon name={t.icon} size={16} />}{t.label}
        </button>
      ))}
    </div>
  );
}

export function Seg<T extends string>({ items, value, onChange }: { items: { id: T; label: string; icon?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {items.map((t) => (
        <button key={t.id} className={value === t.id ? "on" : ""} onClick={() => onChange(t.id)}>
          {t.icon && <Icon name={t.icon} size={14} />}{t.label}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="search">
      <Icon name="search" size={16} />
      <input className="inp" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export type Col<T> = { key: string; label: React.ReactNode; align?: "right"; render?: (r: T, i: number) => React.ReactNode };

export function DataTable<T extends Record<string, any>>({ columns, rows, pageSize = 10, variant = "page", empty, emptyHint }: {
  columns: Col<T>[]; rows: T[]; pageSize?: number; variant?: "page" | "showing"; empty?: string; emptyHint?: string;
}) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const slice = rows.slice(cur * pageSize, cur * pageSize + pageSize);
  const n = rows.length.toLocaleString("en-US");

  return (
    <div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>{columns.map((c) => <th key={c.key} className={c.align === "right" ? "ta-r" : ""}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan={columns.length}><div className="empty">{empty || "No records found"}{emptyHint && <small>{emptyHint}</small>}</div></td></tr>
            ) : (
              slice.map((r, i) => (
                <tr key={cur * pageSize + i}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.align === "right" ? "ta-r" : ""}>{c.render ? c.render(r, cur * pageSize + i) : String(r[c.key] ?? "")}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="pager">
          <span>
            {variant === "page"
              ? <>Page {cur + 1} of {pages} · <b>{n}</b> record{rows.length === 1 ? "" : "s"}</>
              : <>Showing page <b>{cur + 1}</b> of {pages} · <b className="down">{n}</b> total records</>}
          </span>
          <div className="btns">
            <button className="btn btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</button>
            {variant === "showing" && <span>{cur + 1} / {pages}</span>}
            <button className="btn btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export type IncomeFilter = { from: string; to: string; txn: string; user: string };

export function IncomeFilters({ onApply }: { onApply: (f: IncomeFilter) => void }) {
  const [f, setF] = useState<IncomeFilter>({ from: "", to: "", txn: "", user: "" });
  const set = (k: keyof IncomeFilter) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="filters" onSubmit={(e) => { e.preventDefault(); onApply(f); }}>
      <div><label className="field-l" htmlFor="f-from">From Date</label><input id="f-from" className="inp" type="date" value={f.from} onChange={set("from")} /></div>
      <div><label className="field-l" htmlFor="f-to">To Date</label><input id="f-to" className="inp" type="date" value={f.to} onChange={set("to")} /></div>
      <div><label className="field-l" htmlFor="f-txn">Txn Hash</label><input id="f-txn" className="inp" placeholder="Search by Txn hash..." value={f.txn} onChange={set("txn")} /></div>
      <div><label className="field-l" htmlFor="f-user">User ID</label><input id="f-user" className="inp" placeholder="Search by User ID..." value={f.user} onChange={set("user")} /></div>
      <button className="btn btn-gold" type="submit" style={{ padding: "13px 22px" }}><Icon name="search" size={15} /> Apply</button>
    </form>
  );
}

export function inRange(ts: number, from: string, to: string) {
  if (from && ts < Date.parse(from + "T00:00:00Z")) return false;
  if (to && ts > Date.parse(to + "T23:59:59Z")) return false;
  return true;
}

export function RequireWallet({ children }: { children: React.ReactNode }) {
  const { address, openModal } = useWallet();
  if (address) return <>{children}</>;
  return (
    <div className="panel gate">
      <img src="/logo.png" alt="Aritoham" />
      <h2>Connect your wallet</h2>
      <p>Connect MetaMask, OKX Wallet or Rabby to view your dashboard, income and team.</p>
      <button className="btn btn-gold btn-block" onClick={openModal}>Connect Wallet</button>
    </div>
  );
}

export function RankBadge({ n, size = 56, locked }: { n: number; size?: number; locked?: boolean }) {
  const id = useId().replace(/:/g, "");
  const hue = locked ? ["#6f6a5c", "#3b382f"] : ["#f6e08c", "#9a7a1f"];
  return (
    <svg width={size} height={size} viewBox="0 0 48 52" aria-hidden="true" style={{ flex: "none", filter: locked ? "grayscale(.4) brightness(.85)" : "drop-shadow(0 6px 14px rgba(212,175,55,.35))" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={hue[0]} /><stop offset="1" stopColor={hue[1]} /></linearGradient>
      </defs>
      <path d="M24 2l19 7v15c0 12-8 21-19 26C13 45 5 36 5 24V9z" fill={`url(#${id})`} />
      <path d="M24 7l14 5v12c0 9-6 16-14 20C16 40 10 33 10 24V12z" fill="#100d05" fillOpacity=".86" />
      {Array.from({ length: Math.min(n, 5) }).map((_, i) => (
        <path key={i} d={`M17 ${19 + i * 4.2}l7 -4l7 4`} fill="none" stroke={hue[0]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <text x="24" y={n > 5 ? 38 : 40} textAnchor="middle" fontSize="9" fontWeight="800" fill={hue[0]} fontFamily="Sora, sans-serif">{n}</text>
    </svg>
  );
}

export function Donut({ pct, size = 112 }: { pct: number; size?: number }) {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 112 112" width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(212,175,55,.14)" strokeWidth="10" />
        <circle cx="56" cy="56" r={r} fill="none" stroke="#d4af37" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(Math.min(pct, 100) / 100) * c} ${c}`} />
      </svg>
      <div className="c"><div>{pct}%<small>USED</small></div></div>
    </div>
  );
}

/** Price area chart drawn on the light-gold chart card. */
export function PriceChart({ data, labels }: { data: number[]; labels: string[] }) {
  const W = 640, H = 210, L = 56, R = 10, T = 12, B = 30;
  const min = Math.min(...data), max = Math.max(...data);
  const lo = Math.floor(min * 100000) / 100000; let hi = Math.ceil(max * 100000) / 100000; if (hi <= lo) hi = lo + 0.00001;
  const x = (i: number) => L + (i / (data.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - B} L${x(0)},${H - B} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => lo + t * (hi - lo));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} role="img" aria-label="24 hour price chart">
      <defs>
        <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b88f21" stopOpacity=".45" /><stop offset="1" stopColor="#b88f21" stopOpacity="0" /></linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#2a2109" strokeOpacity=".1" />
          <text x={L - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#7a6320" fontWeight="700">${t.toFixed(5)}</text>
        </g>
      ))}
      <path d={area} fill="url(#pc-fill)" />
      <path d={line} fill="none" stroke="#7a5a0e" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {labels.map((lb, i) => (
        <text key={i} x={L + (i / (labels.length - 1)) * (W - L - R)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#7a6320" fontWeight="700">{lb}</text>
      ))}
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="4" fill="#d4af37" stroke="#fff8e4" strokeWidth="2" />
    </svg>
  );
}
