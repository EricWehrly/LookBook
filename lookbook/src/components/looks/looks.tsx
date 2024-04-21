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

    for(var id of lookIds) {
        // console.log(id);

        const look = GetLook(id);
        if(look != null) {
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
        return castedParsed;
    }
    return null;
}
