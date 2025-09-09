'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useOfflineStatus } from '@/lib/offlineManager';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export function OfflineIndicator({ className = '', showWhenOnline = false }: OfflineIndicatorProps) {
  const { isOnline, isOfflineReady } = useOfflineStatus();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  useEffect(() => {
    // Listen for sync events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type } = event.data;
        if (type === 'SYNC_START') {
          setSyncStatus('syncing');
        } else if (type === 'SYNC_COMPLETE') {
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus('idle'), 3000);
        }
      });
    }
  }, []);

  // Don't show when online unless explicitly requested
  if (isOnline && !showWhenOnline && syncStatus === 'idle') {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: isOfflineReady ? <WifiOff className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />,
        text: isOfflineReady ? 'Offline Ready' : 'Offline',
        variant: isOfflineReady ? 'secondary' : 'destructive' as const,
        description: isOfflineReady
          ? 'Working offline - changes will sync when connected'
          : 'Limited functionality - some features unavailable'
      };
    }

    if (syncStatus === 'syncing') {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Syncing...',
        variant: 'outline' as const,
        description: 'Syncing offline changes'
      };
    }

    if (syncStatus === 'synced') {
      return {
        icon: <Cloud className="w-4 h-4" />,
        text: 'Synced',
        variant: 'default' as const,
        description: 'All changes synced successfully'
      };
    }

    return {
      icon: <Wifi className="w-4 h-4" />,
      text: 'Online',
      variant: 'default' as const,
      description: 'Connected and ready'
    };
  };

  const status = getStatusInfo();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge
        className="flex items-center gap-1.5 px-2 py-1"
        title={status.description}
      >
        {status.icon}
        <span className="text-xs font-medium">{status.text}</span>
      </Badge>
    </div>
  );
}

// Compact version for header/toolbar
export function OfflineIndicatorCompact({ className = '' }: { className?: string }) {
  const { isOnline, isOfflineReady } = useOfflineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className={`flex items-center ${className}`}>
      {isOfflineReady ? (
        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs">Offline</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <CloudOff className="w-4 h-4" />
          <span className="text-xs">Limited</span>
        </div>
      )}
    </div>
  );
}

// Hook for components that need to react to offline state
export function useOfflineAware() {
  const { isOnline, isOfflineReady, cachePlan, queueAction } = useOfflineStatus();

  const showOfflineMessage = (action: string) => {
    if (!isOnline) {
      return `${action} saved offline - will sync when connected`;
    }
    return null;
  };

  const canPerformAction = (requiresNetwork = false) => {
    if (!requiresNetwork) return true;
    return isOnline || isOfflineReady;
  };

  return {
    isOnline,
    isOfflineReady,
    showOfflineMessage,
    canPerformAction,
    cachePlan,
    queueAction
  };
}
