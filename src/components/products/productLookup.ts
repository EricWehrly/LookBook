// if my domain name contains localhost, domain variable is "localhost:5000"
// else use the domain in the window
const domain = window.location.hostname.includes('localhost')
    ? 'http://localhost:5000' 
    : `https://${window.location.hostname}`;

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
        const response = await fetch(`${domain}/upc?upc=${upc}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
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
