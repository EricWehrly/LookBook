import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PhotoPicker from '../../../components/photos/photopicker';
import { MemoryPhotoStore, setPhotoStore } from '../../../components/photos/photoStore';
import { LookOccurrence } from '../../../components/looks/lookOccurrence';
import * as auth from '../../../components/photos/pickerAuth';
import * as api from '../../../components/photos/pickerApi';

jest.mock('../../../components/photos/pickerAuth');
jest.mock('../../../components/photos/pickerApi', () => ({
    ...jest.requireActual('../../../components/photos/pickerApi'),
    createSession: jest.fn(),
    waitForSelection: jest.fn(),
    listPickedItems: jest.fn(),
    fetchPhotoBlob: jest.fn(),
    deleteSession: jest.fn()
}));

const photoItem = (id: string) => ({
    id, type: 'PHOTO',
    mediaFile: { baseUrl: `https://lh3/${id}`, mimeType: 'image/jpeg', filename: `${id}.jpg` }
});

describe('PhotoPicker', () => {
    const addPhoto = jest.fn();
    let store: MemoryPhotoStore;

    beforeEach(() => {
        jest.resetAllMocks();
        store = new MemoryPhotoStore();
        setPhotoStore(store);
        jest.spyOn(LookOccurrence, 'Current', 'get').mockReturnValue({ addPhoto } as unknown as LookOccurrence);

        (auth.requestAccessToken as jest.Mock).mockResolvedValue('tok');
        (api.createSession as jest.Mock).mockResolvedValue({ id: 's1', pickerUri: 'https://picker/x' });
        (api.waitForSelection as jest.Mock).mockResolvedValue(true);
        (api.fetchPhotoBlob as jest.Mock).mockResolvedValue(new Blob(['img']));
    });

    afterEach(() => {
        setPhotoStore(null);
        jest.restoreAllMocks();
    });

    test('imports picked photos into the store and the current look, skipping videos', async () => {
        (api.listPickedItems as jest.Mock).mockResolvedValue([
            photoItem('a'), { ...photoItem('v'), type: 'VIDEO' }, photoItem('b')
        ]);

        render(<PhotoPicker />);
        fireEvent.click(screen.getByRole('button', { name: /Add photos from Google Photos/i }));

        await waitFor(() => expect(addPhoto).toHaveBeenCalledTimes(2));
        expect(api.fetchPhotoBlob).toHaveBeenCalledTimes(2);

        const added = addPhoto.mock.calls.map(([p]) => p);
        for (const photo of added) {
            expect(photo.src).toBe(`stored:${photo.id}`);
            expect(await store.get(photo.id)).toBeDefined();
        }
        expect(api.deleteSession).toHaveBeenCalledWith('tok', 's1');
        expect(await screen.findByRole('button', { name: /Add photos/i })).toBeInTheDocument();
    });

    test('shows the picker link while waiting for the user', async () => {
        (api.waitForSelection as jest.Mock).mockReturnValue(new Promise(() => undefined));

        render(<PhotoPicker />);
        fireEvent.click(screen.getByRole('button'));

        const link = await screen.findByRole('link', { name: /Choose photos/i });
        expect(link).toHaveAttribute('href', 'https://picker/x/autoclose');
    });

    test('shows an error and allows retry when authorization fails', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        (auth.requestAccessToken as jest.Mock).mockRejectedValue(new Error('popup_closed'));

        render(<PhotoPicker />);
        fireEvent.click(screen.getByRole('button'));

        expect(await screen.findByRole('alert')).toHaveTextContent('popup_closed');
        expect(screen.getByRole('button', { name: /Add photos/i })).toBeInTheDocument();
        expect(addPhoto).not.toHaveBeenCalled();
    });
});
