import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting state in localStorage.
 * Handles Set and Map types by serializing them as arrays.
 */
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void] {
  // Helper to serialize data, handling Set and Map
  const serialize = (value: any): string => {
    return JSON.stringify(value, (_key, val) => {
      if (val instanceof Set) {
        return { _type: 'Set', value: Array.from(val) };
      }
      if (val instanceof Map) {
        return { _type: 'Map', value: Array.from(val.entries()) };
      }
      return val;
    });
  };

  // Helper to deserialize data, handling Set and Map
  const deserialize = (value: string): any => {
    return JSON.parse(value, (_key, val) => {
      if (val && typeof val === 'object' && val._type === 'Set') {
        return new Set(val.value);
      }
      if (val && typeof val === 'object' && val._type === 'Map') {
        return new Map(val.value);
      }
      return val;
    });
  };

  // Initialize state
  const [state, setState] = useState<T>(() => {
    const initial = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        let val = deserialize(item);
        
        // Robust type conversion for legacy data or unexpected formats
        if (initial instanceof Set) {
          if (val && typeof val === 'object' && val._type === 'Set') {
            val = new Set(val.value);
          } else if (Array.isArray(val)) {
            val = new Set(val);
          } else if (!(val instanceof Set)) {
            val = new Set();
          }
          return val as unknown as T;
        }
        
        if (initial instanceof Map) {
          if (val && typeof val === 'object' && val._type === 'Map') {
            val = new Map(val.value);
          } else if (Array.isArray(val)) {
            val = new Map(val);
          } else if (!(val instanceof Map)) {
            val = new Map();
          }
          return val as unknown as T;
        }
        
        return val;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    return initial;
  });

  // Atomic update function
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setState((prev) => {
        const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        
        // Write to localStorage
        try {
          window.localStorage.setItem(key, serialize(nextValue));
        } catch (e) {
          // Catch QuotaExceededError silently
          if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            console.warn('LocalStorage quota exceeded');
          } else {
            throw e;
          }
        }
        
        return nextValue;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          let val = deserialize(e.newValue);
          const initial = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
          
          if (initial instanceof Set) {
            if (val && typeof val === 'object' && val._type === 'Set') {
              val = new Set(val.value);
            } else if (Array.isArray(val)) {
              val = new Set(val);
            } else if (!(val instanceof Set)) {
              val = new Set();
            }
            setState(val as unknown as T);
          } else if (initial instanceof Map) {
            if (val && typeof val === 'object' && val._type === 'Map') {
              val = new Map(val.value);
            } else if (Array.isArray(val)) {
              val = new Map(val);
            } else if (!(val instanceof Map)) {
              val = new Map();
            }
            setState(val as unknown as T);
          } else {
            setState(val);
          }
        } catch (error) {
          console.error(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [state, setValue];
}
