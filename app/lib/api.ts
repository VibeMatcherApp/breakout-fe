// import { User, Asset, TradingPreference } from '@/types';

export const fetchPotentialMatches = async () => {
    try {
        const currentWalletAddress = localStorage.getItem('walletAddress');
        if (!currentWalletAddress) {
            console.error('No wallet address found in localStorage');
            throw new Error('Current user wallet address not found');
        }

        console.log('Fetching potential matches for wallet:', currentWalletAddress);

        // 1. Get all users list
        const allUsersResponse = await fetch('http://43.207.147.137:3001/api/users');
        if (!allUsersResponse.ok) {
            console.error('Failed to fetch users list:', allUsersResponse.status);
            throw new Error('Unable to get user list');
        }
        const allUsers = await allUsersResponse.json();
        console.log('Total users found:', allUsers.length);

        // 2. Get current user's friends list
        let friendsList: string[] = [];
        try {
            const userResponse = await fetch(`http://43.207.147.137:3001/api/users/${currentWalletAddress}`);
            if (userResponse.ok) {
                const userData = await userResponse.json();
                if (userData.friends && Array.isArray(userData.friends)) {
                    friendsList = userData.friends.map((friend: any) => 
                        friend.wallet_address || friend._id || friend
                    );
                }
                console.log('Friends list:', friendsList);
            }
        } catch (error) {
            console.error('Error getting friends list:', error);
        }

        // Get matched users from API
        let matchedUserIds: string[] = [];
        try {
            const matchesResponse = await fetch(`http://43.207.147.137:3001/api/users/${currentWalletAddress}/matches`);
            if (matchesResponse.ok) {
                const matchesData = await matchesResponse.json();
                matchedUserIds = matchesData.map((match: any) => match.user_id || match._id);
                console.log('Matched users:', matchedUserIds);
            }
        } catch (error) {
            console.error('Error getting matched users:', error);
        }

        // Filter out self, friends, and already matched users
        const otherUsers = allUsers.filter((user: any) => {
            const isNotSelf = user.wallet_address && user.wallet_address !== currentWalletAddress;
            const isNotFriend = !friendsList.includes(user.wallet_address);
            const isNotMatched = !matchedUserIds.includes(user._id?.toString() || user.id?.toString());
            
            return isNotSelf && isNotFriend && isNotMatched;
        });

        console.log('Filtered potential matches:', otherUsers.length);

        // 4. Build complete data for each user
        const potentialMatches = await Promise.all(
            otherUsers.map(async (user: any) => {
                try {
                    // Calculate match percentage
                    const matchResponse = await fetch(
                        `http://43.207.147.137:3001/api/users/match?wallet1=${currentWalletAddress}&wallet2=${user.wallet_address}`
                    );
                    const matchData = matchResponse.ok ? await matchResponse.json() : { match_percentage: 70 };

                    // Get user details
                    const userDetailResponse = await fetch(
                        `http://43.207.147.137:3001/api/users/${user.wallet_address}`
                    );
                    const userData = userDetailResponse.ok ? await userDetailResponse.json() : {};

                    // Build user data
                    return {
                        user: {
                            id: userData._id || user._id || Math.floor(Math.random() * 1000),
                            displayName: userData.nickname || user.nickname || 'Anonymous User',
                            avatarInitials: (userData.nickname || user.nickname || 'U')[0].toUpperCase(),
                            activeStatus: "active",
                            reputation: userData.reputation || 4.5,
                            wallet_address: user.wallet_address
                        },
                        assets: userData.chain_data?.distribution ? 
                            Object.entries(userData.chain_data.distribution).map(([symbol, value]) => ({
                                symbol,
                                balance: "0",
                                value: String(value)
                            })) : [
                                { symbol: "ETH", balance: "0", value: "0" }
                            ],
                        preferences: {
                            wantedTokens: userData.wanted_tokens || ['USDT', 'USDC'],
                            offeredTokens: userData.offered_tokens || ['ETH', 'BTC']
                        },
                        matchPercentage: matchData.match_percentage || 70,
                        tags: userData.tags || {
                            blockchain: "Web3 User",
                            assetType: "Crypto Holder"
                        },
                        walletAddress: user.wallet_address
                    };
                } catch (error) {
                    console.error('Error processing user:', user.wallet_address, error);
                    return null;
                }
            })
        );

        // Filter out any failed matches
        const validMatches = potentialMatches.filter(match => match !== null);
        console.log('Final potential matches:', validMatches.length);
        return validMatches;
    } catch (error) {
        console.error('Error getting potential matches:', error);
        return [];
    }
};

