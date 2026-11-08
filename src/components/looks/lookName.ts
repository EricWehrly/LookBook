// Owns: calendar-day comparison and the default display name for a look date.

export function sameDay(date1 : Date, date2 : Date) {

    return date1 != null && date2 != null
    && (date1.getDate() === date2.getDate())
    && (date1.getMonth() === date2.getMonth())
    && (date1.getFullYear() === date2.getFullYear());
}

export const TODAYS_LOOK_NAME = "Today's Look";

// "Today's Look" when date is on the same calendar day as now, otherwise the
// date written out in the viewer's locale. `now` is injectable for tests.
export function nameFromDate(date : Date, now : Date = new Date()) : string {

    if(isNaN(date.getTime()) || sameDay(date, now)) {
        return TODAYS_LOOK_NAME;
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
