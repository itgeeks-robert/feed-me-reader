import { useState, useEffect, useCallback, useRef } from 'react';

interface ServiceWorkerHookOptions {
  onBackgroundSync?: () => void;
}

/**
 * Hook for managing Service Worker registration and background sync.
 */
export function useServiceWorker(options: ServiceWorkerHookOptions = {}) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const onBackgroundSyncRef = useRef(options.onBackgroundSync);

  const applyUpdate = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  useEffect(() => {
    onBackgroundSyncRef.current = options.onBackgroundSync;
  }, [options.onBackgroundSync]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register the Service Worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setRegistration(reg);

          // Handle updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                }
              });
            }
          });

          // Handle periodic sync registration
          if ('periodicSync' in reg) {
            (reg as any).periodicSync.register('feed-refresh', {
              minInterval: 24 * 60 * 60 * 1000, // 24 hours
            }).catch((err: any) => {
              console.warn('Periodic sync could not be registered:', err);
            });
          }
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });

      // Listen for messages from the Service Worker
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'BACKGROUND_SYNC') {
          onBackgroundSyncRef.current?.();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      // Handle controller change (reload on update)
      let refreshing = false;
      const handleControllerChange = () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return { isUpdateAvailable, applyUpdate };
}
