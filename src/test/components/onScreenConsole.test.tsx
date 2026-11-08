import React from 'react';
import { act, render } from '@testing-library/react';

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)';

// OnScreenConsole decides whether it is enabled when the module loads, so each
// scenario re-requires it after setting the user agent. React is pinned to the
// test's own copy so hooks still work with the already-imported renderer.
function loadComponent(userAgent?: string): React.ComponentType {
  if (userAgent) {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);
  }
  let component: React.ComponentType | undefined;
  jest.isolateModules(() => {
    jest.doMock('react', () => React);
    component = require('../../components/util/onScreenConsole').default;
  });
  jest.dontMock('react');
  return component!;
}

describe('OnScreenConsole', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    window.onerror = null;
  });

  test('renders nothing on a desktop user agent', () => {
    const OnScreenConsole = loadComponent();

    const { container } = render(<OnScreenConsole />);

    expect(container).toBeEmptyDOMElement();
  });

  test('does not hook console.log when disabled', () => {
    const before = console.log;
    const OnScreenConsole = loadComponent();

    render(<OnScreenConsole />);

    expect(console.log).toBe(before);
  });

  test('renders a read-only textarea on a mobile user agent', () => {
    const OnScreenConsole = loadComponent(MOBILE_UA);

    const { container } = render(<OnScreenConsole />);

    const textarea = container.querySelector('textarea.debugConsole') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.readOnly).toBe(true);
    expect(textarea.value).toBe('');
  });

  test('mirrors console.log and console.error into the textarea and still forwards them', () => {
    const originalLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    const originalError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const OnScreenConsole = loadComponent(MOBILE_UA);
    const { container } = render(<OnScreenConsole />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    act(() => { console.log('first', 2); });
    act(() => { console.error('boom'); });

    expect(textarea.value.split('\n')).toEqual(['first', '2', 'boom']);
    expect(originalLog).toHaveBeenCalledWith('first', 2);
    expect(originalError).toHaveBeenCalledWith('boom');
  });

  test('captures window.onerror details', () => {
    const OnScreenConsole = loadComponent(MOBILE_UA);
    const { container } = render(<OnScreenConsole />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    act(() => {
      window.onerror!('bad thing', 'file.js', 3, 4, new Error('bad thing'));
    });

    expect(textarea.value).toContain('Error: bad thing, Source: file.js, Line: 3, Column: 4');
  });

  test('restores console and window.onerror on unmount', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const hookedBefore = console.log;
    const OnScreenConsole = loadComponent(MOBILE_UA);
    const { unmount } = render(<OnScreenConsole />);

    expect(console.log).not.toBe(hookedBefore);
    unmount();

    expect(console.log).toBe(hookedBefore);
    expect(window.onerror).toBeNull();
  });
});
