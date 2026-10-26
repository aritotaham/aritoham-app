// Deterministic mock data so server and client render identically.
// Replace with real contract / API calls when wiring the backend.
import { BRAND } from "./brand";

export type Row = Record<string, any>;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const r = rng(20261019);
const HEX = "0123456789abcdef";
const hex = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(r() * 16)]).join("");
const mix = (n: number) => hex(n).split("").map((c) => (/[a-f]/.test(c) && r() > 0.5 ? c.toUpperCase() : c)).join("");
/** 0xb024...9C4B */
export const wallet = () => "0x" + mix(4) + "..." + mix(4);
/** 0x8d0c9a...50245c */
export const thash = () => "0x" + hex(6) + "..." + hex(6);
const uid = () => BRAND.userPrefix + String(1000000 + Math.floor(r() * 8999999));
const at = (m: number, d: number, h: number, mi: number, s: number) => Date.UTC(2026, m - 1, d, h, mi, s);
const round = (n: number, d = 4) => +n.toFixed(d);

export const PRICE = 0.139733;
export const PROFILE = {
  me: "0x0000...0000",
  totalWithdrawn: 0,
  totalIncome: 0,
  minted: 0,
  walletUSDT: 0,
  walletToken: 0,
  dailyLimitLeft: 3000,
  limitLeft24h: 0,
  directIncome: 0,
  rewardIncome: 0,
  generationIncome: 0,
  daoIncome: 0,
};

/* -------- market -------- */
export const MARKET = { liquidity: 0, burn: 0, pooledUsdt: 0, supply: 0 };
export const PRICE_24H: number[] = (() => {
  const base = [0.1395, 0.13951, 0.13954, 0.13957, 0.13959, 0.13959, 0.1396, 0.13959, 0.1396, 0.1396, 0.13961, 0.13961, 0.1396, 0.13961, 0.13962, 0.13964, 0.13966, 0.13969, 0.13967, 0.13968, 0.1397, 0.13972, 0.13973, 0.13974, 0.13974];
  return base;
})();
export const PRICE_LABELS = ["6 PM", "8 PM", "10 PM", "12 AM", "2 AM", "4 AM", "6 AM", "8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"];

/* -------- participation history -------- */
export const PARTICIPATION: Row[] = [
  [at(0, 0, 0, 0, 0), "0x000000...000000", 0, 0, 0, 0],
  // [at(10, 14, 20, 58, 20), "0x2b8708...170ed1", 10, 0.136447, 52.7678, 0.1253],
  // [at(10, 11, 16, 6, 57), "0xc84e50...370540", 10, 0.132876, 54.186, 0.1253],
  // [at(9, 30, 10, 20, 31), "0xb38b91...c46a76", 10, 0.122189, 58.9249, 0.1253],
  // [at(9, 28, 17, 32, 31), "0xcc0568...a2c32e", 10, 0.120226, 59.8872, 0.1253],
  // [at(9, 27, 14, 34, 23), "0x567ce5...e510b7", 10, 0.118728, 60.6426, 0.1253],
  // [at(9, 26, 19, 11, 12), "0x9be5e3...5e8b2a", 10, 0.117919, 61.059, 0.1253],
  // [at(9, 26, 0, 17, 17), "0x38af06...f287e7", 10, 0.117406, 61.3257, 0.1253],
  // [at(9, 18, 5, 30, 12), "0x0e39f3...37195a", 90, 0.109303, 592.8453, 1.1275],
].map(([ts, hash, minted, price, tokens, reward]) => ({ ts, hash, minted, price, tokens, reward }));

