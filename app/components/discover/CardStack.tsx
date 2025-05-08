"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileCard } from './ProfileCard';
import SwipeControls from './SwipeControls';
import MatchAnimation from '../match/MatchAnimation';
import { useQuery } from '@tanstack/react-query';
import { fetchPotentialMatches, createMatch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface CardStackProps { }

export const CardStack: React.FC<CardStackProps> = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);

  const { data: potentialMatches = [], isLoading } = useQuery({
    queryKey: ['potentialMatches'],
    queryFn: () => fetchPotentialMatches(),
    enabled: !!userId
  });

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (direction === 'right') {
      const matchedPotential = potentialMatches[currentIndex];
      setMatchedUser(matchedPotential);
      setShowMatchAnimation(true);

      try {
        if (!matchedPotential.walletAddress && matchedPotential.user && matchedPotential.user.wallet_address) {
          matchedPotential.walletAddress = matchedPotential.user.wallet_address;
        }
        await createMatch(matchedPotential);
        console.log(`Added ${matchedPotential.user.displayName} to match list`);
      } catch (error) {
        console.error('Error creating match:', error);
        showToast(
          'Match Failed',
          'Unable to create match, please try again',
          'destructive'
        );
      }
    }
    setCurrentIndex(prev => prev + 1);
  };

  const handleCloseMatchAnimation = () => {
    setShowMatchAnimation(false);
  };

  const handleMessageNow = () => {
    setShowMatchAnimation(false);
    router.push('/?view=matches');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-10 h-10 border-4 border-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentIndex >= potentialMatches.length) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-medium mb-2">No more users for now</h2>
          <p className="text-neutral mb-6">
            check back later for more matches
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col">
      <AnimatePresence>
        {showMatchAnimation && (
          <MatchAnimation
            isOpen={showMatchAnimation}
            matchedUser={matchedUser}
            onClose={handleCloseMatchAnimation}
            onMessageNow={handleMessageNow}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 relative flex items-center justify-center mb-24">
        <AnimatePresence>
          {potentialMatches.slice(currentIndex, currentIndex + 3).map((match, index) => (
            <motion.div
              key={match.user.id}
              className="absolute max-w-md w-full mx-auto left-0 right-0"
              initial={{ scale: 1, y: 0, opacity: 1 }}
              animate={{
                scale: 1 - index * 0.05,
                y: index * 20,
                opacity: 1 - index * 0.2
              }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ zIndex: 3 - index }}
            >
              <ProfileCard
                user={{
                  ...match.user,
                  username: match.user.displayName.toLowerCase()
                }}
                assets={match.assets}
                preferences={match.preferences}
                matchPercentage={match.matchPercentage}
                onLike={() => handleSwipe('right')}
                onDislike={() => handleSwipe('left')}
                tags={match.tags}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative w-full max-w-md mx-auto mt-4 mb-8">
        <SwipeControls
          onSwipeLeft={() => handleSwipe('left')}
          onSwipeRight={() => handleSwipe('right')}
        />
      </div>
    </div>
  );
};
