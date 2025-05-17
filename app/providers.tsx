"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "@/components/ui/toaster";
import { WalletGatekeeper } from "@/components/WalletGatekeeper";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const queryClient = new QueryClient();

const solanaChain = {
  id: 101,
  name: "Solana",
  rpcUrls: {
    default: { http: ["https://api.mainnet-beta.solana.com"] },
    public: { http: ["https://api.mainnet-beta.solana.com"] },
  },
  blockExplorers: {
    default: { name: "Solana Explorer", url: "https://explorer.solana.com" },
  },
  nativeCurrency: {
    name: "SOL",
    symbol: "SOL",
    decimals: 9,
  },
} as const;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID}
      config={{
        loginMethods: ["wallet", "email", "twitter"],
        appearance: {
          walletChainType: "solana-only",
          walletList: ["phantom"],
          theme: "dark",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        supportedChains: [solanaChain],
        defaultChain: solanaChain,
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WalletProvider>
            <UserProvider>
              <WalletGatekeeper>{children}</WalletGatekeeper>
              <Toaster />
            </UserProvider>
          </WalletProvider>
        </AuthProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}