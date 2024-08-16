import { Component } from "react";

export interface PersistedModel {
    id? : string;
}

type PersistMap = { [id: string] : Persisted };

// export default class Look extends Component<LookModel> implements LookModel {
export default abstract class Persisted extends Component<PersistedModel> implements PersistedModel {
    private _id : string;

    get id() { return this._id; }

    constructor(options: PersistedModel) {
        super(options);

        if(options.id && options.id.length > 0) {
            console.log(`Using provided id ${options.id}`);
            this._id = options.id;

            this.buildFromStorage(this._id);
        } else {
            console.log('Trying to generate new obj...');
            this._id = crypto.randomUUID();
            this.create(options);
        }

        // TODO: see if we can separate method
        // add to collection of persisted objects
        // const list = (this.constructor as any).List = (this.constructor as any).List || {};
        // list[this._id] = this;
        localStorage.setItem(this.id, this.serialize());
        this.updateteCollection(this.constructor, this);
    }

    // TODO: return type <T extends Persisted>
    abstract buildFromStorage(id: string): void;
    abstract create(options: PersistedModel): void;
    abstract serialize(): string;

    static Get(id: string) {

        const serialized = localStorage.getItem(id);
        if(!serialized) return null;
        const unserialized = JSON.parse(serialized);
        return unserialized;
    }

    private updateteCollection(constructor: Function, persisted: Persisted) {

        const list = this.GetCollection();

        list[persisted.id] = persisted;
        const keys = Object.keys(list);
        localStorage.setItem(constructor.name, JSON.stringify(keys));
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
                    // Assuming Persisted.Get(key) is synchronous for simplicity
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

        const storageSerialized = localStorage.getItem(constructor.name);
        if(storageSerialized) {
            const keys = JSON.parse(storageSerialized);
            keys.forEach((key: string) => {
                list[key] = this.lazyLoadPersistedObject(key);
            });
        }

        return list;
    }
}
