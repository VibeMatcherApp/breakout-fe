export interface User {
    id: number;
    username: string;
    displayName: string;
    avatarInitials: string;
    activeStatus: string;
    reputation: number;
    walletAddress: string;
    createdAt: number;
    lastActive: number;
}

export interface Asset {
    symbol: string;
    balance: string;
    value: string;
}

export interface TradingPreference {
    wantedTokens: string[];
    offeredTokens: string[];
}