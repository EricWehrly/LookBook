import { Component } from "react";
import { getStore, readJson, writeJson } from "./storage";

export interface PersistedModel {
    id? : string;
}

type PersistMap = { [id: string] : Persisted };

// Subclasses are stored under their id and indexed under the subclass name.
// buildFromStorage/create run from this constructor, before the subclass's own
// field initializers: a field declared as `name?: string` is reset to undefined
// afterwards, wiping what those methods set. Re-read from storage (or assign) in
// the subclass constructor after super().
export default abstract class Persisted extends Component<PersistedModel> implements PersistedModel {
    private _id : string;

    get id() { return this._id; }

    constructor(options: PersistedModel) {
        super(options);

        if(options.id && options.id.length > 0) {
            this._id = options.id;

            this.buildFromStorage(this._id);
        } else {
            this._id = crypto.randomUUID();
            this.create(options);
        }

        getStore().setItem(this.id, this.serialize());
        this.updateCollection(this.constructor, this);
    }

    abstract buildFromStorage(id: string): void;
    abstract create(options: PersistedModel): void;
    abstract serialize(): string;

    // Returns null when nothing is stored under id or the stored JSON is corrupt.
    static Get<T = any>(id: string): T | null {
        return readJson<T>(id);
    }

    private updateCollection(constructor: Function, persisted: Persisted) {

        const list = this.GetCollection();

        list[persisted.id] = persisted;
        const keys = Object.keys(list);
        writeJson(constructor.name, keys);
    }

    GetCollection(): PersistMap {

        const constructor = this.constructor as any;

        if(constructor.List) return constructor.List;

        else return this.loadCollectionFromStorage();
    }

    private lazyLoadPersistedObject(key: string) {
        const handler = {
            get: (target: any, prop: string) => {
                if (prop === '__isLoaded') return true; // Custom property to check if loaded
                if (!target.__isLoaded) {
                    const persisted = Persisted.Get(key);
                    if (persisted) {
                        Object.assign(target, persisted, { __isLoaded: true });
                    }
                }
                return target[prop];
            }
        };
        return new Proxy({ __isLoaded: false }, handler);
    }

    private loadCollectionFromStorage() {

        const constructor = this.constructor as any;
        const list: PersistMap = {};
        constructor.List = list;

        const keys = readJson<string[]>(constructor.name);
        if(Array.isArray(keys)) {
            keys.forEach((key: string) => {
                list[key] = this.lazyLoadPersistedObject(key);
            });
        }

        return list;
    }
}
