'use client';
import React, { useEffect, useMemo, useState } from 'react';

import { Download, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const PWAInstallModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const installState = useMemo(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone ||
      document.referrer.includes('android-app://');

    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isPWASupported = 'serviceWorker' in navigator;

    console.log('[PWA][InstallPrompt] install state computed', {
      isStandalone,
      isSafari,
      isIOS,
      isPWASupported,
      displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: (window.navigator as { standalone?: boolean }).standalone,
      referrer: document.referrer,
      ua: navigator.userAgent,
    });

    return {
      isStandalone,
      isSafari,
      isIOS,
      isPWASupported,
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      console.log('[PWA][InstallPrompt] beforeinstallprompt fired; deferring prompt');
      setDeferredPrompt(e);
      setIsModalOpen(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA][InstallPrompt] appinstalled');
      setDeferredPrompt(null);
      setIsModalOpen(false);
    };

    console.log('[PWA][InstallPrompt] mounting listeners for beforeinstallprompt and appinstalled');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      console.log('[PWA][InstallPrompt] cleaning up listeners');
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async (): Promise<void> => {
    console.log('[PWA][InstallPrompt] Install button clicked');
    if (!deferredPrompt) {
      console.log('[PWA][InstallPrompt] No deferredPrompt available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA][InstallPrompt] userChoice outcome', outcome);

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsModalOpen(false);
        console.log('[PWA][InstallPrompt] Install accepted; prompt cleared and modal closed');
      }
    } catch (error) {
      console.error('[PWA][InstallPrompt] Installation error:', error);
    }
  };

  if (installState?.isStandalone || !deferredPrompt) {
    if (installState?.isStandalone) {
      console.log('[PWA][InstallPrompt] In standalone mode; not showing install modal');
    } else if (!deferredPrompt) {
      console.log('[PWA][InstallPrompt] No deferredPrompt yet; modal not rendered');
    }
    return null;
  }

  if (installState?.isIOS && installState?.isSafari) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Install on iOS
            </DialogTitle>
            <DialogDescription>
              To install this app on your iOS device:
              <ol className="mt-2 ml-4 list-decimal space-y-1">
                <li>Tap the Share button in Safari</li>
                <li>Scroll down and tap &apos;Add to Home Screen&apos;</li>
                <li>Tap &apos;Add&apos; to confirm</li>
              </ol>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Install App
          </DialogTitle>
          <DialogDescription>Install our application for a better experience</DialogDescription>
        </DialogHeader>

        <p className="text-sm text-gray-600">
          Get faster access and a better experience by installing our app on your device.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInstallClick}>Install</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallModal;
