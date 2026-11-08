import { render, waitFor } from '@testing-library/react';
import { MemoryPhotoStore, getPhotoStore, setPhotoStore } from '../../../components/photos/photoStore';
import StoredPhoto from '../../../components/photos/storedPhoto';

describe('MemoryPhotoStore', () => {
    test('stores, returns and deletes blobs', async () => {
        const store = new MemoryPhotoStore();
        const blob = new Blob(['x']);

        await store.put('a', blob);
        expect(await store.get('a')).toBe(blob);

        await store.delete('a');
        expect(await store.get('a')).toBeUndefined();
    });
});

describe('getPhotoStore', () => {
    afterEach(() => setPhotoStore(null));

    test('returns the injected store', () => {
        const store = new MemoryPhotoStore();
        setPhotoStore(store);
        expect(getPhotoStore()).toBe(store);
    });
});

describe('StoredPhoto', () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;

    beforeEach(() => {
        URL.createObjectURL = jest.fn(() => 'blob:photo-url');
        URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
        URL.createObjectURL = originalCreate;
        URL.revokeObjectURL = originalRevoke;
        setPhotoStore(null);
    });

    test('shows the stored blob as a background image and revokes the URL on unmount', async () => {
        const store = new MemoryPhotoStore();
        await store.put('p1', new Blob(['x']));
        setPhotoStore(store);

        const { container, unmount } = render(<StoredPhoto id="p1" width={240} height={240} />);

        await waitFor(() =>
            expect((container.firstChild as HTMLElement).style.backgroundImage).toContain('blob:photo-url'));

        unmount();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo-url');
    });

    test('renders an empty placeholder when the blob is missing', async () => {
        setPhotoStore(new MemoryPhotoStore());

        const { container } = render(<StoredPhoto id="missing" width={10} height={10} />);

        await Promise.resolve();
        expect((container.firstChild as HTMLElement).style.backgroundImage).toBe('');
    });
});
