import {
    createSession, deleteSession, fetchPhotoBlob, getSession, listPickedItems,
    parseDurationMs, pickerUriFor, waitForSelection
} from '../../../components/photos/pickerApi';

const ok = (body: unknown) => ({ ok: true, status: 200, statusText: 'OK', json: async () => body }) as Response;
const fail = (status: number, statusText: string) => ({ ok: false, status, statusText }) as Response;

describe('pickerApi', () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    test('parseDurationMs reads protobuf seconds and falls back otherwise', () => {
        expect(parseDurationMs('5s', 1)).toBe(5000);
        expect(parseDurationMs('0.5s', 1)).toBe(500);
        expect(parseDurationMs(undefined, 1234)).toBe(1234);
        expect(parseDurationMs('soon', 1234)).toBe(1234);
    });

    test('pickerUriFor appends /autoclose once', () => {
        expect(pickerUriFor({ id: 'a', pickerUri: 'https://photos.google.com/picker/abc' }))
            .toBe('https://photos.google.com/picker/abc/autoclose');
        expect(pickerUriFor({ id: 'a', pickerUri: 'https://photos.google.com/picker/abc/' }))
            .toBe('https://photos.google.com/picker/abc/autoclose');
    });

    test('createSession posts with bearer token and maxItemCount', async () => {
        fetchMock.mockResolvedValue(ok({ id: 's1', pickerUri: 'u' }));

        const session = await createSession('tok', 5);

        expect(session.id).toBe('s1');
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://photospicker.googleapis.com/v1/sessions');
        expect(init.method).toBe('POST');
        expect(init.headers.Authorization).toBe('Bearer tok');
        expect(JSON.parse(init.body)).toEqual({ pickingConfig: { maxItemCount: '5' } });
    });

    test('API errors include the status', async () => {
        fetchMock.mockResolvedValue(fail(403, 'Forbidden'));
        await expect(createSession('tok')).rejects.toThrow('403 Forbidden');
        await expect(getSession('tok', 's1')).rejects.toThrow('403 Forbidden');
    });

    test('listPickedItems follows nextPageToken', async () => {
        fetchMock
            .mockResolvedValueOnce(ok({ mediaItems: [{ id: '1' }], nextPageToken: 'p2' }))
            .mockResolvedValueOnce(ok({ mediaItems: [{ id: '2' }] }));

        const items = await listPickedItems('tok', 's1');

        expect(items.map((i) => i.id)).toEqual(['1', '2']);
        expect(fetchMock.mock.calls[0][0]).toContain('sessionId=s1');
        expect(fetchMock.mock.calls[1][0]).toContain('pageToken=p2');
    });

    test('listPickedItems tolerates an empty selection', async () => {
        fetchMock.mockResolvedValue(ok({}));
        expect(await listPickedItems('tok', 's1')).toEqual([]);
    });

    test('deleteSession swallows network failures', async () => {
        fetchMock.mockRejectedValue(new Error('offline'));
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        await expect(deleteSession('tok', 's1')).resolves.toBeUndefined();
        warn.mockRestore();
    });

    test('fetchPhotoBlob requests a sized image with the token header', async () => {
        const blob = new Blob(['x']);
        fetchMock.mockResolvedValue({ ok: true, blob: async () => blob } as unknown as Response);

        expect(await fetchPhotoBlob('tok', 'https://lh3/abc', 800)).toBe(blob);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://lh3/abc=w800-h800');
        expect(init.headers.Authorization).toBe('Bearer tok');
    });

    describe('waitForSelection', () => {
        const session = { id: 's1', pickerUri: 'u', pollingConfig: { pollInterval: '2s', timeoutIn: '10s' } };

        test('polls at the server interval until items are set', async () => {
            fetchMock
                .mockResolvedValueOnce(ok({ id: 's1', pickerUri: 'u', mediaItemsSet: false }))
                .mockResolvedValueOnce(ok({ id: 's1', pickerUri: 'u', mediaItemsSet: true }));
            const sleep = jest.fn().mockResolvedValue(undefined);

            expect(await waitForSelection('tok', session, { sleep })).toBe(true);
            expect(sleep).toHaveBeenCalledTimes(2);
            expect(sleep).toHaveBeenCalledWith(2000);
        });

        test('throws once the session timeout passes', async () => {
            fetchMock.mockResolvedValue(ok({ id: 's1', pickerUri: 'u', mediaItemsSet: false }));
            let clock = 0;
            const now = () => clock;
            const sleep = async (ms: number) => { clock += ms * 3; };

            await expect(waitForSelection('tok', session, { sleep, now })).rejects.toThrow('Timed out');
        });

        test('returns false without polling when cancelled', async () => {
            const sleep = jest.fn().mockResolvedValue(undefined);
            expect(await waitForSelection('tok', session, { sleep, isCancelled: () => true })).toBe(false);
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });
});
