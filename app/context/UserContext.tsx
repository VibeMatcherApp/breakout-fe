"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Asset, TradingPreference } from '../types/schema';
import { fetchUserProfile, fetchUserAssets, fetchUserPreferences } from '../lib/api';
import { useAuth } from './AuthContext';

interface UserContextType {
    user: User | null;
    assets: Asset[];
    preferences: TradingPreference | null;
    loading: boolean;
    error: string | null;
    refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userId } = useAuth();
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('userData');
            return storedUser ? JSON.parse(storedUser) : null;
        }
        return null;
    });
    const [assets, setAssets] = useState<Asset[]>(() => {
        if (typeof window !== 'undefined') {
            const storedAssets = localStorage.getItem('userAssets');
            return storedAssets ? JSON.parse(storedAssets) : [];
        }
        return [];
    });
    const [preferences, setPreferences] = useState<TradingPreference | null>(() => {
        if (typeof window !== 'undefined') {
            const storedPreferences = localStorage.getItem('userPreferences');
            return storedPreferences ? JSON.parse(storedPreferences) : null;
        }
        return null;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshUserData = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);

            const [userData, assetsData, preferencesData] = await Promise.all([
                fetchUserProfile(userId),
                fetchUserAssets(userId),
                fetchUserPreferences(userId)
            ]);

            setUser(userData);
            setAssets(assetsData);
            setPreferences(preferencesData);

            // 保存到本地存储
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('userAssets', JSON.stringify(assetsData));
            localStorage.setItem('userPreferences', JSON.stringify(preferencesData));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    // 当 userId 变化时刷新数据
    useEffect(() => {
        if (userId) {
            refreshUserData();
        } else {
            // 如果 userId 为空，清除所有数据
            setUser(null);
            setAssets([]);
            setPreferences(null);
            localStorage.removeItem('userData');
            localStorage.removeItem('userAssets');
            localStorage.removeItem('userPreferences');
        }
    }, [userId]);

    return (
        <UserContext.Provider value={{ user, assets, preferences, loading, error, refreshUserData }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}; 