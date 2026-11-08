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

// productLookup never rejects; callers compare against this name to tell
// "lookup failed, ask the user" from a real result.
export const UNRECOGNIZED_NAME = "unrecognized";

export async function productLookup(code: string, format: string): Promise<ResolvedProduct> {
    const resolved = await upcItemDb(code);
    if (resolved) {
        return resolved;
    }
    else return {
        name: UNRECOGNIZED_NAME,
        barcode: code
    };
}

async function upcItemDb(upc: string): Promise<ResolvedProduct | null> {
    // back out if upc is null or empty (should be 12 digits?)
    if (!upc) return null;

    try {
        const response = await fetch(`${domain}/upc?upc=${encodeURIComponent(upc)}`);
        // 404 (no such product), 429, 5xx: all mean "no usable data"
        if (!response.ok) return null;

        const data = await response.json();
        if (!data || typeof data !== 'object') return null;
        if (!data.name && !data.src && !data.previewImageUrl) return null;

        return {
            name: data.name || '',
            barcode: data.barcode || upc,
            src: data.src,
            previewImageUrl: data.previewImageUrl
        };
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
