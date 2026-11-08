/* eslint-disable no-script-url -- javascript: URLs are the attack input under test */
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Result from '../../components/barcode/product';
import { productLookup, UNRECOGNIZED_NAME } from '../../components/products/productLookup';
import { ProductType } from '../../components/products/productModel';
import { getCatalog, getLookProductIds, saveProduct } from '../../components/products/productStore';

jest.mock('../../components/products/productLookup', () => ({
    ...jest.requireActual('../../components/products/productLookup'),
    productLookup: jest.fn(),
}));
const mockLookup = productLookup as jest.MockedFunction<typeof productLookup>;

const Where = () => {
    const location = useLocation();
    return <div data-testid="where">{location.pathname}</div>;
};

const renderResult = (code: string, entry = '/product?look=look-1') => render(
    <MemoryRouter initialEntries={[entry]}>
        <Routes>
            <Route path="/product" element={<Result result={{ code, format: code ? 'ean_13' : 'manual' }} />} />
            <Route path="*" element={<Where />} />
        </Routes>
    </MemoryRouter>
);

const nameInput = () => screen.getByLabelText('Name:') as HTMLInputElement;
const save = () => fireEvent.click(screen.getByRole('button', { name: /save product/i }));

describe('barcode Result form', () => {
    beforeEach(() => {
        localStorage.clear();
        mockLookup.mockReset();
    });

    test('prefills the form from the product lookup', async () => {
        mockLookup.mockResolvedValue({
            name: 'Face Cream',
            barcode: '0030878461993',
            src: 'https://shop.example/cream',
            previewImageUrl: 'https://img.example/cream.png',
        });

        renderResult('0030878461993');

        await waitFor(() => expect(nameInput().value).toBe('Face Cream'));
        expect(screen.getByLabelText('Barcode:')).toHaveValue('0030878461993');
        expect(screen.getByLabelText('Source URL:')).toHaveValue('https://shop.example/cream');
        expect(screen.getByLabelText('Preview Image URL:')).toHaveValue('https://img.example/cream.png');
        expect(screen.getByLabelText('Type:')).toHaveValue(ProductType.Other);
        expect(mockLookup).toHaveBeenCalledWith('0030878461993', 'ean_13');
    });

    test('offers every ProductType in the select', () => {
        renderResult('');

        const options = screen.getAllByRole('option').map(option => option.textContent);
        expect(options).toEqual(Object.values(ProductType));
    });

    test('an unrecognized lookup leaves the name blank and says so', async () => {
        mockLookup.mockResolvedValue({ name: UNRECOGNIZED_NAME, barcode: '999' });

        renderResult('999');

        expect(await screen.findByText(/could not find this product/i)).toBeInTheDocument();
        expect(nameInput().value).toBe('');
        expect(screen.getByLabelText('Barcode:')).toHaveValue('999');
    });

    test('does not overwrite a name the user typed while the lookup was in flight', async () => {
        let resolveLookup!: (value: any) => void;
        mockLookup.mockReturnValue(new Promise(resolve => { resolveLookup = resolve; }));

        renderResult('123');
        fireEvent.change(nameInput(), { target: { value: 'My own name' } });
        resolveLookup({ name: 'From upcitemdb', barcode: '123', src: 'https://shop.example/x' });

        await waitFor(() => expect(screen.getByLabelText('Source URL:')).toHaveValue('https://shop.example/x'));
        expect(nameInput().value).toBe('My own name');
    });

    test('reuses a cataloged product for a rescanned barcode without calling the lookup', async () => {
        saveProduct({
            name: 'Cataloged Serum',
            barcode: '123',
            type: ProductType.Skincare,
            src: 'https://shop.example/serum',
        });

        renderResult('123');

        await waitFor(() => expect(nameInput().value).toBe('Cataloged Serum'));
        expect(screen.getByLabelText('Type:')).toHaveValue(ProductType.Skincare);
        expect(screen.getByText(/already in your catalog/i)).toBeInTheDocument();
        expect(mockLookup).not.toHaveBeenCalled();
    });

    test('saving adds the product to the catalog and the look, then navigates back to the look', async () => {
        mockLookup.mockResolvedValue({ name: 'Face Cream', barcode: '123', src: 'https://shop.example/c' });

        renderResult('123');
        await waitFor(() => expect(nameInput().value).toBe('Face Cream'));
        fireEvent.change(screen.getByLabelText('Type:'), { target: { value: ProductType.Skincare } });
        save();

        const [saved] = getCatalog();
        expect(saved).toMatchObject({
            name: 'Face Cream',
            barcode: '123',
            type: ProductType.Skincare,
            src: 'https://shop.example/c',
        });
        expect(getLookProductIds('look-1')).toEqual([saved.id]);
        expect(await screen.findByTestId('where')).toHaveTextContent('/looks/look-1');
    });

    test('saving a rescanned barcode updates the same catalog entry instead of duplicating', async () => {
        const existing = saveProduct({ name: 'Old name', barcode: '123' });

        renderResult('123');
        await waitFor(() => expect(nameInput().value).toBe('Old name'));
        fireEvent.change(nameInput(), { target: { value: 'New name' } });
        save();

        expect(getCatalog()).toHaveLength(1);
        expect(getCatalog()[0]).toMatchObject({ id: existing.id, name: 'New name' });
        expect(getLookProductIds('look-1')).toEqual([existing.id]);
    });

    test('blocks saving without a name and shows a validation message', async () => {
        mockLookup.mockResolvedValue({ name: UNRECOGNIZED_NAME, barcode: '999' });

        renderResult('999');
        await screen.findByText(/could not find this product/i);
        fireEvent.change(nameInput(), { target: { value: '   ' } });
        save();

        expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');
        expect(getCatalog()).toEqual([]);
        expect(getLookProductIds('look-1')).toEqual([]);
        expect(screen.queryByTestId('where')).not.toBeInTheDocument();
    });

    test.each([
        ['Source URL:', /source url must start with http/i],
        ['Preview Image URL:', /preview image url must start with http/i],
    ])('rejects a non-http value in %s', (label, message) => {
        renderResult('');

        fireEvent.change(nameInput(), { target: { value: 'Thing' } });
        fireEvent.change(screen.getByLabelText(label), { target: { value: 'javascript:alert(1)' } });
        save();

        expect(screen.getByRole('alert')).toHaveTextContent(message);
        expect(getCatalog()).toEqual([]);
    });

    test('manual entry (no scan) saves a product without a barcode', () => {
        renderResult('');

        expect(mockLookup).not.toHaveBeenCalled();
        fireEvent.change(nameInput(), { target: { value: 'Homemade balm' } });
        fireEvent.change(screen.getByLabelText('Type:'), { target: { value: ProductType.Body } });
        save();

        const [saved] = getCatalog();
        expect(saved).toMatchObject({ name: 'Homemade balm', type: ProductType.Body });
        expect(saved.barcode).toBeUndefined();
        expect(getLookProductIds('look-1')).toEqual([saved.id]);
    });

    test('a manually typed barcode is saved with the product', () => {
        renderResult('');

        fireEvent.change(screen.getByLabelText('Barcode:'), { target: { value: '4006381333931' } });
        fireEvent.change(nameInput(), { target: { value: 'Highlighter' } });
        save();

        expect(getCatalog()[0]).toMatchObject({ name: 'Highlighter', barcode: '4006381333931' });
    });

    test('without a look in the url the product is cataloged only and the user goes home', async () => {
        renderResult('', '/product');

        fireEvent.change(nameInput(), { target: { value: 'Orphan' } });
        save();

        expect(getCatalog()).toHaveLength(1);
        expect(await screen.findByTestId('where')).toHaveTextContent('/');
        expect(Object.keys(localStorage).filter(key => key.startsWith('lookbook.lookProducts'))).toEqual([]);
    });
});