/* -------- withdraw history (52) -------- */
const W_FIXED: [number, string, number, number, number][] = [
  [at(0, 0, 0, 0, 0), "0x000000...000000", 0, 0, 0],
  // [at(10, 16, 22, 25, 18), "0x0c9f6f...953f20", 11.2956, 0.5648, 81.3331],
  // [at(10, 16, 11, 42, 2), "0x829066...598646", 10.032, 0.5016, 72.791],
  // [at(10, 15, 18, 17, 10), "0x2f45bc...79a5ee", 10.0515, 0.5026, 73.192],
  // [at(10, 15, 9, 52, 52), "0x119e75...0815ac", 10.3141, 0.5157, 75.3556],
  // [at(10, 15, 0, 38, 30), "0x1cef59...eba490", 10.5824, 0.5291, 77.4213],
  // [at(10, 12, 12, 39, 56), "0xfcdd52...348865", 10.0238, 0.5012, 75.0591],
  // [at(10, 12, 8, 42, 32), "0x427874...621249", 10.1781, 0.5089, 76.2825],
  // [at(10, 11, 22, 31, 21), "0x3c5d5a...ffec62", 10.0235, 0.5012, 75.2302],
  // [at(10, 1, 1, 13, 46), "0xa81440...69d62b", 10.0151, 0.5008, 81.0958],
];
export const WITHDRAWALS: Row[] = (() => {
  const out: Row[] = W_FIXED.map(([ts, hash, amount, fee, tokens]) => ({ ts, hash, amount, wallet: "0x73d7...dfb7", fee, tokens }));
  let ts = at(9, 30, 9, 30, 48);
  for (let i = out.length; i < 52; i++) {
    ts -= Math.floor(3600e3 * (2 + r() * 20));
    const amount = round(10 + Math.pow(r(), 2) * 1.9);
    const fee = round(amount * 0.05);
    const price = 0.1085 + r() * 0.012;
    out.push({ ts, hash: thash(), amount, wallet: "0x73d7...dfb7", fee, tokens: round((amount - fee) / price) });
  }
  return out;
})();

/* -------- sell report -------- */
export const SELLS: Row[] = [
  { ts: at(0, 0, 0, 0, 0), hash: "0x000000...000000", sold: 0, usdt: 0, price: 0 },
  // { ts: at(9, 30, 10, 20, 31), hash: "0xb38b91...c46a76", sold: 100, usdt: 10.3861, price: 0.122189 },
  // { ts: at(9, 18, 5, 30, 12), hash: "0x0e39f3...37195a", sold: 980, usdt: 91.0488, price: 0.109302 },
];

/* -------- direct income -------- */
export const DIRECT_INCOME: Row[] = (
  [
    [at(0, 0, 0, 0, 0), 0, "0x0000...0000", 20, "0x000000...000000"],
    // [at(10, 1, 0, 38, 35), 8972691, "0xb024...9C4B", 50, "0x2f6e24...fcdb89"],
    // [at(9, 28, 6, 28, 12), 8972691, "0xb024...9C4B", 50, "0xb6bc4b...4edb7a"],
    // [at(9, 27, 6, 58, 33), 8972691, "0xb024...9C4B", 50, "0xc3bfb4...026708"],
    // [at(9, 26, 21, 54, 32), 8972691, "0xb024...9C4B", 10, "0xcf037d...690a61"],
    // [at(9, 25, 5, 22, 41), 7968391, "0xe234...8F76", 10, "0xe76d0e...9cceb8"],
    // [at(9, 24, 6, 44, 17), 8972691, "0xb024...9C4B", 50, "0x128aa2...2ec55f"],
    // [at(9, 23, 19, 47, 59), 7114742, "0xC1a0...56fd", 40, "0xa2d132...a4868a"],
    // [at(9, 20, 13, 47, 18), 7968391, "0xe234...8F76", 10, "0xc9572c...74161d"],
    // [at(9, 19, 5, 47, 18), 7968391, "0xe234...8F76", 10, "0xfea643...0758f7"],
  ] as [number, number, string, number, string][]
).map(([ts, n, w, minted, hash]) => {
  const id = BRAND.userPrefix + n;
  const inc = minted * 0.05;
  return { ts, uid: id, wallet: w, minted, income: inc, commission: "5%", hash, note: `Direct income of ${inc} from user ${id} for stake $${minted}` };
});

