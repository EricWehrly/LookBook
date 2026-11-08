// The lambda lives outside src/ (CRA only discovers tests under src/) but is a
// plain CommonJS module, so jest can require it by relative path.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handler } = require('../../../server/lambda');

export {}; // module marker: isolatedModules rejects a script file

const mockFetchResponse = (body: unknown, init: { status?: number; ok?: boolean } = {}) => {
    const status = init.status ?? 200;
    (global as any).fetch = jest.fn().mockResolvedValue({
        status,
        ok: init.ok ?? (status >= 200 && status < 300),
        json: async () => body,
    });
};

const parse = (result: { body: string }) => JSON.parse(result.body);

describe('server/lambda handler', () => {
    const originalFetch = (global as any).fetch;

    afterEach(() => {
        (global as any).fetch = originalFetch;
        jest.restoreAllMocks();
    });

    test.each([
        ['no event queryStringParameters', {}],
        ['undefined event', undefined],
        ['empty upc', { queryStringParameters: { upc: '' } }],
    ])('returns 400 for %s without calling upcitemdb', async (_label, event) => {
        (global as any).fetch = jest.fn();

        const result = await handler(event);

        expect(result.statusCode).toBe(400);
        expect(parse(result).message).toBe('Bad Request');
        expect((global as any).fetch).not.toHaveBeenCalled();
    });

    test('maps a full upcitemdb item and sends CORS headers', async () => {
        mockFetchResponse({
            items: [{
                title: 'Face Cream',
                offers: [{ link: 'https://shop.example/cream' }],
                images: ['https://img.example/cream.png'],
            }],
        });

        const result = await handler({ queryStringParameters: { upc: '0030878461993' } });

        expect(result.statusCode).toBe(200);
        expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(parse(result)).toEqual({
            name: 'Face Cream',
            barcode: '0030878461993',
            src: 'https://shop.example/cream',
            previewImageUrl: 'https://img.example/cream.png',
        });
        expect((global as any).fetch).toHaveBeenCalledWith(
            'https://api.upcitemdb.com/prod/trial/lookup?upc=0030878461993'
        );
    });

    test.each([
        ['offers and images missing', { title: 'Plain' }],
        ['offers and images empty', { title: 'Plain', offers: [], images: [] }],
        ['offers entry without link', { title: 'Plain', offers: [{}] }],
        ['offers and images null', { title: 'Plain', offers: null, images: null }],
    ])('does not throw when %s', async (_label, item) => {
        mockFetchResponse({ items: [item] });

        const result = await handler({ queryStringParameters: { upc: '123' } });

        expect(result.statusCode).toBe(200);
        const body = parse(result);
        expect(body.name).toBe('Plain');
        expect(body.barcode).toBe('123');
        expect(body.src).toBeUndefined();
        expect(body.previewImageUrl).toBeUndefined();
    });

    test.each([
        ['items missing', {}],
        ['items empty', { items: [] }],
    ])('returns 404 with a small body when %s', async (_label, data) => {
        mockFetchResponse(data);

        const result = await handler({ queryStringParameters: { upc: '999' } });

        expect(result.statusCode).toBe(404);
        const body = parse(result);
        expect(body).toEqual({
            message: 'UPC lookup returned no items.',
            upc: '999',
            upstreamStatus: 200,
        });
        // The fetch Response object must not leak into the body
        expect(result.body).not.toContain('"response"');
        expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    });

    test('passes rate limiting through as 429', async () => {
        mockFetchResponse({ code: 'EXCEED_LIMIT' }, { status: 429 });

        const result = await handler({ queryStringParameters: { upc: '1' } });

        expect(result.statusCode).toBe(429);
    });

    test('reports a failing provider as 502, not as a missing product', async () => {
        mockFetchResponse({ code: 'SERVER_ERR' }, { status: 500 });

        const result = await handler({ queryStringParameters: { upc: '1' } });

        expect(result.statusCode).toBe(502);
    });

    test('returns 500 with a message when fetch rejects', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        (global as any).fetch = jest.fn().mockRejectedValue(new Error('network down'));

        const result = await handler({ queryStringParameters: { upc: '1' } });

        expect(result.statusCode).toBe(500);
        expect(parse(result)).toEqual({ message: 'network down' });
    });

    test('returns 500 when the provider body is not json', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        (global as any).fetch = jest.fn().mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => { throw new SyntaxError('Unexpected token <'); },
        });

        const result = await handler({ queryStringParameters: { upc: '1' } });

        expect(result.statusCode).toBe(500);
    });

    test('url-encodes the upc sent upstream', async () => {
        mockFetchResponse({ items: [{ title: 'x' }] });

        await handler({ queryStringParameters: { upc: '1&x=2' } });

        expect((global as any).fetch).toHaveBeenCalledWith(
            'https://api.upcitemdb.com/prod/trial/lookup?upc=1%26x%3D2'
        );
    });
});
