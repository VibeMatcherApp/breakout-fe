"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CardStack } from './CardStack';
import { useQuery } from '@tanstack/react-query';
import { fetchPotentialMatches, getUserMatches, submitScanResult, getUserFriends, getWalletNFTs } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { AssetChart } from './AssetChart';
import { ProfileCard } from './ProfileCard';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { EnhancedChatInterface } from '@/components/chat/EnhancedChatInterface';
import { ArrowLeft } from 'lucide-react';
import { walletConnect } from '@/lib/wallet';
import { ethers } from 'ethers';
import { Input } from '@/components/ui/input';
import { getRizzContract, RIZZ_CONTRACT_ADDRESS } from '@/lib/contracts/RizzToken';

interface PotentialMatch {
    user: {
        id: number;
        username: string;
        displayName: string;
        avatarInitials: string;
        activeStatus: string;
        reputation: number;
    };
    assets: {
        symbol: string;
        balance: string;
        value: string;
    }[];
    preferences: any;
    matchPercentage: number;
}

interface Match {
    matchId: string;
    user: {
        id: number;
        displayName: string;
        avatarInitials: string;
        activeStatus: string;
    };
    matchPercentage: number;
    lastMessage?: {
        content: string;
        isFromUser: boolean;
        sentAt: string;
    };
    unreadCount: number;
    matchedAt: string;
}

export const RIZZ_ABI = [
    // Ensure this signature matches the contract exactly
    "function balanceOf(address owner) view returns (uint256)",
    // Other functions...
];

