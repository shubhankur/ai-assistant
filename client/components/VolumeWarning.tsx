import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VolumeWarningProps {
  volume: number;
}

export function VolumeWarning({ volume }: VolumeWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [lowVolumeStartTime, setLowVolumeStartTime] = useState<number | null>(null);
  
  const VOLUME_THRESHOLD = 0.3;  // Threshold for low volume
  const WARNING_DELAY = 1500;    // Show warning after 1.5 seconds of low volume
  
  useEffect(() => {
    const isLowVolume = volume < VOLUME_THRESHOLD;
    
    if (isLowVolume && !lowVolumeStartTime) {
      // Start timing when volume first goes low
      setLowVolumeStartTime(Date.now());
    } else if (!isLowVolume) {
      // Reset when volume is okay
      setLowVolumeStartTime(null);
      setShowWarning(false);
    } else if (isLowVolume && lowVolumeStartTime) {
      // Check if we've been at low volume long enough to show warning
      const timeInLowVolume = Date.now() - lowVolumeStartTime;
      if (timeInLowVolume >= WARNING_DELAY) {
        setShowWarning(true);
      }
    }
  }, [volume, lowVolumeStartTime]);

  const volumePercentage = Math.round(volume * 100);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
            <div className="flex-shrink-0">
              {volumePercentage === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {volumePercentage === 0 
                  ? "Device is muted" 
                  : `Volume is very low (${volumePercentage}%)`
                }
              </p>
              <p className="text-xs opacity-90">
                Please increase your device volume to hear the assistant clearly
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 