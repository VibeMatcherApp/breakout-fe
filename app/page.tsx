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
    const view = searchParams.get('view') || 'discover';

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

    // 检查认证状态
    useEffect(() => {
        if (!ready) return;
        
        const hasLoggedIn = localStorage.getItem('hasLoggedIn') === 'true';
        const userLoggedOut = localStorage.getItem('user_logged_out') === 'true';
        
        if (hasLoggedIn && !authenticated && !userLoggedOut) {
            console.log('Auto login triggered');
            login();
        }
    }, [ready, authenticated, login]);
    
    if (!ready) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/90">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <MainLayout>
            <Discover />
        </MainLayout>
    );
}