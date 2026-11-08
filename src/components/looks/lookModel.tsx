// The persisted shape of a look. GetLook always returns id and created filled in.
export default interface LookModel {
    id : string;
    name? : string;
    created : Date;
}

// What a Look is constructed from: everything optional, defaults are generated.
export type LookProps = Partial<LookModel>;
