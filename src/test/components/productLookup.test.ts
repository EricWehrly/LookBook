import { productLookup, UNRECOGNIZED_NAME } from '../../components/products/productLookup';

const mockFetch = (impl: () => Promise<unknown>) => {
    (global as any).fetch = jest.fn(impl);
};

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe('productLookup', () => {
    const originalFetch = (global as any).fetch;

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        jest.restoreAllMocks();
    });

    test('calls the /upc endpoint on the local dev server under jsdom (localhost)', async () => {
        mockFetch(async () => okResponse({ name: 'Cream', barcode: '123' }));

        await productLookup('123', 'ean_13');

        expect((global as any).fetch).toHaveBeenCalledWith('http://localhost:5000/upc?upc=123');
    });

    test('returns the resolved product', async () => {
        mockFetch(async () => okResponse({
            name: 'Cream',
            barcode: '123',
            src: 'https://shop.example/cream',
            previewImageUrl: 'https://img.example/cream.png',
        }));

        await expect(productLookup('123', 'ean_13')).resolves.toEqual({
            name: 'Cream',
            barcode: '123',
            src: 'https://shop.example/cream',
            previewImageUrl: 'https://img.example/cream.png',
        });
    });

    test('keeps a partial result and fills in the scanned barcode', async () => {
        mockFetch(async () => okResponse({ previewImageUrl: 'https://img.example/x.png' }));

        await expect(productLookup('555', 'ean_13')).resolves.toEqual({
            name: '',
            barcode: '555',
            src: undefined,
            previewImageUrl: 'https://img.example/x.png',
        });
    });

    test('empty code is unrecognized without hitting the network', async () => {
        mockFetch(async () => okResponse({}));

        await expect(productLookup('', 'manual')).resolves.toEqual({ name: UNRECOGNIZED_NAME, barcode: '' });
        expect((global as any).fetch).not.toHaveBeenCalled();
    });

    test.each([
        ['404', { ok: false, status: 404, json: async () => ({ message: 'UPC lookup returned no items.' }) }],
        ['429', { ok: false, status: 429, json: async () => ({ message: 'slow down' }) }],
        ['500', { ok: false, status: 500, json: async () => ({}) }],
        ['empty object body', okResponse({})],
        ['null body', okResponse(null)],
        ['non-object body', okResponse('oops')],
    ])('%s is unrecognized', async (_label, response) => {
        mockFetch(async () => response);

        await expect(productLookup('999', 'ean_13')).resolves.toEqual({
            name: UNRECOGNIZED_NAME,
            barcode: '999',
        });
    });

    test('network failure is unrecognized rather than a rejection', async () => {
        mockFetch(async () => { throw new TypeError('Failed to fetch'); });

        await expect(productLookup('999', 'ean_13')).resolves.toEqual({
            name: UNRECOGNIZED_NAME,
            barcode: '999',
        });
    });

    test('invalid json is unrecognized', async () => {
        mockFetch(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad json'); } }));

        await expect(productLookup('999', 'ean_13')).resolves.toMatchObject({ name: UNRECOGNIZED_NAME });
    });
});
