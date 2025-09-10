import {useState, useEffect} from 'react';


export interface OfflineManager {
  isOnline: boolean;
  isOfflineReady: boolean;
  cachePlan: (plan: any) => Promise<void>;
  queueAction: (action: OfflineAction) => Promise<void>;
  syncWhenOnline: () => Promise<void>;
}

export interface OfflineAction {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  method: string;
  data?: any;
  planId?: string;
  timestamp: number;
}

class OfflineService implements OfflineManager {
  private sw: ServiceWorker | null = null;
  public isOnline: boolean = true;
  public isOfflineReady: boolean = false;
  private listeners: ((status: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.initializeServiceWorker();
      this.setupEventListeners();
    }
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        this.sw = registration.active;
        this.isOfflineReady = true;
        console.log('[Offline] Service worker ready for offline operations');
      } catch (error) {
        console.error('[Offline] Service worker initialization failed:', error);
      }
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      this.syncWhenOnline();
      console.log('[Offline] Back online, syncing data...');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
      console.log('[Offline] Gone offline, using cached data');
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const {type, data} = event.data;
        if (type === 'SYNC_COMPLETE') {
          console.log('[Offline] Background sync completed:', data);
        }
      });
    }
  }

  public onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(callback => callback(isOnline));
  }

  public async cachePlan(plan: any): Promise<void> {
    if (!this.sw) {
      console.warn('[Offline] Service worker not available for caching');
      return;
    }

    try {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CACHE_PLAN',
        data: plan
      });
      console.log('[Offline] Plan cached for offline use:', plan.id);
    } catch (error) {
      console.error('[Offline] Error caching plan:', error);
    }
  }

  public async queueAction(action: OfflineAction): Promise<void> {
    if (!this.sw) {
      console.warn('[Offline] Service worker not available for queuing');
      return;
    }

    try {
      navigator.serviceWorker.controller?.postMessage({
        type: 'QUEUE_SYNC',
        data: action
      });
      console.log('[Offline] Action queued for sync:', action.type);
    } catch (error) {
      console.error('[Offline] Error queuing action:', error);
    }
  }

  public async syncWhenOnline(): Promise<void> {
    if (!this.isOnline || !this.sw) return;

    try {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        const syncManager = (registration as any).sync;
        if (syncManager) {
          await syncManager.register('sync-plans');
          console.log('[Offline] Background sync registered');
        }
      }
    } catch (error) {
      console.error('[Offline] Error triggering sync:', error);
    }
  }
}

export const offlineManager = new OfflineService();

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(offlineManager.isOnline);
  const [isOfflineReady, setIsOfflineReady] = useState(offlineManager.isOfflineReady);

  useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange(setIsOnline);

    const checkOfflineReady = () => {
      setIsOfflineReady(offlineManager.isOfflineReady);
    };

    checkOfflineReady();
    const interval = setInterval(checkOfflineReady, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    isOfflineReady,
    cachePlan: offlineManager.cachePlan.bind(offlineManager),
    queueAction: offlineManager.queueAction.bind(offlineManager)
  };
}