export interface User {
    id: string;
    username: string;
    displayName: string;
    avatarInitials: string;
    activeStatus: string;
    reputation: number;
    wallet_address?: string;
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