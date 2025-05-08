import React, { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';

interface AssetChartProps {
  assets: Array<{
    symbol: string;
    balance: string;
    value: string;
  }>;
  walletAddress?: string;
  matchPercentage?: number;
}

// Define chain data interface
interface ChainDistribution {
  ETH?: string;
  BTC?: string;
  STABLE?: string;
  Layer2?: string;
  Meme?: string;
  Agent?: string;
  Protocol?: string;
  DAO?: string;
  OTHER?: string;
  [key: string]: string | undefined;
}

// Chain category colors
const categoryColors: Record<string, string> = {
  ETH: '#627EEA',     // Ethereum Blue
  BTC: '#F7931A',     // Bitcoin Orange
  STABLE: '#26A17B',  // Stablecoin Green
  Layer2: '#8A2BE2',  // Purple
  Meme: '#FFD700',    // Gold
  Agent: '#1E90FF',   // Dodger Blue
  Protocol: '#FF4500', // Red Orange
  DAO: '#32CD32',     // Green
  OTHER: '#9CA3AF'    // Gray
};

// Full names mapping for categories
const categoryFullNames: Record<string, string> = {
  ETH: 'Ethereum',
  BTC: 'Bitcoin',
  STABLE: 'Stablecoin',
  Layer2: 'Layer 2',
  Meme: 'Meme Coin',
  Agent: 'Agent',
  Protocol: 'Protocol',
  DAO: 'DAO',
  OTHER: 'Others'
};

export const AssetChart: React.FC<AssetChartProps> = ({ assets, walletAddress, matchPercentage }) => {
  const { walletAddress: contextWalletAddress } = useWallet();
  const [chainDistribution, setChainDistribution] = useState<ChainDistribution>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use walletAddress parameter or get from context
  const effectiveWalletAddress = walletAddress || contextWalletAddress;

  // Get chain data distribution
  useEffect(() => {
    const fetchChainDistribution = async () => {
      // If matchPercentage is provided, no need to get chain data distribution
      if (matchPercentage !== undefined) {
        setChainDistribution({});
        return;
      }

      if (!effectiveWalletAddress) {
        // If no wallet address but has asset data, use asset data
        if (assets && assets.length > 0) {
          const distribution: ChainDistribution = {};
          assets.forEach(asset => {
            const category = asset.symbol === 'ETH' ? 'ETH' :
              (asset.symbol === 'USDT' || asset.symbol === 'USDC') ? 'STABLE' : 'OTHER';
            distribution[category] = (parseFloat(distribution[category] || '0') + parseFloat(asset.value)).toString();
          });
          setChainDistribution(distribution);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://43.207.147.137:3001/api/users/${effectiveWalletAddress}`);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const userData = await response.json();
        console.log('Get user data:', userData);

        if (userData.chain_data?.distribution) {
          setChainDistribution(userData.chain_data.distribution);
        } else {
          console.warn('No chain data distribution found');
          // If no chain data, use old asset data
          if (assets && assets.length > 0) {
            const oldDistribution: ChainDistribution = {};
            assets.forEach(asset => {
              const category = asset.symbol === 'ETH' ? 'ETH' :
                (asset.symbol === 'USDT' || asset.symbol === 'USDC') ? 'STABLE' : 'OTHER';
              oldDistribution[category] = (parseFloat(oldDistribution[category] || '0') + parseFloat(asset.value)).toString();
            });
            setChainDistribution(oldDistribution);
          }
        }
      } catch (err) {
        console.error('Error getting chain data distribution:', err);
        setError('Unable to get asset distribution data');
        
        // If API request fails, use provided asset data
        if (assets && assets.length > 0) {
          const fallbackDistribution: ChainDistribution = {};
          assets.forEach(asset => {
            const category = asset.symbol === 'ETH' ? 'ETH' :
              (asset.symbol === 'USDT' || asset.symbol === 'USDC') ? 'STABLE' : 'OTHER';
            fallbackDistribution[category] = (parseFloat(fallbackDistribution[category] || '0') + parseFloat(asset.value)).toString();
          });
          setChainDistribution(fallbackDistribution);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChainDistribution();
  }, [effectiveWalletAddress, assets, matchPercentage]);

  // Prepare donut chart data
  const prepareChartData = () => {
    // Check if there is data
    if (Object.keys(chainDistribution).length === 0) {
      return { segments: [], totalValue: 0 };
    }

    // Calculate total value
    const totalValue = Object.values(chainDistribution).reduce((total, value) => {
      return total + (parseFloat(value || '0') || 0);
    }, 0);

    // Calculate donut chart data
    const circumference = 2 * Math.PI * 40; // Calculate circumference with radius 40
    let currentOffset = 0;

    const segments = Object.entries(chainDistribution)
      .filter(([_, value]) => parseFloat(value || '0') > 0)
      .sort(([_, a], [__, b]) => parseFloat(b || '0') - parseFloat(a || '0'))
      .map(([category, value]) => {
        const percentage = totalValue > 0 ? parseFloat(value || '0') / totalValue : 0;
        const arcLength = percentage * circumference;
        const strokeDasharray = `${arcLength} ${circumference}`;
        const strokeDashoffset = -currentOffset;
        currentOffset += arcLength;

        return {
          category,
          value: parseFloat(value || '0').toFixed(2),
          percentage: (percentage * 100).toFixed(1),
          strokeDasharray,
          strokeDashoffset,
          color: categoryColors[category] || '#9CA3AF'
        };
      });

    return { segments, totalValue };
  };

  // Define chart segment type
  type ChartSegment = {
    category: string;
    value: string;
    percentage: string;
    strokeDasharray: string;
    strokeDashoffset: number;
    color: string;
  };

  const { segments, totalValue = 0 } = prepareChartData();

  if (isLoading) {
    return (
      <div className="h-[180px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && segments.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center">
        <p className="text-sm text-gray-500">No available asset data</p>
      </div>
    );
  }

  return (
    <div className="h-[220px] flex flex-col items-center justify-between">
      {matchPercentage !== undefined ? (
        // If there is match percentage, only show match percentage, not donut chart
        <div className="relative w-[180px] h-[180px] mx-auto">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base text-neutral whitespace-nowrap">Match percentage</span>
            <span className="text-purple font-bold text-4xl mt-2">{matchPercentage}%</span>
          </div>
        </div>
      ) : (
          // Otherwise, show asset donut chart
        <>
          <div className="relative w-[220px] h-[220px] mx-auto">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 100 100"
            >
              {segments.map((segment: ChartSegment, index: number) => (
                <circle
                  key={`${segment.category}-${index}`}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="15"
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  style={{ transition: 'all 0.3s ease' }}
                />
              ))}
            </svg>
          </div>

            {segments.length > 0 && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 w-full max-w-[220px]">
                {segments.map((segment: ChartSegment) => (
                  <div key={`legend-${segment.category}`} className="flex items-center text-xs">
                    <div
                      className="w-3 h-3 rounded-full mr-1 flex-shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="mr-1">{categoryFullNames[segment.category] || segment.category}</span>
                    <span className="ml-auto text-gray-500">{segment.percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </>
      )}
    </div>
  );
};
