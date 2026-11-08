// localStorage.ts - LocalStorage mock for Jest testing environment
// Provides a clean localStorage implementation for each test

class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  get length(): number {
    return Object.keys(this.store).length;
  }
}

// Setup localStorage mock
const localStorageMock = new LocalStorageMock();

// Define global localStorage for Jest environment
if (typeof global.localStorage === 'undefined') {
  global.localStorage = localStorageMock as any;
}

// Clears the storage the app code actually sees: jsdom provides its own
// localStorage, so the mock above is only the fallback and clearing it alone leaves data behind.
export const clearLocalStorage = () => {
  localStorageMock.clear();
  localStorage.clear();
};

export default localStorageMock;
