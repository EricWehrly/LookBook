import LookModel from "./lookModel";
import { sameDay } from "./lookName";
import { getStore, readJson, writeJson } from "../util/storage";

const LOOKS_INDEX_KEY = 'looks';

// Keyed by look id. `raw` is the exact stored string the model was parsed from:
// a hit is only valid while storage still holds that string, so writes from
// anywhere (a Look saving, another tab, a test) invalidate it without a hook.
interface KnownLook {
    raw: string;
    model: LookModel;
}
const knownLooks : { [id: string] : KnownLook } = {};

interface GetLooksOptions {
    name?: string,
    day?: Date
    // tags
}

function readIndex() : string[] {
    const ids = readJson<string[]>(LOOKS_INDEX_KEY);
    return Array.isArray(ids) ? ids : [];
}

export function GetLooks(options : GetLooksOptions) : LookModel[] {

    const results : LookModel[] = [];

    for(const id of readIndex()) {

        const look = GetLook(id);
        if(look != null) {
            if(options.day && !sameDay(look.created, options.day)) {
                continue;
            }
            results.push(look);
        }
    }

    return results;
}

// Adds id to the persisted index of looks, keeping ids from earlier sessions.
export function AddLookToIndex(id : string) {

    const ids = readIndex();
    if(!ids.includes(id)) {
        ids.push(id);
    }
    writeJson(LOOKS_INDEX_KEY, ids);
}

// Returns null when nothing valid is stored under id.
// An entry saved without a usable `created` is stamped with the current time and
// written back, so it keeps one stable date instead of a new "now" on every read.
export function GetLook(id : string) : LookModel | null {

    const store = getStore();
    const raw = store.getItem(id);
    if(!raw) {
        delete knownLooks[id];
        return null;
    }

    const known = knownLooks[id];
    if(known && known.raw === raw) {
        return { ...known.model };
    }

    let parsed : any;
    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        console.warn(`Ignoring corrupt look stored at '${id}'`, e);
        delete knownLooks[id];
        return null;
    }
    if(parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        delete knownLooks[id];
        return null;
    }

    // JSON.parse leaves created as a string
    const created = new Date(parsed.created ?? NaN);
    const hadCreated = !isNaN(created.getTime());

    const model : LookModel = {
        id: typeof parsed.id === 'string' && parsed.id ? parsed.id : id,
        created: hadCreated ? created : new Date()
    };
    if(typeof parsed.name === 'string') {
        model.name = parsed.name;
    }

    let cachedRaw = raw;
    if(!hadCreated) {
        cachedRaw = JSON.stringify({ ...parsed, ...model });
        store.setItem(id, cachedRaw);
    }
    knownLooks[id] = { raw: cachedRaw, model };

    return { ...model };
}
