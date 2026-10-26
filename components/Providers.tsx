"use client";

import { WalletProvider } from "./WalletProvider";
import RegistrationGuard from "./RegistrationGuard";
import Shell from "./Shell";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <Shell>
        <RegistrationGuard>{children}</RegistrationGuard>
      </Shell>
    </WalletProvider>
  );
}
