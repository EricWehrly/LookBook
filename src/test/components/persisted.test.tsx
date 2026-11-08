import { testUtils } from '../test-utils';
import Persisted, { PersistedModel } from '../../components/util/persisted';
import { KeyValueStore, setStore } from '../../components/util/storage';

class Thing extends Persisted {
  name?: string;

  // The field declaration above resets name to undefined once Persisted's
  // constructor returns, so re-read what it serialized.
  constructor(options: PersistedModel & { name?: string }) {
    super(options);
    this.name = Persisted.Get<{ name?: string }>(this.id)?.name;
  }

  buildFromStorage(id: string): void {
    this.name = (Persisted.Get(id) as { name?: string } | null)?.name;
  }

  create(options: PersistedModel & { name?: string }): void {
    this.name = options.name ?? 'created';
  }

  serialize(): string {
    return JSON.stringify({ id: this.id, name: this.name });
  }

  render() {
    return null;
  }
}

class OtherThing extends Thing {}

class UnhydratedThing extends Persisted {
  name?: string;
  buildFromStorage(): void { this.name = 'built'; }
  create(): void { this.name = 'created'; }
  serialize(): string { return JSON.stringify({ id: this.id, name: this.name }); }
  render() { return null; }
}

function resetCollections() {
  (Thing as any).List = undefined;
  (OtherThing as any).List = undefined;
}

describe('Persisted', () => {
  beforeEach(() => {
    testUtils.clearStorage();
    resetCollections();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('construction', () => {
    test('generates a UUID and calls create when no id is given', () => {
      const thing = new Thing({});

      expect(thing.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(thing.name).toBe('created');
    });

    test('treats an empty id as a request for a new object', () => {
      const thing = new Thing({ id: '' });
      expect(thing.id.length).toBeGreaterThan(0);
      expect(thing.name).toBe('created');
    });

    test('serializes the new object under its id', () => {
      const thing = new Thing({});

      expect(testUtils.getMockStorageData(thing.id)).toEqual({ id: thing.id, name: 'created' });
    });

    test('calls buildFromStorage instead of create when an id is given', () => {
      testUtils.setMockStorageData('known-id', { id: 'known-id', name: 'stored name' });

      const thing = new Thing({ id: 'known-id' });

      expect(thing.id).toBe('known-id');
      expect(thing.name).toBe('stored name');
    });

    test('subclass field declarations reset what create() set, but the serialized form keeps it', () => {
      const thing = new UnhydratedThing({});

      expect(thing.name).toBeUndefined();
      expect(testUtils.getMockStorageData(thing.id).name).toBe('created');
    });

    test('does not log while constructing', () => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => {});
      new Thing({});
      new Thing({ id: 'x' });
      expect(log).not.toHaveBeenCalled();
    });
  });

  describe('Get', () => {
    test('returns the parsed stored object', () => {
      testUtils.setMockStorageData('a', { id: 'a', n: 1 });
      expect(Persisted.Get('a')).toEqual({ id: 'a', n: 1 });
    });

    test('returns null for a missing key', () => {
      expect(Persisted.Get('nope')).toBeNull();
    });

    test('returns null for corrupt JSON instead of throwing', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('bad', '{oops');
      expect(Persisted.Get('bad')).toBeNull();
    });
  });

  describe('collections', () => {
    test('indexes every instance under the subclass name', () => {
      const a = new Thing({});
      const b = new Thing({});

      expect(testUtils.getMockStorageData('Thing')).toEqual([a.id, b.id]);
    });

    test('keeps separate indexes per subclass', () => {
      const thing = new Thing({});
      const other = new OtherThing({});

      expect(testUtils.getMockStorageData('Thing')).toEqual([thing.id]);
      expect(testUtils.getMockStorageData('OtherThing')).toEqual([other.id]);
    });

    test('GetCollection returns the live instances created this session', () => {
      const thing = new Thing({});

      expect(thing.GetCollection()[thing.id]).toBe(thing);
    });

    test('lazily loads previously stored objects when the in-memory list is empty', () => {
      const first = new Thing({ name: 'first' });
      const second = new Thing({ name: 'second' });
      resetCollections();

      const reloaded = new Thing({ id: first.id }).GetCollection();

      expect(Object.keys(reloaded)).toEqual([first.id, second.id]);
      expect((reloaded[second.id] as Thing).name).toBe('second');
    });

    test('treats a corrupt index as empty', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('Thing', '{bad');

      const thing = new Thing({});

      expect(Object.keys(thing.GetCollection())).toEqual([thing.id]);
      expect(testUtils.getMockStorageData('Thing')).toEqual([thing.id]);
    });

    test('ignores a lazily loaded entry whose stored object has vanished', () => {
      testUtils.setMockStorageData('Thing', ['ghost']);

      const thing = new Thing({});
      const ghost = thing.GetCollection()['ghost'] as any;

      expect(ghost.name).toBeUndefined();
    });
  });

  describe('storage failures', () => {
    test('constructing still works when writes fail (quota exceeded)', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      });

      let thing: Thing | undefined;
      expect(() => { thing = new Thing({}); }).not.toThrow();
      expect(localStorage.getItem(thing!.id)).toBeNull();
    });

    test('writes go through a replacement store', () => {
      const data: Record<string, string> = {};
      const memory: KeyValueStore = {
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => { data[k] = v; },
        removeItem: (k) => { delete data[k]; }
      };
      const previous = setStore(memory);
      try {
        const thing = new Thing({});
        expect(JSON.parse(data[thing.id])).toEqual({ id: thing.id, name: 'created' });
        expect(JSON.parse(data['Thing'])).toEqual([thing.id]);
        expect(localStorage.getItem(thing.id)).toBeNull();
      } finally {
        setStore(previous);
      }
    });
  });
});
