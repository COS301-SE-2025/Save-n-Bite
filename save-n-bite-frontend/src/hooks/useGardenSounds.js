import { useCallback } from 'react';

export const useGardenSounds = () => {
  const playSound = useCallback((soundType) => {
    // Don't play sounds if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    try {
      let soundUrl;
      
      switch(soundType) {
        case 'plant':
          // Use a simple beep sound that's more reliable
          soundUrl = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
          break;
        case 'harvest':
          // Use a different simple sound
          soundUrl = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
          break;
        case 'move':
          // Use the same for now, or find better URLs
          soundUrl = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
          break;
        default:
          return;
      }

      //console.log('🔊 Playing sound:', soundType);
      
      const audio = new Audio(soundUrl);
      audio.volume = 0.7;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          //console.log('Audio play failed:', error);
          // Create a fallback using the Web Audio API
          try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            // Different frequencies for different actions
            if (soundType === 'plant') oscillator.frequency.value = 523.25; // C5
            else if (soundType === 'harvest') oscillator.frequency.value = 659.25; // E5
            else if (soundType === 'move') oscillator.frequency.value = 392.00; // G4
            
            gainNode.gain.value = 0.3;
            oscillator.start();
            oscillator.stop(context.currentTime + 0.1);
          } catch (fallbackError) {
            //console.log('Fallback audio also failed:', fallbackError);
          }
        });
      }
      
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  return { playSound };
};