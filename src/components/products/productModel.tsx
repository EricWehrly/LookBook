export enum ProductType {
    Skincare = 'Skincare',
    Makeup = 'Makeup',
    Hair = 'Hair',
    Body = 'Body',
    Fragrance = 'Fragrance',
    Tool = 'Tool',
    Other = 'Other'
}

export default interface ProductModel {

    // TODO: id and created shouldn't be nullable ...
    // fix referencing in App.tsx...

    id? : string;
    name? : string;
    type?: ProductType;
    barcode?: string;
    // Page where the product can be found/bought
    src?: string;
    previewImageUrl?: string;
}

// src and previewImageUrl end up in href/src attributes; only http(s) is
// accepted so a "javascript:" URL can never be stored or rendered.
export function isHttpUrl(value: string | undefined): boolean {
    if (!value) return false;
    try {
        const protocol = new URL(value).protocol;
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
}
