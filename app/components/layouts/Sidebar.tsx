"use client";

import React from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, MessageCircle, Sparkles, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { disconnectMetaMask } from '@/lib/wallet';
import { usePrivy } from "@privy-io/react-auth";

export const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { logout: privyLogout } = usePrivy();
    const currentView = searchParams.get('view') || 'discover';
    const { isAuthenticated, logout } = useAuth();
    const { setWalletAddress, setConnected } = useWallet();
    const { showToast } = useToast();

    console.log('Sidebar component rendered');

    const menuItems = [
        { view: 'discover', label: 'Matching', icon: <Home size={24} /> },
        { view: 'matches', label: 'Messages', icon: <MessageCircle size={24} /> },
        { view: 'nft', label: 'NFT', icon: <Sparkles size={24} /> },
        { view: 'profile', label: 'Profile', icon: <User size={24} /> },
    ];

    const handleNavigation = (view: string) => {
        console.log('handleNavigation called, view:', view);
        router.push(`/?view=${view}`);
    };

    const handleLogout = async () => {
        try {
            await privyLogout();
    
            localStorage.removeItem("user_logged_out");
            localStorage.removeItem("walletconnected");
    
            window.location.href = "/";
        } catch (err) {
            console.error("Logout failed:", err);
            showToast("Logout error", "An error occurred during logout.", "destructive");
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
            <div className="fixed bottom-0 left-0 right-0 px-6 pb-6 pt-2 bg-white md:hidden z-50">
                <div className="flex justify-between items-center bg-gray-50 rounded-full px-4 py-2 shadow-sm">
                    {menuItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => handleNavigation(item.view)}
                            className={`p-3 rounded-full transition-all duration-300 ${currentView === item.view
                                ? 'text-violet-500 bg-violet-50 shadow-sm'
                                : 'text-gray-500 hover:text-violet-500 hover:bg-violet-50/50'
                                }`}
                        >
                            {item.icon}
                        </button>
                    ))}

                    {/* Logout button - mobile */}
                    <button
                        onClick={handleLogout}
                        className="p-3 rounded-full transition-all duration-300 text-gray-500 hover:text-red-500 hover:bg-red-50/50"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </>
    );
};