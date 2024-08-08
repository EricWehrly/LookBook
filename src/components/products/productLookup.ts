export interface ResolvedProduct {
    name: string;
    barcode: string;
    src?: string;
    previewImageUrl?: string;
}

export function productLookup(code: string, format: string): ResolvedProduct {
    return {
        name: "unrecognized",
        barcode: code
    };
}

export function resolveFromAmazonUrl(url: string): ResolvedProduct | null {

    fetch(url)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));

    return null;
}

// export function saveProductData

// resolve from amazon url
