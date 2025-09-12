// The test setup has to be in this location and like this
// in order to satisfy the way "create-react-app" configures Jest.

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Import crypto polyfill for Jest environment
import './test/setup/crypto';

// Import localStorage mock for Jest environment
import './test/setup/localStorage';
