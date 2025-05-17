"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePrivy } from '@privy-io/react-auth';

interface WalletContextType {
    walletAddress: string | null;
    setWalletAddress: (address: string | null) => void;
    connected: boolean;
    setConnected: (connected: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userId } = useAuth();
    const { ready, authenticated, user } = usePrivy();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    // 初始化时检查本地存储的钱包地址
    useEffect(() => {
        if (ready && authenticated && user?.wallet?.address) {
            const storedAddress = localStorage.getItem('walletAddress');
            if (storedAddress === user.wallet.address) {
                setWalletAddress(user.wallet.address);
                setConnected(true);
            }
        }
    }, [ready, authenticated, user]);

    // 当 Privy 用户状态变化时更新钱包状态
    useEffect(() => {
        if (ready && authenticated && user?.wallet?.address) {
            setWalletAddress(user.wallet.address);
            setConnected(true);
            localStorage.setItem('walletAddress', user.wallet.address);
        } else if (!authenticated) {
            setWalletAddress(null);
            setConnected(false);
            localStorage.removeItem('walletAddress');
        }
    }, [ready, authenticated, user]);

    const connect = async () => {
        try {
            // Here should implement actual wallet connection logic
            // For example using ethers.js or web3.js
            setConnected(true);
            setWalletAddress('0x123...'); // Example address
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            throw error;
        }
    };

    const disconnect = () => {
        setConnected(false);
        setWalletAddress(null);
    };

    return (
        <WalletContext.Provider value={{ walletAddress, setWalletAddress, connected, setConnected }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}; 