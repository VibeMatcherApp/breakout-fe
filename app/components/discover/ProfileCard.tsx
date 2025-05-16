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

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return 'from-teal-500 to-emerald-400';
    if (percentage >= 70) return 'from-emerald-500 to-green-400';
    if (percentage >= 50) return 'from-violet-500 to-purple-400';
    return 'from-gray-500 to-gray-400';
  };

  return (
    <motion.div
      className={`relative bg-gradient-to-br from-[#001d25] to-black rounded-2xl shadow-lg overflow-hidden ${isProfileView ? 'cursor-pointer hover:shadow-xl' : ''} transition-all duration-300 [perspective:1000px]`}
      onClick={toggleView}
      onMouseEnter={() => isProfileView && setIsHovered(true)}
      onMouseLeave={() => isProfileView && setIsHovered(false)}
      whileHover={isProfileView ? { scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <div className={`relative h-[400px] transition-transform duration-500 [transform-style:preserve-3d] ${showQRCode ? '[transform:rotateY(180deg)]' : ''}`}>
        {/* Front side */}
        <div className="absolute inset-0 [backface-visibility:hidden]">
          {isProfileView && isLoading && !showQRCode ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 rounded-2xl">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : null}

          <div className="relative h-[400px]">
            {/* Match Percentage Display */}
            {isDiscoverView && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-8xl font-bold bg-gradient-to-r ${getMatchColor(displayMatchPercentage)} bg-clip-text text-transparent animate-fade-in`}>
                  {displayMatchPercentage}%
                </div>
                <div className="text-gray-400 mt-2 text-lg">Match Score</div>
              </div>
            )}

            {/* Asset Chart */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80%] h-[80%]">
                <AssetChart
                  assets={displayAssets}
                  walletAddress={userData?.wallet_address}
                  matchPercentage={isDiscoverView ? displayMatchPercentage : undefined}
                />
              </div>
            </div>

            {/* User Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex items-center mb-3">
                <h2 className="text-2xl font-semibold text-white mr-2">{displayUser.displayName}</h2>
              </div>

              {/* Tags */}
              {isDiscoverView && displayTags && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(displayTags).map(([key, value]) =>
                    value && (
                      <span
                        key={key}
                        className="px-3 py-1 rounded-full text-sm bg-white/10 text-white/80 backdrop-blur-sm"
                      >
                        #{value}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back side */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-black/95 rounded-xl">
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
                  <p className="text-sm text-gray-400 mb-1">Scan this QR Code to add as a friend</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center">
                <p className="text-gray-400 mb-2">Cannot get user data</p>
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
                    <p className="text-xs text-gray-400 mt-3 text-center">Use wallet address as a backup</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
