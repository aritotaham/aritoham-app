"use client";

import { useState } from "react";
import { Hero, Mini, PageTitle, Panel, RequireWallet } from "../ui";
import { useMarket } from "@/lib/data";
import { usd } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export default function PriceCalcView() {
  const { data: MARKET } = useMarket();
  const PRICE = MARKET.price;
  const [amt, setAmt] = useState("100");
  const a = parseFloat(amt) || 0;
  const tokens = a / PRICE;
  const daily = a * 0.01253;
  return (
    <>
      <PageTitle title="Price Calculator" sub={`Estimate ${BRAND.token} tokens and daily reward from the live price.`} />
      <RequireWallet>
        <Hero
          eyebrow="Live Price"
          title={`${BRAND.token} Price Calculator`}
          desc="Enter a USD amount to see tokens received and estimated daily reward."
          tiles={[
            { icon: "dollar", label: "Token Price", value: usd(PRICE, 6), hint: `${MARKET.changePct >= 0 ? "+" : ""}${MARKET.changePct.toFixed(2)}% last 24h` },
            { icon: "layers", label: "Total Liquidity", value: usd(MARKET.liquidity, 0), hint: "Pooled liquidity" },
            { icon: "flame", label: "Burned Tokens", value: MARKET.burn.toLocaleString("en-US", { maximumFractionDigits: 0 }), hint: "Total burn" },
          ]}
        />
        <Panel title="Calculate" sub="Estimates use the current protocol price.">
          <label className="field-l" htmlFor="pc-amt">Amount USD</label>
          <input id="pc-amt" className="inp" type="number" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} />
          <div className="cols-3" style={{ marginTop: 18 }}>
            <Mini icon="coins" label={`${BRAND.token} Tokens`} value={tokens.toLocaleString("en-US", { maximumFractionDigits: 4 })} hint="At live price" />
            <Mini icon="spark" label="Daily Reward" value={usd(daily, 4)} hint="Estimated" />
            <Mini icon="bars" label="30 Day Reward" value={usd(daily * 30, 4)} hint="Estimated" />
          </div>
        </Panel>
      </RequireWallet>
    </>
  );
}
