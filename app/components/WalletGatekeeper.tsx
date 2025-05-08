"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { connectMetaMask } from '@/lib/wallet';
import { getRizzContract } from '@/lib/contracts/RizzToken';
import { walletConnect } from '@/lib/wallet';

interface WalletGatekeeperProps {
    children: React.ReactNode;
}

export function WalletGatekeeper({ children }: WalletGatekeeperProps) {
    const router = useRouter();
    const { walletAddress, setWalletAddress, connected, setConnected } = useWallet();
    const { userId, login, logout } = useAuth();
    const [isInitializing, setIsInitializing] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [nickname, setNickname] = useState('');
    const [showRegistration, setShowRegistration] = useState(false);
    const lastApiCallRef = useRef<{ timestamp: number, address: string, nickname: string, result: any }>({
        timestamp: 0,
        address: '',
        nickname: '',
        result: null
    });

    // Use browser's native alert or console.log instead of useToast
    const showToast = (title: string, description: string = '', variant: "default" | "destructive" = "default") => {
        console.log(`${title}: ${description}`);
        // Only use alert for errors to avoid too much interruption
        if (variant === "destructive") {
            alert(`${title}: ${description}`);
        }
    };

    // Check if user exists
    const checkUserExists = async (address: string) => {
        try {
            console.log(`Checking if user ${address} exists`);
            const response = await fetch(`http://43.207.147.137:3001/api/users/${address}`);

            console.log('API response status:', response.status);

            // Log complete response for debugging
            const responseData = await response.json();
            console.log('API response content:', responseData);

            if (response.ok) {
                return { exists: true, userData: responseData };
            } else if (response.status === 400 || response.status === 404) {
                // 400 or 404 means user doesn't exist, need to register
                return { exists: false, userData: null };
            } else {
                throw new Error(`API request failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Error checking if user exists:', error);
            throw error;
        }
    };

    // Register new user
    const registerUser = async (address: string, userNickname: string) => {
        try {
            console.log(`Registering user, address: ${address}, nickname: ${userNickname}`);

            const response = await fetch('http://43.207.147.137:3001/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    wallet_address: address,
                    nickname: userNickname,
                }),
            });

            console.log('Registration API response status:', response.status);

            // Log complete response for debugging
            const responseData = await response.json();
            console.log('Registration API response content:', responseData);

            if (response.status === 201 || response.status === 200) {
                return responseData;
            } else {
                throw new Error(`API request failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    };

    // Update user tokens
    const updateUserTokens = async (walletAddress: string) => {
        try {
            console.log(`Updating user tokens, address: ${walletAddress}`);

            const response = await fetch(`http://43.207.147.137:3001/api/users/${walletAddress}/update_tokens`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Update tokens API response status:', response.status);

            if (response.ok) {
                const responseData = await response.json();
                console.log('Token update successful, response content:', responseData);
                return responseData;
            } else {
                const errorData = await response.json();
                console.error('Token update failed, error message:', errorData);
                throw new Error(`Token update failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Error updating user tokens:', error);
            // Don't throw error to avoid interrupting login flow
            return null;
        }
    };

    // Call this function after successful login
    const registerUserForRizz = async (walletAddress: string) => {
        try {
            const provider = await walletConnect();
            if (!provider) return;

            const rizzContract = getRizzContract(provider);
            const isRegistered = await rizzContract.isRegistered(walletAddress);

            if (!isRegistered) {
                console.log("User not registered in RIZZ contract, registering...");
                const tx = await rizzContract.register();
                await tx.wait();
                console.log("RIZZ registration successful, received 5 RIZZ tokens");

                // Show a toast message
                showToast(
                    "Registration bonus",
                    "You've received 5 RIZZ tokens as a welcome bonus!",
                    "default"
                );
            } else {
                console.log("User already registered in RIZZ contract");
            }
        } catch (error) {
            console.error("RIZZ registration error:", error);
            // Don't interrupt user login flow, just log error
        }
    };

    // Connect wallet and check user
    const handleConnectWallet = async () => {
        try {
            setIsConnecting(true);
            const address = await connectMetaMask();
            console.log('Wallet connection successful, address:', address);

            if (address) {
                setWalletAddress(address);
                setConnected(true);
                localStorage.setItem('walletAddress', address); // Store wallet address in localStorage

                try {
                    // Check if user exists
                    console.log('Checking if user exists');
                    const result = await checkUserExists(address);
                    console.log('User check result:', result);

                    if (result.exists && result.userData) {
                        console.log('User exists, user data:', result.userData);
                        // Use result.userData._id directly instead of result.userData.user._id
                        if (result.userData._id) {
                            // User exists, login directly
                            login(result.userData._id);
                            localStorage.setItem('walletconnected', 'true');
                            sessionStorage.removeItem('user_logged_out');
                            showToast("Connection successful", `Welcome back, ${result.userData.nickname}!`);

                            // Update user tokens immediately after login
                            updateUserTokens(address);

                            // Redirect to discover page
                            router.push('/?view=discover');
                        } else {
                            console.error('Incorrect user data format:', result.userData);
                            showToast("Connection failed", "Incorrect user data format", "destructive");
                            // Reset connection state
                            setWalletAddress('');
                            setConnected(false);
                        }
                    } else {
                        console.log('User does not exist, showing registration form');
                        // User does not exist, show registration form
                        setShowRegistration(true);
                    }
                } catch (error) {
                    // API request failed
                    console.error("Error checking user:", error);
                    showToast("Connection failed", "Cannot connect to server, please try again later", "destructive");

                    // Reset connection state
                    setWalletAddress('');
                    setConnected(false);
                    sessionStorage.setItem('user_logged_out', 'true');
                }
            }
        } catch (error) {
            console.error("Wallet connection failed:", error);
            showToast("Connection failed", "Cannot connect to wallet, please try again", "destructive");
        } finally {
            setIsConnecting(false);
        }
    };

    // Handle registration form submission
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nickname.trim()) {
            showToast("Error", "Please enter a nickname", "destructive");
            return;
        }

        try {
            setIsConnecting(true);
            if (!walletAddress) {
                showToast("Error", "Wallet address does not exist", "destructive");
                return;
            }

            console.log("Starting user registration...");
            const userData = await registerUser(walletAddress, nickname);
            console.log("Registration response:", userData);

            if (userData && userData._id) {
                console.log("Successfully logged in user:", userData._id);
                login(userData._id);
                localStorage.setItem('walletconnected', 'true');
                localStorage.setItem('walletAddress', walletAddress); // Store wallet address in localStorage
                sessionStorage.removeItem('user_logged_out');
                showToast("Registration successful", `Welcome, ${userData.nickname}!`);
                setShowRegistration(false);

                // Update user tokens immediately after registration
                updateUserTokens(walletAddress);

                // Call RIZZ registration
                await registerUserForRizz(walletAddress);

                // Redirect to discover page
                router.push('/?view=discover');
            } else {
                console.error("Incorrect user data format:", userData);
                throw new Error("Incorrect user data format");
            }
        } catch (error) {
            console.error("Error registering user:", error);
            showToast("Registration failed", "Cannot complete registration, please try again later", "destructive");
        } finally {
            setIsConnecting(false);
        }
    };

    // Automatically check wallet connection
    useEffect(() => {
        const checkConnection = async () => {
            // Check if URL is WorldCoin callback
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                const isWorldcoinCallback = url.pathname === '/api/auth/callback/worldcoin' && url.searchParams.has('code');

                if (isWorldcoinCallback) {
                    // Handle WorldCoin login success
                    console.log('WorldCoin login detected, redirecting to discover page');
                    // Temporarily redirect to discover page
                    router.push('/?view=discover');
                    return;
                }
            }

            try {
                setIsInitializing(true);
                const ethereum = (window as any).ethereum;

                if (!ethereum) {
                    setIsInitializing(false);
                    return;
                }

                try {
                    const accounts = await ethereum.request({ method: 'eth_accounts' });

                    if (accounts.length > 0) {
                        const address = accounts[0];
                        setWalletAddress(address);
                        setConnected(true);
                        localStorage.setItem('walletAddress', address); // Store wallet address in localStorage

                        // Check if there's a logout flag
                        if (sessionStorage.getItem('user_logged_out') === 'true') {
                            console.log('Logout flag detected, preventing auto-login');
                            setWalletAddress('');
                            setConnected(false);
                            localStorage.removeItem('walletAddress'); // Remove wallet address
                            return;
                        }

                        if (userId) {
                            console.log("User already logged in");
                            localStorage.setItem('walletconnected', 'true');

                            // User already logged in, update token info
                            updateUserTokens(address);
                        } else {
                            try {
                                // Check if user exists
                                const { exists, userData } = await checkUserExists(address);

                                if (exists && userData) {
                                    // Auto login
                                    login(userData.user._id);
                                    console.log("Wallet connection detected, auto-login successful");
                                    localStorage.setItem('walletconnected', 'true');

                                    // Update tokens after auto-login
                                    updateUserTokens(address);

                                    // Redirect to discover page
                                    router.push('/?view=discover');
                                } else {
                                    // User does not exist, show registration form
                                    setShowRegistration(true);
                                }
                            } catch (error) {
                                console.error("Auto-login failed:", error);
                                setWalletAddress('');
                                setConnected(false);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error getting MetaMask accounts:", error);
                    setWalletAddress('');
                    setConnected(false);
                }
            } catch (error) {
                console.error("Error checking wallet connection:", error);
                setWalletAddress('');
                setConnected(false);
            } finally {
                setIsInitializing(false);
            }
        };

        checkConnection();
    }, [setWalletAddress, setConnected, userId, login]);

    // Listen for MetaMask account changes and disconnections
    useEffect(() => {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return;

        const handleAccountsChanged = async (accounts: string[]) => {
            console.log('MetaMask accounts changed:', accounts);
            if (accounts.length === 0) {
                // User disconnected or locked MetaMask
                setWalletAddress('');
                setConnected(false);
                logout();
                localStorage.removeItem('walletAddress'); // Remove wallet address
                router.push('/');
                showToast("Wallet disconnected", "Your MetaMask connection has been disconnected", "destructive");
                // Set logout flag
                sessionStorage.setItem('user_logged_out', 'true');
            } else if (accounts[0] !== walletAddress) {
                // User switched accounts
                setWalletAddress(accounts[0]);
                setConnected(true);
                localStorage.setItem('walletAddress', accounts[0]); // Update wallet address in localStorage

                try {
                    // Check if new account exists
                    const { exists, userData } = await checkUserExists(accounts[0]);

                    if (exists && userData) {
                        logout(); // Logout old account first
                        login(userData._id); // Login new account
                        // Clear logout flag
                        sessionStorage.removeItem('user_logged_out');
                        localStorage.setItem('walletconnected', 'true');
                        showToast("Account switched", `Switched to ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`);

                        // Update tokens after account switch
                        updateUserTokens(accounts[0]);

                        // Call RIZZ registration
                        await registerUserForRizz(accounts[0]);
                    } else {
                        // User doesn't exist, show registration form
                        logout();
                        // Clear logout flag to show registration form
                        sessionStorage.removeItem('user_logged_out');
                        setShowRegistration(true);
                    }
                } catch (error) {
                    console.error("Error switching accounts:", error);
                    // Try to check if it's a 404 error
                    if (error instanceof Error && error.message.includes('404')) {
                        logout();
                        // Clear logout flag to show registration form
                        sessionStorage.removeItem('user_logged_out');
                        setShowRegistration(true);
                    } else {
                        showToast("Account switch failed", "Cannot connect to server", "destructive");
                    }
                }
            }
        };

        const handleChainChanged = () => {
            // Refresh page when chain changes
            window.location.reload();
        };

        const handleDisconnect = () => {
            setWalletAddress('');
            setConnected(false);
            logout();
            localStorage.setItem('walletconnected', 'false');
            router.push('/');
            showToast("Wallet disconnected", "Your MetaMask connection has been disconnected", "destructive");
        };

        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);
        ethereum.on('disconnect', handleDisconnect);

        return () => {
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
            ethereum.removeListener('chainChanged', handleChainChanged);
            ethereum.removeListener('disconnect', handleDisconnect);
        };
    }, [walletAddress, setWalletAddress, setConnected, logout, router, showToast]);

    // Handle logout
    const handleLogout = () => {
        logout();
        localStorage.setItem('walletconnected', 'false');
        localStorage.removeItem('walletAddress'); // Remove wallet address
        sessionStorage.setItem('user_logged_out', 'true');
        showToast("Logged out", "You have successfully logged out");

        // Clear match data
        localStorage.removeItem('savedMatches');
    };

    // If initializing, show loading effect
    if (isInitializing) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/90">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // If connected and logged in, show content
    if (connected && userId && !showRegistration) {
        return <>{children}</>;
    }

    // Show registration form or connect wallet button
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90">
            <div className="w-[350px] bg-gray-900 border border-gray-800 text-white shadow-xl rounded-xl p-6">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-purple-500">VibeMatcher</h2>
                </div>

                <div className="space-y-6">
                    {showRegistration ? (
                        <form onSubmit={handleRegisterSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Wallet Address</label>
                                    <p className="text-sm text-gray-400 truncate">{walletAddress}</p>
                                </div>
                                <div>
                                    <label htmlFor="nickname" className="block text-sm font-medium mb-2">Nickname</label>
                                    <Input
                                        id="nickname"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder="Please enter your nickname"
                                        className="bg-gray-800 border-gray-700"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-6">
                                <Button
                                    type="submit"
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? "Processing..." : "Register and Login"}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-center text-gray-300">
                                    Connect your crypto wallet to start trading
                            </p>
                            <Button
                                onClick={handleConnectWallet}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                                </Button>

                                <div className="flex items-center justify-center my-2">
                                    <div className="flex-grow h-px bg-gray-700"></div>
                                    <p className="mx-4 text-sm text-gray-400">or</p>
                                    <div className="flex-grow h-px bg-gray-700"></div>
                                </div>

                                <a href="https://id.worldcoin.org/login?response_type=code&response_mode=query&client_id=app_staging_cfd48af4ef727862fc3594ec2af135b5&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fworldcoin&nonce=XtoQklYebQh8pTheiaIatBIeQkSWKCtzuditJvZJIQI&ready=true&scope=openid&state=BKpb__n7hFYNyXE0ln57flWWtN7vMfFSaxz396_VH_M&code_challenge=ttZM8zTg-PFomc8zKAcb9IP8fCydlGFQLp9CB-qcGXc&code_challenge_method=S256"
                                    className="flex items-center justify-center w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <circle cx="12" cy="12" r="4"></circle>
                                    </svg>
                                    Login with WorldCoin
                                </a>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center text-sm text-gray-400">
                </div>
            </div>
        </div>
    );
} 