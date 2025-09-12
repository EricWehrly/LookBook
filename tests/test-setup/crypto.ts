// crypto.ts - Crypto polyfill for Jest testing environment
// This provides crypto.randomUUID() functionality missing in jsdom

// Simple UUID v4 generator (for testing purposes only)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Mock crypto.randomUUID for Jest environment
const cryptoMock = {
  randomUUID: () => generateUUID(),
  // Add other crypto methods as needed
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};

// Define global crypto if not available (Jest/jsdom environment)
if (typeof global.crypto === 'undefined') {
  global.crypto = cryptoMock as any;
}

export default cryptoMock;