export const Discover = () => {
    const { userId, login, logout } = useAuth();
    const { walletAddress, connected } = useWallet();
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const view = searchParams.get('view') || 'discover';
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scanContainerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');
    const [selectedFriend, setSelectedFriend] = useState<any>(null);
    const [friendChats, setFriendChats] = useState<Map<string, any>>(new Map());
    const [viewingFriendProfile, setViewingFriendProfile] = useState<any>(null);
    const [tipAmount, setTipAmount] = useState<string>('0.01');
    const [isSendingTip, setIsSendingTip] = useState<boolean>(false);
    const [tipError, setTipError] = useState<string | null>(null);
    const [rizzBalance, setRizzBalance] = useState<string | null>(null);
    const [transactionStatus, setTransactionStatus] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [activeNftTab, setActiveNftTab] = useState<'friends' | 'aura'>('friends');

    // Get potential matches
    const { data: potentialMatches = [], isLoading: isLoadingPotentialMatches, refetch } = useQuery({
        queryKey: ['potentialMatches'],
        queryFn: () => fetchPotentialMatches(),
        enabled: !!userId && view === 'discover'
    });

    // Get matched users
    const { data: matches = [], isLoading: isLoadingMatches } = useQuery({
        queryKey: ['matches'],
        queryFn: () => getUserMatches(),
        enabled: !!userId && view === 'matches'
    });

    // Add query to get friends list
    const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
        queryKey: ['friends', walletAddress],
        queryFn: () => getUserFriends(walletAddress || ''),
        enabled: !!walletAddress && view === 'matches' && activeTab === 'friends'
    });

    // Add query to get user's NFTs
    const { data: userNFTs = [], isLoading: isLoadingNFTs } = useQuery({
        queryKey: ['userNFTs', walletAddress],
        queryFn: () => getWalletNFTs(walletAddress || ''),
        enabled: !!walletAddress && view === 'nft'
    });

    const handleScan = () => {
        if (isScanning) {
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().catch(err => {
                        console.log('Error stopping scan:', err);
                    });
                } catch (error) {
                    console.log('Error stopping scan:', error);
                }
            }
            setIsScanning(false);
            return;
        }

        setIsScanning(true);
    };

    useEffect(() => {
        if (isScanning) {
            // Ensure previous scanner instance is cleaned up
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().catch(err => {
                        console.log('Error cleaning up old scanner:', err);
                    });
                } catch (error) {
                    console.log('Error cleaning up old scanner:', error);
                }
            }

            // Wait a short time to ensure DOM is ready
            setTimeout(() => {
                try {
                    console.log('Creating scanner...');
                    // Create new scanner instance
                    const html5QrCode = new Html5Qrcode("qr-reader");
                    scannerRef.current = html5QrCode;

                    console.log('Starting scan...');
                    // Start camera scanning
                    html5QrCode.start(
                        { facingMode: "user" },
                        {
                            fps: 10,
                            qrbox: 250,
                        },
                        async (decodedText) => {
                            console.log('Scan result:', decodedText);

                            try {
                                // Stop scanning
                                await html5QrCode.stop().catch(err => {
                                    console.log('Error stopping scan:', err);
                                });

                                // Send scan result to backend
                                if (!walletAddress) {
                                    throw new Error('Wallet address not found, please ensure your wallet is connected');
                                }
                                const result = await submitScanResult(decodedText, walletAddress);

                                // Show success message
                                showToast(
                                    "Scan successful",
                                    "Friend added",
                                    "default"
                                );
                            } catch (error) {
                                console.error('Error submitting scan result:', error);
                                showToast(
                                    "Submission failed",
                                    "Could not submit scan result, please try again",
                                    "destructive"
                                );
                            } finally {
                                setIsScanning(false);
                            }
                        },
                        (error) => {
                            // Ignore scanning errors
                        }
                    ).catch(err => {
                        console.error('Error starting scanner:', err);
                        setIsScanning(false);
                    });
                } catch (error) {
                    console.error('Scanner initialization error:', error);
                    setIsScanning(false);
                }
            }, 500);
        } else if (scannerRef.current) {
            try {
                scannerRef.current.stop().catch(err => {
                    console.log('Error stopping scan:', err);
                });
            } catch (error) {
                console.log('Error cleaning up scanner:', error);
            }
        }

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().catch(err => {
                        console.log('Error cleaning up scanner during component unmount:', err);
                    });
                } catch (error) {
                    console.log('Error cleaning up scanner during component unmount:', error);
                }
            }
        };
    }, [isScanning, showToast, walletAddress]);

    // Update friend chat history after chat completion
    const handleChatCompleted = (friendId: string, lastMessage: string, isFromUser: boolean) => {
        setFriendChats(prev => {
            const newMap = new Map(prev);
            const currentTime = new Date().toISOString();

            newMap.set(friendId, {
                matchId: `friend-${friendId}`,
                user: {
                    id: friendId,
                    displayName: selectedFriend?.nickname || 'Friend',
                    avatarInitials: selectedFriend?.nickname?.charAt(0).toUpperCase() || 'F',
                    activeStatus: "online"
                },
                lastMessage: {
                    content: lastMessage,
                    isFromUser: isFromUser,
                    sentAt: currentTime
                },
                unreadCount: isFromUser ? 0 : 1,
                matchedAt: currentTime
            });

            return newMap;
        });
    };

    // Show friend profile card
    const showFriendProfile = (friend: any, event: React.MouseEvent) => {
        event.stopPropagation();
        setViewingFriendProfile(friend);
    };

    // Close friend profile card
    const closeFriendProfile = () => {
        setViewingFriendProfile(null);
    };

    // Add friend chats to chat list
    const allChats = [
        ...matches,
        ...Array.from(friendChats.values())
    ].sort((a, b) => {
        const aTime = a.lastMessage?.sentAt || a.matchedAt;
        const bTime = b.lastMessage?.sentAt || b.matchedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    // Handle friend list item click
    const handleFriendItemClick = (friend: any) => {
        setSelectedFriend(friend);
    };

    // Handle friend chat item click
    const handleChatFriendItemClick = (friendId: string) => {
        const friend = friends.find((f: any) => f._id === friendId || f.wallet_address === friendId);
        if (friend) {
            // Check if there's a chat room ID
            if (friend.chat_id) {
                // Has chat room ID, set directly
                setSelectedFriend({
                    ...friend,
                    chatId: friend.chat_id
                });
            } else {
                // No chat room ID, try to find
                setSelectedFriend(friend);
                console.warn('This friend has no chat room ID, may need to create a new chat');
            }
        } else {
            // Try to find corresponding friend from chat records
            const chatRecord = Array.from(friendChats.values()).find(
                chat => chat.user.id === friendId
            );

            if (chatRecord) {
                setSelectedFriend({
                    _id: friendId,
                    nickname: chatRecord.user.displayName,
                    wallet_address: chatRecord.walletAddress,
                    chatId: chatRecord.chatId
                });
            }
        }
    };

    // Handle chat item avatar click
    const handleChatAvatarClick = (chat: any, event: React.MouseEvent): void => {
        event.stopPropagation();
        if (chat.matchId.startsWith('friend-')) {
            const friend = friends.find((f: any) =>
                (f._id || f.wallet_address) === chat.user.id.toString());
            if (friend) {
                showFriendProfile(friend, event);
            }
        }
    };

    // Send tip to friend's wallet
    const handleTipSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSendingTip(true);
        setTipError(null);
        setTransactionStatus("Sending tip...");

        try {
            if (!viewingFriendProfile) {
                throw new Error("Friend data missing");
            }

            const recipientAddress = viewingFriendProfile.wallet_address;
            if (!recipientAddress) {
                throw new Error("Friend wallet address missing");
            }

            // Connect to provider
            const provider = await walletConnect();
            if (!provider) {
                throw new Error("Unable to connect to wallet");
            }

            // Get RIZZ token contract
            const rizzContract = getRizzContract(provider);

            // Check if user is registered
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();
            const isRegistered = await rizzContract.isRegistered(userAddress);

            // If user is not registered, don't auto-register, prompt user to register first
            if (!isRegistered) {
                throw new Error("Please register your account first to receive RIZZ tokens");
            }

            // Check balance
            const balance = await rizzContract.balanceOf(userAddress);
            const tipAmountWei = ethers.utils.parseEther(tipAmount);

            if (balance.lt(tipAmountWei)) {
                throw new Error(`Not enough RIZZ tokens. You have ${ethers.utils.formatEther(balance)} RIZZ`);
            }

            // Send RIZZ tokens
            const tx = await rizzContract.transfer(recipientAddress, tipAmountWei);

            // Wait for transaction confirmation
            await tx.wait();

            showToast(
                "Tip sent successfully",
                `You have successfully sent ${tipAmount} RIZZ tokens`,
                "default"
            );

            setViewingFriendProfile(null);
        } catch (error: any) {
            console.error('Error sending RIZZ tip:', error);

            // Check if error is user rejected transaction
            if (error.code === 'ACTION_REJECTED') {
                setIsSendingTip(false);
                return;
            }

            // Check if error is ENS related
            if (error.message.includes('network does not support ENS') ||
                error.message.includes('UNSUPPORTED_OPERATION')) {
                setTipError("Please switch to Polygon network in your wallet");
                showToast(
                    "Network Error",
                    "Please switch to Polygon network in your wallet",
                    "destructive"
                );
                setIsSendingTip(false);
                return;
            }

            // Set error message
            setTipError(error.message || "Failed to send tip, please try again");

            showToast(
                "Tip sending failed",
                error.message || "Transaction couldn't complete, please try again later",
                "destructive"
            );
        } finally {
            setIsSendingTip(false);
        }
    };

    useEffect(() => {
        if (viewingFriendProfile && walletAddress) {
            const fetchRizzBalance = async () => {
                try {
                    const provider = await walletConnect();
                    if (provider) {
                        const rizzContract = getRizzContract(provider);
                        const balance = await rizzContract.balanceOf(walletAddress);
                        setRizzBalance(ethers.utils.formatEther(balance));
                    }
                } catch (error) {
                    console.error("Error fetching RIZZ balance:", error);
                    setRizzBalance("Error");
                }
            };

            fetchRizzBalance();
        }
    }, [viewingFriendProfile, walletAddress]);

    // Execute after user connects wallet
    const checkAndRegisterUser = async () => {
        try {
            const provider = await walletConnect();
            const rizzContract = getRizzContract(provider);
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();

            // Check if registered
            const isRegistered = await rizzContract.isRegistered(userAddress);

            if (!isRegistered) {
                setIsRegistering(true);
                showToast(
                    "Registering",
                    "Setting up your account to receive 5 RIZZ tokens...",
                    "default"
                );

                try {
                    const registerTx = await rizzContract.register();
                    await registerTx.wait();

                    showToast(
                        "Registration successful",
                        "You've received 5 RIZZ tokens as a welcome bonus!",
                        "default"
                    );

                    // Update user state
                    setIsRegistered(true);
                    // Get and update balance
                    const balance = await rizzContract.balanceOf(userAddress);
                    setRizzBalance(ethers.utils.formatEther(balance));
                } catch (regError) {
                    console.error("Registration failed:", regError);
                    showToast(
                        "Registration failed",
                        "Could not register your account. Please try again.",
                        "destructive"
                    );
                } finally {
                    setIsRegistering(false);
                }
            } else {
                // Already registered, just update balance
                const balance = await rizzContract.balanceOf(userAddress);
                setRizzBalance(ethers.utils.formatEther(balance));
                setIsRegistered(true);
            }
        } catch (error) {
            console.error("Error checking registration:", error);
            showToast(
                "Error",
                "Could not connect to the blockchain",
                "destructive"
            );
        }
    };

    const testContractConnection = async () => {
        try {
            // Connect to provider
            const provider = await walletConnect();
            console.log("Provider connected, network:", await provider.getNetwork());

            // Create contract instance
            const rizzContract = new ethers.Contract(
                RIZZ_CONTRACT_ADDRESS,
                ["function name() view returns (string)"],
                provider
            );

            // Try calling simplest function - name()
            console.log("Testing contract name()...");
            const name = await rizzContract.name();
            console.log("Contract name:", name);

            return "Contract connection successful";
        } catch (error) {
            console.error("Contract test failed:", error);
            return "Contract connection failed: " + (error instanceof Error ? error.message : "Unknown error");
        }
    };

    // Call and display result
    testContractConnection().then(console.log);

    const resetMatches = () => {
        localStorage.removeItem('savedMatches');
        // Refresh match data
        refetch();
        showToast("Matches Reset", "You can now see more potential matches", "default");
    }

    const renderContent = () => {
        switch (view) {
            case 'matches':
                if (!userId) {
                    return (
                        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
                            <div className="text-center">
                                <h2 className="text-2xl font-medium mb-2">Please Login First</h2>
                                <p className="text-neutral">Please login to view your trading matches.</p>
                            </div>
                        </div>
                    );
                }

                if (viewingFriendProfile) {
                    return (
                        <div className="max-w-2xl mx-auto relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeFriendProfile}
                                className="absolute top-0 left-0 z-10 m-4"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="mt-12 p-6 bg-[#d3eded] rounded-xl">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-24 h-24 rounded-full bg-purple/20 flex items-center justify-center text-3xl font-bold mb-4">
                                        {viewingFriendProfile.nickname ? viewingFriendProfile.nickname.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <h2 className="text-2xl font-bold">{viewingFriendProfile.nickname || 'Friend'}</h2>
                                    <p className="text-gray-500 mt-2">
                                        {viewingFriendProfile.wallet_address ?
                                            `${viewingFriendProfile.wallet_address.substring(0, 10)}...${viewingFriendProfile.wallet_address.substring(viewingFriendProfile.wallet_address.length - 8)}`
                                            : 'Wallet address not available'}
                                    </p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-300">
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                type="number"
                                                step="0.001"
                                                min="0.001"
                                                value={tipAmount}
                                                onChange={(e) => setTipAmount(e.target.value)}
                                                className="flex-1"
                                                placeholder="Enter tip amount"
                                            />
                                            <span className="text-gray-700 font-medium">RIZZ</span>
                                        </div>

                                        <div className="text-sm text-gray-500">
                                            Your RIZZ balance: {rizzBalance || "Loading..."}
                                        </div>

                                        {tipError && (
                                            <p className="text-red-500 text-sm">{tipError}</p>
                                        )}

                                        <Button 
                                            className="w-full bg-purple hover:bg-purple/90"
                                            onClick={handleTipSubmit}
                                            disabled={isSendingTip || !viewingFriendProfile.wallet_address}
                                        >
                                            {isSendingTip ? (
                                                <div className="flex items-center">
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                                                </div>
                                            ) : (
                                                    'Send RIZZ Tip'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                if (selectedMatch) {
                    return (
                        <EnhancedChatInterface
                            matchId={selectedMatch.matchId}
                            matchedUser={selectedMatch.user}
                            onBack={() => setSelectedMatch(null)}
                        />
                    );
                }

                if (selectedFriend) {
                    // Create temporary match object to adapt to existing chat interface
                    const friendId = selectedFriend._id || selectedFriend.wallet_address;
                    const friendMatch = {
                        matchId: `friend-${friendId}`,
                        user: {
                            id: friendId,
                            displayName: selectedFriend.nickname || 'Friend',
                            avatarInitials: selectedFriend.nickname ? selectedFriend.nickname.charAt(0).toUpperCase() : 'F',
                            activeStatus: "online"
                        }
                    };

                    return (
                        <EnhancedChatInterface
                            matchId={friendMatch.matchId}
                            matchedUser={friendMatch.user}
                            onBack={() => setSelectedFriend(null)}
                            isFriendChat={true}
                            onChatComplete={(message, isFromUser) =>
                                handleChatCompleted(friendId, message, isFromUser)
                            }
                            chatId={selectedFriend.chatId}
                        />
                    );
                }

                // Render tab selector
                return (
                    <div className="space-y-4">
                        <div className="flex mb-4 border-b border-gray-700">
                            <button
                                className={`py-2 px-4 ${activeTab === 'chats'
                                    ? 'border-b-2 border-purple text-purple font-medium'
                                    : 'text-gray-400'}`}
                                onClick={() => setActiveTab('chats')}
                            >
                                Chat Matches
                            </button>
                            <button
                                className={`py-2 px-4 ${activeTab === 'friends'
                                    ? 'border-b-2 border-purple text-purple font-medium'
                                    : 'text-gray-400'}`}
                                onClick={() => setActiveTab('friends')}
                            >
                                Friends List
                            </button>
                        </div>

                        {activeTab === 'chats' ? (
                            // Chat matches tab content
                            <>
                                {isLoadingMatches ? (
                                    <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
                                        <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : allChats.length === 0 ? (
                                    <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
                                        <div className="text-center max-w-md">
                                            <div className="text-6xl mb-4">😢</div>
                                            <h2 className="text-2xl font-medium mb-2">No Matches</h2>
                                            <p className="text-neutral mb-6">
                                                Start swiping in the "Discover" section to find trading partners with complementary assets.
                                            </p>
                                            <Button
                                                className="bg-purple hover:bg-purple/90 text-white"
                                                onClick={() => router.push('/?view=discover')}
                                            >
                                                Go Matching
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {allChats.map((chat: any) => (
                                            <div
                                                key={chat.matchId}
                                                className="bg-[#d3eded] rounded-xl p-4 cursor-pointer hover:bg-[#d3eded]/80 transition-colors"
                                                onClick={() =>
                                                    chat.matchId.startsWith('friend-')
                                                        ? handleChatFriendItemClick(chat.user.id.toString())
                                                        : setSelectedMatch(chat)
                                                }
                                            >
                                                <div className="flex items-center">
                                                    <div
                                                        className="relative"
                                                        onClick={(e) => handleChatAvatarClick(chat, e)}
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-purple/20 flex items-center justify-center">
                                                            <span className="text-purple font-medium">{chat.user.avatarInitials}</span>
                                                        </div>
                                                        {chat.user.activeStatus === 'online' && (
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-[#d3eded]"></div>
                                                        )}
                                                    </div>

                                                    <div className="ml-3 flex-1">
                                                        <div className="flex justify-between items-center">
                                                            <div className="font-medium">{chat.user.displayName}</div>
                                                            {!chat.matchId.startsWith('friend-') && (
                                                                <div className="text-sm font-bold text-purple">
                                                                    Match: {chat.matchPercentage}%
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm text-neutral truncate max-w-[180px]">
                                                                {chat.lastMessage ? (
                                                                    chat.lastMessage.isFromUser ? (
                                                                        <span className="text-neutral">You: {chat.lastMessage.content}</span>
                                                                    ) : (
                                                                        chat.lastMessage.content
                                                                    )
                                                                ) : (
                                                                    <span className="italic text-neutral">No messages yet</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <div className="text-xs text-neutral">
                                                                    {chat.lastMessage?.sentAt
                                                                        ? formatDistanceToNow(new Date(chat.lastMessage.sentAt), { addSuffix: true })
                                                                        : formatDistanceToNow(new Date(chat.matchedAt), { addSuffix: true })
                                                                    }
                                                                </div>

                                                                {chat.unreadCount > 0 && (
                                                                    <div className="ml-2 bg-purple text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                                                        {chat.unreadCount}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            // Friends list tab content
                            <>
                                {isLoadingFriends ? (
                                    <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
                                        <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : friends.length === 0 ? (
                                    <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
                                        <div className="text-center max-w-md">
                                            <div className="text-6xl mb-4">👥</div>
                                            <h2 className="text-2xl font-medium mb-2">No Friends</h2>
                                            <p className="text-neutral mb-6">
                                                Scan other users' QR codes to add friends, or share your own QR code.
                                            </p>
                                            <Button
                                                className="bg-purple hover:bg-purple/90 text-white"
                                                onClick={() => router.push('/?view=profile')}
                                            >
                                                View My Profile and QR Code
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-medium mb-4 hidden md:block">Your Friends</h2>
                                        {friends.map((friend: any) => (
                                            <div
                                                key={friend._id || friend.wallet_address}
                                                className="bg-[#d3eded] rounded-xl p-4 cursor-pointer hover:bg-[#d3eded]/80 transition-colors"
                                                onClick={() => handleFriendItemClick(friend)}
                                            >
                                                <div className="flex items-center">
                                                    <div
                                                        className="relative"
                                                        onClick={(e) => showFriendProfile(friend, e)}
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-purple/20 flex items-center justify-center">
                                                            <span className="text-purple font-medium">
                                                                {friend.nickname ? friend.nickname.charAt(0).toUpperCase() : 'U'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="ml-3 flex-1">
                                                        <div className="flex justify-between items-center">
                                                            <div className="font-medium">{friend.nickname || 'User'}</div>
                                                        </div>

                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm text-neutral truncate max-w-[220px]">
                                                                {friend.wallet_address ? (
                                                                    `${friend.wallet_address.substring(0, 6)}...${friend.wallet_address.substring(friend.wallet_address.length - 4)}`
                                                                ) : (
                                                                    'Wallet address not available'
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            case 'profile':
                return (
                    <div className="relative min-h-[calc(100vh-120px)] flex flex-col">
                        <div className="flex-1 relative flex items-center justify-center">
                            <div className="absolute max-w-md w-full mx-auto left-0 right-0">
                                <ProfileCard
                                    user={{
                                        id: 0,
                                        username: 'user',
                                        displayName: 'User',
                                        avatarInitials: 'U',
                                        activeStatus: 'online',
                                        reputation: 4.5
                                    }}
                                    assets={[]}
                                    preferences={{
                                        wantedTokens: [],
                                        offeredTokens: []
                                    }}
                                    matchPercentage={100}
                                />
                            </div>
                        </div>

                        {!isScanning && (
                            <div className="absolute -bottom-16 left-0 right-0 w-full max-w-md mx-auto">
                                <div className="flex flex-col items-center">
                                    <p className="text-sm text-gray-500">
                                        Click to scan other users' QR codes
                                    </p>
                                    <div className="flex justify-center gap-8 mt-4 mb-20 md:mb-4 z-[60] relative">
                                        <Button
                                            className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-900 to-black text-white/80 flex items-center justify-center shadow-xl"
                                            onClick={handleScan}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                                                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                                                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                                <line x1="7" y1="12" x2="17" y2="12" />
                                            </svg>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isScanning && (
                            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
                                <div className="absolute top-4 right-4">
                                    <Button
                                        variant="ghost"
                                        className="text-white hover:bg-white/10"
                                        onClick={handleScan}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </Button>
                                </div>
                                <div className="text-white text-center mb-4">Please align the QR code with the scanning frame</div>
                                <div id="qr-reader" className="w-full max-w-md h-[300px]"></div>
                            </div>
                        )}
                    </div>
                );
            case 'wallet':
                return potentialMatches[0] ? (
                    <div className="max-w-md mx-auto">
                        <AssetChart assets={potentialMatches[0].assets} />
                    </div>
                ) : null;
            case 'nft':
                if (!userId) {
                    return (
                        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
                            <div className="text-center">
                                <h2 className="text-2xl font-medium mb-2">Please Login First</h2>
                                <p className="text-neutral">Please login to view your NFT collection.</p>
                            </div>
                        </div>
                    );
                }

                // Render tag selector
                return (
                    <div className="space-y-4">
                        <div className="flex mb-4 border-b border-gray-700">
                            <button
                                className={`py-2 px-4 ${activeNftTab === 'friends'
                                    ? 'border-b-2 border-purple text-purple font-medium'
                                    : 'text-gray-400'}`}
                                onClick={() => setActiveNftTab('friends')}
                            >
                                Friends NFT
                            </button>
                            <button
                                className={`py-2 px-4 ${activeNftTab === 'aura'
                                    ? 'border-b-2 border-purple text-purple font-medium'
                                    : 'text-gray-400'}`}
                                onClick={() => setActiveNftTab('aura')}
                            >
                                Aura NFT
                            </button>
                        </div>

                        {activeNftTab === 'friends' ? (
                            // Friends NFT tag content - display user's own NFT
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {isLoadingNFTs ? (
                                    <div className="flex items-center justify-center min-h-[calc(100vh-180px)] col-span-full">
                                        <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : userNFTs.length === 0 ? (
                                    <div className="flex items-center justify-center min-h-[calc(100vh-180px)] col-span-full">
                                        <div className="text-center max-w-md">
                                            <div className="text-6xl mb-4">🖼️</div>
                                            <h2 className="text-2xl font-medium mb-2">No NFTs found in your wallet</h2>
                                            <p className="text-neutral mb-6">
                                                No NFTs found in your wallet. Please make sure you have connected the correct wallet address.
                                            </p>
                                            <Button
                                                className="bg-purple hover:bg-purple/90 text-white"
                                                onClick={() => router.push('/?view=discover')}
                                            >
                                                Return to Homepage
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    // User's NFT list
                                    userNFTs.map((nft: any) => (
                                        <div
                                            key={nft.id}
                                            className="bg-[#d3eded] rounded-xl p-4 hover:bg-[#d3eded]/80 transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                {/* NFT Image */}
                                                <div className="w-full h-48 rounded-lg mb-3 overflow-hidden">
                                                    <img
                                                        src={nft.image}
                                                        alt={nft.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* NFT Information */}
                                                <h3 className="font-bold text-lg mb-1">{nft.name}</h3>
                                                <p className="text-sm text-gray-600 mb-3">{nft.description}</p>

                                                {/* NFT Attributes */}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {nft.attributes?.map((attr: any, index: number) => (
                                                        <span
                                                            key={index}
                                                            className="text-xs bg-purple/10 text-purple px-2 py-1 rounded-full"
                                                        >
                                                            {attr.trait_type}: {attr.value}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Wallet Information */}
                                                <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center mr-2">
                                                            <span className="text-purple text-xs font-medium">
                                                                {walletAddress ? walletAddress.charAt(0).toUpperCase() : 'Y'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            Your NFT
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            // Aura NFT tag content
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="col-span-full flex items-center justify-center min-h-[calc(100vh-180px)]">
                                    <div className="text-center max-w-md">
                                        <div className="text-6xl mb-4">✨</div>
                                        <h2 className="text-2xl font-medium mb-2">Aura NFT Coming Soon</h2>
                                        <p className="text-neutral mb-6">
                                            We are preparing unique Aura NFT features, stay tuned!
                                        </p>

                                        {/* Sample NFT card */}
                                        <div className="w-64 h-64 mx-auto mt-4 mb-6 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center p-1">
                                            <div className="w-full h-full bg-black/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                                <span className="text-white text-xl font-bold">Coming Soon</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return <CardStack />;
        }
    };

    const isTabPage = view === 'matches' || view === 'nft';

    return (
        <div className={isTabPage ? 'pt-32' : ''}>
            {renderContent()}
        </div>
    );
};