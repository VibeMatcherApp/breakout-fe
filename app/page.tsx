"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WalletGatekeeper } from "@/components/WalletGatekeeper";
import { Discover } from "@/components/discover/Discover";
import { MainLayout } from "@/components/layouts/MainLayouts";

export default function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check WorldCoin callback
    useEffect(() => {
        // Check if URL is WorldCoin callback
        if (window.location.pathname === '/api/auth/callback/worldcoin' && window.location.search.includes('code=')) {
            console.log('WorldCoin callback detected, redirecting to discover view');
            router.push('/?view=discover');
        }
    }, [router]);

    return (
        <WalletGatekeeper>
            <MainLayout>
                <Discover />
            </MainLayout>
        </WalletGatekeeper>
    );
} 