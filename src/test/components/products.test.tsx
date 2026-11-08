/* eslint-disable no-script-url -- javascript: URLs are the attack input under test */
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import Products from '../../components/products/products';
import { ProductType } from '../../components/products/productModel';
import { addProductToLook, getLookProductIds, saveProduct } from '../../components/products/productStore';

const LocationProbe = () => {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
};

// Products only reads look.id, so a stand-in avoids pulling the whole Look class (photos, auth) into the test.
const renderProducts = (lookId = 'look-1') => render(
    <MemoryRouter initialEntries={['/']}>
        <Routes>
            <Route path="*" element={<>
                <Products look={{ id: lookId } as any} />
                <LocationProbe />
            </>} />
        </Routes>
    </MemoryRouter>
);

describe('Products', () => {
    beforeEach(() => localStorage.clear());

    test('renders no products but the add button for a fresh look', () => {
        renderProducts();

        expect(screen.getByRole('button', { name: /add new product/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });

    test('renders saved products with name, barcode, type, image and source link', () => {
        const product = saveProduct({
            name: 'Face Cream',
            barcode: '0030878461993',
            type: ProductType.Skincare,
            src: 'https://shop.example/cream',
            previewImageUrl: 'https://img.example/cream.png',
        });
        addProductToLook('look-1', product.id!);

        renderProducts();

        expect(screen.getByText('Face Cream')).toBeInTheDocument();
        expect(screen.getByText('0030878461993')).toBeInTheDocument();
        expect(screen.getByText('Skincare')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Face Cream' })).toHaveAttribute('src', 'https://img.example/cream.png');
        const link = screen.getByRole('link', { name: /view product/i });
        expect(link).toHaveAttribute('href', 'https://shop.example/cream');
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    test('omits image, link, barcode and type when the product has none', () => {
        const product = saveProduct({ name: 'Homemade balm' });
        addProductToLook('look-1', product.id!);

        renderProducts();

        expect(screen.getByText('Homemade balm')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('does not render unsafe urls that were written to storage directly', () => {
        localStorage.setItem('lookbook.products', JSON.stringify([
            { id: 'p1', name: 'Sneaky', src: 'javascript:alert(1)', previewImageUrl: 'javascript:alert(2)' },
        ]));
        addProductToLook('look-1', 'p1');

        renderProducts();

        expect(screen.getByText('Sneaky')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    test('only shows products belonging to this look', () => {
        const mine = saveProduct({ name: 'Mine', barcode: '1' });
        const theirs = saveProduct({ name: 'Theirs', barcode: '2' });
        addProductToLook('look-1', mine.id!);
        addProductToLook('look-2', theirs.id!);

        renderProducts('look-1');

        expect(screen.getByText('Mine')).toBeInTheDocument();
        expect(screen.queryByText('Theirs')).not.toBeInTheDocument();
    });

    test('remove unlinks the product from the look and keeps it in the catalog', () => {
        const a = saveProduct({ name: 'Alpha', barcode: '1' });
        const b = saveProduct({ name: 'Beta', barcode: '2' });
        addProductToLook('look-1', a.id!);
        addProductToLook('look-1', b.id!);

        renderProducts();
        fireEvent.click(screen.getByRole('button', { name: 'Remove Alpha' }));

        expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
        expect(getLookProductIds('look-1')).toEqual([b.id]);
        expect(JSON.parse(localStorage.getItem('lookbook.products')!)).toHaveLength(2);
    });

    test('add new product navigates to the scanner carrying the look id', () => {
        renderProducts('look id/1');

        fireEvent.click(screen.getByRole('button', { name: /add new product/i }));

        expect(screen.getByTestId('location')).toHaveTextContent('/product?look=look%20id%2F1');
    });
});
