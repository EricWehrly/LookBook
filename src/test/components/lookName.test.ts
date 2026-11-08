import { nameFromDate, sameDay, TODAYS_LOOK_NAME } from '../../components/looks/lookName';

describe('sameDay', () => {
  test('is true for different times on one calendar day', () => {
    expect(sameDay(new Date(2023, 3, 1, 0, 5), new Date(2023, 3, 1, 23, 55))).toBe(true);
  });

  test('is false for adjacent days', () => {
    expect(sameDay(new Date(2023, 3, 1, 23, 59), new Date(2023, 3, 2, 0, 1))).toBe(false);
  });

  test('is false for the same day and month in different years', () => {
    expect(sameDay(new Date(2022, 3, 1), new Date(2023, 3, 1))).toBe(false);
  });

  test('is false for the same day of month in different months', () => {
    expect(sameDay(new Date(2023, 2, 1), new Date(2023, 3, 1))).toBe(false);
  });

  test('is false when either date is missing', () => {
    expect(sameDay(null as any, new Date())).toBe(false);
    expect(sameDay(new Date(), undefined as any)).toBe(false);
  });
});

describe('nameFromDate', () => {
  const now = new Date(2023, 5, 15, 9, 0);

  test("is Today's Look for a date on the same day as now", () => {
    expect(nameFromDate(new Date(2023, 5, 15, 22, 30), now)).toBe(TODAYS_LOOK_NAME);
    expect(TODAYS_LOOK_NAME).toBe("Today's Look");
  });

  test('uses the real current date when now is omitted', () => {
    expect(nameFromDate(new Date())).toBe("Today's Look");
  });

  test('is the written-out date for any other day', () => {
    const name = nameFromDate(new Date(2023, 5, 14), now);

    expect(name).not.toBe(TODAYS_LOOK_NAME);
    expect(name).toBe(new Date(2023, 5, 14).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    }));
    expect(name).toContain('2023');
  });

  test('distinguishes the same calendar day in another year', () => {
    expect(nameFromDate(new Date(2022, 5, 15), now)).not.toBe(TODAYS_LOOK_NAME);
  });

  test('falls back to Today\'s Look for an invalid date', () => {
    expect(nameFromDate(new Date('garbage'), now)).toBe(TODAYS_LOOK_NAME);
  });
});
