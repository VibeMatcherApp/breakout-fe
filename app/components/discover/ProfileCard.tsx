import React, { useState, useEffect } from 'react';
import { AssetChart } from './AssetChart';
import { Button } from '@/components/ui/button';
import { getUserInfo } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '@/context/WalletContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

interface ProfileCardProps {
  user: {
    id: number;
    username: string;
    displayName: string;
    avatarInitials: string;
    activeStatus: string;
    reputation: number;
  };
  assets: Array<{
    symbol: string;
    balance: string;
    value: string;
  }>;
  preferences: {
    wantedTokens: string[];
    offeredTokens: string[];
  };
  matchPercentage: number;
  onLike?: () => void;
  onDislike?: () => void;
  showActions?: boolean;
  tags?: {
    blockchain?: string;
    assetType?: string;
    [key: string]: string | undefined;
  };
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user: propUser,
  assets: propAssets,
  preferences: propPreferences,
  matchPercentage: propMatchPercentage,
  onLike,
  onDislike,
  showActions = true,
  tags: propTags
}) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [profileData, setProfileData] = useState<{
    user: ProfileCardProps['user'],
    assets: ProfileCardProps['assets'],
    preferences: ProfileCardProps['preferences'],
    matchPercentage: number,
    tags?: ProfileCardProps['tags']
  } | null>(null);

  const { walletAddress } = useWallet();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  // Check if current view is profile
  const isProfileView = searchParams.get('view') === 'profile';
  // Check if current view is discover
  const isDiscoverView = searchParams.get('view') === 'discover';

  // Load user data in profile view
  useEffect(() => {
    if (isProfileView && walletAddress) {
      setIsLoading(true);

      getUserInfo(walletAddress)
        .then(data => {
          // Convert backend data to component format
          const userProfile = {
            user: {
              id: parseInt(data._id || '0', 10),
              username: data.nickname || 'user',
              displayName: data.nickname || 'User',
              avatarInitials: (data.nickname || 'U')[0].toUpperCase(),
              activeStatus: 'online',
              reputation: data.reputation || 4.5
            },
            assets: data.chain_data?.distribution ? 
              Object.entries(data.chain_data.distribution).map(([symbol, value]) => ({
                symbol,
                balance: "0", // No balance information, use 0
                value: String(value)
              })) : [
                { symbol: 'ETH', balance: '0', value: '0' },
                { symbol: 'USDT', balance: '0', value: '0' }
              ],
            preferences: {
              wantedTokens: data.wanted_tokens || ['BTC', 'ETH'],
              offeredTokens: data.offered_tokens || ['USDT', 'USDC']
            },
            matchPercentage: 100,
            tags: data.tags
          };

          setProfileData(userProfile);
          setUserData(data);
        })
        .catch(error => {
          console.error('Failed to get user data:', error);
          showToast('Error', 'Cannot get user data', 'destructive');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isProfileView, walletAddress, showToast]);

  useEffect(() => {
    // Only fetch user data when showing QR Code, and only needed in non-profile view
    const fetchUserData = async () => {
      if (showQRCode && walletAddress && !userData) {
        setIsLoading(true);
        try {
          const data = await getUserInfo(walletAddress);
          setUserData(data);
        } catch (error) {
          console.error('Failed to get user data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [showQRCode, walletAddress, userData]);

  const toggleView = (e: React.MouseEvent) => {
    // Don't flip card if not in profile view or if copy button is clicked
    if (!isProfileView || (e.target as HTMLElement).closest('[data-no-flip]')) {
      return;
    }
    setShowQRCode(!showQRCode);
  };

  // Decide which data source to display
  const displayUser = isProfileView && profileData ? profileData.user : propUser;
  const displayAssets = isProfileView && profileData ? profileData.assets : propAssets;
  const displayPreferences = isProfileView && profileData ? profileData.preferences : propPreferences;
  const displayMatchPercentage = isProfileView && profileData ? profileData.matchPercentage : propMatchPercentage;
  const displayTags = isProfileView && profileData ? profileData.tags : propTags;

  // Render tag function
  const renderTags = () => {
    if (!displayTags) return null;

    return (
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {Object.entries(displayTags).map(([key, value]) =>
          value && (
            <div
              key={key}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
            >
              {value}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <motion.div
      className={`relative bg-white rounded-2xl shadow-lg p-8 ${isProfileView ? 'cursor-pointer overflow-hidden hover:shadow-xl' : ''} transition-all duration-300 [perspective:1000px]`}
      onClick={toggleView}
      onMouseEnter={() => isProfileView && setIsHovered(true)}
      onMouseLeave={() => isProfileView && setIsHovered(false)}
      whileHover={isProfileView ? { scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {isProfileView && isLoading && !showQRCode ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : null}

      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold mb-4">
          {displayUser.avatarInitials}
        </div>
        <h2 className="text-2xl font-bold">{displayUser.displayName}</h2>
      </div>

      <div className="relative w-full h-[300px] [transform-style:preserve-3d]">
        <AnimatePresence initial={false} mode="wait">
          {showQRCode ? (
            <motion.div
              key="qrcode"
              className="absolute inset-0 bg-white rounded-xl shadow-sm [backface-visibility:hidden]"
              initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              exit={{ rotateY: -90, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <div className="flex flex-col items-center justify-center py-4 h-full">
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : userData ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                      <QRCodeSVG
                          value={userData.wallet_address || walletAddress}
                        size={200}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"L"}
                        includeMargin={false}
                      />
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-1">Scan this QR Code to add as a friend</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center">
                        <p className="text-gray-500 mb-2">Cannot get user data</p>
                    {walletAddress && (
                      <div className="bg-white p-4 rounded-lg shadow mt-4">
                        <QRCodeSVG
                          value={walletAddress}
                          size={200}
                          bgColor={"#ffffff"}
                          fgColor={"#000000"}
                          level={"L"}
                          includeMargin={false}
                        />
                            <p className="text-xs text-gray-500 mt-3 text-center">Use wallet address as a backup</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              className="absolute inset-0 [backface-visibility:hidden]"
              initial={{ rotateY: -90, opacity: 0, scale: 0.95 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              exit={{ rotateY: 90, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                {isDiscoverView && renderTags()}

                <div>
                  <AssetChart
                    assets={displayAssets}
                    walletAddress={userData?.wallet_address}
                    matchPercentage={isDiscoverView ? displayMatchPercentage : undefined}
                  />
                </div>

                {isProfileView && (
                  <div className="absolute bottom-0 left-0 right-0 text-center pb-2 text-sm text-gray-400 opacity-60">
                    Click the card to view QR Code
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
