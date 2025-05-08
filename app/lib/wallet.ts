import { ethers } from 'ethers';

// Connect to MetaMask wallet
export const walletConnect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed. Please install the MetaMask extension to continue.');
    }

    try {
        // Request user to connect wallet
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Check if current network is the contract network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const requiredChainId = '0x13882'; // Polygon Mainnet's Chain ID, using hexadecimal representation instead of decimal 137
        if (chainId !== requiredChainId) {
            // Try to switch network, using hex value 0x89
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: requiredChainId }],
                });
            } catch (switchError: any) {
                // If network is not added to MetaMask, we can add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: requiredChainId, // 0x89
                            chainName: 'Polygon Mainnet',
                            nativeCurrency: {
                                name: 'MATIC',
                                symbol: 'MATIC',
                                decimals: 18
                            },
                            rpcUrls: ['https://polygon-rpc.com/'],
                            blockExplorerUrls: ['https://polygonscan.com/']
                        }],
                    });
                } else {
                    throw switchError;
                }
            }
        }

        // Create provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        return provider;
    } catch (error: any) {
        console.error('Failed to connect wallet:', error);
        throw new Error(error.message || 'Failed to connect wallet');
    }
};

// Connect to MetaMask and return address (compatible with old version)
export const connectMetaMask = async (): Promise<string> => {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed. Please install the MetaMask extension to continue.');
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return accounts[0];
    } catch (error: any) {
        console.error('Failed to connect wallet:', error);
        throw error;
    }
};

// Get currently connected wallet address
export const getCurrentWalletAddress = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
        return null;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
        console.error('Error getting wallet address:', error);
        return null;
    }
};

// Monitor wallet status changes
export const addWalletListener = (callback: (accounts: string[]) => void) => {
    if (typeof window === 'undefined' || !window.ethereum) {
        return () => { }; // Return empty function as cleanup function
    }

    const handleAccountsChanged = (accounts: string[]) => {
        callback(accounts);
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);

    // Return cleanup function
    return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
};

// Declare window.ethereum type for TypeScript recognition
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, callback: (accounts: string[]) => void) => void;
            removeListener: (event: string, callback: (accounts: string[]) => void) => void;
        };
    }
}

export const getWalletProviders = () => {
    return [
        {
            name: "MetaMask",
            icon: "/images/metamask.svg",
        },
        {
            name: "WalletConnect",
            icon: "/images/walletconnect.svg",
        },
        {
            name: "Coinbase Wallet",
            icon: "/images/coinbase.svg",
        },
    ];
};

// Try all possible ways to disconnect MetaMask
export const disconnectMetaMask = async (): Promise<boolean> => {
    try {
        const ethereum = (window as any).ethereum;
        if (!ethereum || !ethereum.isMetaMask) {
            console.error("MetaMask not installed or unavailable");
            return false;
        }

        // No longer try to use internal method as it may cause errors
        // try {
        //     if (typeof ethereum._handleDisconnect === 'function') {
        //         await ethereum._handleDisconnect();
        //     }
        // } catch (error) {
        //     console.log("Failed to disconnect using internal method");
        // }

        // Clear connection status in local storage
        localStorage.setItem('walletconnected', 'false');
        localStorage.setItem('metamask_disconnected', Date.now().toString());

        // Add an additional flag to force ignore MetaMask connection status on next check
        localStorage.setItem('force_disconnect', 'true');

        // Add a flag indicating user has explicitly logged out to prevent auto re-login
        sessionStorage.setItem('user_logged_out', 'true');

        return true;
    } catch (error) {
        console.error("Error disconnecting MetaMask:", error);
        return false;
    }
}; 