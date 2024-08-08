export interface ResolvedProduct {
    name: string;
    barcode: string;
    src?: string;
    previewImageUrl?: string;
}

export async function productLookup(code: string, format: string): Promise<ResolvedProduct> {
    const resolved = await upcItemDb(code);
    if (resolved) {
        return resolved;
    }
    else return {
        name: "unrecognized",
        barcode: code
    };
}

async function upcItemDb(upc: string): Promise<ResolvedProduct | null> {
    // back out if upc is null or empty (should be 12 digits?)
    if (!upc) return null;

    try {
        const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`);
        const data = await response.json();
        console.log(data);
        const item = data.items[0];
        return {
            name: item.title,
            barcode: upc,
            src: item.offers[0].link,
            previewImageUrl: item.images[0]
        };
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
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