/* -------- generation income (4719) -------- */
const G_FIXED: [number, number, string, number, number, number, number, string, string][] = [
  [at(10, 17, 13, 38, 24), 5287078, "0xf960...DEb6", 6, 28.5638, 0.0531, 1.5, "0x6529e1...f43e40", "0.053068|28.56384"],
  [at(10, 17, 12, 54, 49), 7573519, "0x89dA...06BA", 7, 6.264, 0.0626, 1, "0xdd006c...225169", "0.06264|6.264"],
  [at(10, 17, 12, 24, 25), 6128753, "0x7aeE...DD83", 8, 25.056, 0.2506, 1, "0x5392d5...44e505", "0.25056|25.056"],
  [at(10, 17, 12, 19, 42), 3617885, "0x1c12...aB74", 14, 12.528, 0.0376, 0.3, "0x94fa53...e01875", "0.037584|12.527999"],
  [at(10, 17, 12, 17, 4), 4137110, "0x9099...7339", 10, 12.528, 0.1253, 1, "0xd10d9e...fd0c27", "0.12528|12.528"],
  [at(10, 17, 12, 0, 4), 9198685, "0x4aC3...659d", 12, 0.877, 0.0026, 0.3, "0x3c9655...f5db39", "0.00263|0.87696"],
  [at(10, 17, 11, 57, 30), 3010126, "0x4fD3...ef69", 6, 1.2528, 0.0188, 1.5, "0xa19d52...9a852e", "0.018792|1.2528"],
  [at(10, 17, 11, 54, 29), 4685359, "0xb586...8345", 11, 6.264, 0.0188, 0.3, "0x2dd1a6...034dd0", "0.018792|6.264"],
  [at(10, 17, 11, 52, 14), 1299054, "0x8Be9...BD5D", 15, 314.4528, 0.9434, 0.3, "0xff52e1...1f37f9", "0.943358|314.452799"],
  [at(10, 17, 11, 31, 54), 3390967, "0xc7aC...0Fbd", 9, 1.5034, 0.015, 1, "0xf2fb33...a6c07b", "0.015033|1.50336"],
];
export const GENERATION: Row[] = (() => {
  const out: Row[] = G_FIXED.map(([ts, n, w, level, base, income, pct, hash, c]) => {
    const [inc, b] = c.split("|");
    const id = BRAND.userPrefix + n;
    return { ts, uid: id, wallet: w, level, base, income, pct: pct + "%", hash, comment: `You have received $${inc} generation income (Level ${level}) from ${id}'s ROI earnings of $${b}.` };
  });
  let ts = at(10, 17, 11, 31, 54);
  for (let i = out.length; i < 4719; i++) {
    ts -= Math.floor(60e3 * (1 + r() * 9));
    const level = 1 + Math.floor(r() * 20);
    const pct = level <= 6 ? 1.5 : level <= 10 ? 1 : 0.3;
    const base = round(0.4 + Math.pow(r(), 3) * 320);
    const income = round((base * pct) / 100);
    const id = uid();
    out.push({ ts, uid: id, wallet: wallet(), level, base, income, pct: pct + "%", hash: thash(), comment: `You have received $${round(income, 6)} generation income (Level ${level}) from ${id}'s ROI earnings of $${round(base, 5)}.` });
  }
  return out;
})();

/* -------- ranks -------- */
export const RANKS = [
  { name: "Spark", self: 100, directs: 3, matching: 5000, pct: 8, income: 0 },
  { name: "Rise", self: 200, directs: 5, matching: 10000, pct: 10, income: 0 },
  { name: "Prime", self: 300, directs: 7, matching: 25000, pct: 12, income: 500 },
  { name: "Elite", self: 400, directs: 9, matching: 50000, pct: 15, income: 750 },
  { name: "Legend", self: 500, directs: 11, matching: 100000, pct: 18, income: 1750 },
  { name: "Titan", self: 600, directs: 12, matching: 250000, pct: 20, income: 5750 },
  { name: "Crown", self: 700, directs: 13, matching: 500000, pct: 25, income: 11250 },
  { name: "Royal", self: 800, directs: 14, matching: 1000000, pct: 30, income: 25000 },
  { name: "Emperor", self: 1000, directs: 15, matching: 2500000, pct: 35, income: 80000 },
];

