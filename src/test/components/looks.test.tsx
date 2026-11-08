import { testUtils } from '../test-utils';
import { GetLook, GetLooks } from '../../components/looks/looks';
import Look from '../../components/looks/look';

describe('Looks Utilities', () => {
  beforeEach(() => {
    testUtils.clearStorage();
    Look.Looks = {};
  });

  describe('GetLook function', () => {
    test('returns null for non-existent look id', () => {
      const result = GetLook('non-existent-id');
      expect(result).toBeNull();
    });

    test('retrieves existing look by id', () => {
      // Create and save a look
      const originalLook = new Look({ name: 'Test Look' });
      const lookId = originalLook.id;
      
      // Retrieve using GetLook
      const retrievedLook = GetLook(lookId);
      
      expect(retrievedLook).toBeTruthy();
      expect(retrievedLook!.id).toBe(lookId);
      expect(retrievedLook!.name).toBe('Test Look');
    });

    test('properly deserializes date from storage', () => {
      const testDate = new Date('2023-05-01T14:30:00Z');
      const originalLook = new Look({ 
        name: 'Date Test', 
        created: testDate 
      });
      
      const retrievedLook = GetLook(originalLook.id);
      
      expect(retrievedLook!.created).toBeInstanceOf(Date);
      expect(retrievedLook!.created!.getTime()).toBe(testDate.getTime());
    });

    test('stamps a look stored with a null created date and keeps that date', () => {
      const lookId = 'test-look-id';
      testUtils.setMockStorageData(lookId, {
        id: lookId,
        name: 'No Date Look',
        created: null
      });

      const retrievedLook = GetLook(lookId);

      expect(retrievedLook).toBeTruthy();
      expect(retrievedLook!.name).toBe('No Date Look');
      expect(retrievedLook!.created).toBeInstanceOf(Date);

      // written back, so later reads return the same instant
      expect(testUtils.getMockStorageData(lookId).created).toBe(retrievedLook!.created.toISOString());
      expect(GetLook(lookId)!.created.getTime()).toBe(retrievedLook!.created.getTime());
    });

    test('stamps a look stored with an unparseable created date', () => {
      testUtils.setMockStorageData('bad-date', { id: 'bad-date', created: 'not a date' });

      const retrievedLook = GetLook('bad-date');

      expect(retrievedLook!.created).toBeInstanceOf(Date);
      expect(isNaN(retrievedLook!.created.getTime())).toBe(false);
    });

    test('falls back to the storage key when the stored object has no id', () => {
      testUtils.setMockStorageData('key-id', { name: 'No Id', created: '2023-05-01T00:00:00Z' });

      expect(GetLook('key-id')!.id).toBe('key-id');
    });

    test('returns null for corrupted JSON instead of throwing', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const lookId = 'corrupted-look';
      localStorage.setItem(lookId, '{invalid json');

      expect(GetLook(lookId)).toBeNull();
      jest.restoreAllMocks();
    });

    test('returns null for stored JSON that is not a look object', () => {
      localStorage.setItem('array-look', '[1,2]');
      localStorage.setItem('null-look', 'null');
      localStorage.setItem('number-look', '42');

      expect(GetLook('array-look')).toBeNull();
      expect(GetLook('null-look')).toBeNull();
      expect(GetLook('number-look')).toBeNull();
    });

    test('ignores a non-string name', () => {
      testUtils.setMockStorageData('odd-name', { id: 'odd-name', name: 7, created: '2023-05-01T00:00:00Z' });

      expect(GetLook('odd-name')!.name).toBeUndefined();
    });

    test('does not log while reading', () => {
      const look = new Look({ name: 'Quiet' });
      const log = jest.spyOn(console, 'log').mockImplementation(() => {});

      GetLook(look.id);

      expect(log).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    describe('caching', () => {
      test('does not re-parse an unchanged entry', () => {
        const look = new Look({ name: 'Cached' });
        GetLook(look.id);
        const parse = jest.spyOn(JSON, 'parse');

        GetLook(look.id);
        GetLook(look.id);

        expect(parse).not.toHaveBeenCalled();
        jest.restoreAllMocks();
      });

      test('returns independent copies so a caller cannot corrupt the cache', () => {
        const look = new Look({ name: 'Original' });

        const first = GetLook(look.id)!;
        first.name = 'Mutated';

        expect(GetLook(look.id)!.name).toBe('Original');
      });

      test('picks up a change saved by the Look', () => {
        const look = new Look({ name: 'Before' });
        expect(GetLook(look.id)!.name).toBe('Before');

        look.name = 'After';
        look.handleSave({} as any);

        expect(GetLook(look.id)!.name).toBe('After');
      });

      test('picks up a change written straight to storage', () => {
        const look = new Look({ name: 'Before' });
        GetLook(look.id);

        testUtils.setMockStorageData(look.id, { id: look.id, name: 'External', created: look.created });

        expect(GetLook(look.id)!.name).toBe('External');
      });

      test('forgets an entry removed from storage', () => {
        const look = new Look({ name: 'Doomed' });
        GetLook(look.id);

        localStorage.removeItem(look.id);

        expect(GetLook(look.id)).toBeNull();
      });

      test('does not cache corrupt data', () => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const look = new Look({ name: 'Fine' });
        GetLook(look.id);
        localStorage.setItem(look.id, '{bad');
        expect(GetLook(look.id)).toBeNull();

        testUtils.setMockStorageData(look.id, { id: look.id, name: 'Repaired', created: look.created });

        expect(GetLook(look.id)!.name).toBe('Repaired');
        jest.restoreAllMocks();
      });
    });
  });

  describe('GetLooks function', () => {
    test('returns all looks when no filters provided', () => {
      // Create test data for this specific test
      new Look({ name: 'Look 1', created: new Date('2023-01-15') });
      new Look({ name: 'Look 2', created: new Date('2023-02-20') });
      new Look({ name: 'Look 3', created: new Date('2023-01-15') });

      const allLooks = GetLooks({});
      
      expect(allLooks).toHaveLength(3);
      
      const lookNames = allLooks.map(look => look.name);
      expect(lookNames).toContain('Look 1');
      expect(lookNames).toContain('Look 2');
      expect(lookNames).toContain('Look 3');
    });

    test('filters looks by specific day', () => {
      // Create test data for this specific test
      new Look({ name: 'Look 1', created: new Date('2023-01-15') });
      new Look({ name: 'Look 2', created: new Date('2023-02-20') });
      new Look({ name: 'Look 3', created: new Date('2023-01-15') }); // Same date as Look 1

      const filterDate = new Date('2023-01-15');
      const filteredLooks = GetLooks({ day: filterDate });
      
      expect(filteredLooks).toHaveLength(2);
      
      const lookNames = filteredLooks.map(look => look.name);
      expect(lookNames).toContain('Look 1');
      expect(lookNames).toContain('Look 3');
      expect(lookNames).not.toContain('Look 2');
    });

    test('returns empty array when no looks match day filter', () => {
      // Create test data for this specific test
      new Look({ name: 'Look 1', created: new Date('2023-01-15') });
      new Look({ name: 'Look 2', created: new Date('2023-02-20') });

      const filterDate = new Date('2024-12-25'); // Date with no looks
      const filteredLooks = GetLooks({ day: filterDate });
      
      expect(filteredLooks).toHaveLength(0);
    });

    test('handles empty looks collection', () => {
      // Explicitly ensure we have no looks by setting empty array
      testUtils.setMockStorageData('looks', []);
      
      const allLooks = GetLooks({});
      expect(allLooks).toHaveLength(0);
    });

    test('handles missing looks array in localStorage', () => {
      // Remove the 'looks' key from localStorage
      localStorage.removeItem('looks');
      
      const allLooks = GetLooks({});
      expect(allLooks).toHaveLength(0);
    });

    test('treats a corrupted looks array in localStorage as empty', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('looks', '{invalid json');

      expect(GetLooks({})).toEqual([]);
      jest.restoreAllMocks();
    });

    test('treats a looks index that is not an array as empty', () => {
      localStorage.setItem('looks', '{"a":1}');

      expect(GetLooks({})).toEqual([]);
    });

    test('skips an entry whose stored look is corrupt', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const good = new Look({ name: 'Good' });
      const bad = new Look({ name: 'Bad' });
      localStorage.setItem(bad.id, '{broken');

      const results = GetLooks({});

      expect(results.map(l => l.id)).toEqual([good.id]);
      jest.restoreAllMocks();
    });

    test('a corrupt index does not stop new looks from being listed', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('looks', '{invalid json');

      const look = new Look({ name: 'Fresh' });

      expect(GetLooks({}).map(l => l.id)).toEqual([look.id]);
      jest.restoreAllMocks();
    });

    test('skips looks that cannot be retrieved', () => {
      // Create a look first
      const validLook = new Look({ name: 'Valid Look' });
      
      // Add an invalid look ID to the looks array
      const looksArray = testUtils.getMockStorageData('looks');
      looksArray.push('invalid-look-id');
      testUtils.setMockStorageData('looks', looksArray);
      
      const retrievedLooks = GetLooks({});
      
      // Should only return the valid look, skipping the invalid one
      expect(retrievedLooks).toHaveLength(1);
      expect(retrievedLooks[0].name).toBe('Valid Look');
    });

    test('filters by name (though not implemented in current code)', () => {
      // Create test data for this specific test
      new Look({ name: 'Look 1', created: new Date('2023-01-15') });
      new Look({ name: 'Look 2', created: new Date('2023-02-20') });

      // This test documents expected behavior, even though name filtering 
      // isn't currently implemented in GetLooks
      const filteredLooks = GetLooks({ name: 'Look 1' });
      
      // Current implementation ignores name filter, returns all looks
      // This test documents this behavior
      expect(filteredLooks.length).toBeGreaterThan(0);
    });

    test('date filtering uses sameDay logic correctly', () => {
      // Test the edge case of same date but different times
      const date1 = new Date('2023-03-15T08:30:00Z');
      const date2 = new Date('2023-03-15T20:45:00Z');
      
      new Look({ name: 'Morning Look', created: date1 });
      new Look({ name: 'Evening Look', created: date2 });
      
      // Filter by the same day but different time
      const filterDate = new Date('2023-03-15T12:00:00Z');
      const sameDayLooks = GetLooks({ day: filterDate });
      
      expect(sameDayLooks).toHaveLength(2);
      
      const lookNames = sameDayLooks.map(look => look.name);
      expect(lookNames).toContain('Morning Look');
      expect(lookNames).toContain('Evening Look');
    });
  });

  describe('Date comparison logic', () => {
    test('sameDay function works correctly for various date scenarios', () => {
      // We can't test the private sameDay function directly, but we can test 
      // its behavior through GetLooks filtering
      
      // Same day, different times
      const look1 = new Look({ 
        name: 'Look 1', 
        created: new Date('2023-04-01T09:00:00Z') 
      });
      const look2 = new Look({ 
        name: 'Look 2', 
        created: new Date('2023-04-01T21:30:00Z') 
      });
      
      // Different day
      const look3 = new Look({ 
        name: 'Look 3', 
        created: new Date('2023-04-02T09:00:00Z') 
      });
      
      const filterDate = new Date('2023-04-01T15:00:00Z');
      const sameDayLooks = GetLooks({ day: filterDate });
      
      expect(sameDayLooks).toHaveLength(2);
      expect(sameDayLooks.map(l => l.name)).toEqual(
        expect.arrayContaining(['Look 1', 'Look 2'])
      );
    });

    test('handles null dates in filtering', () => {
      // Create a look with null created date
      testUtils.setMockStorageData('null-date-look', {
        id: 'null-date-look',
        name: 'Null Date Look',
        created: null
      });
      
      // Add to looks array
      const looksArray = testUtils.getMockStorageData('looks') || [];
      looksArray.push('null-date-look');
      testUtils.setMockStorageData('looks', looksArray);
      
      // Filter by a specific date
      const filterDate = new Date('2023-04-01');
      const filteredLooks = GetLooks({ day: filterDate });
      
      // Look with null date should not match the filter
      const lookNames = filteredLooks.map(l => l.name);
      expect(lookNames).not.toContain('Null Date Look');
    });
  });
});