export const getUserMatches = async () => {
    try {
        // Get current user's wallet address
        const myWalletAddress = localStorage.getItem('walletAddress');
        if (!myWalletAddress) {
            throw new Error('Current user wallet address not found');
        }

        // First check if there are saved matches in localStorage
        const savedMatchesStr = localStorage.getItem('savedMatches');
        const savedMatches = savedMatchesStr ? JSON.parse(savedMatchesStr) : [];

        // If there are locally stored matches, use them first - only return matches with chat records
        if (savedMatches.length > 0) {
            console.log('Retrieved matches from local storage:', savedMatches.length);
            // Only return matches with hasChat = true
            const chatsOnly = savedMatches.filter((match: any) => match.hasChat === true);
            console.log('Matches with chat records:', chatsOnly.length);
            return chatsOnly;
        }

        // Get chat list API (if available)
        try {
            const chatsResponse = await fetch(`http://43.207.147.137:3001/api/chats/${myWalletAddress}`);

            if (chatsResponse.ok) {
                const chatsData = await chatsResponse.json();

                if (chatsData && Array.isArray(chatsData.chats) && chatsData.chats.length > 0) {
                    console.log('Retrieved chats from API:', chatsData.chats.length);

                    // Convert chat data to match format
                    const chatMatches = await Promise.all(
                        chatsData.chats.map(async (chat: any) => {
                            const otherUserAddress = chat.user1 === myWalletAddress ? chat.user2 : chat.user1;

                            // Get user details
                            try {
                                const userDetailResponse = await fetch(
                                    `http://43.207.147.137:3001/api/users/${otherUserAddress}`
                                );

                                if (!userDetailResponse.ok) {
                                    return null;
                                }

                                const userData = await userDetailResponse.json();

                                return {
                                    matchId: chat.id || userData._id || otherUserAddress,
                                    user: {
                                        id: userData._id || otherUserAddress,
                                        displayName: userData.nickname || 'Anonymous User',
                                        avatarInitials: (userData.nickname || 'U')[0].toUpperCase(),
                                        activeStatus: "online"
                                    },
                                    matchPercentage: 100,
                                    lastMessage: {
                                        content: chat.lastMessage?.content || "You've matched! Start chatting now.",
                                        isFromUser: chat.lastMessage?.sender === myWalletAddress,
                                        sentAt: chat.lastMessage?.timestamp || new Date().toISOString()
                                    },
                                    unreadCount: chat.unreadCount || 0,
                                    matchedAt: chat.createdAt || new Date().toISOString(),
                                    walletAddress: otherUserAddress,
                                    hasChat: true
                                };
                            } catch (error) {
                                console.error(`Error getting user ${otherUserAddress} data:`, error);
                                return null;
                            }
                        })
                    );

                    // Filter out failed items
                    const validChatMatches = chatMatches.filter(match => match !== null);

                    // Save to localStorage
                    localStorage.setItem('savedMatches', JSON.stringify(validChatMatches));

                    return validChatMatches;
                }
            }
        } catch (error) {
            console.error('Error getting chat list:', error);
        }

        // If all above methods fail, return empty array
        return [];
    } catch (error) {
        console.error('Error getting user matches:', error);
        return [];
    }
};

export const performMatchAction = async (userId: number, targetUserId: number, action: 'like' | 'pass'): Promise<{ isMatch: boolean }> => {
    try {
        console.log(`Performing match action: ${action} user ${targetUserId}`);

        // Local simulation of match operation
        if (action === 'pass') {
            return { isMatch: false };
        }

        // Simulate 30% chance of matching
        const isMatch = Math.random() < 0.3;

        // If match is successful, simulate storage
        if (isMatch) {
            const savedMatchesStr = localStorage.getItem('savedMatches') || '[]';
            const savedMatches = JSON.parse(savedMatchesStr);

            // Check if the match already exists
            if (!savedMatches.some((m: any) => m.user.id === targetUserId)) {
                // Don't add the match here, as it will be handled by the createMatch function
                console.log('Match successful, waiting for createMatch function to handle');
            }
        }

        return { isMatch };
    } catch (error) {
        console.error('Error performing match action:', error);
        return { isMatch: false };
    }
};

