// components/camera/CountdownTimer.tsx
import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  remaining: number;
  onCountdownEnd: () => void;
  audioEnabled?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  remaining,
  onCountdownEnd,
  audioEnabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (remaining > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      // Call onCountdownEnd when countdown reaches 0
      if (remaining === 0) {
        onCountdownEnd();
      }
    }
  }, [remaining, onCountdownEnd]);

  // Play countdown sound
  useEffect(() => {
    if (audioEnabled && remaining > 0 && remaining <= 3 && typeof window !== 'undefined') {
      try {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.warn('Audio playback failed:', error);
      }
    }
  }, [remaining, audioEnabled]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-black bg-opacity-75 rounded-full p-8">
        <div className="text-white text-8xl font-bold animate-pulse">
          {remaining}
        </div>
        {remaining === 1 && (
          <div className="text-white text-xl text-center mt-4 animate-bounce">
            Say Cheese! 📸
          </div>
        )}
      </div>
    </div>
  );
};

export default CountdownTimer;
