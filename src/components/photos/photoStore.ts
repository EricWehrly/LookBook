// Picker baseUrls expire after 60 minutes, so picked photos are copied into IndexedDB
// (localStorage's ~5MB quota fits only a few photos). Looks keep just the photo id.

export interface PhotoBlobStore {
    put(id: string, blob: Blob): Promise<void>;
    get(id: string): Promise<Blob | undefined>;
    delete(id: string): Promise<void>;
}

const DB_NAME = 'lookbook-photos';
const STORE_NAME = 'blobs';

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await openDb();
    try {
        return await new Promise<T>((resolve, reject) => {
            const request = op(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } finally {
        db.close();
    }
}

export class IndexedDbPhotoStore implements PhotoBlobStore {
    async put(id: string, blob: Blob) { await run('readwrite', (s) => s.put(blob, id)); }
    async get(id: string) { return run<Blob | undefined>('readonly', (s) => s.get(id)); }
    async delete(id: string) { await run('readwrite', (s) => s.delete(id)); }
}

export class MemoryPhotoStore implements PhotoBlobStore {
    private blobs = new Map<string, Blob>();
    async put(id: string, blob: Blob) { this.blobs.set(id, blob); }
    async get(id: string) { return this.blobs.get(id); }
    async delete(id: string) { this.blobs.delete(id); }
}

let current: PhotoBlobStore | null = null;

export function getPhotoStore(): PhotoBlobStore {
    if (!current) {
        current = typeof indexedDB !== 'undefined' ? new IndexedDbPhotoStore() : new MemoryPhotoStore();
    }
    return current;
}

export function setPhotoStore(store: PhotoBlobStore | null) {
    current = store;
}
