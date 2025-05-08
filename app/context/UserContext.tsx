"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Asset, TradingPreference } from '@shared/schema';
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
    const [user, setUser] = useState<User | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [preferences, setPreferences] = useState<TradingPreference | null>(null);
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUserData();
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