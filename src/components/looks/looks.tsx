import Look from "./look";
import LookModel from "./lookModel";

const knownLooks : { [id: string] : Look } = {};

interface GetLooksOptions {
    name?: string,
    day?: Date
    // tags
}

export function GetLooks(options : GetLooksOptions) : LookModel[] {

    const results : LookModel[] = [];
    const storageValue = localStorage.getItem('looks');
    const lookIds = storageValue ? JSON.parse(storageValue) : [];

    for(const id of lookIds) {
        // console.log(id);

        const look = GetLook(id);
        if(look != null) {
            if(options.day) {
                if(look.created == null 
                    || !sameDay(look.created, options.day)) {
                    continue;
                }
            }
            results.push(look);
        }
    }

    return results;
}

export function GetLook(id : string) : LookModel | null {

    // TODO: cache via knownlooks

    const storageItem = localStorage.getItem(id);
    if(storageItem) {
        // TODO: probly try/catch this
        const castedParsed : LookModel = JSON.parse(storageItem);
        // dumb hack cuz the above doesn't seem to coerce the type :/
        if(castedParsed.created) {
            castedParsed.created = new Date(castedParsed.created?.toString());
        }
        return castedParsed;
    }
    return null;
}

function sameDay(date1 : Date, date2 : Date) {

    return date1 != null && date2 != null
    && (date1.getDate() === date2.getDate())
    && (date1.getMonth() === date2.getMonth())
    && (date1.getFullYear() === date2.getFullYear());
}
