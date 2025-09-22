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

// FIX: Change React.Dispatch<React.SetStateAction<T>> to Dispatch<SetStateAction<T>>
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        const resolvedInitialValue = initialValue instanceof Function ? initialValue() : initialValue;
        try {
            const item = window.localStorage.getItem(key);
            if (item === null) {
                return resolvedInitialValue;
            }
            const parsed = JSON.parse(item, reviver);
            // Ensure that if localStorage has `null` we don't return it,
            // as this will crash the app when properties are accessed.
            return parsed !== null ? parsed : resolvedInitialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return resolvedInitialValue;
        }
    });

    // FIX: Change React.Dispatch<React.SetStateAction<T>> to Dispatch<SetStateAction<T>>
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