export type NavItem = { label: string; icon: string; href: string };

export const NAV: NavItem[] = [
  { label: "Dashboard Overview", icon: "grid", href: "/dashboard" },
  { label: "Protocol Participation", icon: "link", href: "/staking" },
  { label: "Price Calculator", icon: "calculator", href: "/price-calculator" },
  { label: "Withdraw", icon: "download", href: "/withdraw" },
  { label: "Sell Report", icon: "file", href: "/sell-tokens" },
  { label: "Emission Rewards", icon: "dollar", href: "/income/roi" },
  { label: "Direct Income", icon: "trend", href: "/income/direct" },
  { label: "Rank Rewards", icon: "crown", href: "/income/rank" },
  { label: "Generation Income", icon: "network", href: "/income/generation" },
  { label: "DAO Partnership Program", icon: "gem", href: "/income/leadership-pool" },
  { label: "DAO Payouts", icon: "hand", href: "/dao-payouts" },
  { label: "My Direct Team", icon: "users", href: "/team/direct" },
  { label: "My Contributing Team", icon: "network", href: "/team/all" },
];