/* -------- DAO partner program -------- */
export const DAO = { pool: 3796, deposit: 0, holders: 742, eligible: 0, shares: 763, valuePerShare: 4.9751, activated: "9/18/2026" };
const D_FIXED: [string, number, boolean][] = [
  ["0x978b...9710", 3560, false], ["0xb8c2...c34f", 700, false], ["0x9F6b...1d0c", 16780, false], ["0xA911...80Bf", 2500, false],
  ["0x9b2E...A47E", 5480, false], ["0x685A...47dd", 5050, false], ["0x73D7...DfB6", 2220, true], ["0xb024...9C4B", 130, false],
  ["0x8CAE...2B42", 1210, false], ["0xa68A...2b0B", 1520, false],
];
export const DAO_MEMBERS: Row[] = (() => {
  const mk = (w: string, m: number, mine: boolean) => {
    const tiers = Math.floor(m / 2500);
    const target = (tiers + 1) * 2500;
    return { wallet: w, matching: m, target, tiers, toNext: target - m, shares: tiers + 1, reward: round((tiers + 1) * DAO.valuePerShare), mine };
  };
  const out = D_FIXED.map(([w, m, mine]) => mk(w, m, mine));
  for (let i = out.length; i < 742; i++) out.push(mk(wallet(), Math.round((Math.pow(r(), 2.4) * 18000) / 10) * 10, r() < 0.012));
  return out;
})();

/* -------- DAO payouts -------- */
export const CYCLES = Array.from({ length: 14 }, (_, i) => 14 - i);
export function cycleSummary(c: number) {
  if (c === 14) return { deposit: 248710, pool: 12500.5, members: 734, shares: 847, vps: 14.7586, ts: at(10, 12, 0, 0, 0) };
  const deposit = Math.round(248710 * (0.52 + 0.03 * c));
  const pool = round(deposit * 0.05, 1);
  const shares = 800 + c * 3;
  return { deposit, pool, members: 690 + c * 3, shares, vps: round(pool / shares), ts: at(10, 12, 0, 0, 0) - (14 - c) * 7 * 86400e3 };
}
const P_FIXED = ["0xD0F3...9a73", "0x0b58...BCB1", "0x2F8F...6C8e", "0xf526...1DE4", "0xD31b...2Db3", "0x67a4...056c", "0x1582...24aF", "0xD8de...e026", "0x93F4...C28B", "0x9F7A...3fc4"];
const payoutCache: Record<number, Row[]> = {};
export function payoutsFor(c: number): Row[] {
  if (payoutCache[c]) return payoutCache[c];
  const s = cycleSummary(c);
  const local = rng(900 + c);
  const out: Row[] = Array.from({ length: s.members }, (_, i) => {
    const w = i < 10 ? P_FIXED[i] : "0x" + [0, 1, 2, 3].map(() => "0123456789abcdefABCDEF"[Math.floor(local() * 22)]).join("") + "..." + [0, 1, 2, 3].map(() => "0123456789abcdefABCDEF"[Math.floor(local() * 22)]).join("");
    return { wallet: w, matching: 0, shares: 1, value: s.vps, payout: s.vps, ts: s.ts };
  });
  return (payoutCache[c] = out);
}
export const MY_PAYOUTS: Row[] = [14, 13, 12, 11, 10, 9, 8].map((c, i) => {
  const s = cycleSummary(c);
  const got = i !== 0 && i !== 2;
  return { cycle: c, ts: s.ts, shares: got ? 1 : 0, value: s.vps, payout: got ? s.vps : 0, hash: got ? thash() : "—", status: got ? "RECEIVED" : "MISSED" };
});
