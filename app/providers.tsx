"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import { UserProvider } from "@/context/UserContext";
import { Toaster } from "@/components/ui/toaster";
import { WalletGatekeeper } from "@/components/WalletGatekeeper";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <WalletProvider>
                    <UserProvider>
                        <WalletGatekeeper>
                            {children}
                        </WalletGatekeeper>
                        <Toaster />
                    </UserProvider>
                </WalletProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
} 