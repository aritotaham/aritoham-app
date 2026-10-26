export const usd = (n: number, digits = 2) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** $3,796 / $0.5 style: no forced decimals */
export const money = (n: number, max = 4) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: max });

export const num = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });

export const shortAddr = (a: string) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "");
export const midAddr = (a: string) => (a ? `${a.slice(0, 10)}…${a.slice(-10)}` : "");

const p2 = (n: number) => String(n).padStart(2, "0");

/** 10/17/2026, 1:38:24 PM  (UTC fields so server and client agree) */
export function fmtUS(ts: number) {
  const d = new Date(ts);
  let h = d.getUTCHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}, ${h}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} ${ap}`;
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Oct 12, 2026 */
export function fmtDay(ts: number) {
  const d = new Date(ts);
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
