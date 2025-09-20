import { useState } from 'react';

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

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item, reviver) : (initialValue instanceof Function ? initialValue() : initialValue);
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue instanceof Function ? initialValue() : initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = value => {
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
