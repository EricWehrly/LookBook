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
}
