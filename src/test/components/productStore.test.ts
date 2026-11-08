import { ProductType, isHttpUrl } from '../../components/products/productModel';
import {
    CATALOG_KEY,
    addProductToLook,
    findByBarcode,
    getCatalog,
    getLookProductIds,
    getLookProducts,
    getProduct,
    lookProductsKey,
    removeProductFromLook,
    saveProduct,
} from '../../components/products/productStore';
import { readJson, removeKey, writeJson } from '../../components/util/keyValueStore';

describe('ProductModel helpers', () => {
    test('ProductType enum exposes the expected categories', () => {
        expect(Object.values(ProductType)).toEqual([
            'Skincare', 'Makeup', 'Hair', 'Body', 'Fragrance', 'Tool', 'Other',
        ]);
    });

    test('isHttpUrl accepts only http(s) urls', () => {
        expect(isHttpUrl('https://example.com/a.png')).toBe(true);
        expect(isHttpUrl('http://example.com')).toBe(true);
        expect(isHttpUrl('javascript:alert(1)')).toBe(false);
        expect(isHttpUrl('data:text/html,hi')).toBe(false);
        expect(isHttpUrl('not a url')).toBe(false);
        expect(isHttpUrl('')).toBe(false);
        expect(isHttpUrl(undefined)).toBe(false);
    });
});

describe('keyValueStore', () => {
    beforeEach(() => localStorage.clear());

    test('round-trips json and falls back when missing', () => {
        expect(readJson('missing', ['x'])).toEqual(['x']);
        expect(writeJson('k', { a: 1 })).toBe(true);
        expect(readJson('k', null)).toEqual({ a: 1 });
        removeKey('k');
        expect(readJson('k', 'gone')).toBe('gone');
    });

    test('corrupt json yields the fallback instead of throwing', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('bad', '{not json');
        expect(readJson('bad', 'fallback')).toBe('fallback');
        spy.mockRestore();
    });

    test('write failures (quota) return false instead of throwing', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        expect(writeJson('k', 1)).toBe(false);
        setItem.mockRestore();
        spy.mockRestore();
    });
});

describe('productStore', () => {
    beforeEach(() => localStorage.clear());

    describe('catalog', () => {
        test('starts empty', () => {
            expect(getCatalog()).toEqual([]);
        });

        test('saves a product with a generated id and persists it', () => {
            const saved = saveProduct({
                name: '  Moisturizer ',
                barcode: '0030878461993',
                type: ProductType.Skincare,
                src: 'https://example.com/p',
                previewImageUrl: 'https://example.com/p.png',
            });

            expect(saved.id).toBeTruthy();
            expect(saved.name).toBe('Moisturizer');
            expect(getCatalog()).toEqual([saved]);
            expect(getProduct(saved.id!)).toEqual(saved);
            expect(JSON.parse(localStorage.getItem(CATALOG_KEY)!)).toEqual([saved]);
        });

        test('rejects a missing or blank name', () => {
            expect(() => saveProduct({ name: '   ', barcode: '1' })).toThrow();
            expect(() => saveProduct({ barcode: '1' })).toThrow();
            expect(getCatalog()).toEqual([]);
        });

        test('rescanning a barcode reuses the catalog entry and updates it', () => {
            const first = saveProduct({ name: 'Serum', barcode: '123', type: ProductType.Skincare });
            const second = saveProduct({ name: 'Serum v2', barcode: '123', src: 'https://example.com/s' });

            expect(second.id).toBe(first.id);
            expect(getCatalog()).toHaveLength(1);
            expect(second.name).toBe('Serum v2');
            expect(second.type).toBe(ProductType.Skincare);
            expect(findByBarcode('123')).toEqual(second);
        });

        test('products without a barcode are always separate entries', () => {
            const a = saveProduct({ name: 'Homemade balm' });
            const b = saveProduct({ name: 'Homemade balm' });

            expect(a.id).not.toBe(b.id);
            expect(getCatalog()).toHaveLength(2);
            expect(findByBarcode(undefined)).toBeUndefined();
            expect(findByBarcode('')).toBeUndefined();
        });

        test('drops non-http urls', () => {
            const saved = saveProduct({
                name: 'Sneaky',
                src: 'javascript:alert(1)',
                previewImageUrl: 'data:image/png;base64,AAAA',
            });
            expect(saved.src).toBeUndefined();
            expect(saved.previewImageUrl).toBeUndefined();
        });

        test('tolerates a corrupt catalog value', () => {
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
            localStorage.setItem(CATALOG_KEY, '{"not":"an array"}');
            expect(getCatalog()).toEqual([]);
            localStorage.setItem(CATALOG_KEY, 'garbage');
            expect(getCatalog()).toEqual([]);
            spy.mockRestore();
        });
    });

    describe('per-look product lists', () => {
        test('adds products to a look once, in order, without touching other looks', () => {
            const a = saveProduct({ name: 'A', barcode: '1' });
            const b = saveProduct({ name: 'B', barcode: '2' });

            addProductToLook('look-1', a.id!);
            addProductToLook('look-1', b.id!);
            addProductToLook('look-1', a.id!);
            addProductToLook('look-2', b.id!);

            expect(getLookProductIds('look-1')).toEqual([a.id, b.id]);
            expect(getLookProducts('look-1')).toEqual([a, b]);
            expect(getLookProductIds('look-2')).toEqual([b.id]);
            expect(getLookProductIds('look-3')).toEqual([]);
        });

        test('does not use the bare look id key that Look owns', () => {
            const a = saveProduct({ name: 'A' });
            addProductToLook('look-1', a.id!);
            expect(localStorage.getItem('look-1')).toBeNull();
            expect(localStorage.getItem(lookProductsKey('look-1'))).not.toBeNull();
        });

        test('removing unlinks from the look but keeps the catalog entry', () => {
            const a = saveProduct({ name: 'A', barcode: '1' });
            const b = saveProduct({ name: 'B', barcode: '2' });
            addProductToLook('look-1', a.id!);
            addProductToLook('look-1', b.id!);

            removeProductFromLook('look-1', a.id!);

            expect(getLookProductIds('look-1')).toEqual([b.id]);
            expect(getProduct(a.id!)).toBeDefined();
        });

        test('skips ids that are no longer in the catalog', () => {
            const a = saveProduct({ name: 'A' });
            addProductToLook('look-1', a.id!);
            addProductToLook('look-1', 'ghost-id');

            expect(getLookProducts('look-1')).toEqual([a]);
        });

        test('ignores a corrupt id list', () => {
            localStorage.setItem(lookProductsKey('look-1'), '{"x":1}');
            expect(getLookProductIds('look-1')).toEqual([]);
            localStorage.setItem(lookProductsKey('look-1'), '[1,"ok",null]');
            expect(getLookProductIds('look-1')).toEqual(['ok']);
        });
    });
});
