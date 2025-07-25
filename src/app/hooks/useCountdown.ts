import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCountdownOptions {
  duration: number;
  audioEnabled?: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

interface UseCountdownReturn {
  isActive: boolean;
  remaining: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export const useCountdown = (options: UseCountdownOptions): UseCountdownReturn => {
  const { duration, audioEnabled = false, onComplete, onTick } = options;
  
  const [isActive, setIsActive] = useState(false);
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    if (audioEnabled) {
      // Create audio context for countdown sounds
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      
      // You can set different audio sources for different sounds
      // For now, we'll use a simple beep sound
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    }
  }, [audioEnabled]);

  // Play countdown sound
  const playCountdownSound = useCallback(() => {
    if (audioRef.current && audioEnabled) {
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
    }
  }, [audioEnabled]);

  // Start countdown
  const start = useCallback(() => {
    setIsActive(true);
    setRemaining(duration);
    
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const newRemaining = prev - 1;
        
        // Play sound for each tick
        if (newRemaining > 0) {
          playCountdownSound();
        }
        
        // Call onTick callback
        if (onTick) {
          onTick(newRemaining);
        }
        
        // Complete countdown
        if (newRemaining <= 0) {
          setIsActive(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Play completion sound
          if (audioEnabled) {
            playCountdownSound();
          }
          
          // Call onComplete callback
          if (onComplete) {
            onComplete();
          }
        }
        
        return newRemaining;
      });
    }, 1000);
  }, [duration, onComplete, onTick, audioEnabled, playCountdownSound]);

  // Stop countdown
  const stop = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset countdown
  const reset = useCallback(() => {
    stop();
    setRemaining(duration);
  }, [stop, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isActive,
    remaining,
    start,
    stop,
    reset,
  };
};
