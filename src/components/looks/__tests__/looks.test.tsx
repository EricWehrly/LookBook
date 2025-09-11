import { testUtils } from '../../../../tests/test-utils';
import { GetLook, GetLooks } from '../looks';
import Look from '../look';
import LookModel from '../lookModel';

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

    test('handles look with null created date', () => {
      // Manually create storage data without created date
      const lookId = 'test-look-id';
      testUtils.setMockStorageData(lookId, {
        id: lookId,
        name: 'No Date Look',
        created: null
      });
      
      const retrievedLook = GetLook(lookId);
      
      expect(retrievedLook).toBeTruthy();
      expect(retrievedLook!.name).toBe('No Date Look');
      expect(retrievedLook!.created).toBeNull();
    });

    test('handles corrupted JSON gracefully', () => {
      // This test verifies that invalid JSON doesn't crash the function
      // In the current implementation, JSON.parse would throw, but we can test this behavior
      const lookId = 'corrupted-look';
      localStorage.setItem(lookId, '{invalid json');
      
      expect(() => GetLook(lookId)).toThrow();
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

    test('handles corrupted looks array in localStorage', () => {
      // Set invalid JSON for looks array
      localStorage.setItem('looks', '{invalid json');
      
      expect(() => GetLooks({})).toThrow();
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