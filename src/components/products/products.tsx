import type Look from "../looks/look";
import ProductModel, { isHttpUrl } from "./productModel";
import { getLookProducts, removeProductFromLook } from "./productStore";
import { useNavigate } from 'react-router-dom';
import React from "react";

interface ProductsProps {
    look: Look;
}

function Products({ look }: ProductsProps) {
    const lookId = look.id;
    const [products, setProducts] = React.useState<ProductModel[]>(() => getLookProducts(lookId));
    const navigate = useNavigate();

    React.useEffect(() => {
        setProducts(getLookProducts(lookId));
    }, [lookId]);

    // The scanner page reads the look id from this query param to know where to save to and return to.
    const navigateToNewProduct = () => {
        navigate(`/product?look=${encodeURIComponent(lookId)}`);
    };

    const removeProduct = (product: ProductModel) => {
        if (!product.id) return;
        removeProductFromLook(lookId, product.id);
        setProducts(getLookProducts(lookId));
    };

    const productsElements = products.map(product =>
        <div key={product.id} className="product">
            {isHttpUrl(product.previewImageUrl) &&
                <img src={product.previewImageUrl} alt={product.name} style={{ maxWidth: '64px', maxHeight: '64px' }} />}
            <div className="product-name">{product.name}</div>
            {product.type && <div className="product-type">{product.type}</div>}
            {product.barcode && <div className="product-barcode">{product.barcode}</div>}
            {isHttpUrl(product.src) &&
                <a href={product.src} target="_blank" rel="noopener noreferrer">View product</a>}
            <button type="button" onClick={() => removeProduct(product)} aria-label={`Remove ${product.name}`}>
                Remove
            </button>
        </div>
    );

    return (
        <div>
            {productsElements}
            <button onClick={navigateToNewProduct}>Add new product</button>
        </div>
    );
}

export default Products;
