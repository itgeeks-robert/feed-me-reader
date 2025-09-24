import { useState, Dispatch, SetStateAction } from 'react';

const reviver = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
        // Hardened check: Ensure value.value is iterable before creating a Map.
        if (value.dataType === 'Map') {
            return Array.isArray(value.value) ? new Map(value.value) : new Map();
        }
        // Hardened check: Ensure value.value is iterable before creating a Set.
        if (value.dataType === 'Set') {
            return Array.isArray(value.value) ? new Set(value.value) : new Set();
        }
    }
    return value;
};

const replacer = (key: string, value: any) => {
    if (value instanceof Map) {
        return { dataType: 'Map', value: Array.from(value.entries()) };
    }
    if (value instanceof Set) {
        return { dataType: 'Set', value: Array.from(value.values()) };
    }
    return value;
};

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        const resolvedInitialValue = initialValue instanceof Function ? initialValue() : initialValue;
        try {
            const item = window.localStorage.getItem(key);
            if (item === null) {
                return resolvedInitialValue;
            }
            
            const parsed = JSON.parse(item, reviver);

            if (parsed === null || typeof parsed === 'undefined') {
                 console.warn(`LocalStorage key "${key}" was null or undefined. Reverting to default.`);
                return resolvedInitialValue;
            }

            // **DEFINITIVE FIX**: Perform strict type validation. If the stored data's type
            // doesn't match the initial value's type (e.g., loaded an array but expected a Set),
            // discard the stored value and use the default. This prevents crashes from stale
            // data formats from older versions of the app.
            const initialType = Object.prototype.toString.call(resolvedInitialValue);
            const parsedType = Object.prototype.toString.call(parsed);

            if (initialType !== parsedType) {
                console.warn(`Type mismatch for localStorage key "${key}". Expected ${initialType}, but got ${parsedType}. Falling back to default value to prevent crash.`);
                return resolvedInitialValue;
            }

            return parsed;
        } catch (error) {
            console.warn(`Error reading or parsing localStorage key "${key}":`, error);
            return resolvedInitialValue;
        }
    });

    const setValue: Dispatch<SetStateAction<T>> = value => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore, replacer));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };
    return [storedValue, setValue];
}