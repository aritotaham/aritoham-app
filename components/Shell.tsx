"use client";

import Link from "next/link";
import { LIVE, useDataError } from "@/lib/data";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/routes";
import { BRAND } from "@/lib/brand";
import { midAddr } from "@/lib/format";
import { Icon, CopyBtn } from "./ui";
import { useWallet, WALLETS } from "./WalletProvider";
import WalletModal from "./WalletModal";

function DataStatus() {
  const err = useDataError();
  if (LIVE && err) {
    return (
      <div className="alert warn" style={{ marginBottom: 16 }}>
        <span><b>Could not read contract data.</b> {err} — check your network connection.</span>
      </div>
    );
  }
  if (!LIVE) {
    return (
      <div className="alert gold" style={{ marginBottom: 16 }}>
        <span><b>Demo data.</b> Remove <code>NEXT_PUBLIC_DEMO_DATA=1</code> to read live data from the BSC Testnet contracts.</span>
      </div>
    );
  }
  return null;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/dashboard";
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const { address, walletId, openModal, disconnect } = useWallet();

  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);
  const walletName = WALLETS.find((w) => w.id === walletId)?.name;

  return (
    <>
      <div className="bg-fx" />
      <div className={`shell ${collapsed ? "collapsed" : ""}`}>
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <div className="brand">
            <div className="brand-logo"><img src="/logo.png" alt={BRAND.name} /></div>
            <div className="brand-text">
              <div className="brand-name">{BRAND.name}</div>
              <div className="brand-sub">{BRAND.sub}</div>
            </div>
          </div>
          <div className="nav-label"><span>User Panel</span></div>
          <nav className="nav">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} title={n.label} className={`nav-item ${pathname === n.href ? "active" : ""}`}>
                <Icon name={n.icon} size={19} />
                <span className="nav-text">{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="side-foot">
            <button className="logout" onClick={disconnect} title="Logout">
              <Icon name="logout" size={19} /><span className="nav-text">Logout</span>
            </button>
          </div>
        </aside>
        <button className="collapse-btn" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar">
          <Icon name="arrowleft" size={18} />
        </button>
        <div className={`overlay ${open ? "show" : ""}`} onClick={() => setOpen(false)} />

        <div className="main">
          <header className="topbar">
            <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
            {address ? (
              <>
                <div className="acct">
                  <div className="conn-pill">
                    <span className="conn-ico"><Icon name="wallet" size={17} /></span>
                    <button style={{ background: "transparent", border: 0, textAlign: "left" }} onClick={() => setMenu((m) => !m)} aria-label="Wallet menu">
                      <div className="conn-l">CONNECTED{walletName ? ` · ${walletName.split(" ")[0].toUpperCase()}` : ""}</div>
                      <div className="conn-a">{midAddr(address)}</div>
                    </button>
                    <CopyBtn text={address} />
                  </div>
                  {menu && (
                    <div className="acct-menu">
                      <button onClick={() => { setMenu(false); openModal(); }}>Switch wallet</button>
                    </div>
                  )}
                </div>
                <button className="top-logout" onClick={disconnect}><Icon name="logout" size={17} /> Logout</button>
              </>
            ) : (
              <button className="top-logout" onClick={openModal}><Icon name="wallet" size={17} /> Connect Wallet</button>
            )}
          </header>
          <main className="content"><DataStatus />{children}</main>
        </div>
      </div>
      <WalletModal />
    </>
  );
}
