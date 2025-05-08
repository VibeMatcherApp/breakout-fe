"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WalletContextType {
    walletAddress: string | null;
    setWalletAddress: (address: string | null) => void;
    connected: boolean;
    setConnected: (connected: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userId } = useAuth();
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

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