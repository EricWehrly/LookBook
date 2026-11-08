// Product catalog (reusable across looks) plus the per-look list of product ids.
//
// Storage keys are namespaced and deliberately NOT the bare look id: Look
// stores its own record under `look.storageKey` (the bare id) and rewrites it
// on every save, so anything nested there would be lost.
import { readJson, writeJson } from '../util/keyValueStore';
import ProductModel, { isHttpUrl } from './productModel';

export const CATALOG_KEY = 'lookbook.products';
export const lookProductsKey = (lookId: string) => `lookbook.lookProducts.${lookId}`;

export function getCatalog(): ProductModel[] {
    const catalog = readJson<unknown>(CATALOG_KEY, []);
    return Array.isArray(catalog) ? catalog : [];
}

export function getProduct(id: string): ProductModel | undefined {
    return getCatalog().find(product => product.id === id);
}

export function findByBarcode(barcode: string | undefined): ProductModel | undefined {
    if (!barcode) return undefined;
    return getCatalog().find(product => product.barcode === barcode);
}

// Catalog entries are keyed by barcode: saving a barcode that is already
// cataloged updates that entry (same id) instead of adding a duplicate.
// Products without a barcode (manual entry) are always new entries.
export function saveProduct(input: ProductModel): ProductModel {
    const name = input.name?.trim();
    if (!name) {
        throw new Error('A product needs a name');
    }

    const barcode = input.barcode?.trim() || undefined;
    const catalog = getCatalog();
    const existing = barcode ? catalog.find(product => product.barcode === barcode) : undefined;

    const product: ProductModel = {
        ...existing,
        id: existing?.id ?? input.id ?? crypto.randomUUID(),
        name,
        barcode,
        type: input.type ?? existing?.type,
        src: isHttpUrl(input.src) ? input.src : undefined,
        previewImageUrl: isHttpUrl(input.previewImageUrl) ? input.previewImageUrl : undefined,
    };

    const index = catalog.findIndex(candidate => candidate.id === product.id);
    if (index >= 0) {
        catalog[index] = product;
    } else {
        catalog.push(product);
    }
    writeJson(CATALOG_KEY, catalog);
    return product;
}

export function getLookProductIds(lookId: string): string[] {
    const ids = readJson<unknown>(lookProductsKey(lookId), []);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

// Ids whose catalog entry has disappeared are skipped.
export function getLookProducts(lookId: string): ProductModel[] {
    const catalog = getCatalog();
    return getLookProductIds(lookId)
        .map(id => catalog.find(product => product.id === id))
        .filter((product): product is ProductModel => product !== undefined);
}

export function addProductToLook(lookId: string, productId: string): void {
    const ids = getLookProductIds(lookId);
    if (ids.includes(productId)) return;
    writeJson(lookProductsKey(lookId), [...ids, productId]);
}

// Only unlinks from the look; the product stays in the catalog for reuse.
export function removeProductFromLook(lookId: string, productId: string): void {
    const ids = getLookProductIds(lookId);
    writeJson(lookProductsKey(lookId), ids.filter(id => id !== productId));
}