// Create match
export const createMatch = async (match: any) => {
    try {
        // Get current user wallet address
        const myWalletAddress = localStorage.getItem('walletAddress');
        if (!myWalletAddress) {
            throw new Error('Current user wallet address not found');
        }

        // Get target user wallet address
        const targetWalletAddress = match.walletAddress;
        if (!targetWalletAddress) {
            console.warn('Unable to get target user wallet address, using backup ID');
        }

        // Get and save existing matches
        const existingMatchesStr = localStorage.getItem('savedMatches') || '[]';
        const existingMatches = JSON.parse(existingMatchesStr);

        // Check if the match already exists
        const matchId = match.user.id.toString();
        if (existingMatches.some((m: any) => m.user.id.toString() === matchId)) {
            console.log('Match already exists:', match.user.displayName);
            return existingMatches.find((m: any) => m.user.id.toString() === matchId);
        }

        // Create chat record - call API
        let chatCreated = false;
        try {
            // Send request to chat creation API
            const chatResponse = await fetch('http://43.207.147.137:3001/api/chats/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user1: myWalletAddress,
                    user2: targetWalletAddress || match.user.id
                }),
            });

            if (chatResponse.ok) {
                chatCreated = true;
                console.log('Chat record created successfully');
            } else {
                console.warn('Failed to create chat record, using local storage');
            }
        } catch (error) {
            console.error('Error creating chat record:', error);
        }

        // Add friend relationship - call API
        try {
            // Send request to add friend API
            const friendResponse = await fetch('http://43.207.147.137:3001/api/users/add_friend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    wallet_address: myWalletAddress,
                    friend_address: targetWalletAddress || match.user.id
                }),
            });

            if (friendResponse.ok) {
                console.log('Friend relationship created successfully');
            } else {
                console.warn('Failed to create friend relationship');
            }
        } catch (error) {
            console.error('Error creating friend relationship:', error);
        }

        // Create new match
        const newMatch = {
            matchId: matchId,
            user: {
                id: match.user.id,
                displayName: match.user.displayName,
                avatarInitials: match.user.avatarInitials,
                activeStatus: "online"
            },
            matchPercentage: match.matchPercentage,
            lastMessage: chatCreated ? {
                content: "You've matched! Start chatting now.",
                isFromUser: false,
                sentAt: new Date().toISOString()
            } : null,
            unreadCount: chatCreated ? 1 : 0,
            matchedAt: new Date().toISOString(),
            walletAddress: targetWalletAddress || match.user.id,
            hasChat: chatCreated
        };

        // Add to saved matches
        existingMatches.push(newMatch);
        localStorage.setItem('savedMatches', JSON.stringify(existingMatches));

        console.log('Created new match:', match.user.displayName);

        return newMatch;
    } catch (error) {
        console.error('Error creating match:', error);
        throw error;
    }
};

export const submitScanResult = async (scanResult: string, currentWalletAddress: string) => {
    try {
        // Send friend relationship directly to external API
        console.log('Starting to add friend, current wallet address:', currentWalletAddress, 'friend address:', scanResult);

        const externalResponse = await fetch('http://43.207.147.137:3001/api/users/add_friend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                wallet_address: currentWalletAddress,
                friend_address: scanResult
            }),
        });

        console.log('Add friend API response status:', externalResponse.status);

        if (!externalResponse.ok) {
            throw new Error('Unable to add friend to external API');
        }

        const externalData = await externalResponse.json();
        console.log('Add friend API response data:', externalData);
        return externalData;
    } catch (error) {
        console.error('Error submitting scan result:', error);
        throw error;
    }
};

// Get user information
export const getUserInfo = async (walletAddress: string) => {
    try {
        const response = await fetch(`http://43.207.147.137:3001/api/users/${walletAddress}`);

        if (!response.ok) {
            throw new Error('Unable to get user information');
        }

        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Error getting user information:', error);
        throw error;
    }
};

