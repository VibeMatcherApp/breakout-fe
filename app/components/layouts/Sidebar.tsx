"use client";

import React from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { disconnectMetaMask } from '@/lib/wallet';

export const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'discover';
    const { isAuthenticated, logout } = useAuth();
    const { setWalletAddress, setConnected } = useWallet();
    const { showToast } = useToast();

    console.log('Sidebar component rendered');

    const menuItems = [
        { view: 'discover', label: 'Matching', icon: '❤️' },
        { view: 'matches', label: 'Messages', icon: '💬' },
        { view: 'nft', label: 'NFT', icon: '🖼️' },
        { view: 'profile', label: 'Profile', icon: '👤' },
    ];

    const handleNavigation = (view: string) => {
        console.log('handleNavigation called, view:', view);
        router.push(`/?view=${view}`);
    };

    const handleLogout = async () => {
        try {
            // Clear Auth state
            logout();

            // Clear Wallet state
            setWalletAddress('');
            setConnected(false);

            // Try to disconnect MetaMask
            await disconnectMetaMask();

            // Show simple logout toast
            showToast("Logged out", "You have successfully logged out", "default");

            // Remove all possible auto-login items
            localStorage.removeItem('userId');

            // Mark logout status to ensure no auto-login after logout
            sessionStorage.setItem('user_logged_out', 'true');
            localStorage.setItem('walletconnected', 'false');
            localStorage.setItem('force_disconnect', 'true');

            // Delay to ensure toast is shown before page refresh
            setTimeout(() => {
                // Force refresh page to ensure all states are reset
                window.location.href = '/';
            }, 100);
        } catch (error) {
            console.error('Logout process error:', error);
            showToast("Logout error", "An error occurred during logout, please try again", "destructive");
        }
    };

    return (
        <>
            {/* Desktop sidebar */}
            <div className="w-64 h-screen bg-gray-900 text-white p-4 hidden md:block fixed left-0 top-0 flex flex-col">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">VibeMatcher</h1>
                </div>  

                <nav className="space-y-2 flex-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => handleNavigation(item.view)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full text-left ${currentView === item.view
                                ? 'bg-purple-600'
                                : 'hover:bg-gray-800'
                            }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}

                    {/* Logout button integrated into navigation menu */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full text-left mt-6 text-red-400 hover:bg-red-900/20"
                    >
                        <span><LogOut className="h-5 w-5" /></span>
                        <span>Logout</span>
                    </button>
                </nav>
            </div>

            {/* Mobile bottom navigation bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-2 md:hidden z-50">
                <div className="flex justify-around">
                    {menuItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => handleNavigation(item.view)}
                            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === item.view
                                ? 'bg-purple-600'
                                : 'hover:bg-gray-800'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs mt-1">{item.label}</span>
                        </button>
                    ))}

                    {/* Logout button - mobile */}
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center p-2 rounded-lg transition-colors text-red-400 hover:bg-red-900/20"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="text-xs mt-1">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};