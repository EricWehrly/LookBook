// Owns: the key/value persistence seam (interface + localStorage backend) and
// JSON helpers that tolerate missing, corrupt or failing storage.

export interface KeyValueStore {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

// Looks up the global on every call: tests and private-browsing modes replace
// or break it after module load. Quota and SecurityError failures are swallowed
// (with a warning) so a full or blocked store degrades to "not saved" instead
// of crashing a render.
export class LocalStorageStore implements KeyValueStore {

    getItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn(`Unable to read '${key}' from localStorage`, e);
            return null;
        }
    }

    setItem(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`Unable to write '${key}' to localStorage`, e);
        }
    }

    removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`Unable to remove '${key}' from localStorage`, e);
        }
    }
}

let current: KeyValueStore = new LocalStorageStore();

export function getStore(): KeyValueStore {
    return current;
}

// Swap the backend (tests, alternate persistence). Returns the previous store so callers can restore it.
export function setStore(store: KeyValueStore): KeyValueStore {
    const previous = current;
    current = store;
    return previous;
}

// Returns null for a missing key and for JSON that does not parse.
export function readJson<T>(key: string): T | null {

    const raw = current.getItem(key);
    if (raw == null || raw === '') return null;

    try {
        return JSON.parse(raw) as T;
    } catch (e) {
        console.warn(`Ignoring corrupt JSON stored at '${key}'`, e);
        return null;
    }
}

export function writeJson(key: string, value: unknown): void {
    current.setItem(key, JSON.stringify(value));
}
