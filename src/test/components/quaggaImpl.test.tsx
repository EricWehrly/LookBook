import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Quagga from '@ericblade/quagga2';
import QuaggaImpl from '../../components/barcode/QuaggaImpl';
import { productLookup } from '../../components/products/productLookup';

// Quagga2 needs a real camera and canvas; QuaggaImpl and scanner.js are the only importers.
jest.mock('@ericblade/quagga2', () => ({
    __esModule: true,
    default: {
        CameraAccess: {
            request: jest.fn(),
            release: jest.fn(),
            enumerateVideoDevices: jest.fn(),
            enableTorch: jest.fn(),
            disableTorch: jest.fn(),
        },
        init: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onDetected: jest.fn(),
        offDetected: jest.fn(),
        onProcessed: jest.fn(),
        offProcessed: jest.fn(),
    },
}));

// Stand-in for the live camera component: a button simulates Quagga detecting a code.
jest.mock('../../components/barcode/scanner', () => ({
    __esModule: true,
    default: ({ onDetected }: { onDetected: (result: { code: string; format: string }) => void }) => (
        <div>
            <button onClick={() => onDetected({ code: '4006381333931', format: 'ean_13' })}>detect-4006381333931</button>
            <button onClick={() => onDetected({ code: '4006381333931', format: 'ean_13' })}>detect-again</button>
        </div>
    ),
}));

jest.mock('../../components/products/productLookup', () => ({
    ...jest.requireActual('../../components/products/productLookup'),
    productLookup: jest.fn(),
}));

const camera = Quagga.CameraAccess as jest.Mocked<typeof Quagga.CameraAccess>;
const mockLookup = productLookup as jest.MockedFunction<typeof productLookup>;

const renderImpl = () => render(<MemoryRouter><QuaggaImpl /></MemoryRouter>);

describe('QuaggaImpl (barcode scanner page)', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        camera.request.mockResolvedValue(undefined as any);
        camera.release.mockResolvedValue(undefined as any);
        camera.disableTorch.mockResolvedValue(undefined as any);
        camera.enumerateVideoDevices.mockResolvedValue([{ deviceId: 'cam-1', label: 'Front camera' }] as any);
        mockLookup.mockResolvedValue({ name: 'Eyeliner', barcode: '4006381333931' });
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    test('requests camera access, releases it and lists the cameras', async () => {
        renderImpl();

        expect(await screen.findByRole('option', { name: 'Front camera' })).toBeInTheDocument();
        expect(camera.request).toHaveBeenCalled();
        expect(camera.release).toHaveBeenCalled();
        expect(screen.getByText(/none so far/i)).toBeInTheDocument();
    });

    test('does not start with a fake pre-scanned result outside development', async () => {
        renderImpl();
        await screen.findByRole('option', { name: 'Front camera' });

        expect(screen.queryByRole('button', { name: /save product/i })).not.toBeInTheDocument();
    });

    test('start toggles the scanner and a detected code shows a product form once', async () => {
        renderImpl();
        await screen.findByRole('option', { name: 'Front camera' });

        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        fireEvent.click(await screen.findByText('detect-4006381333931'));
        fireEvent.click(screen.getByText('detect-again'));

        await waitFor(() => expect(screen.getByLabelText('Name:')).toHaveValue('Eyeliner'));
        expect(screen.getAllByRole('button', { name: /save product/i })).toHaveLength(1);
        expect(mockLookup).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    });

    test('shows the camera error and still allows manual entry', async () => {
        camera.request.mockRejectedValue(new Error('Permission denied'));
        renderImpl();

        expect(await screen.findByRole('alert')).toHaveTextContent(/permission denied/i);
        expect(screen.queryByText(/enumerating cameras/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /enter product manually/i }));

        expect(screen.getByLabelText('Name:')).toHaveValue('');
        expect(screen.getByRole('button', { name: /save product/i })).toBeInTheDocument();
        expect(mockLookup).not.toHaveBeenCalled();
    });

    test('manual entry can be toggled off again', async () => {
        renderImpl();
        await screen.findByRole('option', { name: 'Front camera' });

        fireEvent.click(screen.getByRole('button', { name: /enter product manually/i }));
        expect(screen.getByLabelText('Name:')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /cancel manual entry/i }));
        expect(screen.queryByLabelText('Name:')).not.toBeInTheDocument();
    });

    test('torch button toggles the torch and survives a torch failure', async () => {
        renderImpl();
        await screen.findByRole('option', { name: 'Front camera' });

        fireEvent.click(screen.getByRole('button', { name: 'Enable Torch' }));
        expect(camera.enableTorch).toHaveBeenCalled();

        camera.disableTorch.mockImplementation(() => { throw new Error('no torch'); });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Disable Torch' }));
        });
        expect(errorSpy).toHaveBeenCalled();
    });
});
