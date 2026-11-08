import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { addProductToLook, saveProduct } from '../../components/products/productStore';

// The scanner page needs a camera; routing to it is what is under test here.
jest.mock('../../components/products/productScanner', () => ({
    ProductScanner: () => <div>scanner page</div>,
}));

describe('product routes in App', () => {
    const lookId = 'look-from-url';

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem(lookId, JSON.stringify({ id: lookId, name: 'Evening look', created: new Date() }));
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.history.pushState({}, '', '/');
    });

    test('/looks/:id renders that look with its saved products', () => {
        const product = saveProduct({ name: 'Setting spray', barcode: '777' });
        addProductToLook(lookId, product.id!);
        window.history.pushState({}, '', `/looks/${lookId}`);

        render(<App />);

        expect(screen.getByText('Evening look')).toBeInTheDocument();
        expect(screen.getByText('Setting spray')).toBeInTheDocument();
    });

    test('Add new product opens the scanner route with the look id', async () => {
        window.history.pushState({}, '', `/looks/${lookId}`);

        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: /add new product/i }));

        await waitFor(() => expect(screen.getByText('scanner page')).toBeInTheDocument());
        expect(window.location.pathname + window.location.search).toBe(`/product?look=${lookId}`);
    });
});
