import React from 'react';
import { render, screen, testUtils } from '../tests/test-utils';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    testUtils.clearStorage();
  });

  test('renders main app structure', () => {
    render(<App />);
    
    // Check that main app elements are present
    expect(screen.getByText(/Today's Look/i)).toBeInTheDocument();
    expect(screen.getByText(/Tags:/i)).toBeInTheDocument();
    expect(screen.getByText(/Photos:/i)).toBeInTheDocument();
    expect(screen.getByText(/Products:/i)).toBeInTheDocument();
  });

  test('displays current date-based look by default', () => {
    render(<App />);
    
    // Should show "Today's Look" as default name
    expect(screen.getByText(/Today's Look/i)).toBeInTheDocument();
  });

  test('renders google photos integration components', () => {
    render(<App />);
    
    // Check for Google Photos related elements
    expect(screen.getByRole('button', { name: /Add new product/i })).toBeInTheDocument();
    
    // Albums container should be present
    const albumsDiv = document.getElementById('albums');
    expect(albumsDiv).toBeInTheDocument();
    
    // Album picker should be present
    const albumPicker = document.getElementById('albumPicker');
    expect(albumPicker).toBeInTheDocument();
  });

  test('creates new look with crypto UUID when no existing look found', async () => {
    // Clear storage before test
    testUtils.clearStorage();
    
    render(<App />);
    
    // Wait for component to initialize
    await testUtils.waitForComponent();
    
    // Check that a look was created and saved to localStorage
    // The Look component should have saved itself with its generated ID
    // We expect at least the "looks" array and the look data to be saved
    expect(localStorage.length).toBeGreaterThanOrEqual(2);
    
    // Verify the looks collection exists
    const looks = testUtils.getMockStorageData('looks');
    expect(looks).toBeTruthy();
    expect(Array.isArray(looks)).toBe(true);
    expect(looks.length).toBe(1);
    
    // Verify the UUID format (should match crypto.randomUUID() format)
    const lookId = looks[0];
    expect(lookId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test('has proper component structure and styling', () => {
    render(<App />);
    
    // Check main app div exists
    const appDiv = document.querySelector('.App');
    expect(appDiv).toBeInTheDocument();
    
    // Check look component exists
    const lookDiv = document.querySelector('.look');
    expect(lookDiv).toBeInTheDocument();
  });
});
