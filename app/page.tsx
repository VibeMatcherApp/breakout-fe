"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WalletGatekeeper } from "@/components/WalletGatekeeper";
import { Discover } from "@/components/discover/Discover";
import { MainLayout } from "@/components/layouts/MainLayouts";
import { usePrivy } from "@privy-io/react-auth";

export default function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { ready, authenticated, login, logout } = usePrivy();

    // Check WorldCoin callback
    useEffect(() => {
        if (!ready) return;
        // Check if URL is WorldCoin callback
        if (
          window.location.pathname === '/api/auth/callback/worldcoin' &&
          window.location.search.includes('code=')
        ) {
          console.log('WorldCoin callback detected, redirecting to discover view');
          router.push('/?view=discover');
        }
      }, [ready, router]);
    
      if (!ready) {
        return <div>Loading...</div>;
      }

    return (
        <MainLayout>
            <Discover />
        </MainLayout>
    );
}