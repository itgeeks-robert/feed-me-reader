import { useState, Dispatch, SetStateAction } from 'react';

const reviver = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
        if (value.dataType === 'Set') {
            return new Set(value.value);
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
            // If no item exists, return the initial value.
            if (item === null) {
                return resolvedInitialValue;
            }
            const parsed = JSON.parse(item, reviver);
            // CRITICAL FIX: If the stored value is null or undefined (e.g., from an old state
            // or if localStorage contains the string "null" or "undefined"),
            // fall back to the initial value to prevent app-wide crashes.
            if (parsed === null || typeof parsed === 'undefined') {
                return resolvedInitialValue;
            }
            return parsed;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
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