import { testUtils } from '../test-utils';
import {
  KeyValueStore,
  LocalStorageStore,
  getStore,
  readJson,
  setStore,
  writeJson
} from '../../components/util/storage';

class MemoryStore implements KeyValueStore {
  data: Record<string, string> = {};
  getItem(key: string) { return key in this.data ? this.data[key] : null; }
  setItem(key: string, value: string) { this.data[key] = value; }
  removeItem(key: string) { delete this.data[key]; }
}

describe('storage', () => {
  beforeEach(() => {
    testUtils.clearStorage();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('LocalStorageStore', () => {
    test('reads, writes and removes through localStorage', () => {
      const store = new LocalStorageStore();

      store.setItem('k', 'v');
      expect(localStorage.getItem('k')).toBe('v');
      expect(store.getItem('k')).toBe('v');

      store.removeItem('k');
      expect(store.getItem('k')).toBeNull();
    });

    test('is the default store', () => {
      expect(getStore()).toBeInstanceOf(LocalStorageStore);
    });

    test('swallows quota errors on write and warns', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      });

      expect(() => new LocalStorageStore().setItem('k', 'v')).not.toThrow();
      expect(warn).toHaveBeenCalled();
    });

    test('returns null when reading throws (storage blocked)', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError');
      });

      expect(new LocalStorageStore().getItem('k')).toBeNull();
    });

    test('swallows errors on remove', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('nope');
      });

      expect(() => new LocalStorageStore().removeItem('k')).not.toThrow();
    });
  });

  describe('readJson / writeJson', () => {
    test('round-trips values', () => {
      writeJson('obj', { a: 1, b: ['x'] });
      expect(readJson('obj')).toEqual({ a: 1, b: ['x'] });
    });

    test('returns null for a missing key', () => {
      expect(readJson('missing')).toBeNull();
    });

    test('returns null and warns for corrupt JSON', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('bad', '{not json');

      expect(readJson('bad')).toBeNull();
      expect(warn).toHaveBeenCalled();
    });

    test('returns null for an empty string value', () => {
      localStorage.setItem('empty', '');
      expect(readJson('empty')).toBeNull();
    });
  });

  describe('setStore', () => {
    test('redirects reads and writes to the replacement store and returns the previous one', () => {
      const memory = new MemoryStore();
      const previous = setStore(memory);
      try {
        expect(previous).toBeInstanceOf(LocalStorageStore);

        writeJson('k', [1, 2]);
        expect(memory.data.k).toBe('[1,2]');
        expect(localStorage.getItem('k')).toBeNull();
        expect(readJson('k')).toEqual([1, 2]);
      } finally {
        setStore(previous);
      }
      expect(getStore()).toBe(previous);
    });
  });
});
