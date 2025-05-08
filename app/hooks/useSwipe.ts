import { useState, useRef, useEffect } from 'react';

interface SwipeState {
    isSwiping: boolean;
    startX: number;
    currentX: number;
}

interface UseSwipeProps {
    onSwipe: (direction: 'left' | 'right') => void;
}

export const useSwipe = ({ onSwipe }: UseSwipeProps) => {
    const [swipeState, setSwipeState] = useState<SwipeState>({
        isSwiping: false,
        startX: 0,
        currentX: 0
    });
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleTouchStart = (e: TouchEvent) => {
            setSwipeState({
                isSwiping: true,
                startX: e.touches[0].clientX,
                currentX: e.touches[0].clientX
            });
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!swipeState.isSwiping) return;

            setSwipeState(prev => ({
                ...prev,
                currentX: e.touches[0].clientX
            }));
        };

        const handleTouchEnd = () => {
            if (!swipeState.isSwiping) return;

            const diff = swipeState.currentX - swipeState.startX;
            const threshold = 50; // minimum distance to trigger a swipe

            if (Math.abs(diff) > threshold) {
                const newDirection = diff > 0 ? 'right' : 'left';
                setDirection(newDirection);
                onSwipe(newDirection);
            }

            setSwipeState({
                isSwiping: false,
                startX: 0,
                currentX: 0
            });
        };

        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchmove', handleTouchMove);
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [swipeState.isSwiping, onSwipe]);

    const swipeStyle = {
        transform: `translateX(${swipeState.currentX - swipeState.startX}px)`,
        transition: swipeState.isSwiping ? 'none' : 'transform 0.3s ease-out'
    };

    return { ref, direction, swipeState, swipeStyle };
}; 