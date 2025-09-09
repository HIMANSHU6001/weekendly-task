'use client';

import { useEffect, useState } from 'react';
import { offlineManager } from '@/lib/offlineManager';

export default function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);

      console.log('[PWA] Service Worker registered successfully:', reg);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker available');
              setUpdateAvailable(true);

              // Show update notification
              showUpdateNotification();
            }
          });
        }
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service Worker controller changed, reloading...');
        window.location.reload();
      });

      // Check for waiting service worker
      if (reg.waiting) {
        console.log('[PWA] Service Worker waiting');
        setUpdateAvailable(true);
        showUpdateNotification();
      }

    } catch (error) {
      console.log('[PWA] Service Worker registration failed:', error);
    }
  };

  const showUpdateNotification = () => {
    // You can replace this with your toast/notification system
    if (window.confirm('A new version of Weekendly is available. Update now?')) {
      updateServiceWorker();
    }
  };

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Auto-check for updates periodically
  useEffect(() => {
    const checkForUpdates = () => {
      if (registration) {
        registration.update();
      }
    };

    // Check for updates every 30 minutes
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [registration]);

  return null;
}
