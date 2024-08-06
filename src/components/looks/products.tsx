import { Component } from "react";
import Look from "./look";
import ProductModel from "./productModel";
import QuaggaImpl from "../barcode/QuaggaImpl";

interface ProductsProps {
    look: Look;
}

interface ProductsState {
    products: ProductModel[];
    showScanner: boolean;
}

export class Products extends Component<ProductsProps, ProductsState> {

    constructor(props: ProductsProps) {
        super(props);
        
        this.state = {
            products: [],
            showScanner: true
        };
    }

    toggleNewComponent = () => {
        this.setState(prevState => ({ showScanner: !prevState.showScanner }));
    };

    render() {
        const products = this.state.products.map(product =>
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

        return <div className="products">
            {products}
            <button onClick={this.toggleNewComponent}>Scan a new product</button>
            {this.state.showScanner && <QuaggaImpl />}
        </div>
    }
}
