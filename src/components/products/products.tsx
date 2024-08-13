import Look from "../looks/look";
import ProductModel from "./productModel";
import { useNavigate } from 'react-router-dom';
import React from "react";

interface ProductsProps {
    look: Look;
}

interface ProductsState {
    products: ProductModel[];
}

// Convert Products to a functional component to use hooks
function Products({ look }: ProductsProps) {
    const [products, setProducts] = React.useState<ProductModel[]>([]);
    const navigate = useNavigate(); // Use the useNavigate hook

    const navigateToNewProduct = () => {
        navigate('/product');
    };

    const productsElements = products.map(product =>
        <div key={product.id} className="product"
            style={{
                // width: `${photoWidth}px`,
                // height: `${photoHeight}px`,
                // backgroundImage: `url('${product.src}=w${photoWidth}-h${photoHeight}')`
            }}>{product.name}
            <br />
            {product.barcode}
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
