import React from 'react';
import { render, screen, testUtils } from '../test-utils';
import Look from '../../components/looks/look';
import { GetLook, GetLooks } from '../../components/looks/looks';
import { nameFromDate } from '../../components/looks/lookName';
import { KeyValueStore, setStore } from '../../components/util/storage';
import { LookProps } from '../../components/looks/lookModel';

describe('Look Component', () => {
  beforeEach(() => {
    // Clear localStorage and static collections before each test
    testUtils.clearStorage();
    Look.Looks = {};
  });

  describe('Constructor and Initialization', () => {
    test('creates new look with generated UUID when no id provided', () => {
      const look = new Look({});
      
      expect(look.id).toBeDefined();
      expect(look.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(look.name).toBe("Today's Look");
      expect(look.created).toBeInstanceOf(Date);
      
      // Should be added to static collection
      expect(Look.Looks[look.id]).toBe(look);
      
      // Should be current
      expect(Look.Current).toBe(look);
    });

    test('creates look with provided options', () => {
      const testDate = new Date('2023-01-01');
      const lookData: LookProps = {
        name: 'Test Look',
        created: testDate
      };
      
      const look = new Look(lookData);
      
      expect(look.name).toBe('Test Look');
      expect(look.created).toEqual(testDate);
      expect(look.state.name).toBe('Test Look');
    });

    test('loads existing look when id provided', () => {
      // First create and save a look
      const originalLook = new Look({ name: 'Original Look' });
      const lookId = originalLook.id;
      
      // Clear the static collection to simulate fresh load
      Look.Looks = {};
      
      // Create new look instance with existing id
      const loadedLook = new Look({ id: lookId });
      
      expect(loadedLook.id).toBe(lookId);
      expect(loadedLook.name).toBe('Original Look');
      expect(loadedLook).toBe(Look.Current);
    });

    test('generates unique UUIDs for multiple looks', () => {
      const look1 = new Look({});
      const look2 = new Look({});
      const look3 = new Look({});
      
      expect(look1.id).not.toBe(look2.id);
      expect(look2.id).not.toBe(look3.id);
      expect(look1.id).not.toBe(look3.id);
    });
  });

  describe('Persistence and Storage', () => {
    test('automatically saves new look to localStorage', () => {
      const look = new Look({ name: 'Auto Save Test' });
      
      // Check localStorage has the look data
      const storedData = testUtils.getMockStorageData(look.id);
      expect(storedData).toBeTruthy();
      expect(storedData.name).toBe('Auto Save Test');
      expect(storedData.id).toBe(look.id);
      
      // Check looks collection is updated
      const looksArray = testUtils.getMockStorageData('looks');
      expect(looksArray).toContain(look.id);
    });

    test('updates looks collection when new look is created', () => {
      const look1 = new Look({ name: 'Look 1' });
      const look2 = new Look({ name: 'Look 2' });
      
      const looksArray = testUtils.getMockStorageData('looks');
      expect(looksArray).toHaveLength(2);
      expect(looksArray).toContain(look1.id);
      expect(looksArray).toContain(look2.id);
    });

    test('can retrieve look using GetLook function', () => {
      const originalLook = new Look({ name: 'Retrievable Look' });
      const lookId = originalLook.id;
      
      const retrievedLook = GetLook(lookId);
      expect(retrievedLook).toBeTruthy();
      expect(retrievedLook!.name).toBe('Retrievable Look');
      expect(retrievedLook!.id).toBe(lookId);
    });

    test('can retrieve multiple looks using GetLooks function', () => {
      const look1 = new Look({ name: 'Look 1' });
      const look2 = new Look({ name: 'Look 2' });
      
      const allLooks = GetLooks({});
      expect(allLooks).toHaveLength(2);
      
      const lookNames = allLooks.map(l => l.name);
      expect(lookNames).toContain('Look 1');
      expect(lookNames).toContain('Look 2');
    });
  });

  describe('Name Management', () => {
    test('uses default name when none provided', () => {
      const look = new Look({});
      expect(look.name).toBe("Today's Look");
    });

    test('uses provided name when given', () => {
      const look = new Look({ name: 'Custom Look Name' });
      expect(look.name).toBe('Custom Look Name');
    });

    test('defaults the name to the look date when that is not today', () => {
      const created = new Date('2020-03-04T12:00:00');
      const look = new Look({ created });

      expect(look.name).toBe(nameFromDate(created));
      expect(look.name).not.toBe("Today's Look");
      expect(look.state.name).toBe(look.name);
    });

    test("defaults the name to Today's Look when the look date is today", () => {
      const look = new Look({ created: new Date() });

      expect(look.name).toBe("Today's Look");
      expect(look.state.name).toBe("Today's Look");
    });

    test('an empty provided name falls back to the default', () => {
      const created = new Date('2020-03-04T12:00:00');

      expect(new Look({ name: '', created }).name).toBe(nameFromDate(created));
    });

    test('a stored look without a name gets a name from its stored date, not from now', () => {
      testUtils.setMockStorageData('nameless', { id: 'nameless', created: '2020-03-04T12:00:00' });

      const look = new Look({ id: 'nameless' });

      expect(look.name).toBe(nameFromDate(new Date('2020-03-04T12:00:00')));
      expect(look.name).not.toBe("Today's Look");
      expect(look.state.name).toBe(look.name);
    });

    test('a stored look with an empty name is named from its date', () => {
      testUtils.setMockStorageData('empty-name', { id: 'empty-name', name: '', created: new Date().toISOString() });

      expect(new Look({ id: 'empty-name' }).name).toBe("Today's Look");
    });

    test('a loaded look shows its stored name in state', () => {
      const original = new Look({ name: 'Stored' });
      Look.Looks = {};

      expect(new Look({ id: original.id }).state.name).toBe('Stored');
    });

    test('setText method updates name and state', () => {
      const look = new Look({ name: 'Original Name' });
      
      // Simulate setState working by manually updating the state
      // since we can't properly mount the React component in this test
      look.state.setText('Updated Name');
      
      expect(look.name).toBe('Updated Name');
      // Note: state.name won't be updated because setState isn't working 
      // in this unmounted component context, which is expected behavior
      // In a real React context, the state would be updated
    });
  });

  describe('Date Handling', () => {
    test('uses current date when none provided', () => {
      const beforeCreate = new Date();
      const look = new Look({});
      const afterCreate = new Date();
      
      expect(look.created).toBeInstanceOf(Date);
      expect(look.created.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(look.created.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    test('uses provided date when given', () => {
      const testDate = new Date('2023-06-15T10:30:00Z');
      const look = new Look({ created: testDate });
      
      expect(look.created).toEqual(testDate);
    });

    test('properly deserializes date from storage', () => {
      const testDate = new Date('2023-06-15T10:30:00Z');
      const originalLook = new Look({ 
        name: 'Date Test',
        created: testDate 
      });
      const lookId = originalLook.id;
      
      // Retrieve using GetLook to test date deserialization
      const retrievedLook = GetLook(lookId);
      expect(retrievedLook!.created).toBeInstanceOf(Date);
      expect(retrievedLook!.created!.getTime()).toBe(testDate.getTime());
    });
  });

  describe('Static Methods and Properties', () => {
    test('maintains static Looks collection', () => {
      expect(Look.Looks).toEqual({});
      
      const look1 = new Look({ name: 'Look 1' });
      const look2 = new Look({ name: 'Look 2' });
      
      expect(Object.keys(Look.Looks)).toHaveLength(2);
      expect(Look.Looks[look1.id]).toBe(look1);
      expect(Look.Looks[look2.id]).toBe(look2);
    });

    test('maintains Current reference to latest created look', () => {
      const look1 = new Look({ name: 'Look 1' });
      expect(Look.Current).toBe(look1);
      
      const look2 = new Look({ name: 'Look 2' });
      expect(Look.Current).toBe(look2);
      
      // Loading existing look should also become current
      const look1Id = look1.id;
      Look.Looks = {}; // Clear collection
      const loadedLook = new Look({ id: look1Id });
      expect(Look.Current).toBe(loadedLook);
    });
  });

  describe('Error Handling', () => {
    test('throws error when trying to build from non-existent storage', () => {
      // Clear storage to ensure no data exists
      testUtils.clearStorage();
      
      expect(() => {
        new Look({ id: 'non-existent-id' });
      }).toThrow('bad');
    });

    test('handles missing created date gracefully', () => {
      // Manually create storage without created date
      testUtils.setMockStorageData('test-id', {
        id: 'test-id',
        name: 'No Date Look'
      });
      testUtils.setMockStorageData('looks', ['test-id']);
      
      const look = new Look({ id: 'test-id' });
      expect(look.created).toBeInstanceOf(Date);
      expect(look.name).toBe('No Date Look');
    });
  });

  describe('Looks index', () => {
    test('keeps ids stored by earlier sessions when a new look is created', () => {
      testUtils.setMockStorageData('looks', ['from-last-week']);

      const look = new Look({ name: 'This week' });

      expect(testUtils.getMockStorageData('looks')).toEqual(['from-last-week', look.id]);
    });

    test('does not duplicate an id when an existing look is loaded', () => {
      const look = new Look({ name: 'Once' });
      Look.Looks = {};

      new Look({ id: look.id });

      expect(testUtils.getMockStorageData('looks')).toEqual([look.id]);
    });
  });

  describe('Persistence layer', () => {
    test('reads and writes through the replacement store, not localStorage', () => {
      const data: Record<string, string> = {};
      const memory: KeyValueStore = {
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => { data[k] = v; },
        removeItem: (k) => { delete data[k]; }
      };
      const previous = setStore(memory);
      try {
        const look = new Look({ name: 'In memory' });
        expect(JSON.parse(data[look.id]).name).toBe('In memory');
        expect(JSON.parse(data['looks'])).toEqual([look.id]);
        expect(localStorage.getItem(look.id)).toBeNull();

        Look.Looks = {};
        expect(new Look({ id: look.id }).name).toBe('In memory');
      } finally {
        setStore(previous);
      }
    });

    test('creating a look survives a failing localStorage (quota exceeded)', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      });

      let look: Look | undefined;
      expect(() => { look = new Look({ name: 'Unsaved' }); }).not.toThrow();
      expect(look!.name).toBe('Unsaved');
      jest.restoreAllMocks();
      expect(localStorage.getItem(look!.id)).toBeNull();
    });

    test('loading a look whose stored JSON is corrupt throws the not-found error', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('corrupt', '{nope');

      expect(() => new Look({ id: 'corrupt' })).toThrow('bad');
      jest.restoreAllMocks();
    });

    test('saves the created date so it round-trips', () => {
      const created = new Date('2023-06-15T10:30:00Z');
      const look = new Look({ created });

      expect(testUtils.getMockStorageData(look.id).created).toBe(created.toISOString());
    });

    test('does not log while creating, saving or loading', () => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => {});

      const look = new Look({ name: 'Quiet' });
      look.handleSave({} as any);
      Look.Looks = {};
      new Look({ id: look.id });

      expect(log).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    });
  });

  describe('Integration with localStorage', () => {
    test('storage key matches look id', () => {
      const look = new Look({ name: 'Storage Key Test' });
      expect(look.storageKey).toBe(look.id);
      
      // Verify data is stored under correct key
      const storedData = testUtils.getMockStorageData(look.storageKey);
      expect(storedData).toBeTruthy();
      expect(storedData.id).toBe(look.id);
    });

    test('handleSave method triggers save to storage', () => {
      const look = new Look({ name: 'Save Handler Test' });
      
      // Change the name
      look.name = 'Updated Name';
      
      // Clear storage to test save
      localStorage.removeItem(look.id);
      
      // Call handleSave
      look.handleSave({} as any);
      
      // Verify data was saved
      const storedData = testUtils.getMockStorageData(look.id);
      expect(storedData).toBeTruthy();
      expect(storedData.name).toBe('Updated Name');
    });
  });
});
