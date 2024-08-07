export interface ResolvedProduct {
    name: string;
    barcode: number;
    src?: string;
    previewImageUrl?: string;
}

export function productLookup(code: number, format: string): ResolvedProduct {
    return {
        name: "unrecognized",
        barcode: code
    };
}

export function resolveFromAmazonUrl(url: string): ResolvedProduct | null {
    /*
    axios.get(url).then(response => {
        console.log(response);
    });
    */
    return null;
}

// export function saveProductData

// resolve from amazon url
