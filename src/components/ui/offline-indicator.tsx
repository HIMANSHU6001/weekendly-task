'use client';

import {WifiOff, CloudOff} from 'lucide-react';
import {useOfflineStatus} from '@/lib/offlineManager';


export function OfflineIndicatorCompact({className = ''}: { className?: string }) {
  const {isOnline, isOfflineReady} = useOfflineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className={`flex items-center ${className}`}>
      {isOfflineReady ? (
        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <WifiOff className="w-4 h-4"/>
          <span className="text-xs">Offline</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <CloudOff className="w-4 h-4"/>
          <span className="text-xs">Limited</span>
        </div>
      )}
    </div>
  );
}
