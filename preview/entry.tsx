import React from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import Providers from "../components/Providers";
import { usePathname } from "next/navigation";
import DashboardView from "../components/views/DashboardView";
import ParticipationView from "../components/views/ParticipationView";
import PriceCalcView from "../components/views/PriceCalcView";
import WithdrawView from "../components/views/WithdrawView";
import SellReportView from "../components/views/SellReportView";
import DaoProgramView from "../components/views/DaoProgramView";
import DaoPayoutsView from "../components/views/DaoPayoutsView";
import { DirectTeamView, ContributingTeamView } from "../components/views/TeamViews";
import { EmissionRewardsView, DirectIncomeView, RankRewardsView, GenerationIncomeView } from "../components/views/IncomeViews";

const routes: Record<string, () => JSX.Element> = {
  "/dashboard": () => <DashboardView />,
  "/staking": () => <ParticipationView />,
  "/price-calculator": () => <PriceCalcView />,
  "/withdraw": () => <WithdrawView />,
  "/sell-tokens": () => <SellReportView />,
  "/income/roi": () => <EmissionRewardsView />,
  "/income/direct": () => <DirectIncomeView />,
  "/income/rank": () => <RankRewardsView />,
  "/income/generation": () => <GenerationIncomeView />,
  "/income/leadership-pool": () => <DaoProgramView />,
  "/dao-payouts": () => <DaoPayoutsView />,
  "/team/direct": () => <DirectTeamView />,
  "/team/all": () => <ContributingTeamView />,
};

function Page() {
  const path = usePathname();
  const View = routes[path] || routes["/dashboard"];
  return <View />;
}

createRoot(document.getElementById("root")!).render(
  <Providers>
    <Page />
  </Providers>
);