// Generate wallet QR code string
export const getWalletQRCode = async (walletAddress: string) => {
    try {
        // Use remote API to get user data to obtain _id
        const response = await fetch('http://43.207.147.137:3001/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                wallet_address: walletAddress,
            }),
        });

        if (!response.ok) {
            throw new Error('Unable to get user ID');
        }

        const userData = await response.json();
        // Use _id as QR code content
        return userData.user._id;
    } catch (error) {
        console.error('Failed to generate wallet QR code:', error);
        throw error;
    }
};

// Get user friends list
export const getUserFriends = async (walletAddress: string) => {
    try {
        console.log('Getting user friends list, wallet address:', walletAddress);

        const response = await fetch(`http://43.207.147.137:3001/api/users/${walletAddress}`);

        if (!response.ok) {
            throw new Error('Unable to get user information');
        }

        const userData = await response.json();
        console.log('Retrieved user data:', userData);

        // Return user's friends list
        return userData.friends || [];
    } catch (error) {
        console.error('Error getting user friends list:', error);
        throw error;
    }
};

// Get chat messages
export const fetchChatMessages = async (chatId: string) => {
    try {
        const response = await fetch(`http://43.207.147.137:3001/api/chats/${chatId}`);

        if (!response.ok) {
            throw new Error(`Failed to get chat messages: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error retrieving chat messages:', error);
        throw error;
    }
};

// Send chat message
export const sendChatMessage = async (chatId: string, sender: string, content: string) => {
    try {
        const response = await fetch(`http://43.207.147.137:3001/api/chats/${chatId}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sender,
                content
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

export const clearMatches = async () => {
    try {
        const currentWalletAddress = localStorage.getItem('walletAddress');
        if (!currentWalletAddress) {
            throw new Error('Current user wallet address not found');
        }

        // Clear localStorage
        localStorage.removeItem('savedMatches');

        // Call API to clear match data (if such API exists)
        try {
            const response = await fetch(`http://43.207.147.137:3001/api/users/${currentWalletAddress}/matches`, {
                method: 'DELETE',
            });
            if (response.ok) {
                console.log('Successfully cleared matches on server');
            }
        } catch (error) {
            console.error('Failed to clear matches on server:', error);
        }

        return true;
    } catch (error) {
        console.error('Error clearing matches:', error);
        return false;
    }
};

// Get wallet NFTs
export const getWalletNFTs = async (walletAddress: string) => {
    try {
        console.log('Starting to fetch wallet NFTs:', walletAddress);

        // Here we can use Moralis, Alchemy or other NFT APIs
        // For demonstration, we use mock data here

        // Simulate API request delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return mock NFT data
        return [
            {
                id: '1',
                name: 'VibeMatcher #01',
                description: 'Your exclusive VibeMatcher NFT',
                image: 'https://source.unsplash.com/random/300x300?nft,blue',
                attributes: [
                    { trait_type: 'Background', value: 'Blue' },
                    { trait_type: 'Rarity', value: 'Rare' }
                ]
            },
            {
                id: '2',
                name: 'CryptoPunk Clone #356',
                description: 'Mock CryptoPunk style NFT',
                image: 'https://source.unsplash.com/random/300x300?nft,punk',
                attributes: [
                    { trait_type: 'Background', value: 'Purple' },
                    { trait_type: 'Rarity', value: 'Common' }
                ]
            },
            {
                id: '3',
                name: 'Digital Art Collection',
                description: 'Digital Artwork',
                image: 'https://source.unsplash.com/random/300x300?nft,art',
                attributes: [
                    { trait_type: 'Style', value: 'Abstract' },
                    { trait_type: 'Rarity', value: 'Uncommon' }
                ]
            }
        ];
    } catch (error) {
        console.error('Error getting wallet NFTs:', error);
        throw error;
    }
};

// Get user profile
export const fetchUserProfile = async (userId: string) => {
    try {
        const response = await fetch(`http://43.207.147.137:3001/api/users/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

// Get user assets
export const fetchUserAssets = async (userId: string) => {
    try {
        const response = await fetch(`http://43.207.147.137:3001/api/users/${userId}/assets`);
        if (!response.ok) {
            throw new Error('Failed to fetch user assets');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching user assets:', error);
        throw error;
    }
};

// Get user preferences
export const fetchUserPreferences = async (userId: string) => {
    try {
        const response = await fetch(`http://43.207.147.137:3001/api/users/${userId}/preferences`);
        if (!response.ok) {
            throw new Error('Failed to fetch user preferences');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        throw error;
    }
};