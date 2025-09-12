// test-utils.tsx - Custom test utilities for LookBook testing
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { clearLocalStorage } from './setup/localStorage';

// Custom render function that can be extended with providers as needed
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test helper functions
export const testUtils = {
  // Clean localStorage before each test
  clearStorage: () => clearLocalStorage(),
  
  // Wait for component to settle (useful for components with async initialization)
  waitForComponent: (ms: number = 100) => 
    new Promise(resolve => setTimeout(resolve, ms)),
    
  // Generate test UUID (consistent for testing)
  generateTestId: () => 'test-uuid-' + Date.now(),
  
  // Mock localStorage data helper
  setMockStorageData: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  getMockStorageData: (key: string) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
};
