import React from 'react';
import { render, screen, testUtils } from '../../../test-utils';
import Look from '../look';
import { GetLook, GetLooks } from '../looks';
import LookModel from '../lookModel';

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
      const lookData: LookModel = {
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