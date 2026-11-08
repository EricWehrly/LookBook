// The only module the product store touches storage through; swap the
// backing implementation here (localStorage today) without touching callers.
// Reads never throw: unavailable storage or corrupt JSON yields the fallback.

export function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch (error) {
        console.error(`Could not read "${key}" from storage`, error);
        return fallback;
    }
}

export function writeJson(key: string, value: unknown): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Could not write "${key}" to storage`, error);
        return false;
    }
}

export function removeKey(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Could not remove "${key}" from storage`, error);
    }
}
